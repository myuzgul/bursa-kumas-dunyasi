import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const db = dbRepo.read();

  const product = (db.products || []).find((p: any) => p.id === id);
  if (!product) {
    return NextResponse.json({ message: 'Ürün bulunamadı.' }, { status: 404 });
  }

  const pCatIds = Array.isArray(product.category_ids) && product.category_ids.length > 0
    ? product.category_ids
    : (product.category_id ? [product.category_id] : []);

  const variants = (db.product_variants || []).filter((v: any) => v.product_id === id);
  const category = (db.categories || []).find((c: any) => c.id === product.category_id);
  const productWithCategories = {
    ...product,
    category_ids: pCatIds,
  };
  const stockHistory = (db.stock_history || []).filter((s: any) => s.product_id === id).slice(0, 10);
  const priceHistory = (db.price_history || []).filter((p: any) => p.product_id === id).slice(0, 10);

  return NextResponse.json({
    product: productWithCategories,
    variants,
    category,
    categories: db.categories || [],
    badges: (db.product_badges || []).filter((b: any) => b.is_active === 1),
    stockHistory,
    priceHistory,
  });
}
