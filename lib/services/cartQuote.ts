/**
 * Sepet fiyat teklifi (quote): Sepet çekmecesi ve ödeme sayfası, gösterdikleri
 * tüm tutarları bu hesaplamadan alır. Sipariş oluşturma da aynı formülleri kullanır,
 * böylece müşterinin gördüğü tutar ile siparişe yazılan tutar her zaman aynıdır.
 */
import { dbRepo, type DatabaseData } from '../db/repo';
import { computePromotions, round2, type PricedLine, type PromoCustomer, type PromotionResult } from './promotions';
import { calculateShippingFee } from './shippingSettings';
import { calculatePaymentAdjustments } from './paymentSettings';
import { resolveAcceptedOutlet, toPublicOffer } from './outlet';

export interface QuoteItemInput {
  productId: string;
  variantId?: string | null;
  meterQuantity: number;
}

export interface OrderTotals {
  subtotal: number;
  shippingTotal: number;
  shippingIsFree: boolean;
  shippingThreshold: number;
  remainingForFreeShipping: number;
  carrierName: string;
  paymentFee: number;
  paymentDiscount: number;
  taxTotal: number;
  grandTotal: number;
}

/** Sunucu fiyatlarıyla sepet satırlarını hesaplar (stok hatası fırlatmaz). */
export function priceCartLines(db: DatabaseData, items: QuoteItemInput[]): PricedLine[] {
  const lines: PricedLine[] = [];
  for (const item of items || []) {
    const qty = Number(item?.meterQuantity);
    if (!item?.productId || !Number.isFinite(qty) || qty <= 0) continue;
    const product = (db.products || []).find((p: any) => p.id === item.productId && p.is_active === 1);
    if (!product) continue;

    let unitPrice = Number(product.discount_price || product.base_price) || 0;
    if (item.variantId) {
      const variant = (db.product_variants || []).find(
        (v: any) => v.id === item.variantId && v.product_id === product.id && v.is_active === 1
      );
      if (variant) unitPrice = Number(variant.discount_price || variant.price) || unitPrice;
    }
    lines.push({
      product_id: product.id,
      variant_id: item.variantId || null,
      meter_quantity: qty,
      unit_price: unitPrice,
      total_price: round2(unitPrice * qty),
    });
  }
  return lines;
}

/** Sipariş oluşturma ile birebir aynı toplam formülü. */
export function computeOrderTotals(params: {
  subtotal: number;
  totalDiscount: number;
  freeShipping: boolean;
  paymentMethod: string;
  hasItems: boolean;
}): OrderTotals {
  const subtotal = round2(params.subtotal);
  const shipping = calculateShippingFee(subtotal);
  const shippingIsFree = params.freeShipping || shipping.isFree || !params.hasItems;
  const shippingTotal = shippingIsFree ? 0 : round2(shipping.fee);

  const pay = calculatePaymentAdjustments({
    subtotal,
    couponDiscount: params.totalDiscount,
    paymentMethod: params.paymentMethod,
  });

  const taxRate = 10;
  const taxTotal = round2(((subtotal - params.totalDiscount - pay.paymentDiscount) * taxRate) / (100 + taxRate));
  const grandTotal = round2(
    Math.max(0, subtotal - params.totalDiscount - pay.paymentDiscount + shippingTotal + pay.paymentFee)
  );

  return {
    subtotal,
    shippingTotal,
    shippingIsFree,
    shippingThreshold: shipping.threshold,
    remainingForFreeShipping: params.freeShipping ? 0 : shipping.remainingForFree,
    carrierName: shipping.carrierName,
    paymentFee: pay.paymentFee,
    paymentDiscount: pay.paymentDiscount,
    taxTotal,
    grandTotal,
  };
}

export function buildCartQuote(params: {
  items: QuoteItemInput[];
  couponCode?: string | null;
  customer?: PromoCustomer;
  paymentMethod?: string | null;
  outlet?: { reservationId?: string; sessionId?: string } | null;
}) {
  const db = dbRepo.read();
  const lines = priceCartLines(db, params.items || []);
  const productSubtotal = round2(lines.reduce((a, l) => a + l.total_price, 0));

  let outlet: any = null;
  let outletError: string | null = null;
  if (params.outlet?.reservationId) {
    const resolved = resolveAcceptedOutlet(db, params.outlet);
    if (resolved.offer) {
      outlet = {
        reservation_id: resolved.reservation.id,
        expires_at: resolved.reservation.expires_at,
        ...toPublicOffer(db, resolved.offer),
      };
    } else {
      outletError = resolved.error;
    }
  }

  const promo: PromotionResult = computePromotions(db, lines, {
    couponCode: params.couponCode,
    customer: params.customer,
  });

  const subtotal = round2(productSubtotal + (outlet ? outlet.offer_price : 0));
  const totals = computeOrderTotals({
    subtotal,
    totalDiscount: promo.totalDiscount,
    freeShipping: promo.freeShipping,
    paymentMethod: params.paymentMethod || 'paytr',
    hasItems: lines.length > 0,
  });

  return {
    lines: lines.map((l) => ({
      productId: l.product_id,
      variantId: l.variant_id,
      meterQuantity: l.meter_quantity,
      unitPrice: l.unit_price,
      totalPrice: l.total_price,
    })),
    productSubtotal,
    outlet,
    outletError,
    cartDiscount: promo.cartRule
      ? { id: promo.cartRule.id, label: promo.cartRule.label, amount: promo.cartDiscount }
      : null,
    coupon: promo.coupon
      ? {
          code: promo.coupon.code,
          title: promo.coupon.title,
          discount_type: promo.coupon.discount_type,
          discount_value: promo.coupon.discount_value,
          amount: promo.couponDiscount,
          free_shipping: promo.coupon.free_shipping,
        }
      : null,
    couponError: promo.couponError,
    couponMessage: promo.couponMessage,
    totalDiscount: promo.totalDiscount,
    hint: promo.hint,
    notices: promo.notices,
    ...totals,
  };
}
