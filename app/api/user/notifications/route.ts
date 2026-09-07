import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { readDb, writeDb } from '@/lib/db/repo';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const db = readDb();
    const notifications = (db.user_notifications || [])
      .filter((n: any) => n.user_id === auth.user.id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const unreadCount = notifications.filter((n: any) => n.is_read === 0).length;

    return NextResponse.json({
      notifications,
      unread_count: unreadCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const body = await req.json();
    const { notification_id, mark_all = false } = body;

    const db = readDb();
    if (!db.user_notifications) db.user_notifications = [];

    if (mark_all) {
      db.user_notifications.forEach((n: any) => {
        if (n.user_id === auth.user.id) {
          n.is_read = 1;
        }
      });
    } else if (notification_id) {
      const notif = db.user_notifications.find(
        (n: any) => n.id === notification_id && n.user_id === auth.user.id
      );
      if (notif) notif.is_read = 1;
    }

    writeDb(db);
    return NextResponse.json({ success: true, message: 'Bildirimler güncellendi.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
