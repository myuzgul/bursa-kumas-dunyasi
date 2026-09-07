import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db/repo';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const status = searchParams.get('status');

    const db = readDb();
    let users = db.users || [];
    const orders = db.orders || [];

    // Filter status
    if (status && status !== 'all') {
      users = users.filter((u: any) => u.account_status === status);
    } else {
      users = users.filter((u: any) => u.account_status !== 'deleted');
    }

    // Search query
    if (q) {
      users = users.filter((u: any) => {
        const name = (u.full_name || `${u.first_name} ${u.last_name}`).toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (u.phone || '');
        const id = (u.id || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q);
      });
    }

    // Sort by newest
    users.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = users.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = users.slice((page - 1) * limit, page * limit);

    // Enrich with order statistics
    const enriched = paginated.map((u: any) => {
      const userOrders = orders.filter((o: any) => o.user_id === u.id || o.customer_email?.toLowerCase() === u.email?.toLowerCase());
      const totalSpent = userOrders.reduce((acc: number, o: any) => acc + (Number(o.final_amount || o.total_amount) || 0), 0);
      const lastOrder = userOrders.length > 0
        ? userOrders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : null;

      return {
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        full_name: u.full_name || `${u.first_name} ${u.last_name}`,
        email: u.email,
        phone: u.phone,
        email_verified: Boolean(u.email_verified),
        account_status: u.account_status || 'active',
        marketing_consent: Boolean(u.marketing_consent),
        orders_count: userOrders.length,
        total_spent: Math.round(totalSpent * 100) / 100,
        last_order_date: lastOrder?.created_at || null,
        created_at: u.created_at,
        last_login_at: u.last_login_at,
      };
    });

    return NextResponse.json({
      customers: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
