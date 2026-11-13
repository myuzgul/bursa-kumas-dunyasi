import { NextRequest, NextResponse } from 'next/server';
import { toggleProductShowcase, updateProductShowcaseOrder } from '@/lib/services/showcaseSettings';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, isFeatured, orderIndex } = body;

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
