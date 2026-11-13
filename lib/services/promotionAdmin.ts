/**
 * Yönetim paneli için Sepette İndirim / Kupon giriş doğrulama yardımcıları.
 */
import { normalizeCartRule, normalizeCoupon } from './promotions';

const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const isoOrNull = (v: any): string | null | 'invalid' => {
  if (v === null || v === undefined || v === '') return null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? 'invalid' : d.toISOString();
};

const strArr = (v: any): string[] =>
  Array.isArray(v) ? Array.from(new Set(v.map((x: any) => String(x || '').trim()).filter(Boolean))) : [];

const emailList = (v: any): string[] => {
  const raw = Array.isArray(v) ? v.join('\n') : String(v || '');
  return Array.from(
    new Set(
      raw
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
    )
  );
};

function commonTargeting(body: any, errors: string[]) {
  const applies_to = ['all', 'categories', 'products'].includes(body.applies_to) ? body.applies_to : 'all';
  const category_ids = strArr(body.category_ids);
  const product_ids = strArr(body.product_ids);
  if (applies_to === 'categories' && category_ids.length === 0) errors.push('En az bir kategori seçiniz.');
  if (applies_to === 'products' && product_ids.length === 0) errors.push('En az bir ürün seçiniz.');

  const customer_scope = ['all', 'members', 'first_order', 'specific'].includes(body.customer_scope)
    ? body.customer_scope
    : 'all';
  const allowed_emails = emailList(body.allowed_emails);
  if (customer_scope === 'specific' && allowed_emails.length === 0) {
    errors.push('Belirli müşteriler seçeneği için en az bir geçerli e-posta adresi giriniz.');
  }

  const start_at = isoOrNull(body.start_at);
  const end_at = isoOrNull(body.end_at);
  if (start_at === 'invalid') errors.push('Başlangıç tarihi geçersiz.');
  if (end_at === 'invalid') errors.push('Bitiş tarihi geçersiz.');
  if (start_at && end_at && start_at !== 'invalid' && end_at !== 'invalid' && new Date(end_at) <= new Date(start_at)) {
    errors.push('Bitiş tarihi başlangıç tarihinden sonra olmalıdır.');
  }

  return {
    applies_to,
    category_ids: applies_to === 'categories' ? category_ids : [],
    product_ids: applies_to === 'products' ? product_ids : [],
    exclude_product_ids: strArr(body.exclude_product_ids),
    exclude_sale_items: body.exclude_sale_items ? 1 : 0,
    customer_scope,
    allowed_emails: customer_scope === 'specific' ? allowed_emails : [],
    start_at: start_at === 'invalid' ? null : start_at,
    end_at: end_at === 'invalid' ? null : end_at,
  };
}

function discountFields(body: any, errors: string[], allowFreeShipping: boolean) {
  const types = allowFreeShipping ? ['percent', 'fixed', 'free_shipping'] : ['percent', 'fixed'];
  const discount_type = types.includes(body.discount_type) ? body.discount_type : 'percent';
  let discount_value = num(body.discount_value);
  if (discount_type === 'free_shipping') {
    discount_value = 0;
  } else {
    if (!(discount_value > 0)) errors.push('İndirim değeri 0’dan büyük olmalıdır.');
    if (discount_type === 'percent' && discount_value > 100) errors.push('Yüzde indirim en fazla %100 olabilir.');
  }
  const max = num(body.max_discount_amount);
  return {
    discount_type,
    discount_value: Number.isFinite(discount_value) ? discount_value : 0,
    max_discount_amount: discount_type === 'percent' && max > 0 ? max : null,
  };
}

const posOrZero = (v: any) => {
  const n = num(v);
  return n > 0 ? n : 0;
};
const posOrNull = (v: any) => {
  const n = num(v);
  return n > 0 ? Math.floor(n) : null;
};

export function sanitizeCartRuleInput(body: any, existing?: any): { rule: any; errors: string[] } {
  const errors: string[] = [];
  const title = String(body.title || '').trim();
  if (!title) errors.push('Kampanya adı zorunludur.');

  const rule = normalizeCartRule({
    ...(existing || {}),
    title,
    label: String(body.label || '').trim(),
    description: String(body.description || '').trim(),
    ...discountFields(body, errors, false),
    min_cart_total: posOrZero(body.min_cart_total),
    min_total_meters: posOrZero(body.min_total_meters),
    ...commonTargeting(body, errors),
    combinable_with_coupon: body.combinable_with_coupon ? 1 : 0,
    usage_limit: posOrNull(body.usage_limit),
    show_progress_hint: body.show_progress_hint ? 1 : 0,
    priority: Number.isFinite(num(body.priority)) ? num(body.priority) : 0,
    is_active: body.is_active ? 1 : 0,
    updated_at: new Date().toISOString(),
  });
  return { rule, errors };
}

export const COUPON_CODE_RE = /^[A-Z0-9_-]{3,32}$/;

export function sanitizeCouponInput(body: any, existing?: any): { coupon: any; errors: string[] } {
  const errors: string[] = [];
  const code = String(body.code || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!COUPON_CODE_RE.test(code)) {
    errors.push('Kupon kodu 3-32 karakter olmalı; yalnızca harf (A-Z), rakam, tire ve alt çizgi içerebilir.');
  }
  const coupon = normalizeCoupon({
    ...(existing || {}),
    code,
    title: String(body.title || '').trim() || code,
    description: String(body.description || '').trim(),
    ...discountFields(body, errors, true),
    min_order_amount: posOrZero(body.min_order_amount),
    min_total_meters: posOrZero(body.min_total_meters),
    ...commonTargeting(body, errors),
    usage_limit: posOrNull(body.usage_limit),
    per_customer_limit: posOrNull(body.per_customer_limit),
    combinable_with_cart_discount: body.combinable_with_cart_discount ? 1 : 0,
    is_public: body.is_public ? 1 : 0,
    is_active: body.is_active ? 1 : 0,
    updated_at: new Date().toISOString(),
  });
  return { coupon, errors };
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // karışan karakterler (0/O, 1/I) çıkarıldı

export function generateCouponCode(prefix: string, length: number, taken: Set<string>): string {
  const cleanPrefix = String(prefix || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 16);
  const len = Math.min(16, Math.max(4, Math.floor(length || 8)));
  for (let attempt = 0; attempt < 1000; attempt++) {
    let body = '';
    for (let i = 0; i < len; i++) body += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    const code = cleanPrefix ? `${cleanPrefix}-${body}` : body;
    if (!taken.has(code)) {
      taken.add(code);
      return code;
    }
  }
  throw new Error('Benzersiz kupon kodu üretilemedi, lütfen önek veya uzunluğu değiştirin.');
}
