import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, logSecurityEvent } from '@/lib/auth';
import { readDb, writeDb } from '@/lib/db/repo';

// GET all addresses for current user
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const db = readDb();
    const addresses = (db.user_addresses || []).filter((a: any) => a.user_id === auth.user.id);
    return NextResponse.json({ addresses });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST create address
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      title, 
      first_name, 
      last_name, 
      phone, 
      city, 
      district, 
      neighborhood, 
      full_address, 
      postal_code, 
      is_default_shipping = false, 
      is_default_billing = false 
    } = body;

    if (!title?.trim() || !first_name?.trim() || !last_name?.trim() || !phone?.trim() || !city?.trim() || !district?.trim() || !full_address?.trim()) {
      return NextResponse.json({ error: 'Lütfen tüm zorunlu adres alanlarını doldurunuz.' }, { status: 400 });
    }

    const db = readDb();
    if (!db.user_addresses) db.user_addresses = [];

    // If first address, automatically make it default
    const userAddresses = db.user_addresses.filter((a: any) => a.user_id === auth.user.id);
    const isFirst = userAddresses.length === 0;

    const makeDefaultShipping = is_default_shipping || isFirst ? 1 : 0;
    const makeDefaultBilling = is_default_billing || isFirst ? 1 : 0;

    // Reset existing defaults if set
    if (makeDefaultShipping === 1) {
      db.user_addresses.forEach((a: any) => {
        if (a.user_id === auth.user.id) a.is_default_shipping = 0;
      });
    }
    if (makeDefaultBilling === 1) {
      db.user_addresses.forEach((a: any) => {
        if (a.user_id === auth.user.id) a.is_default_billing = 0;
      });
    }

    const newAddressId = `addr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newAddress = {
      id: newAddressId,
      user_id: auth.user.id,
      title: title.trim(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone.trim(),
      city: city.trim(),
      district: district.trim(),
      neighborhood: neighborhood?.trim() || '',
      full_address: full_address.trim(),
      postal_code: postal_code?.trim() || '',
      is_default_shipping: makeDefaultShipping,
      is_default_billing: makeDefaultBilling,
      created_at: nowIso,
      updated_at: nowIso,
    };

    db.user_addresses.push(newAddress);
    writeDb(db);

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';
    logSecurityEvent(auth.user.id, 'address_created', ip, userAgent, 'success');

    return NextResponse.json({
      success: true,
      message: 'Adres başarıyla kaydedildi.',
      address: newAddress,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT update address
export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      id, 
      title, 
      first_name, 
      last_name, 
      phone, 
      city, 
      district, 
      neighborhood, 
      full_address, 
      postal_code, 
      is_default_shipping, 
      is_default_billing 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Adres ID zorunludur.' }, { status: 400 });
    }

    const db = readDb();
    const address = (db.user_addresses || []).find(
      (a: any) => a.id === id && a.user_id === auth.user.id
    );

    if (!address) {
      return NextResponse.json({ error: 'Adres bulunamadı veya bu adresi düzenleme yetkiniz yok.' }, { status: 404 });
    }

    // Default shipping toggle
    if (is_default_shipping) {
      db.user_addresses.forEach((a: any) => {
        if (a.user_id === auth.user.id) a.is_default_shipping = 0;
      });
      address.is_default_shipping = 1;
    }

    // Default billing toggle
    if (is_default_billing) {
      db.user_addresses.forEach((a: any) => {
        if (a.user_id === auth.user.id) a.is_default_billing = 0;
      });
      address.is_default_billing = 1;
    }

    if (title) address.title = title.trim();
    if (first_name) address.first_name = first_name.trim();
    if (last_name) address.last_name = last_name.trim();
    if (phone) address.phone = phone.trim();
    if (city) address.city = city.trim();
    if (district) address.district = district.trim();
    if (neighborhood !== undefined) address.neighborhood = neighborhood.trim();
    if (full_address) address.full_address = full_address.trim();
    if (postal_code !== undefined) address.postal_code = postal_code.trim();
    address.updated_at = new Date().toISOString();

    writeDb(db);

    return NextResponse.json({
      success: true,
      message: 'Adres başarıyla güncellendi.',
      address,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE address
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Adres ID zorunludur.' }, { status: 400 });
    }

    const db = readDb();
    const initialLen = (db.user_addresses || []).length;
    db.user_addresses = (db.user_addresses || []).filter(
      (a: any) => !(a.id === id && a.user_id === auth.user.id)
    );

    if (db.user_addresses.length === initialLen) {
      return NextResponse.json({ error: 'Adres bulunamadı veya silme yetkiniz yok.' }, { status: 404 });
    }

    writeDb(db);
    return NextResponse.json({ success: true, message: 'Adres başarıyla silindi.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
