import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db/repo';
import { 
  hashToken, 
  hashPassword, 
  logSecurityEvent 
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';

    const body = await req.json();
    const { token, new_password, new_password_confirm } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Geçersiz şifre sıfırlama bağlantısı.' }, { status: 400 });
    }

    if (!new_password || new_password.length < 6) {
      return NextResponse.json({ error: 'Yeni şifreniz en az 6 karakter olmalıdır.' }, { status: 400 });
    }

    if (new_password_confirm && new_password !== new_password_confirm) {
      return NextResponse.json({ error: 'Şifreler birbiriyle eşleşmiyor.' }, { status: 400 });
    }

    const tokenHash = hashToken(token.trim());
    const db = readDb();
    const user = (db.users || []).find(
      (u: any) => u.reset_password_token_hash === tokenHash && u.account_status !== 'deleted'
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı.' },
        { status: 400 }
      );
    }

    // Check expiration
    if (user.reset_password_token_expires_at) {
      const expires = new Date(user.reset_password_token_expires_at).getTime();
      if (Date.now() > expires) {
        return NextResponse.json(
          { error: 'Bu şifre sıfırlama bağlantısının süresi dolmuş. Lütfen yeniden talep ediniz.' },
          { status: 400 }
        );
      }
    }

    // Update password
    user.password_hash = hashPassword(new_password);
    user.reset_password_token_hash = null;
    user.reset_password_token_expires_at = null;
    user.updated_at = new Date().toISOString();

    // Invalidate all active sessions for security
    if (db.user_sessions) {
      db.user_sessions.forEach((s: any) => {
        if (s.user_id === user.id) {
          s.is_active = 0;
        }
      });
    }

    // Create Notification
    if (!db.user_notifications) db.user_notifications = [];
    db.user_notifications.push({
      id: `notif-${Date.now()}-pw-changed`,
      user_id: user.id,
      title: 'Şifreniz Değiştirildi',
      message: 'Hesabınızın şifresi başarıyla güncellendi. Eğer bu işlemi siz yapmadıysanız hemen bizimle iletişime geçiniz.',
      type: 'system',
      action_url: '/hesabim/guvenlik',
      is_read: 0,
      created_at: new Date().toISOString(),
    });

    writeDb(db);
    logSecurityEvent(user.id, 'password_reset_completed', ip, userAgent, 'success');

    return NextResponse.json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Şifre güncellenemedi.' }, { status: 500 });
  }
}
