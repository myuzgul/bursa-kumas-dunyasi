import { dbRepo } from '../db/repo';
import { calculateDiscounts } from './discountEngine';
import { sendEmailNotification, sendSmsNotification } from './notifications';
import { createYurticiShipment } from './shipping';
import { createParkBulutInvoice } from './invoice';
import { calculateShippingFee, getShippingSettings } from './shippingSettings';
import { calculatePaymentAdjustments } from './paymentSettings';

export interface CheckoutCustomerData {
  fullName: string;
  email: string;
  phone: string;
  addressTitle?: string;
  city: string;
  district: string;
  addressLine: string;
  postalCode?: string;
  isCorporate?: boolean;
  companyName?: string;
  taxNumber?: string;
  taxOffice?: string;
  orderNotes?: string;
}

export interface CheckoutItem {
  productId: string;
  variantId?: string;
  meterQuantity: number;
}

export interface CreateOrderParams {
  customer: CheckoutCustomerData;
  items: CheckoutItem[];
  couponCode?: string;
  paymentMethod?: string;
  userId?: string;
}

export function generateOrderNumber(): string {
  const db = dbRepo.read();
  const year = new Date().getFullYear();
  const count = (db.orders ? db.orders.length : 0) + 101;
  const seq = count.toString().padStart(6, '0');
  return `BKD-${year}-${seq}`;
}

