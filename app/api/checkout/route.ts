import { NextResponse } from 'next/server';
import { processCheckoutOrder } from '@/lib/services/orderWorkflow';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await processCheckoutOrder(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Sipariş işlenirken bir hata oluştu.' },
      { status: 400 }
    );
  }
}
