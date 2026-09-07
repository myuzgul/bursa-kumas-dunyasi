import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyPassword, logSecurityEvent } from '@/lib/auth';
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
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Hesabınızı silmek için şifrenizi girmeniz gerekmektedir.' }, { status: 400 });
    }

    const db = readDb();
    const user = (db.users || []).find((u: any) => u.id === auth.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    // Password Re-authentication
    if (!verifyPassword(password, user.password_hash)) {
      logSecurityEvent(user.id, 'account_deletion_failed_pw', ip, userAgent, 'failed');
      return NextResponse.json({ error: 'Girdiğiniz şifre hatalı.' }, { status: 401 });
    }

    // Soft-delete and anonymize user record while keeping legal & accounting order integrity
    user.account_status = 'deleted';
    user.first_name = 'Silinmiş';
    user.last_name = 'Kullanıcı';
    user.full_name = 'Silinmiş Kullanıcı';
    user.email = `deleted_${Date.now()}@bursakumasdunyasi.anonymized`;
    user.phone = '';
    user.marketing_consent = 0;
    user.updated_at = new Date().toISOString();

    // Terminate all sessions
    if (db.user_sessions) {
      db.user_sessions.forEach((s: any) => {
        if (s.user_id === user.id) {
          s.is_active = 0;
        }
      });
    }

    writeDb(db);
    logSecurityEvent(user.id, 'account_deleted', ip, userAgent, 'success');

    const response = NextResponse.json({
      success: true,
      message: 'Hesabınız başarıyla silindi ve kişisel verileriniz anonimleştirildi.',
    });

    response.cookies.set('bkd_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Hesap silinemedi.' }, { status: 500 });
  }
}
