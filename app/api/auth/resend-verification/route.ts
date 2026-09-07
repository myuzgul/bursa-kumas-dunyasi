import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db/repo';
import { 
  getAuthenticatedUser, 
  generateSecureToken, 
  checkRateLimit, 
  logSecurityEvent 
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';

    const rateCheck = checkRateLimit(`resend_verify_${ip}`, 3, 5 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Lütfen yeni doğrulama bağlantısı istemeden önce birkaç dakika bekleyiniz.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const auth = await getAuthenticatedUser(req);
    const targetEmail = (auth?.user?.email || body?.email || '').trim().toLowerCase();

    if (!targetEmail) {
      return NextResponse.json({ error: 'E-posta adresi belirtilmedi.' }, { status: 400 });
    }

    const db = readDb();
    const user = (db.users || []).find((u: any) => u.email.toLowerCase() === targetEmail);

    if (user && user.email_verified !== 1) {
      const { token, tokenHash } = generateSecureToken();
      user.verification_token_hash = tokenHash;
      user.verification_token_expires_at = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      user.updated_at = new Date().toISOString();

      if (!db.email_logs) db.email_logs = [];
      db.email_logs.push({
        id: `email-${Date.now()}-resend-verify`,
        to: targetEmail,
        subject: 'Bursa Kumaş Dünyası - Yeni E-Posta Doğrulama Bağlantısı',
        template: 'email_verification',
        verification_link: `/auth/dogrula?token=${token}`,
        status: 'sent',
        created_at: new Date().toISOString(),
      });

      writeDb(db);
      logSecurityEvent(user.id, 'resend_verification_email', ip, userAgent, 'success');

      return NextResponse.json({
        success: true,
        message: 'Yeni doğrulama bağlantısı e-posta adresinize gönderildi.',
        demo_token: token,
      });
    }

    // Generic response if already verified
    return NextResponse.json({
      success: true,
      message: 'E-posta adresiniz zaten doğrulanmış veya bağlantı gönderilmiştir.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'İşlem başarısız.' }, { status: 500 });
  }
}
