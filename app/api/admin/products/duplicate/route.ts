import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';
import { logAuditAction } from '@/lib/services/auditLogger';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ message: 'Kaynak ürün ID zorunludur.' }, { status: 400 });
    }

    const db = dbRepo.read();
    const sourceProduct = (db.products || []).find((p: any) => p.id === id);

    if (!sourceProduct) {
      return NextResponse.json({ message: 'Kopyalanacak ürün bulunamadı.' }, { status: 404 });
    }

    const newProductId = `prod-${Date.now()}`;
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newSku = `${sourceProduct.sku}-KOPYA-${randomSuffix}`;
    const newName = `${sourceProduct.name} (Kopya)`;
    const newSlug = `${sourceProduct.slug}-kopya-${randomSuffix.toLowerCase()}`;

    const duplicatedProduct = {
      ...sourceProduct,
      id: newProductId,
      name: newName,
      sku: newSku,
      slug: newSlug,
      is_active: 0, // start as draft/inactive
      is_archived: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!db.products) db.products = [];
    db.products.unshift(duplicatedProduct);

    // Duplicate variants if any
    const sourceVariants = (db.product_variants || []).filter((v: any) => v.product_id === id);
    if (sourceVariants.length > 0) {
      if (!db.product_variants) db.product_variants = [];
      sourceVariants.forEach((v: any, index: number) => {
        db.product_variants.push({
          ...v,
          id: `var-${newProductId}-${index + 1}`,
          product_id: newProductId,
          sku: `${newSku}-${index + 1}`,
          created_at: new Date().toISOString(),
        });
      });
    }

    logAuditAction({
      adminEmail: 'admin@bursakumasdunyasi.com',
      action: 'PRODUCT_DUPLICATE',
      details: `Ürün kopyalandı: ${sourceProduct.name} -> ${newName} (${newSku})`,
    });

    dbRepo.write(db);

    return NextResponse.json({
      success: true,
      message: `"${sourceProduct.name}" kumaşı başarıyla kopyalandı (${newSku}). Taslak olarak eklendi.`,
      product: duplicatedProduct,
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Kopyalama sırasında hata oluştu.' }, { status: 500 });
  }
}
