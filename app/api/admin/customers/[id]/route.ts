import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db/repo';

// GET Customer Detail for Admin
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id;
    const db = readDb();
    const user = (db.users || []).find((u: any) => u.id === customerId);

    if (!user) {
      return NextResponse.json({ error: 'Müşteri bulunamadı.' }, { status: 404 });
    }

    const addresses = (db.user_addresses || []).filter((a: any) => a.user_id === user.id);
    const orders = (db.orders || []).filter((o: any) => o.user_id === user.id || o.customer_email?.toLowerCase() === user.email?.toLowerCase());
    const reviews = (db.reviews || []).filter((r: any) => r.user_id === user.id);
    const securityLogs = (db.security_logs || []).filter((s: any) => s.user_id === user.id).slice(0, 20);

    const totalSpent = orders.reduce((acc: number, o: any) => acc + (Number(o.final_amount || o.total_amount) || 0), 0);

    return NextResponse.json({
      customer: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name || `${user.first_name} ${user.last_name}`,
        email: user.email,
        phone: user.phone,
        email_verified: Boolean(user.email_verified),
        phone_verified: Boolean(user.phone_verified),
        account_status: user.account_status || 'active',
        marketing_consent: Boolean(user.marketing_consent),
        kvkk_consent: Boolean(user.kvkk_consent),
        created_at: user.created_at,
        last_login_at: user.last_login_at,
        total_spent: Math.round(totalSpent * 100) / 100,
        orders_count: orders.length,
      },
      addresses,
      orders,
      reviews,
      security_logs: securityLogs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT Update Customer Account Status (Active, Blocked)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id;
    const body = await req.json();
    const { account_status } = body;

    const db = readDb();
    const user = (db.users || []).find((u: any) => u.id === customerId);

    if (!user) {
      return NextResponse.json({ error: 'Müşteri bulunamadı.' }, { status: 404 });
    }

    if (account_status) {
      user.account_status = account_status;
      user.updated_at = new Date().toISOString();
      writeDb(db);
    }

    return NextResponse.json({
      success: true,
      message: 'Müşteri durumu güncellendi.',
      customer: user,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
