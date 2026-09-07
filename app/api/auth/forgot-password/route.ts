import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db/repo';
import { 
  generateSecureToken, 
  checkRateLimit, 
  logSecurityEvent 
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';

    const rateCheck = checkRateLimit(`forgot_pw_${ip}`, 4, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { message: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyiniz.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ message: 'Lütfen e-posta adresinizi giriniz.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = readDb();
    const user = (db.users || []).find(
      (u: any) => u.email.toLowerCase() === cleanEmail && u.account_status !== 'deleted'
    );

    let demoToken = null;

    if (user && user.account_status !== 'blocked') {
      const { token, tokenHash } = generateSecureToken();
      demoToken = token;
      user.reset_password_token_hash = tokenHash;
      user.reset_password_token_expires_at = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour
      user.updated_at = new Date().toISOString();

      if (!db.email_logs) db.email_logs = [];
      db.email_logs.push({
        id: `email-${Date.now()}-reset-pw`,
        to: cleanEmail,
        subject: 'Bursa Kumaş Dünyası - Şifre Sıfırlama Talebi',
        template: 'password_reset',
        reset_link: `/auth/sifre-sifirla?token=${token}`,
        status: 'sent',
        created_at: new Date().toISOString(),
      });

      writeDb(db);
      logSecurityEvent(user.id, 'forgot_password_requested', ip, userAgent, 'success');
    }

    // Always generic message to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'Eğer bu e-posta adresi sistemimizde kayıtlı ise, şifre sıfırlama bağlantısı gönderilmiştir.',
      demo_token: demoToken,
    });
  } catch (err: any) {
    return NextResponse.json({ message: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
  }
}
