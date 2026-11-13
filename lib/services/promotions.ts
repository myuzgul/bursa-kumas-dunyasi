/**
 * Promosyon Motoru — Sepette İndirim kampanyaları ve Kupon kodları
 *
 * Tek doğruluk kaynağı: Sepet çekmecesi, ödeme sayfası ve sipariş oluşturma
 * aynı hesaplamayı bu dosyadan kullanır. Tutarlar her zaman sunucuda hesaplanır.
 */
import type { DatabaseData } from '../db/repo';

export type PromoDiscountType = 'percent' | 'fixed';
export type CouponDiscountType = 'percent' | 'fixed' | 'free_shipping';
export type PromoTargetScope = 'all' | 'categories' | 'products';
export type PromoCustomerScope = 'all' | 'members' | 'first_order' | 'specific';
export type PromoStatus = 'active' | 'scheduled' | 'expired' | 'inactive' | 'exhausted';

export interface PricedLine {
  product_id: string;
  variant_id?: string | null;
  meter_quantity: number;
  unit_price: number;
  total_price: number;
  is_outlet?: boolean | number;
}

export interface PromoCustomer {
  userId?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface CartDiscountRule {
  id: string;
  title: string;
  label: string;
  description: string;
  discount_type: PromoDiscountType;
  discount_value: number;
  max_discount_amount: number | null;
  min_cart_total: number;
  min_total_meters: number;
  start_at: string | null;
  end_at: string | null;
  applies_to: PromoTargetScope;
  category_ids: string[];
  product_ids: string[];
  exclude_product_ids: string[];
  exclude_sale_items: number;
  customer_scope: PromoCustomerScope;
  allowed_emails: string[];
  combinable_with_coupon: number;
  usage_limit: number | null;
  used_count: number;
  total_discount_given: number;
  show_progress_hint: number;
  priority: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number;
  min_total_meters: number;
  start_at: string | null;
  end_at: string | null;
  usage_limit: number | null;
  per_customer_limit: number | null;
  applies_to: PromoTargetScope;
  category_ids: string[];
  product_ids: string[];
  exclude_product_ids: string[];
  exclude_sale_items: number;
  customer_scope: PromoCustomerScope;
  allowed_emails: string[];
  combinable_with_cart_discount: number;
  is_public: number;
  batch_id: string | null;
  used_count: number;
  total_discount_given: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CartRuleResult {
  id: string;
  title: string;
  label: string;
  discount_type: PromoDiscountType;
  discount_value: number;
  amount: number;
}

export interface CouponResult {
  id: string;
  code: string;
  title: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  amount: number;
  free_shipping: boolean;
}

export interface ProgressHint {
  rule_id: string;
  label: string;
  remaining_amount: number;
  remaining_meters: number;
  message: string;
}

export interface PromotionResult {
  cartRule: CartRuleResult | null;
  cartDiscount: number;
  coupon: CouponResult | null;
  couponDiscount: number;
  couponError: string | null;
  couponMessage: string | null;
  freeShipping: boolean;
  totalDiscount: number;
  hint: ProgressHint | null;
  notices: string[];
}

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

export const round2 = (n: number): number => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const toNum = (v: any, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toNullableNum = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const toStrArray = (v: any): string[] => {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x || '').trim()).filter(Boolean);
};

const toFlag = (v: any, fallback: number): number => {
  if (v === undefined || v === null || v === '') return fallback;
  if (v === true || v === 'true') return 1;
  if (v === false || v === 'false') return 0;
  return Number(v) ? 1 : 0;
};

export function formatTL(amount: number): string {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${round2(amount).toFixed(2)} TL`;
  }
}

/** "2026-09-07" gibi eski tarih-only değerleri İstanbul saatine göre ISO'ya çevirir. */
function legacyDateToIso(value: any, endOfDay: boolean): string | null {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return `${s}T${endOfDay ? '23:59:59' : '00:00:00'}+03:00`;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function normalizeDate(value: any): string | null {
  if (!value) return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function normalizeEmail(v: any): string {
  return String(v || '').trim().toLowerCase();
}

export function normalizePhone(v: any): string {
  const digits = String(v || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function normalizeTargetScope(v: any): PromoTargetScope {
  return v === 'categories' || v === 'products' ? v : 'all';
}

function normalizeCustomerScope(v: any): PromoCustomerScope {
  return v === 'members' || v === 'first_order' || v === 'specific' ? v : 'all';
}

// ---------------------------------------------------------------------------
// Normalizasyon (eski kayıtlarla geriye dönük uyumlu)
// ---------------------------------------------------------------------------

export function normalizeCartRule(r: any): CartDiscountRule {
  const legacyPercent = toNum(r?.discount_percent);
  const legacyFixed = toNum(r?.discount_fixed);
  const discount_type: PromoDiscountType =
    r?.discount_type === 'fixed' || r?.discount_type === 'percent'
      ? r.discount_type
      : legacyPercent > 0
        ? 'percent'
        : 'fixed';
  const discount_value =
    r?.discount_value !== undefined && r?.discount_value !== null
      ? toNum(r.discount_value)
      : discount_type === 'percent'
        ? legacyPercent
        : legacyFixed;

  const now = new Date().toISOString();
  return {
    id: String(r?.id || ''),
    title: String(r?.title || 'Sepette İndirim'),
    label: String(r?.label || ''),
    description: String(r?.description || ''),
    discount_type,
    discount_value: Math.max(0, discount_value),
    max_discount_amount: toNullableNum(r?.max_discount_amount),
    min_cart_total: Math.max(0, toNum(r?.min_cart_total)),
    min_total_meters: Math.max(0, toNum(r?.min_total_meters)),
    start_at: normalizeDate(r?.start_at),
    end_at: normalizeDate(r?.end_at),
    applies_to: normalizeTargetScope(r?.applies_to),
    category_ids: toStrArray(r?.category_ids),
    product_ids: toStrArray(r?.product_ids),
    exclude_product_ids: toStrArray(r?.exclude_product_ids),
    exclude_sale_items: toFlag(r?.exclude_sale_items, 0),
    customer_scope: normalizeCustomerScope(r?.customer_scope),
    allowed_emails: toStrArray(r?.allowed_emails).map(normalizeEmail),
    combinable_with_coupon: toFlag(r?.combinable_with_coupon, 1),
    usage_limit: toNullableNum(r?.usage_limit),
    used_count: Math.max(0, toNum(r?.used_count)),
    total_discount_given: Math.max(0, toNum(r?.total_discount_given)),
    show_progress_hint: toFlag(r?.show_progress_hint, 1),
    priority: toNum(r?.priority),
    is_active: toFlag(r?.is_active, 1),
    created_at: String(r?.created_at || now),
    updated_at: String(r?.updated_at || r?.created_at || now),
  };
}

export function normalizeCoupon(c: any): Coupon {
  const type: CouponDiscountType =
    c?.discount_type === 'fixed' || c?.discount_type === 'free_shipping' ? c.discount_type : 'percent';
  const now = new Date().toISOString();
  return {
    id: String(c?.id || ''),
    code: String(c?.code || '').trim().toUpperCase(),
    title: String(c?.title || c?.code || ''),
    description: String(c?.description || ''),
    discount_type: type,
    discount_value: type === 'free_shipping' ? 0 : Math.max(0, toNum(c?.discount_value)),
    max_discount_amount: toNullableNum(c?.max_discount_amount),
    min_order_amount: Math.max(0, toNum(c?.min_order_amount ?? c?.min_basket_amount)),
    min_total_meters: Math.max(0, toNum(c?.min_total_meters)),
    start_at: c?.start_at !== undefined ? normalizeDate(c.start_at) : legacyDateToIso(c?.start_date, false),
    end_at:
      c?.end_at !== undefined
        ? normalizeDate(c.end_at)
        : legacyDateToIso(c?.expiry_date ?? c?.expires_at, true),
    usage_limit: toNullableNum(c?.usage_limit),
    per_customer_limit: toNullableNum(c?.per_customer_limit ?? c?.per_user_limit),
    applies_to: normalizeTargetScope(c?.applies_to),
    category_ids: toStrArray(c?.category_ids),
    product_ids: toStrArray(c?.product_ids),
    exclude_product_ids: toStrArray(c?.exclude_product_ids),
    exclude_sale_items: toFlag(c?.exclude_sale_items, 0),
    customer_scope: normalizeCustomerScope(c?.customer_scope),
    allowed_emails: toStrArray(c?.allowed_emails).map(normalizeEmail),
    combinable_with_cart_discount: toFlag(c?.combinable_with_cart_discount, 1),
    is_public: toFlag(c?.is_public, 0),
    batch_id: c?.batch_id ? String(c.batch_id) : null,
    used_count: Math.max(0, toNum(c?.used_count)),
    total_discount_given: Math.max(0, toNum(c?.total_discount_given)),
    is_active: toFlag(c?.is_active, 1),
    created_at: String(c?.created_at || now),
    updated_at: String(c?.updated_at || c?.created_at || now),
  };
}

export function getPromoStatus(
  p: { is_active: number; start_at: string | null; end_at: string | null; usage_limit: number | null; used_count: number },
  now: number = Date.now()
): PromoStatus {
  if (!p.is_active) return 'inactive';
  if (p.end_at && new Date(p.end_at).getTime() < now) return 'expired';
  if (p.usage_limit && p.used_count >= p.usage_limit) return 'exhausted';
  if (p.start_at && new Date(p.start_at).getTime() > now) return 'scheduled';
  return 'active';
}

export function describeDiscount(type: string, value: number): string {
  if (type === 'free_shipping') return 'Ücretsiz Kargo';
  if (type === 'percent') return `%${round2(value)} İndirim`;
  return `${formatTL(value)} İndirim`;
}

// ---------------------------------------------------------------------------
// Ürün / kategori uygunluğu
// ---------------------------------------------------------------------------

interface CatalogIndex {
  products: Map<string, any>;
  variants: Map<string, any>;
  ancestors: Map<string, Set<string>>;
  slugToId: Map<string, string>;
}

function buildCatalogIndex(db: DatabaseData): CatalogIndex {
  const products = new Map<string, any>();
  for (const p of db.products || []) products.set(String(p.id), p);
  const variants = new Map<string, any>();
  for (const v of db.product_variants || []) variants.set(String(v.id), v);

  const parentOf = new Map<string, string | null>();
  const slugToId = new Map<string, string>();
  for (const c of db.categories || []) {
    parentOf.set(String(c.id), c.parent_id ? String(c.parent_id) : null);
    if (c.slug) slugToId.set(String(c.slug), String(c.id));
  }
  const ancestors = new Map<string, Set<string>>();
  for (const id of Array.from(parentOf.keys())) {
    const set = new Set<string>();
    let cur: string | null = id;
    let guard = 0;
    while (cur && !set.has(cur) && guard < 20) {
      set.add(cur);
      cur = parentOf.get(cur) || null;
      guard++;
    }
    ancestors.set(id, set);
  }
  return { products, variants, ancestors, slugToId };
}

function productCategorySet(product: any, idx: CatalogIndex): Set<string> {
  const direct = new Set<string>();
  if (product?.category_id) direct.add(String(product.category_id));
  for (const c of product?.category_ids || []) direct.add(String(c));
  for (const s of product?.category_slugs || []) {
    const id = idx.slugToId.get(String(s));
    if (id) direct.add(id);
  }
  const all = new Set<string>();
  for (const id of Array.from(direct)) {
    const anc = idx.ancestors.get(id);
    if (anc) anc.forEach((a) => all.add(a));
    else all.add(id);
  }
  return all;
}

function isSaleLine(line: PricedLine, idx: CatalogIndex): boolean {
  const product = idx.products.get(String(line.product_id));
  if (!product) return false;
  if (line.variant_id) {
    const v = idx.variants.get(String(line.variant_id));
    if (v) {
      const dp = toNum(v.discount_price);
      const base = toNum(v.price);
      if (dp > 0 && base > 0 && dp < base) return true;
    }
  }
  const dp = toNum(product.discount_price);
  const base = toNum(product.base_price);
  return dp > 0 && base > 0 && dp < base;
}

interface TargetedPromo {
  applies_to: PromoTargetScope;
  category_ids: string[];
  product_ids: string[];
  exclude_product_ids: string[];
  exclude_sale_items: number;
}

function lineIsEligible(promo: TargetedPromo, line: PricedLine, idx: CatalogIndex): boolean {
  if (line.is_outlet) return false;
  const pid = String(line.product_id);
  if (promo.exclude_product_ids.includes(pid)) return false;
  if (promo.exclude_sale_items && isSaleLine(line, idx)) return false;
  if (promo.applies_to === 'products') return promo.product_ids.includes(pid);
  if (promo.applies_to === 'categories') {
    const product = idx.products.get(pid);
    if (!product) return false;
    const cats = productCategorySet(product, idx);
    return promo.category_ids.some((c) => cats.has(c));
  }
  return true;
}

function eligibleTotals(promo: TargetedPromo, lines: PricedLine[], idx: CatalogIndex) {
  let subtotal = 0;
  let meters = 0;
  let count = 0;
  for (const l of lines) {
    if (lineIsEligible(promo, l, idx)) {
      subtotal += toNum(l.total_price);
      meters += toNum(l.meter_quantity);
      count++;
    }
  }
  return { subtotal: round2(subtotal), meters: round2(meters), count };
}

// ---------------------------------------------------------------------------
// Müşteri kapsamı ve kullanım sayıları
// ---------------------------------------------------------------------------

function isCancelledStatus(status: any): boolean {
  const s = String(status || '');
  return s.startsWith('Iptal') || s.startsWith('Iade') || s === 'cancelled' || s === 'refunded' || s === 'failed';
}

function customerHasPreviousOrder(db: DatabaseData, customer: PromoCustomer): boolean {
  const email = normalizeEmail(customer.email);
  const phone = normalizePhone(customer.phone);
  const userId = customer.userId ? String(customer.userId) : '';
  return (db.orders || []).some((o: any) => {
    if (isCancelledStatus(o.status)) return false;
    if (userId && o.user_id && String(o.user_id) === userId) return true;
    if (email && normalizeEmail(o.customer_email) === email) return true;
    if (phone && phone.length >= 10 && normalizePhone(o.customer_phone) === phone) return true;
    return false;
  });
}

function hasIdentity(customer: PromoCustomer): boolean {
  return !!(customer.userId || normalizeEmail(customer.email) || normalizePhone(customer.phone));
}

/** null = uygun, string = hata mesajı */
function checkCustomerScope(
  db: DatabaseData,
  scope: PromoCustomerScope,
  allowedEmails: string[],
  customer: PromoCustomer,
  noun: 'kupon' | 'kampanya'
): string | null {
  if (scope === 'members') {
    if (!customer.userId) return `Bu ${noun} yalnızca üye müşterilerimize özeldir. Lütfen giriş yapın.`;
    return null;
  }
  if (scope === 'first_order') {
    if (!hasIdentity(customer)) return null; // e-posta ödeme adımında doğrulanır
    if (customerHasPreviousOrder(db, customer)) return `Bu ${noun} yalnızca ilk siparişinize özeldir.`;
    return null;
  }
  if (scope === 'specific') {
    const email = normalizeEmail(customer.email);
    if (!email) return null; // e-posta ödeme adımında doğrulanır
    if (!allowedEmails.includes(email)) return `Bu ${noun} e-posta adresiniz için tanımlı değil.`;
    return null;
  }
  return null;
}

export function countCouponUsageForCustomer(db: DatabaseData, couponId: string, customer: PromoCustomer): number {
  const email = normalizeEmail(customer.email);
  const phone = normalizePhone(customer.phone);
  const userId = customer.userId ? String(customer.userId) : '';
  return (db.coupon_usages || []).filter((u: any) => {
    if (String(u.coupon_id) !== String(couponId)) return false;
    if (u.status === 'cancelled') return false;
    if (userId && u.user_id && String(u.user_id) === userId) return true;
    if (email && normalizeEmail(u.email) === email) return true;
    if (phone && phone.length >= 10 && normalizePhone(u.phone) === phone) return true;
    return false;
  }).length;
}

function computeAmount(
  type: 'percent' | 'fixed',
  value: number,
  max: number | null,
  eligibleSubtotal: number
): number {
  let amount = type === 'percent' ? (eligibleSubtotal * value) / 100 : value;
  if (type === 'percent' && max && amount > max) amount = max;
  return round2(Math.max(0, Math.min(amount, eligibleSubtotal)));
}

// ---------------------------------------------------------------------------
// Sepette İndirim
// ---------------------------------------------------------------------------

export function evaluateCartRules(
  db: DatabaseData,
  lines: PricedLine[],
  customer: PromoCustomer,
  now: number = Date.now()
): { best: (CartRuleResult & { rule: CartDiscountRule }) | null; hint: ProgressHint | null } {
  const idx = buildCatalogIndex(db);
  const rules = (db.cart_discount_rules || []).map(normalizeCartRule);

  let best: (CartRuleResult & { rule: CartDiscountRule }) | null = null;
  let hint: ProgressHint | null = null;

  for (const rule of rules) {
    if (getPromoStatus(rule, now) !== 'active') continue;
    if (rule.discount_value <= 0) continue;
    if (checkCustomerScope(db, rule.customer_scope, rule.allowed_emails, customer, 'kampanya')) continue;

    const totals = eligibleTotals(rule, lines, idx);
    const label = rule.label || `Sepette ${describeDiscount(rule.discount_type, rule.discount_value)}`;

    const meetsAmount = totals.subtotal > 0 && totals.subtotal >= rule.min_cart_total;
    const meetsMeters = totals.meters >= rule.min_total_meters;

    if (meetsAmount && meetsMeters) {
      const amount = computeAmount(rule.discount_type, rule.discount_value, rule.max_discount_amount, totals.subtotal);
      if (amount <= 0) continue;
      if (
        !best ||
        amount > best.amount ||
        (amount === best.amount && rule.priority > best.rule.priority)
      ) {
        best = {
          id: rule.id,
          title: rule.title,
          label,
          discount_type: rule.discount_type,
          discount_value: rule.discount_value,
          amount,
          rule,
        };
      }
    } else if (rule.show_progress_hint) {
      // Kapsamda hiç ürün yoksa (kategoriye özel kampanya) ipucu gösterme
      if (rule.applies_to !== 'all' && totals.count === 0) continue;
      const remaining_amount = round2(Math.max(0, rule.min_cart_total - totals.subtotal));
      const remaining_meters = round2(Math.max(0, rule.min_total_meters - totals.meters));
      if (remaining_amount <= 0 && remaining_meters <= 0) continue;

      const parts: string[] = [];
      if (remaining_amount > 0) parts.push(formatTL(remaining_amount));
      if (remaining_meters > 0) parts.push(`${remaining_meters} metre`);
      const where =
        rule.applies_to === 'all' ? 'Sepetinize' : 'Kampanyalı ürünlerden sepetinize';
      const message = `${where} ${parts.join(' ve ')} daha ekleyin, ${label} kazanın!`;

      if (
        !hint ||
        remaining_amount < hint.remaining_amount ||
        (remaining_amount === hint.remaining_amount && remaining_meters < hint.remaining_meters)
      ) {
        hint = { rule_id: rule.id, label, remaining_amount, remaining_meters, message };
      }
    }
  }

  // Zaten daha iyi bir indirim varsa, daha küçük kampanyanın ipucunu gösterme
  if (best && hint) {
    const hintRule = rules.find((r) => r.id === hint!.rule_id);
    if (hintRule) {
      const totals = eligibleTotals(hintRule, lines, idx);
      const potential = computeAmount(
        hintRule.discount_type,
        hintRule.discount_value,
        hintRule.max_discount_amount,
        Math.max(totals.subtotal, hintRule.min_cart_total)
      );
      if (potential <= best.amount) hint = null;
    }
  }

  return { best, hint };
}

// ---------------------------------------------------------------------------
// Kupon
// ---------------------------------------------------------------------------

export function findCouponByCode(db: DatabaseData, code: string): Coupon | null {
  const target = String(code || '').trim().toUpperCase();
  if (!target) return null;
  const raw = (db.coupons || []).find((c: any) => String(c.code || '').trim().toUpperCase() === target);
  return raw ? normalizeCoupon(raw) : null;
}

export function evaluateCoupon(
  db: DatabaseData,
  code: string,
  lines: PricedLine[],
  customer: PromoCustomer,
  now: number = Date.now()
): { result: CouponResult | null; coupon: Coupon | null; error: string | null } {
  const coupon = findCouponByCode(db, code);
  if (!coupon) return { result: null, coupon: null, error: 'Geçersiz kupon kodu.' };

  const status = getPromoStatus(coupon, now);
  if (status === 'inactive') return { result: null, coupon, error: 'Bu kupon şu anda kullanıma kapalı.' };
  if (status === 'expired') return { result: null, coupon, error: 'Bu kuponun kullanım süresi dolmuştur.' };
  if (status === 'exhausted') return { result: null, coupon, error: 'Bu kuponun kullanım limiti dolmuştur.' };
  if (status === 'scheduled') {
    const d = new Date(coupon.start_at as string);
    const when = d.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'long', timeStyle: 'short' });
    return { result: null, coupon, error: `Bu kupon ${when} itibarıyla geçerli olacaktır.` };
  }

  const scopeError = checkCustomerScope(db, coupon.customer_scope, coupon.allowed_emails, customer, 'kupon');
  if (scopeError) return { result: null, coupon, error: scopeError };

  if (coupon.per_customer_limit && hasIdentity(customer)) {
    const used = countCouponUsageForCustomer(db, coupon.id, customer);
    if (used >= coupon.per_customer_limit) {
      return {
        result: null,
        coupon,
        error:
          coupon.per_customer_limit === 1
            ? 'Bu kuponu daha önce kullandınız.'
            : `Bu kuponu en fazla ${coupon.per_customer_limit} kez kullanabilirsiniz.`,
      };
    }
  }

  const idx = buildCatalogIndex(db);
  const totals = eligibleTotals(coupon, lines, idx);
  if (totals.count === 0 || totals.subtotal <= 0) {
    return { result: null, coupon, error: 'Sepetinizdeki ürünler bu kuponun kapsamında değil.' };
  }
  if (coupon.min_order_amount > 0 && totals.subtotal < coupon.min_order_amount) {
    const rem = round2(coupon.min_order_amount - totals.subtotal);
    return {
      result: null,
      coupon,
      error: `Bu kupon ${formatTL(coupon.min_order_amount)} ve üzeri alışverişlerde geçerlidir. ${formatTL(rem)} daha ekleyin.`,
    };
  }
  if (coupon.min_total_meters > 0 && totals.meters < coupon.min_total_meters) {
    return {
      result: null,
      coupon,
      error: `Bu kupon en az ${coupon.min_total_meters} metre alımda geçerlidir.`,
    };
  }

  const amount =
    coupon.discount_type === 'free_shipping'
      ? 0
      : computeAmount(coupon.discount_type, coupon.discount_value, coupon.max_discount_amount, totals.subtotal);

  return {
    coupon,
    error: null,
    result: {
      id: coupon.id,
      code: coupon.code,
      title: coupon.title || coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      amount,
      free_shipping: coupon.discount_type === 'free_shipping',
    },
  };
}

// ---------------------------------------------------------------------------
// Birleşik hesaplama
// ---------------------------------------------------------------------------

export function computePromotions(
  db: DatabaseData,
  lines: PricedLine[],
  opts: { couponCode?: string | null; customer?: PromoCustomer; now?: number } = {}
): PromotionResult {
  const now = opts.now ?? Date.now();
  const customer = opts.customer || {};
  const notices: string[] = [];

  const productSubtotal = round2(
    lines.filter((l) => !l.is_outlet).reduce((acc, l) => acc + toNum(l.total_price), 0)
  );

  const { best, hint } = evaluateCartRules(db, lines, customer, now);
  let cartRule: CartRuleResult | null = best
    ? {
        id: best.id,
        title: best.title,
        label: best.label,
        discount_type: best.discount_type,
        discount_value: best.discount_value,
        amount: best.amount,
      }
    : null;

  let coupon: CouponResult | null = null;
  let couponError: string | null = null;
  let couponMessage: string | null = null;

  const code = String(opts.couponCode || '').trim();
  if (code) {
    const ev = evaluateCoupon(db, code, lines, customer, now);
    if (ev.error || !ev.result) {
      couponError = ev.error || 'Geçersiz kupon kodu.';
    } else {
      coupon = ev.result;
      const couponCombinable = ev.coupon ? ev.coupon.combinable_with_cart_discount === 1 : true;
      const ruleCombinable = best ? best.rule.combinable_with_coupon === 1 : true;

      if (cartRule && !coupon.free_shipping && (!couponCombinable || !ruleCombinable)) {
        // Birleştirilemiyor: müşteri için daha avantajlı olanı uygula
        if (coupon.amount >= cartRule.amount) {
          notices.push(`"${coupon.code}" kuponu sepet kampanyasıyla birleştirilemediği için yalnızca kupon indirimi uygulandı.`);
          cartRule = null;
        } else {
          couponError = 'Bu kupon sepetteki kampanya ile birlikte kullanılamaz. Daha avantajlı olan sepet indirimi uygulandı.';
          coupon = null;
        }
      }
    }
  }

  let cartDiscount = cartRule ? cartRule.amount : 0;
  let couponDiscount = coupon ? coupon.amount : 0;

  // Toplam indirim ürün ara toplamını aşamaz
  if (cartDiscount + couponDiscount > productSubtotal) {
    couponDiscount = round2(Math.max(0, productSubtotal - cartDiscount));
    if (coupon) coupon = { ...coupon, amount: couponDiscount };
  }

  if (coupon) {
    couponMessage = coupon.free_shipping
      ? `"${coupon.code}" kuponu uygulandı: Ücretsiz Kargo`
      : `"${coupon.code}" kuponu uygulandı: ${formatTL(couponDiscount)} indirim`;
  }

  return {
    cartRule,
    cartDiscount: round2(cartDiscount),
    coupon,
    couponDiscount: round2(couponDiscount),
    couponError,
    couponMessage,
    freeShipping: !!coupon?.free_shipping,
    totalDiscount: round2(cartDiscount + couponDiscount),
    hint,
    notices,
  };
}

// ---------------------------------------------------------------------------
// Sipariş sonrası kullanım kaydı (çağıran taraf db'yi kaydeder)
// ---------------------------------------------------------------------------

export function recordPromotionUsage(
  db: DatabaseData,
  promo: PromotionResult,
  order: { id: string; order_number: string; customer_email?: string; customer_phone?: string; customer_name?: string },
  customer: PromoCustomer
): void {
  const nowIso = new Date().toISOString();

  if (promo.cartRule) {
    const rule = (db.cart_discount_rules || []).find((r: any) => r.id === promo.cartRule!.id);
    if (rule) {
      rule.used_count = toNum(rule.used_count) + 1;
      rule.total_discount_given = round2(toNum(rule.total_discount_given) + promo.cartDiscount);
      rule.last_used_at = nowIso;
    }
  }

  if (promo.coupon) {
    const c = (db.coupons || []).find((x: any) => x.id === promo.coupon!.id);
    if (c) {
      c.used_count = toNum(c.used_count) + 1;
      c.total_discount_given = round2(toNum(c.total_discount_given) + promo.couponDiscount);
      c.last_used_at = nowIso;
    }
    if (!db.coupon_usages) db.coupon_usages = [];
    db.coupon_usages.unshift({
      id: `cu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      coupon_id: promo.coupon.id,
      code: promo.coupon.code,
      order_id: order.id,
      order_number: order.order_number,
      user_id: customer.userId || null,
      email: normalizeEmail(customer.email || order.customer_email),
      phone: normalizePhone(customer.phone || order.customer_phone),
      customer_name: order.customer_name || '',
      discount_amount: promo.couponDiscount,
      free_shipping: promo.coupon.free_shipping ? 1 : 0,
      status: 'used',
      created_at: nowIso,
    });
  }
}

