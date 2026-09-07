import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db/repo';
import { 
  verifyPassword, 
  signToken, 
  generateSecureToken, 
  checkRateLimit, 
  logSecurityEvent 
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';

    const body = await req.json();
    const { email, password, remember_me = false } = body;

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { message: 'Lütfen e-posta ve şifrenizi giriniz.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Rate Limit Check (Max 5 attempts per 15 minutes per IP+email key)
    const rateCheck = checkRateLimit(`login_${ip}_${cleanEmail}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      logSecurityEvent(null, 'login_rate_limited', ip, userAgent, 'blocked', { email: cleanEmail });
      return NextResponse.json(
        { message: 'Çok fazla hatalı giriş denemesi yapıldı. Lütfen 15 dakika sonra tekrar deneyiniz.' },
        { status: 429 }
      );
    }

    const db = readDb();

    // 2. Check Admin Users
    const admin = (db.admin_users || []).find(
      (a: any) => a.email.toLowerCase() === cleanEmail && a.is_active !== 0
    );
    if (admin && verifyPassword(password, admin.password_hash)) {
      const sessionId = `ses-admin-${Date.now()}`;
      const token = await signToken(
        {
          userId: admin.id,
          email: admin.email,
          name: admin.full_name,
          role: 'admin',
          sessionId,
          permissions: ['all'],
        },
        remember_me ? '30d' : '1d'
      );

      logSecurityEvent(admin.id, 'login_admin', ip, userAgent, 'success');

      const response = NextResponse.json({
        success: true,
        redirect: '/admin',
        user: { 
          id: admin.id, 
          name: admin.full_name, 
          email: admin.email, 
          role: 'admin' 
        },
      });

      response.cookies.set('bkd_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: (remember_me ? 30 : 1) * 24 * 3600,
      });

      return response;
    }

    // 3. Check Customer Users
    const user = (db.users || []).find(
      (u: any) => u.email.toLowerCase() === cleanEmail && u.account_status !== 'deleted'
    );

    if (user && verifyPassword(password, user.password_hash)) {
      if (user.account_status === 'blocked') {
        logSecurityEvent(user.id, 'login_blocked_account', ip, userAgent, 'blocked');
        return NextResponse.json(
          { message: 'Hesabınız askıya alınmıştır. Lütfen müşteri hizmetleri ile iletişime geçiniz.' },
          { status: 403 }
        );
      }

      const sessionId = `ses-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const nowIso = new Date().toISOString();

      // Update user login timestamp
      user.last_login_at = nowIso;

      // Register session
      if (!db.user_sessions) db.user_sessions = [];
      db.user_sessions.push({
        id: sessionId,
        user_id: user.id,
        session_token_hash: generateSecureToken().tokenHash,
        ip_address: ip,
        user_agent: userAgent,
        device_name: userAgent.includes('Mobile') ? 'Mobil Cihaz' : 'Masaüstü Tarayıcı',
        last_active_at: nowIso,
        expires_at: new Date(Date.now() + (remember_me ? 30 : 1) * 24 * 3600 * 1000).toISOString(),
        is_active: 1,
        created_at: nowIso,
      });

      writeDb(db);
      logSecurityEvent(user.id, 'login', ip, userAgent, 'success');

      const token = await signToken(
        {
          userId: user.id,
          email: user.email,
          name: user.full_name || `${user.first_name} ${user.last_name}`,
          role: 'customer',
          sessionId,
        },
        remember_me ? '30d' : '1d'
      );

      const response = NextResponse.json({
        success: true,
        redirect: '/hesabim',
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: user.full_name || `${user.first_name} ${user.last_name}`,
          email: user.email,
          phone: user.phone,
          email_verified: Boolean(user.email_verified),
          marketing_consent: Boolean(user.marketing_consent),
          role: 'customer',
        },
      });

      response.cookies.set('bkd_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: (remember_me ? 30 : 1) * 24 * 3600,
      });

      return response;
    }

    // 4. Failed Attempt (Generic response to prevent user enumeration)
    logSecurityEvent(null, 'login_failed', ip, userAgent, 'failed', { email: cleanEmail });
    return NextResponse.json(
      { message: 'Bu e-posta adresi veya şifre hatalı.' },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Giriş yapılamadı.' }, { status: 500 });
  }
}
