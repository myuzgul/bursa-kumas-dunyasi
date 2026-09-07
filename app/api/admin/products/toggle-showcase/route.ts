import { NextRequest, NextResponse } from 'next/server';
import { toggleProductShowcase, updateProductShowcaseOrder } from '@/lib/services/showcaseSettings';
import { dbRepo } from '@/lib/db/repo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, isFeatured, orderIndex, categoryId, batchAction } = body;

    const db = dbRepo.read();

    // Handle batch action by category (e.g. enable all in category or disable all in category)
    if (batchAction && categoryId) {
      const isFeatureFlag = batchAction === 'enable' ? 1 : 0;
      let modifiedCount = 0;

      for (const prod of db.products) {
        if (categoryId === 'all' || prod.category_id === categoryId) {
          prod.is_featured = isFeatureFlag;
          prod.updated_at = new Date().toISOString();
          modifiedCount++;
        }
      }

      dbRepo.write(db);
      return NextResponse.json({
        success: true,
        message: `${modifiedCount} ürünün vitrin durumu güncellendi.`,
      });
    }

    // Handle single product order update
    if (productId && orderIndex !== undefined) {
      const result = updateProductShowcaseOrder(productId, Number(orderIndex));
      return NextResponse.json({
        success: true,
        message: 'Vitrin sırası güncellendi.',
        result,
      });
    }

    // Handle single product toggle
    if (productId) {
      const result = toggleProductShowcase(
        productId,
        isFeatured !== undefined ? Boolean(isFeatured) : undefined
      );
      return NextResponse.json({
        success: true,
        message: result.is_featured === 1 ? 'Ürün ana sayfa vitrinine eklendi.' : 'Ürün ana sayfa vitrininden kaldırıldı.',
        result,
      });
    }

    return NextResponse.json({ success: false, message: 'Geçersiz parametre.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
