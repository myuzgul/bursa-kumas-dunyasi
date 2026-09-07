import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { readDb } from '@/lib/db/repo';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Sipariş ID gereklidir.' }, { status: 400 });
    }

    const db = readDb();
    const order = (db.orders || []).find((o: any) => o.id === order_id || o.order_number === order_id);

    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    // IDOR Check
    const isOwner = order.user_id === auth.user.id || 
      (order.customer_email && order.customer_email.toLowerCase() === auth.user.email.toLowerCase());

    if (!isOwner) {
      return NextResponse.json({ error: 'Bu siparişi tekrarlama yetkiniz yok.' }, { status: 403 });
    }

    const orderItems = (db.order_items || []).filter((it: any) => it.order_id === order.id);
    const products = db.products || [];
    const variants = db.product_variants || [];

    const reorderItems: any[] = [];
    const warnings: string[] = [];

    for (const it of orderItems) {
      const prod = products.find((p: any) => p.id === it.product_id);

      if (!prod || prod.is_active === 0 || prod.is_archived) {
        warnings.push(`"${it.product_name || it.name}" kumaşı artık satışta bulunmadığı için sepete eklenemedi.`);
        continue;
      }

      let currentPrice = prod.discount_price || prod.base_price;
      let currentStock = prod.stock_meter || 100;
      let variantTitle = it.variant_title;
      let variantSku = prod.sku;

      if (it.variant_id) {
        const variant = variants.find((v: any) => v.id === it.variant_id);
        if (variant) {
          if (variant.is_active === 0) {
            warnings.push(`"${prod.name} (${variant.title})" varyasyonu artık mevcut değil.`);
            continue;
          }
          currentPrice = variant.discount_price || variant.price || currentPrice;
          currentStock = variant.stock_meter || currentStock;
          variantTitle = variant.title;
          variantSku = variant.sku || prod.sku;
        }
      }

      const desiredMeter = Number(it.meter_quantity || it.quantity || 1);
      const availableMeter = Math.min(desiredMeter, currentStock);

      if (availableMeter <= 0) {
        warnings.push(`"${prod.name}" kumaşının stoğu tükenmiş.`);
        continue;
      }

      if (availableMeter < desiredMeter) {
        warnings.push(`"${prod.name}" kumaşında kalan stok miktarı (${availableMeter}m) sepete eklendi.`);
      }

      if (it.unit_price && Math.abs(it.unit_price - currentPrice) > 0.01) {
        warnings.push(`"${prod.name}" kumaşının güncel metre fiyatı ${currentPrice.toFixed(2)} TL olarak güncellendi.`);
      }

      reorderItems.push({
        productId: prod.id,
        variantId: it.variant_id || undefined,
        name: prod.name,
        variantTitle: variantTitle,
        sku: variantSku,
        image: prod.main_image_url || (prod.images && prod.images[0]),
        unitPrice: currentPrice,
        meterQuantity: availableMeter,
        maxStockMeter: currentStock,
      });
    }

    if (reorderItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Siparişteki ürünler şu anda satışta veya stokta bulunmamaktadır.',
        warnings,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      items: reorderItems,
      warnings,
      message: `${reorderItems.length} ürün güncel fiyat ve stok bilgisiyle sepete aktarıldı.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
