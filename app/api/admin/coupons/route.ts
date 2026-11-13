import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { logAuditAction } from '@/lib/services/auditLogger';
import { normalizeCoupon, getPromoStatus } from '@/lib/services/promotions';
import { sanitizeCouponInput, generateCouponCode } from '@/lib/services/promotionAdmin';

export const dynamic = 'force-dynamic';

function withStatus(c: any) {
  const n = normalizeCoupon(c);
  return { ...n, status: getPromoStatus(n), last_used_at: c.last_used_at || null };
}

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.response) return guard.response;

  const url = new URL(req.url);
  const db = dbRepo.read();
  const usagesFor = url.searchParams.get('usages');
  if (usagesFor) {
    const usages = (db.coupon_usages || [])
      .filter((u: any) => u.coupon_id === usagesFor)
      .slice(0, 500);
    return NextResponse.json({ usages }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const coupons = (db.coupons || []).map(withStatus);
  return NextResponse.json({ coupons }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.response) return guard.response;
  try {
    const body = await req.json();
    const db = dbRepo.read();
    if (!db.coupons) db.coupons = [];
    const taken = new Set<string>(db.coupons.map((c: any) => String(c.code || '').toUpperCase()));
    const nowIso = new Date().toISOString();

    // Kopyala
    if (body.action === 'duplicate') {
      const orig = db.coupons.find((c: any) => c.id === body.id);
      if (!orig) return NextResponse.json({ message: 'Kupon bulunamadı.' }, { status: 404 });
      const n = normalizeCoupon(orig);
      let code = `${n.code}-KOPYA`.slice(0, 32);
      let i = 2;
      while (taken.has(code)) code = `${n.code}-K${i++}`.slice(0, 32);
      const { coupon, errors } = sanitizeCouponInput({ ...n, code, is_active: 0 });
      if (errors.length) return NextResponse.json({ message: errors.join(' ') }, { status: 400 });
      coupon.id = `coup-${Date.now()}`;
      coupon.used_count = 0;
      coupon.total_discount_given = 0;
      coupon.batch_id = null;
      coupon.created_at = nowIso;
      db.coupons.unshift(coupon);
      dbRepo.write(db);
      return NextResponse.json({ success: true, coupon: withStatus(coupon) });
    }

    // Toplu kupon üretimi (her biri tek kullanımlık benzersiz kod)
    if (body.bulk) {
      const count = Math.floor(Number(body.bulk.count));
      if (!(count >= 1 && count <= 1000)) {
        return NextResponse.json({ message: 'Toplu üretimde adet 1 ile 1000 arasında olmalıdır.' }, { status: 400 });
      }
      const batchId = `batch-${Date.now()}`;
      const created: any[] = [];
      for (let k = 0; k < count; k++) {
        const code = generateCouponCode(body.bulk.prefix || '', Number(body.bulk.length) || 8, taken);
        const { coupon, errors } = sanitizeCouponInput({ ...body, code });
        if (errors.length) return NextResponse.json({ message: errors.join(' ') }, { status: 400 });
        coupon.id = `coup-${Date.now()}-${k}-${Math.random().toString(36).substring(2, 6)}`;
        coupon.batch_id = batchId;
        coupon.used_count = 0;
        coupon.total_discount_given = 0;
        coupon.created_at = nowIso;
        created.push(coupon);
      }
      db.coupons.unshift(...created);
      dbRepo.write(db);
      logAuditAction({
        adminEmail: guard.admin?.email || 'admin',
        adminId: guard.admin?.id,
        action: 'COUPON_BULK_CREATE',
        details: `${count} adet toplu kupon üretildi (${batchId}).`,
      });
      return NextResponse.json({ success: true, batch_id: batchId, coupons: created.map(withStatus) });
    }

    const { coupon, errors } = sanitizeCouponInput(body);
    if (errors.length) return NextResponse.json({ message: errors.join(' ') }, { status: 400 });
    if (taken.has(coupon.code)) {
      return NextResponse.json({ message: `"${coupon.code}" kodlu bir kupon zaten mevcut.` }, { status: 400 });
    }
    coupon.id = `coup-${Date.now()}`;
    coupon.used_count = 0;
    coupon.total_discount_given = 0;
    coupon.created_at = nowIso;
    db.coupons.unshift(coupon);
    dbRepo.write(db);

    logAuditAction({
      adminEmail: guard.admin?.email || 'admin',
      adminId: guard.admin?.id,
      action: 'COUPON_CREATE',
      details: `Kupon oluşturuldu: ${coupon.code}`,
    });
    return NextResponse.json({ success: true, coupon: withStatus(coupon) });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Kupon kaydedilemedi.' }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.response) return guard.response;
  try {
    const body = await req.json();
    const db = dbRepo.read();
    const idx = (db.coupons || []).findIndex((c: any) => c.id === body.id);
    if (idx === -1) return NextResponse.json({ message: 'Kupon bulunamadı.' }, { status: 404 });
    const existing = db.coupons[idx];

    const { coupon, errors } = sanitizeCouponInput(body, existing);
    if (errors.length) return NextResponse.json({ message: errors.join(' ') }, { status: 400 });
    const clash = db.coupons.some(
      (c: any, i: number) => i !== idx && String(c.code || '').toUpperCase() === coupon.code
    );
    if (clash) return NextResponse.json({ message: `"${coupon.code}" kodlu bir kupon zaten mevcut.` }, { status: 400 });

    coupon.id = existing.id;
    db.coupons[idx] = { ...coupon, last_used_at: existing.last_used_at || null };
    dbRepo.write(db);
    logAuditAction({
      adminEmail: guard.admin?.email || 'admin',
      adminId: guard.admin?.id,
      action: 'COUPON_UPDATE',
      details: `Kupon güncellendi: ${coupon.code}`,
    });
    return NextResponse.json({ success: true, coupon: withStatus(db.coupons[idx]) });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Kupon güncellenemedi.' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.response) return guard.response;
  try {
    const body = await req.json();
    const db = dbRepo.read();
    const c = (db.coupons || []).find((x: any) => x.id === body.id);
    if (!c) return NextResponse.json({ message: 'Kupon bulunamadı.' }, { status: 404 });
    if (body.is_active !== undefined) c.is_active = body.is_active ? 1 : 0;
    c.updated_at = new Date().toISOString();
    dbRepo.write(db);
    return NextResponse.json({ success: true, coupon: withStatus(c) });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'İşlem yapılamadı.' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.response) return guard.response;
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const batchId = url.searchParams.get('batch_id');
  const db = dbRepo.read();
  const before = (db.coupons || []).length;

  if (batchId) {
    db.coupons = (db.coupons || []).filter((c: any) => c.batch_id !== batchId);
  } else {
    db.coupons = (db.coupons || []).filter((c: any) => c.id !== id);
  }
  const removed = before - db.coupons.length;
  if (removed === 0) return NextResponse.json({ message: 'Kupon bulunamadı.' }, { status: 404 });
  dbRepo.write(db);
  logAuditAction({
    adminEmail: guard.admin?.email || 'admin',
    adminId: guard.admin?.id,
    action: 'COUPON_DELETE',
    details: batchId ? `Toplu kupon grubu silindi (${removed} adet, ${batchId}).` : `Kupon silindi (${id}).`,
  });
  return NextResponse.json({ success: true, removed });
}
