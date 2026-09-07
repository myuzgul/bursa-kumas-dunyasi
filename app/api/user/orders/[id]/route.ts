import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { readDb } from '@/lib/db/repo';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const orderId = params.id;
    const db = readDb();
    const order = (db.orders || []).find(
      (o: any) => o.id === orderId || o.order_number === orderId
    );

    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    // STRICT IDOR CHECK: Order must belong to user ID or user email
    const isOwner = order.user_id === auth.user.id || 
      (order.customer_email && order.customer_email.toLowerCase() === auth.user.email.toLowerCase());

    if (!isOwner) {
      return NextResponse.json({ error: 'Bu siparişi görüntüleme yetkiniz bulunmamaktadır.' }, { status: 403 });
    }

    const items = (db.order_items || []).filter((it: any) => it.order_id === order.id);
    const statusHistory = (db.order_status_history || [])
      .filter((h: any) => h.order_id === order.id)
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const shippingLog = (db.shipping_logs || []).find((s: any) => s.order_id === order.id);
    const payment = (db.payments || []).find((p: any) => p.order_id === order.id);
    const invoice = (db.invoice_logs || []).find((i: any) => i.order_id === order.id);

    return NextResponse.json({
      order: {
        ...order,
        items,
        status_history: statusHistory,
        shipping: shippingLog || {
          carrier: order.carrier || 'DHL Kargo (MNG Kargo)',
          tracking_number: order.tracking_number,
        },
        payment: payment || {
          provider: 'PayTR 256-Bit SSL',
          status: 'success',
          amount: order.final_amount || order.total_amount,
        },
        invoice: invoice || null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
