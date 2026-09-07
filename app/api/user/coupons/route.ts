import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { readDb } from '@/lib/db/repo';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const db = readDb();
    const coupons = db.coupons || [];
    const usages = db.coupon_usages || [];

    const now = new Date().getTime();

    // Check user's specific usage for each coupon
    const userCoupons = coupons.map((c: any) => {
      const userUsageCount = usages.filter(
        (u: any) => u.coupon_id === c.id && u.user_id === auth.user.id
      ).length;

      const isExpired = c.expires_at ? new Date(c.expires_at).getTime() < now : false;
      const isExhausted = c.usage_limit ? userUsageCount >= c.usage_limit : false;
      const isAvailable = c.is_active === 1 && !isExpired && !isExhausted;

      return {
        id: c.id,
        code: c.code,
        discount_type: c.discount_type,
        discount_value: c.discount_value,
        min_basket_amount: c.min_basket_amount || 0,
        expires_at: c.expires_at,
        is_available: isAvailable,
        is_used: isExhausted,
        is_expired: isExpired,
        description: c.description || (c.discount_type === 'percent' ? `%${c.discount_value} İndirim Kuponu` : `${c.discount_value} TL İndirim Kuponu`),
      };
    });

    return NextResponse.json({ coupons: userCoupons });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
