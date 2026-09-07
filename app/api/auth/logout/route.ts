import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db/repo';
import { verifyToken, logSecurityEvent } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';

    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/bkd_token=([^;]+)/);
    const token = match ? match[1] : null;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        const db = readDb();
        if (payload.sessionId && db.user_sessions) {
          const session = db.user_sessions.find((s: any) => s.id === payload.sessionId);
          if (session) {
            session.is_active = 0;
            writeDb(db);
          }
        }
        logSecurityEvent(payload.userId, 'logout', ip, userAgent, 'success');
      }
    }

    const response = NextResponse.json({ success: true, message: 'Başarıyla çıkış yapıldı.' });
    response.cookies.set('bkd_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: true });
  }
}
