import { NextResponse } from 'next/server';
import { requestOutletOffer } from '@/lib/services/outlet';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = requestOutletOffer({
      sessionId: String(body.sessionId || ''),
      cartSubtotal: Number(body.cartSubtotal || 0),
      declinedOfferIds: Array.isArray(body.declinedOfferIds) ? body.declinedOfferIds.map(String) : [],
    });
    return NextResponse.json(
      {
        offer: result.offer,
        reservation: result.reservation,
        headline: result.settings?.headline || null,
        subtext: result.settings?.subtext || null,
        server_time: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return NextResponse.json({ offer: null, message: err.message || 'Outlet fırsatı alınamadı.' }, { status: 200 });
  }
}
