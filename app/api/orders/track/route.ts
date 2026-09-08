import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get('order') || '';
  const cleanQuery = rawQuery.replace(/#/g, '').trim().toUpperCase();

  if (!cleanQuery) {
    return NextResponse.json({ message: 'Sipariş numarası gereklidir.' }, { status: 400 });
  }

  const db = dbRepo.read();
  const order = db.orders?.find((o: any) => {
    const oNum = String(o.order_number || '').trim().toUpperCase();
    const oId = String(o.id || '').trim().toUpperCase();
    return oNum === cleanQuery || oId === cleanQuery;
  });

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
