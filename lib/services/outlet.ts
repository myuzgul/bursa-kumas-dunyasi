/**
 * Outlet Fırsat Motoru
 *
 * Ödeme sayfasında müşteriye, daha önce sisteme girilmiş tek parça / az adetli
 * outlet kumaşlar (ör. 3.2 m keten, size özel 200 TL) süreli olarak teklif edilir.
 *
 * - Teklif gösterildiği anda parça o müşteri için "hold_minutes" (varsayılan 5 dk) rezerve edilir.
 *   Bu sürede başka bir müşteriye aynı parça gösterilmez; varsa başka bir parça gösterilir.
 * - Müşteri "Siparişe Ekle" derse rezervasyon, ödemeyi tamamlayabilmesi için uzatılır.
 * - "İstemiyorum" derse veya süre dolarsa parça serbest kalır.
 * - Sipariş oluşturulurken parça son kez kontrol edilir; satıldıysa bir daha kimseye gösterilmez.
 */
import { dbRepo, type DatabaseData } from '../db/repo';
import { round2 } from './promotions';

export interface OutletSettings {
  is_active: number;
  hold_minutes: number;
  accepted_hold_minutes: number;
  min_cart_total: number;
  headline: string;
  subtext: string;
}

export const DEFAULT_OUTLET_SETTINGS: OutletSettings = {
  is_active: 1,
  hold_minutes: 5,
  accepted_hold_minutes: 20,
  min_cart_total: 0,
  headline: 'Size Özel Outlet Fırsatı',
  subtext: 'Bu parça yalnızca bu sipariş için ve kısa bir süre size ayrıldı.',
};

export type ReservationStatus = 'active' | 'accepted' | 'declined' | 'expired' | 'converted' | 'released';

