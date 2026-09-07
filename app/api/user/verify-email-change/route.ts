import { NextRequest, NextResponse } from 'next/server';
import { hashToken, logSecurityEvent } from '@/lib/auth';
import { readDb, writeDb } from '@/lib/db/repo';

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
    const user = (db.users || []).find(
      (u: any) => u.email_change_pending && u.email_change_pending.token_hash === tokenHash
    );

    if (!user) {
      return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş e-posta değişiklik bağlantısı.' }, { status: 400 });
    }

    const pending = user.email_change_pending;
    if (new Date(pending.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Bu onay bağlantısının süresi dolmuş. Lütfen yeniden talep ediniz.' }, { status: 400 });
    }

    const oldEmail = user.email;
    user.email = pending.new_email;
    user.email_verified = 1;
    user.email_change_pending = null;
    user.updated_at = new Date().toISOString();

    writeDb(db);
    logSecurityEvent(user.id, 'email_changed_successfully', ip, userAgent, 'success', {
      old_email: oldEmail,
      new_email: user.email,
    });

    return NextResponse.json({
      success: true,
      message: `E-posta adresiniz başarıyla ${user.email} olarak güncellendi.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Doğrulama yapılamadı.' }, { status: 500 });
  }
}
