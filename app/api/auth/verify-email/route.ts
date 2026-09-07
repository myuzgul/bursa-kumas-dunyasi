import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db/repo';
import { hashToken, logSecurityEvent } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';

    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Doğrulama belirteci eksik.' }, { status: 400 });
    }

    const tokenHash = hashToken(token.trim());
    const db = readDb();
    const users = db.users || [];

    const user = users.find(
      (u: any) => u.verification_token_hash === tokenHash && u.account_status !== 'deleted'
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Geçersiz veya daha önce kullanılmış doğrulama bağlantısı.' },
        { status: 400 }
      );
    }

    // Check expiration
    if (user.verification_token_expires_at) {
      const expires = new Date(user.verification_token_expires_at).getTime();
      if (Date.now() > expires) {
        return NextResponse.json(
          { error: 'Doğrulama bağlantısının süresi dolmuş. Lütfen yeni bir bağlantı talep ediniz.' },
          { status: 400 }
        );
      }
    }

    // Activate and mark verified
    user.email_verified = 1;
    user.account_status = 'active';
    user.verification_token_hash = null;
    user.verification_token_expires_at = null;
    user.updated_at = new Date().toISOString();

    // Create Notification
    if (!db.user_notifications) db.user_notifications = [];
    db.user_notifications.push({
      id: `notif-${Date.now()}-email-verified`,
      user_id: user.id,
      title: 'E-Posta Adresiniz Doğrulandı',
      message: 'Hesabınız başarıyla doğrulandı. Güvenli alışverişler dileriz.',
      type: 'system',
      action_url: '/hesabim',
      is_read: 0,
      created_at: new Date().toISOString(),
    });

    writeDb(db);
    logSecurityEvent(user.id, 'email_verified', ip, userAgent, 'success');

    return NextResponse.json({
      success: true,
      message: 'E-posta adresiniz başarıyla doğrulandı. Hesabınız artık tam yetkilidir.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Doğrulama yapılamadı.' }, { status: 500 });
  }
}