export interface OutletOffer {
  id: string;
  title: string;
  description: string;
  product_id: string | null;
  image_url: string;
  meter_length: number;
  offer_price: number;
  original_price: number | null;
  sku: string;
  note: string;
  quantity: number;
  sold_count: number;
  min_cart_total: number;
  start_at: string | null;
  end_at: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

const toNum = (v: any, f = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
};

const ensureCollections = (db: DatabaseData) => {
  const anyDb = db as any;
  if (!Array.isArray(anyDb.outlet_offers)) anyDb.outlet_offers = [];
  if (!Array.isArray(anyDb.outlet_reservations)) anyDb.outlet_reservations = [];
  return anyDb as DatabaseData & { outlet_offers: any[]; outlet_reservations: any[]; outlet_settings?: any };
};

export function getOutletSettings(db?: DatabaseData): OutletSettings {
  const source = db || dbRepo.read();
  const s = (source as any).outlet_settings || {};
  return {
    is_active: s.is_active === undefined ? DEFAULT_OUTLET_SETTINGS.is_active : Number(s.is_active) ? 1 : 0,
    hold_minutes: Math.min(60, Math.max(1, toNum(s.hold_minutes, DEFAULT_OUTLET_SETTINGS.hold_minutes))),
    accepted_hold_minutes: Math.min(
      120,
      Math.max(5, toNum(s.accepted_hold_minutes, DEFAULT_OUTLET_SETTINGS.accepted_hold_minutes))
    ),
    min_cart_total: Math.max(0, toNum(s.min_cart_total, 0)),
    headline: String(s.headline || DEFAULT_OUTLET_SETTINGS.headline),
    subtext: String(s.subtext || DEFAULT_OUTLET_SETTINGS.subtext),
  };
}

export function normalizeOutletOffer(o: any): OutletOffer {
  const now = new Date().toISOString();
  const nd = (v: any) => {
    if (!v) return null;
    const d = new Date(String(v));
    return isNaN(d.getTime()) ? null : d.toISOString();
  };
  return {
    id: String(o?.id || ''),
    title: String(o?.title || 'Outlet Kumaş'),
    description: String(o?.description || ''),
    product_id: o?.product_id ? String(o.product_id) : null,
    image_url: String(o?.image_url || ''),
    meter_length: round2(Math.max(0.1, toNum(o?.meter_length, 1))),
    offer_price: round2(Math.max(0, toNum(o?.offer_price))),
    original_price: o?.original_price ? round2(toNum(o.original_price)) || null : null,
    sku: String(o?.sku || ''),
    note: String(o?.note || ''),
    quantity: Math.max(1, Math.floor(toNum(o?.quantity, 1))),
    sold_count: Math.max(0, Math.floor(toNum(o?.sold_count))),
    min_cart_total: Math.max(0, toNum(o?.min_cart_total)),
    start_at: nd(o?.start_at),
    end_at: nd(o?.end_at),
    sort_order: toNum(o?.sort_order),
    is_active: o?.is_active === undefined ? 1 : Number(o.is_active) ? 1 : 0,
    created_at: String(o?.created_at || now),
    updated_at: String(o?.updated_at || o?.created_at || now),
  };
}

/** Süresi dolan rezervasyonları kapatır, eski kayıtları temizler. Değişiklik olduysa true döner. */
export function cleanupReservations(db: DatabaseData, now: number = Date.now()): boolean {
  const d = ensureCollections(db);
  let changed = false;
  for (const r of d.outlet_reservations) {
    if ((r.status === 'active' || r.status === 'accepted') && new Date(r.expires_at).getTime() < now) {
      r.status = 'expired';
      r.closed_at = new Date(now).toISOString();
      changed = true;
    }
  }
  const cutoff = now - 3 * 24 * 60 * 60 * 1000;
  const before = d.outlet_reservations.length;
  d.outlet_reservations = d.outlet_reservations.filter(
    (r: any) =>
      r.status === 'active' ||
      r.status === 'accepted' ||
      r.status === 'converted' ||
      new Date(r.created_at).getTime() > cutoff
  );
  if (d.outlet_reservations.length !== before) changed = true;
  return changed;
}

function liveHolds(db: DatabaseData, offerId: string, now: number, excludeReservationId?: string): number {
  const d = ensureCollections(db);
  return d.outlet_reservations.filter(
    (r: any) =>
      r.offer_id === offerId &&
      r.id !== excludeReservationId &&
      (r.status === 'active' || r.status === 'accepted') &&
      new Date(r.expires_at).getTime() >= now
  ).length;
}

export function getOfferAvailability(
  db: DatabaseData,
  offer: OutletOffer,
  now: number = Date.now(),
  excludeReservationId?: string
): number {
  return Math.max(0, offer.quantity - offer.sold_count - liveHolds(db, offer.id, now, excludeReservationId));
}

export function isOfferInWindow(offer: OutletOffer, now: number = Date.now()): boolean {
  if (!offer.is_active) return false;
  if (offer.start_at && new Date(offer.start_at).getTime() > now) return false;
  if (offer.end_at && new Date(offer.end_at).getTime() < now) return false;
  return offer.sold_count < offer.quantity;
}

export function getOfferProduct(db: DatabaseData, offer: OutletOffer): any | null {
  if (!offer.product_id) return null;
  return (db.products || []).find((p: any) => p.id === offer.product_id) || null;
}

export function toPublicOffer(db: DatabaseData, offer: OutletOffer) {
  const product = getOfferProduct(db, offer);
  const perMeter = product ? toNum(product.discount_price) || toNum(product.base_price) : 0;
  const computedOriginal = perMeter > 0 ? round2(perMeter * offer.meter_length) : null;
  const original = offer.original_price || computedOriginal;
  return {
    id: offer.id,
    title: offer.title,
    description: offer.description,
    note: offer.note,
    image_url: offer.image_url || product?.main_image_url || '',
    meter_length: offer.meter_length,
    offer_price: offer.offer_price,
    original_price: original && original > offer.offer_price ? original : null,
    product_name: product?.name || null,
    product_slug: product?.slug || null,
  };
}

function newReservationId() {
  return `ores-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

function sanitizeSession(sessionId: any): string {
  return String(sessionId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

/**
 * Ödeme sayfası açıldığında çağrılır. Oturumun canlı bir rezervasyonu varsa onu,
 * yoksa uygun ilk parçayı rezerve edip döner.
 */
export function requestOutletOffer(params: {
  sessionId: string;
  cartSubtotal: number;
  declinedOfferIds?: string[];
}) {
  const sessionId = sanitizeSession(params.sessionId);
  if (!sessionId || sessionId.length < 8) return { offer: null as any, reservation: null as any, settings: null as any };

  const now = Date.now();
  const db = ensureCollections(dbRepo.read());
  let changed = cleanupReservations(db, now);
  const settings = getOutletSettings(db);

  const finish = (payload: any) => {
    if (changed) dbRepo.write(db);
    return payload;
  };

  if (!settings.is_active) return finish({ offer: null, reservation: null, settings });

  const offers = db.outlet_offers.map(normalizeOutletOffer);

  // 1) Oturumun zaten canlı bir rezervasyonu var mı?
  const existing = db.outlet_reservations.find(
    (r: any) =>
      r.session_id === sessionId &&
      (r.status === 'active' || r.status === 'accepted') &&
      new Date(r.expires_at).getTime() >= now
  );
  if (existing) {
    const offer = offers.find((o) => o.id === existing.offer_id);
    if (offer && offer.sold_count < offer.quantity) {
      return finish({ offer: toPublicOffer(db, offer), reservation: publicReservation(existing), settings });
    }
    existing.status = 'released';
    existing.closed_at = new Date(now).toISOString();
    changed = true;
  }

  // 2) Bu oturumda daha önce bir teklif gösterildiyse (reddetti/süresi doldu) tekrar teklif sunma
  const alreadyShown = db.outlet_reservations.some(
    (r: any) => r.session_id === sessionId && (r.status === 'declined' || r.status === 'expired')
  );
  if (alreadyShown) return finish({ offer: null, reservation: null, settings });

  const declined = new Set((params.declinedOfferIds || []).map(String));
  const cartSubtotal = toNum(params.cartSubtotal);
  if (cartSubtotal <= 0 || cartSubtotal < settings.min_cart_total) {
    return finish({ offer: null, reservation: null, settings });
  }

  const candidates = offers
    .filter((o) => !declined.has(o.id))
    .filter((o) => isOfferInWindow(o, now))
    .filter((o) => cartSubtotal >= o.min_cart_total)
    .filter((o) => getOfferAvailability(db, o, now) > 0)
    .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));

  const offer = candidates[0];
  if (!offer) return finish({ offer: null, reservation: null, settings });

  const reservation = {
    id: newReservationId(),
    offer_id: offer.id,
    session_id: sessionId,
    status: 'active' as ReservationStatus,
    created_at: new Date(now).toISOString(),
    expires_at: new Date(now + settings.hold_minutes * 60 * 1000).toISOString(),
  };
  db.outlet_reservations.push(reservation);
  changed = true;

  return finish({ offer: toPublicOffer(db, offer), reservation: publicReservation(reservation), settings });
}

function publicReservation(r: any) {
  return {
    id: r.id,
    offer_id: r.offer_id,
    status: r.status,
    expires_at: r.expires_at,
  };
}

/** Müşterinin "Siparişe Ekle" / "İstemiyorum" kararını işler. */
export function respondOutletOffer(params: { sessionId: string; reservationId: string; action: 'accept' | 'decline' }) {
  const sessionId = sanitizeSession(params.sessionId);
  const now = Date.now();
  const db = ensureCollections(dbRepo.read());
  cleanupReservations(db, now);
  const settings = getOutletSettings(db);

  const res = db.outlet_reservations.find((r: any) => r.id === params.reservationId && r.session_id === sessionId);
  if (!res) {
    dbRepo.write(db);
    throw new Error('Outlet fırsatı bulunamadı.');
  }

  if (params.action === 'decline') {
    if (res.status === 'active' || res.status === 'accepted') {
      res.status = 'declined';
      res.closed_at = new Date(now).toISOString();
    }
    dbRepo.write(db);
    return { reservation: publicReservation(res) };
  }

  // accept
  const offerRaw = db.outlet_offers.find((o: any) => o.id === res.offer_id);
  const offer = offerRaw ? normalizeOutletOffer(offerRaw) : null;
  if (!offer) {
    dbRepo.write(db);
    throw new Error('Bu outlet ürünü artık mevcut değil.');
  }

  if (res.status === 'expired' || res.status === 'declined' || res.status === 'released') {
    dbRepo.write(db);
    throw new Error('Bu fırsatın süresi doldu.');
  }
  if (getOfferAvailability(db, offer, now, res.id) <= 0) {
    res.status = 'released';
    res.closed_at = new Date(now).toISOString();
    dbRepo.write(db);
    throw new Error('Üzgünüz, bu outlet ürünü başka bir müşteri tarafından alındı.');
  }

  res.status = 'accepted';
  res.accepted_at = new Date(now).toISOString();
  res.expires_at = new Date(now + settings.accepted_hold_minutes * 60 * 1000).toISOString();
  dbRepo.write(db);
  return { reservation: publicReservation(res), offer: toPublicOffer(db, offer) };
}

/**
 * Sipariş oluşturma ve fiyat teklifi sırasında kabul edilmiş outlet parçasını doğrular.
 * db üzerinde değişiklik yapmaz.
 */
export function resolveAcceptedOutlet(
  db: DatabaseData,
  ref: { reservationId?: string; sessionId?: string } | null | undefined,
  now: number = Date.now()
): { offer: OutletOffer; reservation: any; error: null } | { offer: null; reservation: null; error: string | null } {
  if (!ref || !ref.reservationId) return { offer: null, reservation: null, error: null };
  const d = ensureCollections(db);
  const sessionId = sanitizeSession(ref.sessionId);
  const res = d.outlet_reservations.find((r: any) => r.id === ref.reservationId && r.session_id === sessionId);
  if (!res || !(res.status === 'accepted' || (res.status === 'expired' && res.accepted_at))) {
    return { offer: null, reservation: null, error: 'Outlet fırsatı artık geçerli değil.' };
  }
  const raw = d.outlet_offers.find((o: any) => o.id === res.offer_id);
  if (!raw) return { offer: null, reservation: null, error: 'Bu outlet ürünü artık mevcut değil.' };
  const offer = normalizeOutletOffer(raw);
  if (!offer.is_active || offer.sold_count >= offer.quantity) {
    return { offer: null, reservation: null, error: 'Üzgünüz, outlet ürünü başka bir müşteri tarafından alındı.' };
  }
  // Süre dolduysa ama parça hâlâ boştaysa satışa izin ver
  const expired = res.status === 'expired' || new Date(res.expires_at).getTime() < now;
  if (expired && getOfferAvailability(db, offer, now, res.id) <= 0) {
    return { offer: null, reservation: null, error: 'Üzgünüz, outlet ürünü başka bir müşteri tarafından alındı.' };
  }
  return { offer, reservation: res, error: null };
}

export function buildOutletOrderLine(db: DatabaseData, offer: OutletOffer) {
  const product = getOfferProduct(db, offer);
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    product_id: offer.product_id || `outlet-${offer.id}`,
    variant_id: null,
    product_name: `OUTLET • ${offer.title}`,
    variant_title: offer.note || '',
    product_sku: offer.sku || product?.sku || 'OUTLET',
    product_image: offer.image_url || product?.main_image_url || '',
    meter_quantity: offer.meter_length,
    unit_price: round2(offer.offer_price / offer.meter_length),
    total_price: offer.offer_price,
    is_outlet: 1,
    outlet_offer_id: offer.id,
  };
}

/** Sipariş kaydedilmeden hemen önce çağrılır (çağıran db'yi kaydeder). */
export function commitOutletSale(
  db: DatabaseData,
  offer: OutletOffer,
  reservation: any,
  order: { id: string; order_number: string }
) {
  const d = ensureCollections(db);
  const raw = d.outlet_offers.find((o: any) => o.id === offer.id);
  if (raw) {
    raw.sold_count = Math.max(0, Math.floor(toNum(raw.sold_count))) + 1;
    raw.updated_at = new Date().toISOString();
    if (raw.sold_count >= Math.max(1, Math.floor(toNum(raw.quantity, 1)))) {
      raw.sold_out_at = new Date().toISOString();
    }
  }
  const res = d.outlet_reservations.find((r: any) => r.id === reservation.id);
  if (res) {
    res.status = 'converted';
    res.order_id = order.id;
    res.order_number = order.order_number;
    res.closed_at = new Date().toISOString();
  }
}

/** Sipariş iptal edilirse outlet parçasını tekrar satışa açar. Tekrar çağrılması güvenlidir. */
export function releaseOutletSale(db: DatabaseData, order: any): boolean {
  if (!order || !order.outlet_offer_id || order.outlet_released) return false;
  const d = ensureCollections(db);
  const raw = d.outlet_offers.find((o: any) => o.id === order.outlet_offer_id);
  if (raw) {
    raw.sold_count = Math.max(0, Math.floor(toNum(raw.sold_count)) - 1);
    delete raw.sold_out_at;
    raw.updated_at = new Date().toISOString();
  }
  order.outlet_released = 1;
  return true;
}
