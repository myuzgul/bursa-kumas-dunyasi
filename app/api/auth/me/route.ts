import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { readDb } from '@/lib/db/repo';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const { user, role } = auth;
    const db = readDb();

    // Collect lightweight counts for user
    const unreadNotificationsCount = (db.user_notifications || []).filter(
      (n: any) => n.user_id === user.id && n.is_read === 0
    ).length;

    const favoritesCount = (db.wishlists || []).filter((w: any) => w.user_id === user.id).length;
    const ordersCount = (db.orders || []).filter((o: any) => o.user_id === user.id).length;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        first_name: user.first_name || (user.full_name ? user.full_name.split(' ')[0] : 'Kullanıcı'),
        last_name: user.last_name || (user.full_name ? user.full_name.split(' ').slice(1).join(' ') : ''),
        full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: user.email,
        phone: user.phone || '',
        email_verified: Boolean(user.email_verified),
        phone_verified: Boolean(user.phone_verified),
        marketing_consent: Boolean(user.marketing_consent),
        role,
        unread_notifications_count: unreadNotificationsCount,
        favorites_count: favoritesCount,
        orders_count: ordersCount,
        created_at: user.created_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
