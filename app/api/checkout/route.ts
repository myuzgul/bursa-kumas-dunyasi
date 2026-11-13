import { NextResponse } from 'next/server';
import { processCheckoutOrder } from '@/lib/services/orderWorkflow';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Üyelik bazlı kupon/kampanya kontrolleri için kimlik yalnızca oturum çerezinden alınır
    delete body.promoUserId;
    const auth = await getAuthenticatedUser(req).catch(() => null);
    if (auth && auth.role === 'customer' && auth.user?.id) {
      body.promoUserId = auth.user.id;
    }

    const result = await processCheckoutOrder(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Sipariş işlenirken bir hata oluştu.', code: error.code || null },
      { status: 400 }
    );
  }
}
