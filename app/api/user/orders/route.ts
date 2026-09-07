import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { readDb } from '@/lib/db/repo';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const db = readDb();
    const allOrders = db.orders || [];
    const allOrderItems = db.order_items || [];
    const allShippingLogs = db.shipping_logs || [];

    // Filter by user ID or user email
    const userOrders = allOrders.filter(
      (o: any) => o.user_id === auth.user.id || (o.customer_email && o.customer_email.toLowerCase() === auth.user.email.toLowerCase())
    );

    // Sort by latest
    userOrders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const totalOrders = userOrders.length;
    const totalPages = Math.ceil(totalOrders / limit) || 1;
    const paginatedOrders = userOrders.slice((page - 1) * limit, page * limit);

    const enrichedOrders = paginatedOrders.map((o: any) => {
      const items = allOrderItems.filter((it: any) => it.order_id === o.id);
      const shipLog = allShippingLogs.find((s: any) => s.order_id === o.id);

      return {
        id: o.id,
        order_number: o.order_number || o.id,
        created_at: o.created_at,
        total_amount: o.total_amount,
        final_amount: o.final_amount || o.total_amount,
        payment_status: o.payment_status || 'Paid',
        order_status: o.status || 'Siparis_Alindi',
        tracking_number: o.tracking_number || shipLog?.tracking_number || null,
        carrier: o.carrier || shipLog?.carrier || 'DHL Kargo (MNG Kargo)',
        items_count: items.length,
        items_summary: items.map((it: any) => ({
          name: it.product_name || it.name,
          meter: it.meter_quantity || it.quantity || 1,
          variant: it.variant_title,
          image: it.product_image || it.image,
          unit_price: it.unit_price,
        })),
      };
    });

    return NextResponse.json({
      orders: enrichedOrders,
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
