import { NextRequest, NextResponse } from 'next/server';
import { 
  getAuthenticatedUser, 
  verifyPassword, 
  generateSecureToken, 
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
    const { current_password, new_email } = body;

    if (!current_password || !new_email?.trim()) {
      return NextResponse.json({ error: 'Lütfen mevcut şifrenizi ve yeni e-posta adresinizi giriniz.' }, { status: 400 });
    }

    const cleanNewEmail = new_email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanNewEmail)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta adresi giriniz.' }, { status: 400 });
    }

    const db = readDb();
    const user = (db.users || []).find((u: any) => u.id === auth.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    // 1. Re-authenticate Password
    if (!verifyPassword(current_password, user.password_hash)) {
      logSecurityEvent(user.id, 'change_email_failed_pw', ip, userAgent, 'failed');
      return NextResponse.json({ error: 'Mevcut şifreniz hatalı.' }, { status: 401 });
    }

    // 2. Check if new email already exists
    if (cleanNewEmail === user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Yeni e-posta adresiniz mevcut adresinizle aynı olamaz.' }, { status: 400 });
    }

    const duplicate = (db.users || []).find(
      (u: any) => u.email.toLowerCase() === cleanNewEmail && u.id !== user.id && u.account_status !== 'deleted'
    );
    if (duplicate) {
      return NextResponse.json({ error: 'Bu e-posta adresi başka bir müşteri tarafından kullanılmaktadır.' }, { status: 409 });
    }

    // 3. Generate Token for new email
    const { token, tokenHash } = generateSecureToken();
    const expiresAt = new Date(Date.now() + 2 * 3600 * 1000).toISOString(); // 2 hours

    user.email_change_pending = {
      new_email: cleanNewEmail,
      token_hash: tokenHash,
      expires_at: expiresAt,
    };
    user.updated_at = new Date().toISOString();

    // 4. Log Email to New Address & Notice to Old Address
    if (!db.email_logs) db.email_logs = [];
    db.email_logs.push({
      id: `email-${Date.now()}-change-verify`,
      to: cleanNewEmail,
      subject: 'Bursa Kumaş Dünyası - Yeni E-Posta Adresinizi Onaylayın',
      template: 'email_change_verification',
      verification_link: `/auth/dogrula?type=email-change&token=${token}`,
      status: 'sent',
      created_at: new Date().toISOString(),
    });

    db.email_logs.push({
      id: `email-${Date.now()}-change-notice`,
      to: user.email,
      subject: 'Bursa Kumaş Dünyası - Hesabınızda E-Posta Değişikliği Talebi',
      template: 'security_notice',
      message: `Hesabınız için ${cleanNewEmail} adresine geçiş talebi alındı. Eğer bu işlemi siz yapmadıysanız lütfen hemen şifrenizi değiştiriniz.`,
      status: 'sent',
      created_at: new Date().toISOString(),
    });

    writeDb(db);
    logSecurityEvent(user.id, 'email_change_requested', ip, userAgent, 'success', { new_email: cleanNewEmail });

    return NextResponse.json({
      success: true,
      message: `Onay bağlantısı ${cleanNewEmail} adresine gönderildi. Lütfen yeni e-postanıza gelen bağlantıya tıklayarak değişikliği tamamlayınız.`,
      demo_token: token,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'İşlem başarısız.' }, { status: 500 });
  }
}
