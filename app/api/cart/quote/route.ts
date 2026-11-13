import { NextResponse } from 'next/server';
import { buildCartQuote } from '@/lib/services/cartQuote';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const items = Array.isArray(body.items) ? body.items.slice(0, 100) : [];

    const auth = await getAuthenticatedUser(req).catch(() => null);
    const userId = auth && auth.role === 'customer' ? auth.user?.id : null;

    const quote = buildCartQuote({
      items: items.map((i: any) => ({
        productId: String(i?.productId || ''),
        variantId: i?.variantId ? String(i.variantId) : null,
        meterQuantity: Number(i?.meterQuantity),
      })),
      couponCode: body.couponCode ? String(body.couponCode).slice(0, 64) : null,
      paymentMethod: body.paymentMethod ? String(body.paymentMethod) : null,
      customer: {
        userId,
        email: body.email ? String(body.email) : (auth?.user?.email || null),
        phone: body.phone ? String(body.phone) : null,
      },
      outlet: body.outlet && body.outlet.reservationId
        ? { reservationId: String(body.outlet.reservationId), sessionId: String(body.outlet.sessionId || '') }
        : null,
    });

    return NextResponse.json(quote, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Sepet hesaplanamadı.' }, { status: 500 });
  }
}
