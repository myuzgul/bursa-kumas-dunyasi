import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';
import { createParkBulutInvoice } from '@/lib/services/invoice';
import { logAuditAction } from '@/lib/services/auditLogger';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const db = dbRepo.read();
  const order = db.orders?.find((o: any) => o.id === params.id || o.order_number === params.id);

  if (!order) {
    return NextResponse.json({ success: false, message: 'Sipariş bulunamadı.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    invoice_status: order.invoice_status || 'pending',
    invoice_number: order.invoice_number || '',
    invoice_uuid: order.invoice_uuid || '',
    invoice_url: order.invoice_url || '',
    invoice_pdf_url: order.invoice_pdf_url || '',
    invoice_created_at: order.invoice_created_at || null,
    billing_address: order.billing_address || order.shipping_address,
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = dbRepo.read();
    const order = db.orders?.find((o: any) => o.id === params.id || o.order_number === params.id);

    if (!order) {
      return NextResponse.json({ success: false, message: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    const items = db.order_items?.filter((i: any) => i.order_id === order.id) || [];
    const billing = typeof order.billing_address === 'string'
      ? JSON.parse(order.billing_address)
      : (order.billing_address || order.shipping_address);

    const isCorporate = Boolean(billing?.isCorporate || billing?.companyName || billing?.taxNumber?.length === 10);
    const addressStr = typeof billing === 'object'
      ? `${billing.addressLine || ''} ${billing.district || ''} / ${billing.city || ''}`
      : String(billing);

    const result = await createParkBulutInvoice({
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: billing?.fullName || order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: billing?.phone || order.customer_phone,
      isCorporate,
      companyName: billing?.companyName,
      taxNumber: billing?.taxNumber,
      taxOffice: billing?.taxOffice,
      address: addressStr,
      city: typeof billing === 'object' ? billing.city : 'Bursa',
      district: typeof billing === 'object' ? billing.district : '',
      subtotal: order.subtotal,
      taxTotal: order.tax_total,
      grandTotal: order.grand_total,
      discountTotal: order.discount_total,
      shippingTotal: order.shipping_total,
      paymentMethod: order.payment_method,
      items: items.map((it: any) => ({
        name: it.product_name + (it.variant_title ? ` (${it.variant_title})` : ''),
        meter: it.meter_quantity,
        unitPrice: it.unit_price,
        totalPrice: it.total_price,
        taxRate: 10,
        sku: it.product_sku,
      })),
    });

    logAuditAction({
      adminEmail: 'admin@bursakumasdunyasi.com',
      action: 'INVOICE_CREATE',
      details: `Sipariş #${order.order_number} için Park Bulut Faturası kesildi: ${result.invoiceNumber}`,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Fatura oluşturulamadı.' },
      { status: 500 }
    );
  }
}
