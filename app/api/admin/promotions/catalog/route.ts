import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';
import { requireAdmin } from '@/lib/auth/adminGuard';

export const dynamic = 'force-dynamic';

/** Kampanya / kupon / outlet formlarındaki kategori ve ürün seçicileri için hafif katalog listesi. */
export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.response) return guard.response;

  const db = dbRepo.read();
  const categories = (db.categories || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    parent_id: c.parent_id || null,
    is_active: c.is_active,
  }));
  const products = (db.products || [])
    .filter((p: any) => p.is_archived !== 1)
    .map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku || '',
      image: p.main_image_url || '',
      price: Number(p.discount_price || p.base_price) || 0,
      base_price: Number(p.base_price) || 0,
      is_active: p.is_active,
    }));
  return NextResponse.json({ categories, products }, { headers: { 'Cache-Control': 'no-store' } });
}
