import { NextRequest, NextResponse } from 'next/server';
import { 
  getAuthenticatedUser, 
  verifyPassword, 
  hashPassword, 
  logSecurityEvent 
} from '@/lib/auth';
import { readDb, writeDb } from '@/lib/db/repo';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';

    const body = await req.json();
    const { current_password, new_password, new_password_confirm, terminate_other_sessions = true } = body;

    if (!current_password || !new_password) {
      return NextResponse.json({ error: 'Lütfen tüm şifre alanlarını doldurunuz.' }, { status: 400 });
    }

    if (new_password.length < 6) {
      return NextResponse.json({ error: 'Yeni şifreniz en az 6 karakter olmalıdır.' }, { status: 400 });
    }

    if (new_password_confirm && new_password !== new_password_confirm) {
      return NextResponse.json({ error: 'Yeni şifreler birbiriyle eşleşmiyor.' }, { status: 400 });
    }

    const db = readDb();
    const user = (db.users || []).find((u: any) => u.id === auth.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    // Check old password
    if (!verifyPassword(current_password, user.password_hash)) {
      logSecurityEvent(user.id, 'password_change_failed_pw', ip, userAgent, 'failed');
      return NextResponse.json({ error: 'Mevcut şifreniz hatalı.' }, { status: 400 });
    }

    // Update password
    user.password_hash = hashPassword(new_password);
    user.updated_at = new Date().toISOString();

    // Terminate other sessions if requested
    if (terminate_other_sessions && db.user_sessions) {
      const currentSessionId = auth.session?.id;
      db.user_sessions.forEach((s: any) => {
        if (s.user_id === user.id && s.id !== currentSessionId) {
          s.is_active = 0;
        }
      });
    }

    // Create Notification
    if (!db.user_notifications) db.user_notifications = [];
    db.user_notifications.push({
      id: `notif-${Date.now()}-pw-updated`,
      user_id: user.id,
      title: 'Şifreniz Güncellendi',
      message: 'Hesabınızın şifresi başarıyla değiştirildi.',
      type: 'system',
      action_url: '/hesabim/guvenlik',
      is_read: 0,
      created_at: new Date().toISOString(),
    });

    writeDb(db);
    logSecurityEvent(user.id, 'password_changed', ip, userAgent, 'success');

    return NextResponse.json({
      success: true,
      message: 'Şifreniz başarıyla değiştirildi.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Şifre değiştirilemedi.' }, { status: 500 });
  }
}