export async function processCheckoutOrder(params: CreateOrderParams) {
  const db = dbRepo.read();

  if (!params.items || params.items.length === 0) {
    throw new Error('Sepetinizde ürün bulunmamaktadır.');
  }

  // 1. Verify products & stock server-side
  let calculatedSubtotal = 0;
  const orderItemsData: any[] = [];

  for (const item of params.items) {
    const product = db.products.find((p: any) => p.id === item.productId && p.is_active === 1);
    if (!product) {
      throw new Error(`Ürün bulunamadı veya satışta değil: ${item.productId}`);
    }

    let unitPrice = product.discount_price || product.base_price;
    let variantTitle = '';
    let productSku = product.sku;
    let productImage = product.main_image_url;

    if (item.variantId) {
      const variant = db.product_variants.find(
        (v: any) => v.id === item.variantId && v.product_id === product.id && v.is_active === 1
      );
      if (variant) {
        unitPrice = variant.discount_price || variant.price;
        variantTitle = variant.title;
        productSku = variant.sku;
        if (variant.image_url) productImage = variant.image_url;

        // Stock check (only if variant tracks stock)
        const isVariantStockTracked = variant.track_stock === 1 || (variant.stock_meter !== null && variant.stock_meter !== undefined && variant.track_stock !== 0);
        if (isVariantStockTracked) {
          if (Number(variant.stock_meter || 0) <= 0) {
            throw new Error(`${product.name} (${variant.title}) tükendi / stokta kalmadı.`);
          }
          if (Number(variant.stock_meter || 0) < item.meterQuantity) {
            throw new Error(
              `${product.name} (${variant.title}) için talep edilen ${item.meterQuantity}m stokta yok. Mevcut stok: ${variant.stock_meter}m.`
            );
          }
        }
      }
    } else {
      // Stock check (only if product tracks stock)
      const isProductStockTracked = product.track_stock === 1 || (product.stock_meter !== null && product.stock_meter !== undefined && product.track_stock !== 0);
      if (isProductStockTracked) {
        if (Number(product.stock_meter || 0) <= 0) {
          throw new Error(`${product.name} tükendi / stokta kalmadı.`);
        }
        if (Number(product.stock_meter || 0) < item.meterQuantity) {
          throw new Error(
            `${product.name} için talep edilen ${item.meterQuantity}m stokta yok. Mevcut stok: ${product.stock_meter}m.`
          );
        }
      }
    }

    const itemTotal = Number((unitPrice * item.meterQuantity).toFixed(2));
    calculatedSubtotal += itemTotal;

    orderItemsData.push({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: product.id,
      variant_id: item.variantId || null,
      product_name: product.name,
      variant_title: variantTitle,
      product_sku: productSku,
      product_image: productImage,
      meter_quantity: item.meterQuantity,
      unit_price: unitPrice,
      total_price: itemTotal,
    });
  }

  // 2. Server-side discount & payment adjustments recalculation
  const discounts = calculateDiscounts(calculatedSubtotal, params.couponCode, params.userId);
  const finalDiscountTotal = discounts.totalDiscount;
  const shippingCalculation = calculateShippingFee(calculatedSubtotal);
  const shippingTotal = Number(shippingCalculation.fee.toFixed(2));
  
  const paymentMethod = params.paymentMethod || 'paytr';
  const paymentAdjustments = calculatePaymentAdjustments({
    subtotal: calculatedSubtotal,
    couponDiscount: finalDiscountTotal,
    paymentMethod,
  });
  const paymentFee = paymentAdjustments.paymentFee;
  const paymentDiscount = paymentAdjustments.paymentDiscount;

  const taxRate = 10;
  const taxTotal = Number((((calculatedSubtotal - finalDiscountTotal - paymentDiscount) * taxRate) / (100 + taxRate)).toFixed(2));
  const grandTotal = Number(Math.max(0, calculatedSubtotal - finalDiscountTotal - paymentDiscount + shippingTotal + paymentFee).toFixed(2));

  const orderNumber = generateOrderNumber();
  const orderId = `ord-${Date.now()}`;

  const addressSnapshot = {
    fullName: params.customer.fullName,
    phone: params.customer.phone,
    city: params.customer.city,
    district: params.customer.district,
    addressLine: params.customer.addressLine,
    postalCode: params.customer.postalCode || '',
    isCorporate: params.customer.isCorporate || false,
    companyName: params.customer.companyName || '',
    taxNumber: params.customer.taxNumber || '',
    taxOffice: params.customer.taxOffice || '',
  };

  const newOrder = {
    id: orderId,
    order_number: orderNumber,
    user_id: params.userId || null,
    is_guest: params.userId ? 0 : 1,
    customer_name: params.customer.fullName,
    customer_email: params.customer.email,
    customer_phone: params.customer.phone,
    shipping_address: addressSnapshot,
    billing_address: addressSnapshot,
    subtotal: calculatedSubtotal,
    discount_total: finalDiscountTotal,
    payment_discount: paymentDiscount,
    payment_fee: paymentFee,
    coupon_code: discounts.appliedCoupon ? discounts.appliedCoupon.code : null,
    shipping_total: shippingTotal,
    tax_total: taxTotal,
    grand_total: grandTotal,
    status: 'Siparis_Alindi',
    payment_status: paymentMethod === 'paytr' ? 'paid' : 'pending',
    payment_method: paymentMethod,
    order_notes: params.customer.orderNotes || '',
    carrier_name: 'DHL Kargo (MNG Kargo)',
    tracking_number: '',
    tracking_url: '',
    invoice_status: 'pending',
    invoice_number: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 3. Atomic stock deduction and DB persistence
  db.orders.unshift(newOrder);

  for (const oi of orderItemsData) {
    oi.order_id = orderId;
    db.order_items.push(oi);

    // Deduct stock safely if tracked
    const prod = db.products.find((p: any) => p.id === oi.product_id);
    if (prod) {
      const isProductStockTracked = prod.track_stock === 1 || (prod.stock_meter !== null && prod.stock_meter !== undefined && prod.track_stock !== 0);
      if (isProductStockTracked) {
        const oldStock = Number(prod.stock_meter || 0);
        const newStock = Math.max(0, Number((oldStock - oi.meter_quantity).toFixed(2)));
        prod.stock_meter = newStock;

        if (!db.stock_history) db.stock_history = [];
        db.stock_history.push({
          id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          product_id: prod.id,
          order_id: orderId,
          old_stock: oldStock,
          change_meter: -oi.meter_quantity,
          new_stock: newStock,
          reason: `Sipariş Satışı #${orderNumber}`,
          created_at: new Date().toISOString(),
        });
      }
    }

    if (oi.variant_id) {
      const vari = db.product_variants.find((v: any) => v.id === oi.variant_id);
      if (vari) {
        const isVariantStockTracked = vari.track_stock === 1 || (vari.stock_meter !== null && vari.stock_meter !== undefined && vari.track_stock !== 0);
        if (isVariantStockTracked) {
          vari.stock_meter = Math.max(0, Number(((vari.stock_meter || 0) - oi.meter_quantity).toFixed(2)));
        }
      }
    }
  }

  // Increment coupon usage if used
  if (discounts.appliedCoupon) {
    const coup = db.coupons.find((c: any) => c.id === discounts.appliedCoupon.id);
    if (coup) coup.used_count = (coup.used_count || 0) + 1;
  }

  // Add initial status log
  db.order_status_history.unshift({
    id: `hist-${Date.now()}`,
    order_id: orderId,
    old_status: null,
    new_status: 'Siparis_Alindi',
    changed_by: 'Sistem (Otomatik)',
    notes: `Sipariş oluşturuldu. Toplam: ${grandTotal} TL`,
    created_at: new Date().toISOString(),
  });

  // Save DB
  dbRepo.write(db);

  // Send notifications
  sendEmailNotification({
    recipientEmail: params.customer.email,
    subject: `Bursa Kumaş Dünyası – Siparişiniz Alındı (#${orderNumber})`,
    templateType: 'ORDER_CONFIRMATION',
    bodyText: `Sayın ${params.customer.fullName}, #${orderNumber} numaralı kumaş siparişiniz başarıyla alınmıştır. En kısa sürede kesilerek kargoya verilecektir.`,
  });

  return {
    success: true,
    order: newOrder,
    items: orderItemsData,
  };
}

export async function updateOrderStatus(orderId: string, newStatus: string, adminName: string, notes?: string) {
  const db = dbRepo.read();
  const order = db.orders.find((o: any) => o.id === orderId);
  if (!order) {
    throw new Error('Sipariş bulunamadı.');
  }

  const oldStatus = order.status;
  order.status = newStatus;
  order.updated_at = new Date().toISOString();

  // If status changed to Kargoya_Verildi, create shipping record if not exists
  if (newStatus === 'Kargoya_Verildi' && !order.tracking_number) {
    const shipment = await createYurticiShipment({
      orderNumber: order.order_number,
      recipientName: order.customer_name,
      recipientPhone: order.customer_phone,
      recipientAddress: typeof order.shipping_address === 'string' ? order.shipping_address : order.shipping_address.addressLine,
      city: typeof order.shipping_address === 'object' ? order.shipping_address.city : 'Bursa',
      district: typeof order.shipping_address === 'object' ? order.shipping_address.district : '',
      itemCount: 1,
      totalMeters: 5,
    });
    order.tracking_number = shipment.trackingNumber;
    order.tracking_url = shipment.trackingUrl;
    order.carrier_name = shipment.carrier;

    // Send SMS
    sendSmsNotification({
      phoneNumber: order.customer_phone,
      messageContent: `Bursa Kumaş Dünyası: #${order.order_number} nolu kumaş siparişiniz DHL Kargo (MNG Kargo) (${shipment.trackingNumber}) ile sevk edilmiştir.`,
    });
  }

  // If status changed to Hazirlaniyor / Cikti_Alindi / Fatura
  if (newStatus === 'Cikti_Alindi' && order.invoice_status !== 'created') {
    const invoice = await createParkBulutInvoice({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      isCorporate: false,
      address: typeof order.shipping_address === 'object' ? order.shipping_address.addressLine : order.shipping_address,
      subtotal: order.subtotal,
      taxTotal: order.tax_total,
      grandTotal: order.grand_total,
      items: [],
    });
    order.invoice_status = invoice.status;
    order.invoice_number = invoice.invoiceNumber;
  }

  db.order_status_history.unshift({
    id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    order_id: orderId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: adminName || 'Yönetici',
    notes: notes || `Sipariş durumu ${newStatus} olarak güncellendi.`,
    created_at: new Date().toISOString(),
  });

  dbRepo.write(db);
  return order;
}
