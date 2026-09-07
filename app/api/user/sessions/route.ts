import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, logSecurityEvent } from '@/lib/auth';
import { readDb, writeDb } from '@/lib/db/repo';

// GET Active Sessions for User
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const db = readDb();
    const currentSessionId = auth.session?.id;

    const sessions = (db.user_sessions || [])
      .filter((s: any) => s.user_id === auth.user.id && s.is_active === 1)
      .map((s: any) => ({
        id: s.id,
        device_name: s.device_name || 'Bilinmeyen Cihaz',
        user_agent: s.user_agent,
        last_active_at: s.last_active_at || s.created_at,
        created_at: s.created_at,
        is_current: s.id === currentSessionId,
      }))
      .sort((a: any, b: any) => (b.is_current ? 1 : 0) - (a.is_current ? 1 : 0));

    return NextResponse.json({ sessions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST Revoke session(s)
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const body = await req.json();
    const { session_id, revoke_all_others = false } = body;

    const db = readDb();
    if (!db.user_sessions) db.user_sessions = [];

    const currentSessionId = auth.session?.id;
    let revokedCount = 0;

    if (revoke_all_others) {
      db.user_sessions.forEach((s: any) => {
        if (s.user_id === auth.user.id && s.id !== currentSessionId && s.is_active === 1) {
          s.is_active = 0;
          revokedCount++;
        }
      });
    } else if (session_id) {
      const target = db.user_sessions.find(
        (s: any) => s.id === session_id && s.user_id === auth.user.id
      );
      if (target) {
        target.is_active = 0;
        revokedCount++;
      }
    }

    writeDb(db);

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';
    logSecurityEvent(auth.user.id, 'sessions_revoked', ip, userAgent, 'success', { revoked_count: revokedCount });

    return NextResponse.json({
      success: true,
      revoked_count: revokedCount,
      message: revoke_all_others
        ? 'Diğer tüm cihazlardaki oturumlar başarıyla kapatıldı.'
        : 'Seçilen oturum sonlandırıldı.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
