import { NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/services/orderWorkflow';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await updateOrderStatus(
      params.id,
      body.status,
      body.adminName || 'Yönetici',
      body.notes
    );
    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Durum güncellenemedi.' }, { status: 400 });
  }
}
