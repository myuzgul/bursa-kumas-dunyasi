import { NextResponse } from 'next/server';
import { respondOutletOffer } from '@/lib/services/outlet';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action === 'accept' ? 'accept' : 'decline';
    const result = respondOutletOffer({
      sessionId: String(body.sessionId || ''),
      reservationId: String(body.reservationId || ''),
      action,
    });
    return NextResponse.json({ success: true, ...result, server_time: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'İşlem yapılamadı.' }, { status: 409 });
  }
}
