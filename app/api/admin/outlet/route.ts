import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { logAuditAction } from '@/lib/services/auditLogger';
import {
  normalizeOutletOffer,
  getOutletSettings,
  cleanupReservations,
  getOfferAvailability,
  isOfferInWindow,
  toPublicOffer,
} from '@/lib/services/outlet';

export const dynamic = 'force-dynamic';

function collections(db: any) {
  if (!Array.isArray(db.outlet_offers)) db.outlet_offers = [];
  if (!Array.isArray(db.outlet_reservations)) db.outlet_reservations = [];
  return db;
}

function sanitizeOffer(body: any, existing?: any): { offer: any; errors: string[] } {
  const errors: string[] = [];
  const title = String(body.title || '').trim();
  if (!title) errors.push('Outlet ürün adı zorunludur.');
  const meter = Number(body.meter_length);
  if (!(meter > 0)) errors.push('Metre uzunluğu 0’dan büyük olmalıdır.');
  const price = Number(body.offer_price);
  if (!(price > 0)) errors.push('Outlet fiyatı 0’dan büyük olmalıdır.');
  const qty = Math.floor(Number(body.quantity || 1));
  if (!(qty >= 1)) errors.push('Adet en az 1 olmalıdır.');
  const start = body.start_at ? new Date(body.start_at) : null;
  const end = body.end_at ? new Date(body.end_at) : null;
  if (start && isNaN(start.getTime())) errors.push('Başlangıç tarihi geçersiz.');
  if (end && isNaN(end.getTime())) errors.push('Bitiş tarihi geçersiz.');
  if (start && end && end <= start) errors.push('Bitiş tarihi başlangıçtan sonra olmalıdır.');

  const soldCount =
    body.sold_count !== undefined && body.sold_count !== ''
      ? Math.max(0, Math.floor(Number(body.sold_count) || 0))
      : Number(existing?.sold_count || 0);

  const offer = normalizeOutletOffer({
    ...(existing || {}),
    title,
    description: String(body.description || '').trim(),
    product_id: body.product_id ? String(body.product_id) : null,
    image_url: String(body.image_url || '').trim(),
    meter_length: meter,
    offer_price: price,
    original_price: Number(body.original_price) > 0 ? Number(body.original_price) : null,
    sku: String(body.sku || '').trim(),
    note: String(body.note || '').trim(),
    quantity: qty,
    sold_count: soldCount,
    min_cart_total: Number(body.min_cart_total) > 0 ? Number(body.min_cart_total) : 0,
    start_at: start && !isNaN(start.getTime()) ? start.toISOString() : null,
    end_at: end && !isNaN(end.getTime()) ? end.toISOString() : null,
    sort_order: Number(body.sort_order) || 0,
    is_active: body.is_active ? 1 : 0,
    updated_at: new Date().toISOString(),
  });
  return { offer, errors };
}

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.response) return guard.response;

  const db = collections(dbRepo.read());
  if (cleanupReservations(db)) dbRepo.write(db);
  const now = Date.now();

  const offers = db.outlet_offers.map((raw: any) => {
    const o = normalizeOutletOffer(raw);
    const live = db.outlet_reservations.filter(
      (r: any) =>
        r.offer_id === o.id &&
        (r.status === 'active' || r.status === 'accepted') &&
        new Date(r.expires_at).getTime() >= now
    );
    const pub = toPublicOffer(db, o);
    return {
      ...o,
      display_image: pub.image_url,
      display_original_price: pub.original_price,
      product_name: pub.product_name,
      available: getOfferAvailability(db, o, now),
      live_holds: live.length,
      in_window: isOfferInWindow(o, now),
      sold_out_at: raw.sold_out_at || null,
      views: db.outlet_reservations.filter((r: any) => r.offer_id === o.id).length,
      accepted_total: db.outlet_reservations.filter((r: any) => r.offer_id === o.id && (r.accepted_at || r.status === 'converted')).length,
    };
  });

  const titleById = new Map<string, string>(db.outlet_offers.map((o: any) => [o.id, o.title]));
  const reservations = [...db.outlet_reservations]
    .sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 60)
    .map((r: any) => ({ ...r, offer_title: titleById.get(r.offer_id) || '-' }));

  return NextResponse.json(
    { offers, reservations, settings: getOutletSettings(db) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.response) return guard.response;
  try {
    const body = await req.json();
    const db = collections(dbRepo.read());
    const { offer, errors } = sanitizeOffer(body);
    if (errors.length) return NextResponse.json({ message: errors.join(' ') }, { status: 400 });
    offer.id = `outlet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    offer.sold_count = 0;
    offer.created_at = new Date().toISOString();
    db.outlet_offers.unshift(offer);
    dbRepo.write(db);
    logAuditAction({
      adminEmail: guard.admin?.email || 'admin',
      adminId: guard.admin?.id,
      action: 'OUTLET_CREATE',
      details: `Outlet ürün eklendi: ${offer.title} (${offer.meter_length} m / ${offer.offer_price} TL)`,
    });
    return NextResponse.json({ success: true, offer });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Outlet ürün kaydedilemedi.' }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.response) return guard.response;
  try {
    const body = await req.json();
    const db = collections(dbRepo.read());

    // Genel ayarlar
    if (body.settings) {
      const s = body.settings;
      db.outlet_settings = {
        is_active: s.is_active ? 1 : 0,
        hold_minutes: Math.min(60, Math.max(1, Math.floor(Number(s.hold_minutes) || 5))),
        accepted_hold_minutes: Math.min(120, Math.max(5, Math.floor(Number(s.accepted_hold_minutes) || 20))),
        min_cart_total: Math.max(0, Number(s.min_cart_total) || 0),
        headline: String(s.headline || '').trim().slice(0, 120),
        subtext: String(s.subtext || '').trim().slice(0, 240),
      };
      dbRepo.write(db);
      logAuditAction({
        adminEmail: guard.admin?.email || 'admin',
        adminId: guard.admin?.id,
        action: 'OUTLET_SETTINGS',
        details: `Outlet ayarları güncellendi.`,
      });
      return NextResponse.json({ success: true, settings: getOutletSettings(db) });
    }

    const idx = db.outlet_offers.findIndex((o: any) => o.id === body.id);
    if (idx === -1) return NextResponse.json({ message: 'Outlet ürün bulunamadı.' }, { status: 404 });
    const existing = db.outlet_offers[idx];
    const { offer, errors } = sanitizeOffer(body, existing);
    if (errors.length) return NextResponse.json({ message: errors.join(' ') }, { status: 400 });
    offer.id = existing.id;
    db.outlet_offers[idx] = offer;
    dbRepo.write(db);
    return NextResponse.json({ success: true, offer });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Güncellenemedi.' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.response) return guard.response;
  try {
    const body = await req.json();
    const db = collections(dbRepo.read());
    const o = db.outlet_offers.find((x: any) => x.id === body.id);
    if (!o) return NextResponse.json({ message: 'Outlet ürün bulunamadı.' }, { status: 404 });
    if (body.is_active !== undefined) o.is_active = body.is_active ? 1 : 0;
    o.updated_at = new Date().toISOString();
    dbRepo.write(db);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'İşlem yapılamadı.' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.response) return guard.response;
  const id = new URL(req.url).searchParams.get('id');
  const db = collections(dbRepo.read());
  const o = db.outlet_offers.find((x: any) => x.id === id);
  if (!o) return NextResponse.json({ message: 'Outlet ürün bulunamadı.' }, { status: 404 });
  db.outlet_offers = db.outlet_offers.filter((x: any) => x.id !== id);
  // Canlı rezervasyonları kapat
  for (const r of db.outlet_reservations) {
    if (r.offer_id === id && (r.status === 'active' || r.status === 'accepted')) {
      r.status = 'released';
      r.closed_at = new Date().toISOString();
    }
  }
  dbRepo.write(db);
  logAuditAction({
    adminEmail: guard.admin?.email || 'admin',
    adminId: guard.admin?.id,
    action: 'OUTLET_DELETE',
    details: `Outlet ürün silindi: ${o.title}`,
  });
  return NextResponse.json({ success: true });
}
