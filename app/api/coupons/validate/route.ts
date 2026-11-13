import { NextResponse } from 'next/server';
import { buildCartQuote } from '@/lib/services/cartQuote';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Geriye dönük uyumluluk: { code, items } veya { code, subtotal } kabul eder.
 * Yeni ekranlar /api/cart/quote kullanır.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || '').trim();
    if (!code) {
      return NextResponse.json({ valid: false, message: 'Lütfen bir kupon kodu giriniz.' }, { status: 400 });
    }
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({
        valid: false,
        message: 'Kuponu uygulayabilmek için sepetinizde ürün bulunmalıdır.',
      });
    }

    const auth = await getAuthenticatedUser(req).catch(() => null);
    const quote = buildCartQuote({
      items,
      couponCode: code,
      customer: {
        userId: auth && auth.role === 'customer' ? auth.user?.id : null,
        email: body.email || auth?.user?.email || null,
        phone: body.phone || null,
      },
    });

    if (!quote.coupon) {
      return NextResponse.json({ valid: false, message: quote.couponError || 'Geçersiz kupon kodu.' });
    }

    return NextResponse.json({
      valid: true,
      coupon: { ...quote.coupon, discount_amount: quote.coupon.amount },
      message: quote.couponMessage,
      quote,
    });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, message: err.message || 'Kupon kontrol edilirken hata oluştu.' },
      { status: 500 }
    );
  }
}
