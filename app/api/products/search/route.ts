import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.toLowerCase() || '';

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [] });
  }

  const db = dbRepo.read();
  const products = (db.products || [])
    .filter(
      (p: any) =>
        p.is_active === 1 &&
        (p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.short_description && p.short_description.toLowerCase().includes(q)))
    )
    .slice(0, 8);

  return NextResponse.json({ products });
}
