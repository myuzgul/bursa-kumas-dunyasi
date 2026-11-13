import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { readDb } from '@/lib/db/repo';
import {
  normalizeCoupon,
  getPromoStatus,
  countCouponUsageForCustomer,
  normalizeEmail,
  describeDiscount,
} from '@/lib/services/promotions';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const db = readDb();
    const email = normalizeEmail(auth.user.email);
    const customer = { userId: auth.user.id, email: auth.user.email, phone: auth.user.phone };

    // Yalnızca "Hesabım'da göster" işaretli kuponlar ve bu müşteriye özel tanımlanmış kuponlar listelenir
    const visible = (db.coupons || [])
      .map(normalizeCoupon)
      .filter((c) => c.is_public === 1 || (c.customer_scope === 'specific' && c.allowed_emails.includes(email)))
      .filter((c) => c.is_active === 1 || countCouponUsageForCustomer(db, c.id, customer) > 0);

    const userCoupons = visible.map((c) => {
      const status = getPromoStatus(c);
      const usedByMe = countCouponUsageForCustomer(db, c.id, customer);
      const isUsed = c.per_customer_limit ? usedByMe >= c.per_customer_limit : false;
      const isExpired = status === 'expired' || status === 'exhausted';
      return {
        id: c.id,
        code: c.code,
        discount_type: c.discount_type,
        discount_value: c.discount_value,
        min_basket_amount: c.min_order_amount || 0,
        starts_at: c.start_at,
        expires_at: c.end_at,
        is_available: status === 'active' && !isUsed,
        is_used: isUsed,
        is_expired: isExpired,
        description: c.description || c.title || describeDiscount(c.discount_type, c.discount_value),
      };
    });

    return NextResponse.json({ coupons: userCoupons });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
