import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';
import { calculateDiscounts } from '@/lib/services/discountEngine';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, subtotal } = body;

    if (!code || !code.trim()) {
      return NextResponse.json({ valid: false, message: 'Lütfen bir kupon kodu giriniz.' }, { status: 400 });
    }

    const currentSubtotal = Number(subtotal || 0);
    const discounts = calculateDiscounts(currentSubtotal, code.trim());

    if (discounts.errorMessage || !discounts.appliedCoupon) {
      return NextResponse.json({
        valid: false,
        message: discounts.errorMessage || 'Geçersiz kupon kodu.',
      });
    }

    const coupon = discounts.appliedCoupon;
    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        title: coupon.title || coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discounts.couponDiscount,
      },
      discounts,
      message: `"${coupon.code}" kuponu başarıyla uygulandı! (${
        coupon.discount_type === 'percent'
          ? `%${coupon.discount_value} indirim`
          : `${coupon.discount_value} TL indirim`
      })`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, message: err.message || 'Kupon kontrol edilirken hata oluştu.' },
      { status: 500 }
    );
  }
}
