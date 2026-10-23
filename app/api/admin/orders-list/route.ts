import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const db = dbRepo.read();

  const orders = db.orders || [];
  const items = db.order_items || [];

  return NextResponse.json(
    {
      orders,
      items,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
