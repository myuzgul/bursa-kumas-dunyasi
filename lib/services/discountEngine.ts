import { dbRepo } from '../db/repo';

export interface DiscountCalculationResult {
  couponDiscount: number;
  cartRuleDiscount: number;
  totalDiscount: number;
  appliedCoupon: any | null;
  appliedRule: any | null;
  errorMessage?: string;
}

export function calculateDiscounts(
  cartSubtotal: number,
  couponCode?: string,
  userId?: string
): DiscountCalculationResult {
  const db = dbRepo.read();
  let couponDiscount = 0;
  let cartRuleDiscount = 0;
  let appliedCoupon: any = null;
  let appliedRule: any = null;
  let errorMessage: string | undefined = undefined;

  // 1. Coupon Evaluation
  if (couponCode && couponCode.trim().length > 0) {
    const codeUpper = couponCode.trim().toUpperCase();
    const coupon = db.coupons.find((c: any) => c.code.toUpperCase() === codeUpper && c.is_active === 1);

    if (!coupon) {
      errorMessage = 'Geçersiz veya süresi dolmuş kupon kodu.';
    } else if (coupon.min_order_amount && cartSubtotal < coupon.min_order_amount) {
      errorMessage = `Bu kupon en az ${coupon.min_order_amount} TL sepet tutarında geçerlidir.`;
    } else if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      errorMessage = 'Bu kuponun toplam kullanım limiti dolmuştur.';
    } else {
      if (coupon.discount_type === 'percent') {
        couponDiscount = (cartSubtotal * coupon.discount_value) / 100;
        if (coupon.max_discount_amount && couponDiscount > coupon.max_discount_amount) {
          couponDiscount = coupon.max_discount_amount;
        }
      } else {
        couponDiscount = coupon.discount_value;
      }
      appliedCoupon = coupon;
    }
  }

  // 2. Automatic Tiered Cart Rules
  const activeRules = db.cart_discount_rules.filter(
    (r: any) => r.is_active === 1 && cartSubtotal >= r.min_cart_total
  );

  if (activeRules.length > 0) {
    // Pick the most favorable rule for customer
    const bestRule = activeRules.reduce((best: any, current: any) => {
      const currentSaving = current.discount_percent
        ? (cartSubtotal * current.discount_percent) / 100
        : current.discount_fixed;
      const bestSaving = best.discount_percent
        ? (cartSubtotal * best.discount_percent) / 100
        : best.discount_fixed;
      return currentSaving > bestSaving ? current : best;
    }, activeRules[0]);

    if (bestRule.discount_percent) {
      cartRuleDiscount = (cartSubtotal * bestRule.discount_percent) / 100;
    } else {
      cartRuleDiscount = bestRule.discount_fixed;
    }
    appliedRule = bestRule;
  }

  const totalDiscount = Number((couponDiscount + cartRuleDiscount).toFixed(2));

  return {
    couponDiscount: Number(couponDiscount.toFixed(2)),
    cartRuleDiscount: Number(cartRuleDiscount.toFixed(2)),
    totalDiscount,
    appliedCoupon,
    appliedRule,
    errorMessage,
  };
}
