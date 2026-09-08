import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';
import { logAuditAction } from '@/lib/services/auditLogger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limitParam = searchParams.get('limit') || '20';
  const search = searchParams.get('q') || searchParams.get('search') || '';
  const categoryId = searchParams.get('category_id') || '';
  const statusFilter = searchParams.get('status') || 'all'; // all, active, inactive, archived, out_of_stock

  const db = dbRepo.read();
  let allProducts = (db.products || []).filter((p: any) => p.is_archived !== 1 || statusFilter === 'archived');

  // Search filter
  if (search.trim()) {
    const qLower = search.trim().toLowerCase();
    allProducts = allProducts.filter(
      (p: any) =>
        p.name?.toLowerCase().includes(qLower) ||
        p.sku?.toLowerCase().includes(qLower) ||
        p.slug?.toLowerCase().includes(qLower)
    );
  }

  // Category filter
  if (categoryId) {
    allProducts = allProducts.filter((p: any) => {
      const pCatIds = Array.isArray(p.category_ids) && p.category_ids.length > 0
        ? p.category_ids
        : (p.category_id ? [p.category_id] : []);
      return pCatIds.includes(categoryId);
    });
  }

  // Status filter
  if (statusFilter === 'active') {
    allProducts = allProducts.filter((p: any) => p.is_active === 1 && p.is_archived !== 1);
  } else if (statusFilter === 'inactive') {
    allProducts = allProducts.filter((p: any) => p.is_active === 0 && p.is_archived !== 1);
  } else if (statusFilter === 'archived') {
    allProducts = (db.products || []).filter((p: any) => p.is_archived === 1);
  } else if (statusFilter === 'out_of_stock') {
    allProducts = allProducts.filter((p: any) => Number(p.stock_meter || 0) <= 0);
  }

  const totalCount = allProducts.length;

  // Pagination
  let paginatedProducts = allProducts;
  let totalPages = 1;

  if (limitParam !== 'all') {
    const limit = parseInt(limitParam);
    totalPages = Math.ceil(totalCount / limit) || 1;
    const startIndex = (page - 1) * limit;
    paginatedProducts = allProducts.slice(startIndex, startIndex + limit);
  }

  // Attach variant counts and category names
  const enrichedProducts = paginatedProducts.map((prod: any) => {
    const variants = (db.product_variants || []).filter((v: any) => v.product_id === prod.id);
    const pCatIds = Array.isArray(prod.category_ids) && prod.category_ids.length > 0
      ? prod.category_ids
      : (prod.category_id ? [prod.category_id] : []);
    const allCats = (db.categories || []).filter((c: any) => pCatIds.includes(c.id));
    const primaryCat = (db.categories || []).find((c: any) => c.id === prod.category_id) || allCats[0];

    return {
      ...prod,
      category_ids: pCatIds,
      category_names: allCats.map((c: any) => c.name),
      category_name: primaryCat ? primaryCat.name : 'Genel',
      variant_count: variants.length,
      variants,
    };
  });

  return NextResponse.json({
    products: enrichedProducts,
    categories: db.categories || [],
    attributes: db.attributes || [],
    pagination: {
      total: totalCount,
      page,
      limit: limitParam === 'all' ? totalCount : parseInt(limitParam),
      totalPages,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = dbRepo.read();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ message: 'Kumaş adı zorunludur.' }, { status: 400 });
    }
    if (!body.sku || !body.sku.trim()) {
      return NextResponse.json({ message: 'Ürün SKU/Kodu zorunludur.' }, { status: 400 });
    }

    const cleanSku = body.sku.trim().toUpperCase();
    const productId = body.id || `prod-${Date.now()}`;
    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const basePrice = parseFloat(body.base_price) || 0;
    const discountPrice = body.discount_price ? parseFloat(body.discount_price) : null;
    const rawStock = body.stock_meter !== undefined && body.stock_meter !== null && String(body.stock_meter).trim() !== ''
      ? parseFloat(body.stock_meter)
      : null;
    const trackStock = rawStock !== null && !isNaN(rawStock) ? 1 : 0;
    const stockMeter = trackStock === 1 ? rawStock : null;
    const hasVariants = body.has_variants ? 1 : 0;
    const imagesArray = Array.isArray(body.images) ? body.images : [];
    const mainImageUrl =
      imagesArray.length > 0
        ? imagesArray[0]
        : body.main_image_url || '/placeholder.jpg';

    const categoryIds = Array.isArray(body.category_ids) && body.category_ids.length > 0
      ? body.category_ids
      : (body.category_id ? [body.category_id] : ['cat-genel']);
    const primaryCategoryId = categoryIds[0] || body.category_id || 'cat-genel';

    const newProduct = {
      id: productId,
      category_id: primaryCategoryId,
      category_ids: categoryIds,
      sku: cleanSku,
      barcode: body.barcode || '',
      name: body.name.trim(),
      slug: slug,
      short_description: body.short_description || '',
      description: body.description || '',
      technical_specs: body.technical_specs || {},
      attributes: body.attributes || {}, // { Renk: ['Mavi', 'Siyah'], Desen: ['Düz'] }
      base_price: basePrice,
      discount_price: discountPrice,
      tax_rate: 20,
      is_meter_sale: body.is_meter_sale !== undefined ? Number(body.is_meter_sale) : 1,
      min_order_meter: parseFloat(body.min_order_meter) || 1.0,
      meter_step: parseFloat(body.meter_step) || 0.5,
      max_order_meter: parseFloat(body.max_order_meter) || 50.0,
      track_stock: trackStock,
      stock_meter: stockMeter,
      has_variants: hasVariants,
      main_image_url: mainImageUrl,
      images: imagesArray,
      badge_ids: Array.isArray(body.badge_ids) ? body.badge_ids : [],
      is_active: body.is_active !== undefined ? Number(body.is_active) : 1,
      is_archived: 0,
      is_featured: body.is_featured ? 1 : 0,
      is_bestseller: body.is_bestseller ? 1 : 0,
      is_new: body.is_new ? 1 : 0,
      vitrin_order: parseInt(body.vitrin_order) || 0,
      meta_title: body.meta_title || `${body.name} - Metre Fiyatı | Bursa Kumaş Dünyası`,
      meta_description: body.meta_description || body.short_description || `${body.name} en kaliteli dokumasıyla Bursa Kumaş Dünyası'nda.`,
      canonical_url: `/urun/${slug}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!db.products) db.products = [];
    db.products.unshift(newProduct);

    // Save Variants if variable product
    if (!db.product_variants) db.product_variants = [];
    if (hasVariants && Array.isArray(body.variants) && body.variants.length > 0) {
      body.variants.forEach((v: any, index: number) => {
        const variantId = v.id || `var-${productId}-${index + 1}`;
        const rawVarStock = v.stock_meter !== undefined && v.stock_meter !== null && String(v.stock_meter).trim() !== ''
          ? parseFloat(v.stock_meter)
          : null;
        const trackVarStock = rawVarStock !== null && !isNaN(rawVarStock) ? 1 : 0;
        const varStockMeter = trackVarStock === 1 ? rawVarStock : null;

        db.product_variants.push({
          id: variantId,
          product_id: productId,
          sku: v.sku ? v.sku.trim().toUpperCase() : `${cleanSku}-${index + 1}`,
          barcode: v.barcode || '',
          title: v.title || `Varyasyon ${index + 1}`,
          color_name: v.color_name || '',
          pattern_name: v.pattern_name || '',
          attributes: v.attributes || {},
          price: parseFloat(v.price) || basePrice,
          discount_price: v.discount_price ? parseFloat(v.discount_price) : discountPrice || parseFloat(v.price) || basePrice,
          track_stock: trackVarStock,
          stock_meter: varStockMeter,
          image_url: v.image_url || mainImageUrl,
          color_code: v.color_code || '#000000',
          is_active: v.is_active !== undefined ? Number(v.is_active) : 1,
          created_at: new Date().toISOString(),
        });
      });
    }

    // Save Initial Stock History
    if (!db.stock_history) db.stock_history = [];
    db.stock_history.push({
      id: `stk-${Date.now()}`,
      product_id: productId,
      change_meter: stockMeter,
      new_stock: stockMeter,
      reason: 'Yeni Ürün Girişi',
      created_at: new Date().toISOString(),
    });

    logAuditAction({
      adminEmail: 'admin@bursakumasdunyasi.com',
      action: 'PRODUCT_CREATE',
      details: `Yeni kumaş eklendi: ${body.name} (${cleanSku})`,
    });

    dbRepo.write(db);
    return NextResponse.json({ success: true, product: newProduct });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Ürün kaydedilemedi.' }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const db = dbRepo.read();

    if (!body.id) {
      return NextResponse.json({ message: 'Ürün ID zorunludur.' }, { status: 400 });
    }

    const idx = (db.products || []).findIndex((p: any) => p.id === body.id);
    if (idx === -1) {
      return NextResponse.json({ message: 'Ürün bulunamadı.' }, { status: 404 });
    }

    const oldProduct = db.products[idx];
    const newBasePrice = parseFloat(body.base_price) !== undefined ? parseFloat(body.base_price) : oldProduct.base_price;

    // Price History Tracking
    if (oldProduct.base_price !== newBasePrice) {
      if (!db.price_history) db.price_history = [];
      db.price_history.push({
        id: `prc-${Date.now()}`,
        product_id: body.id,
        old_price: oldProduct.base_price,
        new_price: newBasePrice,
        changed_by: 'admin@bursakumasdunyasi.com',
        created_at: new Date().toISOString(),
      });
    }

    const imagesArray = Array.isArray(body.images) ? body.images : oldProduct.images || [];
    const mainImageUrl =
      imagesArray.length > 0
        ? imagesArray[0]
        : body.main_image_url || oldProduct.main_image_url;

    const categoryIds = Array.isArray(body.category_ids) && body.category_ids.length > 0
      ? body.category_ids
      : (body.category_id ? [body.category_id] : (oldProduct.category_ids || [oldProduct.category_id]));
    const primaryCategoryId = categoryIds[0] || body.category_id || oldProduct.category_id;

    const rawStockPut = body.stock_meter !== undefined && body.stock_meter !== null && String(body.stock_meter).trim() !== ''
      ? parseFloat(body.stock_meter)
      : (body.stock_meter === '' || body.stock_meter === null ? null : (oldProduct.track_stock === 0 ? null : oldProduct.stock_meter));
    const trackStockPut = rawStockPut !== null && !isNaN(rawStockPut) ? 1 : 0;
    const stockMeterPut = trackStockPut === 1 ? rawStockPut : null;

    // Update product fields
    db.products[idx] = {
      ...oldProduct,
      category_id: primaryCategoryId,
      category_ids: categoryIds,
      sku: body.sku ? body.sku.trim().toUpperCase() : oldProduct.sku,
      barcode: body.barcode !== undefined ? body.barcode : oldProduct.barcode,
      name: body.name ? body.name.trim() : oldProduct.name,
      slug: body.slug || oldProduct.slug,
      short_description: body.short_description !== undefined ? body.short_description : oldProduct.short_description,
      description: body.description !== undefined ? body.description : oldProduct.description,
      technical_specs: body.technical_specs || oldProduct.technical_specs,
      attributes: body.attributes || oldProduct.attributes,
      base_price: newBasePrice,
      discount_price: body.discount_price !== undefined ? (body.discount_price ? parseFloat(body.discount_price) : null) : oldProduct.discount_price,
      is_meter_sale: body.is_meter_sale !== undefined ? Number(body.is_meter_sale) : oldProduct.is_meter_sale,
      min_order_meter: parseFloat(body.min_order_meter) || oldProduct.min_order_meter,
      meter_step: parseFloat(body.meter_step) || oldProduct.meter_step,
      max_order_meter: parseFloat(body.max_order_meter) || oldProduct.max_order_meter,
      track_stock: trackStockPut,
      stock_meter: stockMeterPut,
      has_variants: body.has_variants !== undefined ? Number(body.has_variants) : oldProduct.has_variants,
      main_image_url: mainImageUrl,
      images: imagesArray,
      badge_ids: Array.isArray(body.badge_ids) ? body.badge_ids : oldProduct.badge_ids,
      is_active: body.is_active !== undefined ? Number(body.is_active) : oldProduct.is_active,
      is_featured: body.is_featured !== undefined ? Number(body.is_featured) : oldProduct.is_featured,
      is_bestseller: body.is_bestseller !== undefined ? Number(body.is_bestseller) : oldProduct.is_bestseller,
      is_new: body.is_new !== undefined ? Number(body.is_new) : oldProduct.is_new,
      vitrin_order: parseInt(body.vitrin_order) !== undefined ? parseInt(body.vitrin_order) : oldProduct.vitrin_order,
      meta_title: body.meta_title || oldProduct.meta_title,
      meta_description: body.meta_description || oldProduct.meta_description,
      updated_at: new Date().toISOString(),
    };

    // Sync Variants if provided
    if (Array.isArray(body.variants)) {
      // Remove old variants of this product
      db.product_variants = (db.product_variants || []).filter((v: any) => v.product_id !== body.id);

      // Re-insert new/updated variants
      body.variants.forEach((v: any, index: number) => {
        const rawVarStock = v.stock_meter !== undefined && v.stock_meter !== null && String(v.stock_meter).trim() !== ''
          ? parseFloat(v.stock_meter)
          : null;
        const trackVarStock = rawVarStock !== null && !isNaN(rawVarStock) ? 1 : 0;
        const varStockMeter = trackVarStock === 1 ? rawVarStock : null;

        db.product_variants.push({
          id: v.id || `var-${body.id}-${index + 1}`,
          product_id: body.id,
          sku: v.sku ? v.sku.trim().toUpperCase() : `${db.products[idx].sku}-${index + 1}`,
          barcode: v.barcode || '',
          title: v.title || `Varyasyon ${index + 1}`,
          color_name: v.color_name || '',
          pattern_name: v.pattern_name || '',
          attributes: v.attributes || {},
          price: parseFloat(v.price) || newBasePrice,
          discount_price: v.discount_price ? parseFloat(v.discount_price) : parseFloat(v.price) || newBasePrice,
          track_stock: trackVarStock,
          stock_meter: varStockMeter,
          image_url: v.image_url || mainImageUrl,
          color_code: v.color_code || '#000000',
          is_active: v.is_active !== undefined ? Number(v.is_active) : 1,
          updated_at: new Date().toISOString(),
        });
      });
    }

    logAuditAction({
      adminEmail: 'admin@bursakumasdunyasi.com',
      action: 'PRODUCT_UPDATE',
      details: `Kumaş güncellendi: ${db.products[idx].name} (${db.products[idx].sku})`,
    });

    dbRepo.write(db);
    return NextResponse.json({ success: true, product: db.products[idx] });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Ürün güncellenemedi.' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Ürün ID belirtilmedi.' }, { status: 400 });
    }

    const db = dbRepo.read();
    const product = (db.products || []).find((p: any) => p.id === id);

    if (!product) {
      return NextResponse.json({ message: 'Ürün bulunamadı.' }, { status: 404 });
    }

    // CHECK ORDERS INTEGRITY: Has this product ever been ordered?
    const hasOrders = (db.order_items || []).some((item: any) => item.product_id === id);

    if (hasOrders) {
      // SOFT DELETE / ARCHIVE: Protect historical orders, invoices & receipts!
      product.is_active = 0;
      product.is_archived = 1;
      product.archived_at = new Date().toISOString();

      logAuditAction({
        adminEmail: 'admin@bursakumasdunyasi.com',
        action: 'PRODUCT_SOFT_DELETE',
        details: `${product.name} (${product.sku}) geçmiş siparişlerde yer aldığı için arşive kaldırıldı ve pasif yapıldı.`,
      });

      dbRepo.write(db);
      return NextResponse.json({
        success: true,
        mode: 'soft_delete',
        message: `"${product.name}" kumaşı geçmiş siparişlerde yer aldığı için fatura bütünlüğünü korumak adına arşive kaldırıldı ve yayından çekildi.`,
      });
    } else {
      // HARD DELETE: Completely clean from database
      db.products = (db.products || []).filter((p: any) => p.id !== id);
      db.product_variants = (db.product_variants || []).filter((v: any) => v.product_id !== id);
      db.product_images = (db.product_images || []).filter((i: any) => i.product_id !== id);

      logAuditAction({
        adminEmail: 'admin@bursakumasdunyasi.com',
        action: 'PRODUCT_HARD_DELETE',
        details: `${product.name} (${product.sku}) hiç siparişi olmadığı için sistemden tamamen silindi.`,
      });

      dbRepo.write(db);
      return NextResponse.json({
        success: true,
        mode: 'hard_delete',
        message: `"${product.name}" kumaşı ve tüm varyasyonları sistemden kalıcı olarak silindi.`,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Hata oluştu' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, is_active, stock_meter, reason } = body;

    if (!id) {
      return NextResponse.json({ message: 'Ürün ID zorunludur.' }, { status: 400 });
    }

    const db = dbRepo.read();
    const product = (db.products || []).find((p: any) => p.id === id);

    if (!product) {
      return NextResponse.json({ message: 'Ürün bulunamadı.' }, { status: 404 });
    }

    if (is_active !== undefined) {
      product.is_active = Number(is_active);
    }

    if (stock_meter !== undefined) {
      const oldStock = product.stock_meter || 0;
      const newStock = parseFloat(stock_meter);
      product.stock_meter = newStock;

      if (!db.stock_history) db.stock_history = [];
      db.stock_history.push({
        id: `stk-${Date.now()}`,
        product_id: id,
        old_stock: oldStock,
        change_meter: newStock - oldStock,
        new_stock: newStock,
        reason: reason || 'Hızlı Stok Güncelleme',
        created_at: new Date().toISOString(),
      });
    }

    product.updated_at = new Date().toISOString();
    dbRepo.write(db);

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Hata oluştu' }, { status: 500 });
  }
}
