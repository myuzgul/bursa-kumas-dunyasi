import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get('order')?.trim().toUpperCase();

  if (!orderNumber) {
    return NextResponse.json({ message: 'Sipariş numarası gereklidir.' }, { status: 400 });
  }

  const db = dbRepo.read();
  const order = db.orders?.find(
    (o: any) => o.order_number.toUpperCase() === orderNumber
  );

  if (!order) {
    return NextResponse.json({ message: 'Belirtilen numaraya ait sipariş bulunamadı.' }, { status: 404 });
  }

  const items = db.order_items?.filter((i: any) => i.order_id === order.id) || [];
  const history = db.order_status_history?.filter((h: any) => h.order_id === order.id) || [];

  return NextResponse.json({
    order,
    items,
    history,
  });
}
