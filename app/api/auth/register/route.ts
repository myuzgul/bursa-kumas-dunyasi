import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db/repo';
import { 
  hashPassword, 
  generateSecureToken, 
  signToken, 
  checkRateLimit, 
  logSecurityEvent 
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';

    // 1. Rate Limit (Max 6 registrations per 10 minutes per IP)
    const rateCheck = checkRateLimit(`register_${ip}`, 6, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla kayıt denemesi yapıldı. Lütfen birkaç dakika sonra tekrar deneyiniz.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      password, 
      password_confirm, 
      kvkk_consent, 
      marketing_consent 
    } = body;

    // 2. Input Validation
    if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: 'Lütfen ad, soyad, e-posta ve şifre alanlarını eksiksiz doldurunuz.' },
        { status: 400 }
      );
    }

    if (!kvkk_consent) {
      return NextResponse.json(
        { error: 'Kayıt olabilmek için KVKK ve Kullanıcı Sözleşmesi koşullarını onaylamanız gerekmektedir.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta adresi giriniz.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifreniz en az 6 karakter uzunluğunda olmalıdır.' }, { status: 400 });
    }

    if (password_confirm && password !== password_confirm) {
      return NextResponse.json({ error: 'Girdiğiniz şifreler birbiriyle eşleşmiyor.' }, { status: 400 });
    }

    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';

    const db = readDb();
    if (!db.users) db.users = [];

    // 3. Duplicate Check
    const existingUser = db.users.find(
      (u: any) => u.email.toLowerCase() === cleanEmail && u.account_status !== 'deleted'
    );
    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi ile kayıtlı bir hesap zaten bulunmaktadır. Lütfen giriş yapınız.' },
        { status: 409 }
      );
    }

    // 4. Create Verification Token
    const { token: verifyToken, tokenHash: verifyTokenHash } = generateSecureToken();
    const verifyExpiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    const newUserId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const sessionId = `ses-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newUser = {
      id: newUserId,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      full_name: `${first_name.trim()} ${last_name.trim()}`,
      email: cleanEmail,
      phone: cleanPhone || '',
      password_hash: hashPassword(password),
      email_verified: 0,
      phone_verified: 0,
      account_status: 'active',
      marketing_consent: marketing_consent ? 1 : 0,
      kvkk_consent: 1,
      two_factor_enabled: 0,
      verification_token_hash: verifyTokenHash,
      verification_token_expires_at: verifyExpiresAt,
      created_at: nowIso,
      updated_at: nowIso,
      last_login_at: nowIso,
    };

    db.users.push(newUser);

    // 5. Create Session
    if (!db.user_sessions) db.user_sessions = [];
    const newSession = {
      id: sessionId,
      user_id: newUserId,
      session_token_hash: generateSecureToken().tokenHash,
      ip_address: ip,
      user_agent: userAgent,
      device_name: userAgent.includes('Mobile') ? 'Mobil Cihaz' : 'Masaüstü Tarayıcı',
      last_active_at: nowIso,
      expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      is_active: 1,
      created_at: nowIso,
    };
    db.user_sessions.push(newSession);

    // 6. Create Welcome Notification
    if (!db.user_notifications) db.user_notifications = [];
    db.user_notifications.push({
      id: `notif-${Date.now()}-welcome`,
      user_id: newUserId,
      title: 'Bursa Kumaş Dünyası’na Hoş Geldiniz!',
      message: 'Hesabınız başarıyla oluşturuldu. İlk alışverişiniz için fırsat kumaşlarımızı inceleyebilirsiniz.',
      type: 'system',
      action_url: '/hesabim',
      is_read: 0,
      created_at: nowIso,
    });

    // 7. Log Verification Email
    if (!db.email_logs) db.email_logs = [];
    db.email_logs.push({
      id: `email-${Date.now()}-verify`,
      to: cleanEmail,
      subject: 'Bursa Kumaş Dünyası - E-Posta Adresinizi Doğrulayın',
      template: 'email_verification',
      verification_link: `/auth/dogrula?token=${verifyToken}`,
      status: 'sent',
      created_at: nowIso,
    });

    writeDb(db);

    // Log security event
    logSecurityEvent(newUserId, 'register', ip, userAgent, 'success', { email: cleanEmail });

    // 8. Sign JWT and Set HttpOnly Cookie
    const jwtToken = await signToken(
      {
        userId: newUserId,
        email: cleanEmail,
        name: newUser.full_name,
        role: 'customer',
        sessionId: sessionId,
      },
      '30d'
    );

    const response = NextResponse.json({
      success: true,
      message: 'Hesabınız başarıyla oluşturuldu! Doğrulama bağlantısı e-posta adresinize iletildi.',
      user: {
        id: newUserId,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        full_name: newUser.full_name,
        email: cleanEmail,
        phone: newUser.phone,
        email_verified: false,
        marketing_consent: Boolean(newUser.marketing_consent),
        role: 'customer',
      },
      verification_token_demo: verifyToken, // Provided for easy test execution
    });

    response.cookies.set('bkd_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 3600,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Kayıt işlemi sırasında hata oluştu.' }, { status: 500 });
  }
}
