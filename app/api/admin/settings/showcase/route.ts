import { NextRequest, NextResponse } from 'next/server';
import { getShowcaseSettings, updateShowcaseSettings } from '@/lib/services/showcaseSettings';
import { dbRepo } from '@/lib/db/repo';

export async function GET() {
  try {
    const settings = getShowcaseSettings();
    const db = dbRepo.read();

    const categories = (db.categories || []).filter((c: any) => c.is_active === 1);
    const products = (db.products || []).map((p: any) => {
      const cat = categories.find((c: any) => c.id === p.category_id);
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category_id: p.category_id,
        category_name: cat ? cat.name : 'Genel',
        base_price: p.base_price,
        discount_price: p.discount_price,
        main_image_url: p.main_image_url,
        stock_meter: p.stock_meter,
        is_active: p.is_active,
        is_featured: p.is_featured === 1 || p.is_featured === true ? 1 : 0,
        vitrin_order: p.vitrin_order || 0,
      };
    });

    return NextResponse.json({
      success: true,
      settings,
      categories,
      products,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = updateShowcaseSettings(body);
    return NextResponse.json({
      success: true,
      message: 'Vitrin ayarları başarıyla güncellendi.',
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
