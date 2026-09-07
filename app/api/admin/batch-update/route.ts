import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';
import { logAuditAction } from '@/lib/services/auditLogger';

export async function GET() {
  const db = dbRepo.read();
  const categories = db.categories || [];
  const products = db.products || [];

  // Calculate product counts per category
  const categoriesWithCounts = categories.map((cat: any) => {
    const count = products.filter((p: any) => {
      if (p.category_id === cat.id) return true;
      if (Array.isArray(p.category_ids) && p.category_ids.includes(cat.id)) return true;
      if (typeof p.category_ids === 'string' && p.category_ids.split(',').map((s: string) => s.trim()).includes(cat.id)) return true;
      return false;
    }).length;

    return {
      ...cat,
      productCount: count,
    };
  });

  return NextResponse.json({
    categories: categoriesWithCounts,
    totalProducts: products.length,
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { categoryId, actionType, percentage, fixedAmount } = body;

    const db = dbRepo.read();
    let targetProducts = db.products || [];

    if (categoryId && categoryId !== 'all') {
      targetProducts = targetProducts.filter((p: any) => {
        if (p.category_id === categoryId) return true;
        if (Array.isArray(p.category_ids) && p.category_ids.includes(categoryId)) return true;
        if (typeof p.category_ids === 'string' && p.category_ids.split(',').map((s: string) => s.trim()).includes(categoryId)) return true;
        return false;
      });
    }

    if (targetProducts.length === 0) {
      return NextResponse.json({ message: 'Seçili kategoride güncellenecek kumaş ürünü bulunamadı.' }, { status: 400 });
    }

    let affectedProductsCount = 0;
    let affectedVariantsCount = 0;

    const parsedPercent = parseFloat(percentage) || 0;
    const parsedFixed = parseFloat(fixedAmount) || 0;

    for (const p of targetProducts) {
      const oldBase = Number(p.base_price || 0);
      const oldDiscount = p.discount_price ? Number(p.discount_price) : null;

      if (actionType === 'price_increase_percent') {
        // Increase base price by X%
        const rate = 1 + parsedPercent / 100;
        p.base_price = Number((oldBase * rate).toFixed(2));
        if (oldDiscount) {
          p.discount_price = Number((oldDiscount * rate).toFixed(2));
        }
      } else if (actionType === 'price_discount_percent') {
        // Set discount price as base_price - X%
        const rate = 1 - parsedPercent / 100;
        p.discount_price = Number((oldBase * rate).toFixed(2));
      } else if (actionType === 'price_fixed_add') {
        // Add fixed TL to base and discount price
        p.base_price = Number((oldBase + parsedFixed).toFixed(2));
        if (oldDiscount) {
          p.discount_price = Number((oldDiscount + parsedFixed).toFixed(2));
        }
      } else if (actionType === 'price_fixed_subtract') {
        // Subtract fixed TL
        p.base_price = Math.max(1, Number((oldBase - parsedFixed).toFixed(2)));
        if (oldDiscount) {
          p.discount_price = Math.max(1, Number((oldDiscount - parsedFixed).toFixed(2)));
        }
      } else if (actionType === 'price_set_fixed') {
        // Directly set base price
        p.base_price = parsedFixed;
      } else if (actionType === 'remove_discount') {
        // Clear campaign discount price
        p.discount_price = null;
      }

      p.updated_at = new Date().toISOString();
      affectedProductsCount++;

      // Also update variants belonging to this product
      const productVariants = (db.product_variants || []).filter((v: any) => v.product_id === p.id);
      for (const v of productVariants) {
        const vOldPrice = Number(v.price || 0);
        const vOldDiscount = v.discount_price ? Number(v.discount_price) : null;

        if (actionType === 'price_increase_percent') {
          const rate = 1 + parsedPercent / 100;
          v.price = Number((vOldPrice * rate).toFixed(2));
          if (vOldDiscount) v.discount_price = Number((vOldDiscount * rate).toFixed(2));
        } else if (actionType === 'price_discount_percent') {
          const rate = 1 - parsedPercent / 100;
          v.discount_price = Number((vOldPrice * rate).toFixed(2));
        } else if (actionType === 'price_fixed_add') {
          v.price = Number((vOldPrice + parsedFixed).toFixed(2));
          if (vOldDiscount) v.discount_price = Number((vOldDiscount + parsedFixed).toFixed(2));
        } else if (actionType === 'price_fixed_subtract') {
          v.price = Math.max(1, Number((vOldPrice - parsedFixed).toFixed(2)));
          if (vOldDiscount) v.discount_price = Math.max(1, Number((vOldDiscount - parsedFixed).toFixed(2)));
        } else if (actionType === 'price_set_fixed') {
          v.price = parsedFixed;
        } else if (actionType === 'remove_discount') {
          v.discount_price = null;
        }
        affectedVariantsCount++;
      }
    }

    dbRepo.write(db);

    const categoryName = categoryId === 'all'
      ? 'Tüm Kategoriler'
      : (db.categories?.find((c: any) => c.id === categoryId)?.name || categoryId);

    logAuditAction({
      adminEmail: 'admin@bursakumasdunyasi.com',
      action: 'BATCH_PRICE_UPDATE',
      details: `Toplu Fiyat Güncelleme yapıldı: İşlem "${actionType}", Kategori: "${categoryName}", Güncellenen Kumaş: ${affectedProductsCount}, Güncellenen Varyasyon: ${affectedVariantsCount}`,
    });

    return NextResponse.json({
      success: true,
      affectedProductsCount,
      affectedVariantsCount,
      message: `${categoryName} kapsamında ${affectedProductsCount} adet kumaşın ve ${affectedVariantsCount} adet varyasyonunun fiyatları başarıyla güncellendi.`,
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Toplu fiyat güncelleme işlemi başarısız.' }, { status: 400 });
  }
}
