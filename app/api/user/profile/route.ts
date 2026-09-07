import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, logSecurityEvent } from '@/lib/auth';
import { readDb, writeDb } from '@/lib/db/repo';

// GET User Profile
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const { user } = auth;
    return NextResponse.json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || '',
        email_verified: Boolean(user.email_verified),
        phone_verified: Boolean(user.phone_verified),
        marketing_consent: Boolean(user.marketing_consent),
        created_at: user.created_at,
        last_login_at: user.last_login_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT Update Profile (Name, Phone, Marketing Consent)
export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const body = await req.json();
    const { first_name, last_name, phone, marketing_consent } = body;

    if (!first_name?.trim() || !last_name?.trim()) {
      return NextResponse.json({ error: 'Ad ve soyad zorunludur.' }, { status: 400 });
    }

    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';

    const db = readDb();
    const user = (db.users || []).find((u: any) => u.id === auth.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    user.first_name = first_name.trim();
    user.last_name = last_name.trim();
    user.full_name = `${first_name.trim()} ${last_name.trim()}`;
    user.phone = cleanPhone;
    if (typeof marketing_consent === 'boolean') {
      user.marketing_consent = marketing_consent ? 1 : 0;
    }
    user.updated_at = new Date().toISOString();

    writeDb(db);

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';
    logSecurityEvent(user.id, 'profile_updated', ip, userAgent, 'success');

    return NextResponse.json({
      success: true,
      message: 'Profil bilgileriniz başarıyla güncellendi.',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        email_verified: Boolean(user.email_verified),
        marketing_consent: Boolean(user.marketing_consent),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