/** Sipariş iptal edildiğinde kupon/kampanya kullanımını geri alır. Tekrar çağrılması güvenlidir. */
export function releasePromotionUsage(db: DatabaseData, order: any): boolean {
  if (!order || order.promotions_released) return false;
  let changed = false;

  if (order.cart_discount_rule_id) {
    const rule = (db.cart_discount_rules || []).find((r: any) => r.id === order.cart_discount_rule_id);
    if (rule) {
      rule.used_count = Math.max(0, toNum(rule.used_count) - 1);
      rule.total_discount_given = round2(Math.max(0, toNum(rule.total_discount_given) - toNum(order.cart_discount_total)));
      changed = true;
    }
  }

  if (order.coupon_id) {
    const c = (db.coupons || []).find((x: any) => x.id === order.coupon_id);
    if (c) {
      c.used_count = Math.max(0, toNum(c.used_count) - 1);
      c.total_discount_given = round2(Math.max(0, toNum(c.total_discount_given) - toNum(order.coupon_discount_total)));
      changed = true;
    }
    for (const u of db.coupon_usages || []) {
      if (u.order_id === order.id && u.status !== 'cancelled') {
        u.status = 'cancelled';
        u.cancelled_at = new Date().toISOString();
        changed = true;
      }
    }
  }

  if (changed) order.promotions_released = 1;
  return changed;
}
