import { readDb, writeDb } from '@/lib/db/repo';

export interface SyncOptions {
  syncCategories?: boolean;
  syncProducts?: boolean;
  syncOrders?: boolean;
  orderLimit?: number;
  ck?: string;
  cs?: string;
  url?: string;
}

const DEFAULT_URL = 'https://bursakumasdunyasi.com';
const DEFAULT_CK = 'ck_6dc86fd48c4761862bd63b1f438cb0738993069c';
const DEFAULT_CS = 'cs_33987a75b760a1664214914a07f6b1f491ee1a41';

async function fetchWc(endpoint: string, options: { ck?: string; cs?: string; url?: string } = {}) {
  const baseUrl = (options.url || DEFAULT_URL).replace(/\/$/, '');
  const ck = options.ck || DEFAULT_CK;
  const cs = options.cs || DEFAULT_CS;

  const separator = endpoint.includes('?') ? '&' : '?';
  const fullUrl = `${baseUrl}/wp-json/wc/v3/${endpoint}${separator}consumer_key=${ck}&consumer_secret=${cs}`;

  const res = await fetch(fullUrl, {
    headers: { 'User-Agent': 'BursaKumasNextSync/1.0' },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`WooCommerce API Error (${res.status}): ${errorText.slice(0, 200)}`);
  }

  const total = Number(res.headers.get('x-wp-total') || 0);
  const totalPages = Number(res.headers.get('x-wp-totalpages') || 1);
  const data = await res.json();

  return { data, total, totalPages };
}

export async function runWooCommerceSync(options: SyncOptions = {}, onProgress?: (msg: string) => void) {
  const log = (msg: string) => {
    if (onProgress) onProgress(msg);
  };

  log('WooCommerce senkronizasyonu başlatılıyor...');
  const db = readDb();

  let categoriesCount = 0;
  let productsCount = 0;
  let variationsCount = 0;
  let ordersCount = 0;

  // 1. KATEGORİLER
  if (options.syncCategories !== false) {
    log('Kategoriler çekiliyor...');
    let page = 1;
    let hasMore = true;
    const allWcCategories: any[] = [];

    while (hasMore) {
      const { data, totalPages } = await fetchWc(`products/categories?per_page=100&page=${page}`, options);
      if (Array.isArray(data) && data.length > 0) {
        allWcCategories.push(...data);
      }
      if (page >= totalPages || data.length === 0) {
        hasMore = false;
      } else {
        page++;
      }
    }

    log(`${allWcCategories.length} kategori bulundu. Dönüştürülüyor...`);

    const existingCats = db.categories || [];
    const catMap = new Map<string, any>();
    existingCats.forEach((c: any) => catMap.set(c.id, c));

    for (const wcCat of allWcCategories) {
      const catId = `cat-${wcCat.id}`;
      const parentId = wcCat.parent && wcCat.parent > 0 ? `cat-${wcCat.parent}` : null;
      const imageUrl = wcCat.image?.src || '';

      const existing = catMap.get(catId);
      const categoryObj = {
        id: catId,
        parent_id: parentId,
        name: wcCat.name || '',
        slug: wcCat.slug || '',
        description: wcCat.description ? wcCat.description.replace(/<[^>]*>/g, '').trim() : '',
        image_url: imageUrl || existing?.image_url || '/placeholder.jpg',
        display_order: wcCat.menu_order || existing?.display_order || 0,
        is_active: 1,
        is_featured_home: existing ? (existing.is_featured_home ?? 0) : 1,
        show_in_menu: existing ? (existing.show_in_menu ?? 1) : 1,
        meta_title: `${wcCat.name} - Bursa Kumaş Dünyası`,
        meta_description: wcCat.description ? wcCat.description.slice(0, 160) : '',
        created_at: existing?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        wc_id: wcCat.id,
      };

      catMap.set(catId, categoryObj);
    }

    db.categories = Array.from(catMap.values());
    categoriesCount = allWcCategories.length;
    log(`${categoriesCount} kategori kaydedildi.`);
  }

  // 2. AKTİF ÜRÜNLER & VARYASYONLAR
  if (options.syncProducts !== false) {
    log('Aktif ürünler çekiliyor (status=publish)...');
    let page = 1;
    let hasMore = true;
    const allWcProducts: any[] = [];

    while (hasMore) {
      const { data, totalPages } = await fetchWc(`products?status=publish&per_page=100&page=${page}`, options);
      if (Array.isArray(data) && data.length > 0) {
        allWcProducts.push(...data);
      }
      if (page >= totalPages || data.length === 0) {
        hasMore = false;
      } else {
        page++;
      }
    }

    log(`${allWcProducts.length} aktif ürün bulundu. Varyasyonlar ve kumaş özellikleri çekiliyor...`);

    const existingProducts = db.products || [];
    const prodMap = new Map<string, any>();
    existingProducts.forEach((p: any) => prodMap.set(p.id, p));

    const existingVariants = db.product_variants || [];
    const varMap = new Map<string, any>();
    existingVariants.forEach((v: any) => varMap.set(v.id, v));

    for (let i = 0; i < allWcProducts.length; i++) {
      const p = allWcProducts[i];
      const prodId = `prod-${p.id}`;
      const existing = prodMap.get(prodId);

      const catIds = (p.categories || []).map((c: any) => `cat-${c.id}`);
      const primaryCatId = catIds[0] || (existing?.category_id || 'cat-viskon');

      const basePrice = Number(p.regular_price || p.price || 0);
      const discountPrice = p.sale_price ? Number(p.sale_price) : null;

      const images = (p.images || []).map((img: any) => img.src);
      const mainImageUrl = images[0] || existing?.main_image_url || '/placeholder.jpg';

      const isVariable = p.type === 'variable' && Array.isArray(p.variations) && p.variations.length > 0;

      const attributesObj: Record<string, string[]> = {};
      if (Array.isArray(p.attributes)) {
        for (const attr of p.attributes) {
          if (attr.name && Array.isArray(attr.options)) {
            attributesObj[attr.name] = attr.options;
          }
        }
      }

      const stepMeta = (p.meta_data || []).find((m: any) => m.key === 'woodecimalproduct_step_qnt');
      const minMeta = (p.meta_data || []).find((m: any) => m.key === 'woodecimalproduct_min_qnt');
      const maxMeta = (p.meta_data || []).find((m: any) => m.key === 'woodecimalproduct_max_qnt');

      const meterStep = stepMeta && Number(stepMeta.value) > 0 ? Number(stepMeta.value) : 0.5;
      const minMeter = minMeta && Number(minMeta.value) > 0 ? Number(minMeta.value) : 1;
      const maxMeter = maxMeta && Number(maxMeta.value) > 0 ? Number(maxMeta.value) : 100;

      const stockMeter = p.stock_quantity !== null && p.stock_quantity !== undefined ? Number(p.stock_quantity) : (existing?.stock_meter ?? null);

      const productObj = {
        id: prodId,
        category_id: primaryCatId,
        category_ids: catIds,
        sku: p.sku || `BKD-${p.id}`,
        barcode: '',
        name: p.name || '',
        slug: p.slug || '',
        short_description: p.short_description ? p.short_description.replace(/<[^>]*>/g, '').trim() : '',
        description: p.description ? p.description.replace(/<[^>]*>/g, '').trim() : '',
        technical_specs: existing?.technical_specs || {},
        attributes: attributesObj,
        base_price: basePrice,
        discount_price: discountPrice,
        tax_rate: 20,
        is_meter_sale: 1,
        min_order_meter: minMeter,
        meter_step: meterStep,
        max_order_meter: maxMeter,
        stock_meter: stockMeter,
        has_variants: isVariable ? 1 : 0,
        main_image_url: mainImageUrl,
        images: images.length > 0 ? images : [mainImageUrl],
        badge_ids: existing?.badge_ids || [],
        is_active: 1,
        is_archived: 0,
        is_featured: p.featured ? 1 : (existing?.is_featured || 0),
        is_bestseller: existing?.is_bestseller || 0,
        is_new: existing?.is_new || 0,
        vitrin_order: existing?.vitrin_order || 0,
        meta_title: `${p.name} - Metre Fiyatı | Bursa Kumaş Dünyası`,
        meta_description: p.short_description ? p.short_description.replace(/<[^>]*>/g, '').trim().slice(0, 160) : '',
        canonical_url: `/urun/${p.slug || p.id}`,
        created_at: p.date_created || existing?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        wc_id: p.id,
      };

      prodMap.set(prodId, productObj);

      if (isVariable) {
        try {
          const { data: variationsData } = await fetchWc(`products/${p.id}/variations?per_page=100`, options);
          if (Array.isArray(variationsData)) {
            for (const v of variationsData) {
              const varId = `var-${p.id}-${v.id}`;
              const varPrice = Number(v.regular_price || v.price || basePrice);
              const varDiscount = v.sale_price ? Number(v.sale_price) : null;
              const varStock = v.manage_stock && v.stock_quantity !== null ? Number(v.stock_quantity) : null;
              const varImage = v.image?.src || mainImageUrl;

              const attrTitle = Array.isArray(v.attributes) && v.attributes.length > 0
                ? v.attributes.map((a: any) => a.option).join(' / ')
                : `Varyant #${v.id}`;

              const variantObj = {
                id: varId,
                product_id: prodId,
                sku: v.sku || `${productObj.sku}-${v.id}`,
                title: attrTitle,
                price: varPrice,
                discount_price: varDiscount,
                stock_meter: varStock,
                image_url: varImage,
                is_active: v.status === 'publish' ? 1 : 1,
                created_at: v.date_created || new Date().toISOString(),
                wc_id: v.id,
                wc_parent_id: p.id,
              };

              varMap.set(varId, variantObj);
              variationsCount++;
            }
          }
        } catch (err: any) {
          log(`Uyarı: Ürün #${p.id} varyasyonları çekilemedi: ${err.message}`);
        }
      }

      if ((i + 1) % 20 === 0 || i + 1 === allWcProducts.length) {
        log(`Ürün işleniyor: ${i + 1} / ${allWcProducts.length}`);
      }
    }

    db.products = Array.from(prodMap.values());
    db.product_variants = Array.from(varMap.values());
    productsCount = allWcProducts.length;
    log(`${productsCount} aktif ürün ve ${variationsCount} varyasyon güncellendi.`);
  }

  // 3. SİPARİŞLER
  if (options.syncOrders !== false) {
    const limit = options.orderLimit || 100;
    log(`Siparişler çekiliyor (Son ${limit} sipariş)...`);

    let page = 1;
    let fetchedCount = 0;
    const allWcOrders: any[] = [];

    while (fetchedCount < limit) {
      const perPage = Math.min(100, limit - fetchedCount);
      const { data, totalPages } = await fetchWc(`orders?per_page=${perPage}&page=${page}`, options);

      if (Array.isArray(data) && data.length > 0) {
        allWcOrders.push(...data);
        fetchedCount += data.length;
      }

      if (page >= totalPages || data.length === 0) {
        break;
      } else {
        page++;
      }
    }

    log(`${allWcOrders.length} sipariş bulundu. Dönüştürülüyor...`);

    const existingOrders = db.orders || [];
    const orderMap = new Map<string, any>();
    existingOrders.forEach((o: any) => orderMap.set(o.id, o));

    const existingOrderItems = db.order_items || [];
    const itemMap = new Map<string, any>();
    existingOrderItems.forEach((it: any) => itemMap.set(it.id, it));

    for (const o of allWcOrders) {
      const orderId = `ord-wc-${o.id}`;
      const customerFullName = [o.billing?.first_name, o.billing?.last_name].filter(Boolean).join(' ') || 'Müşteri';

      let localStatus = 'Siparis_Alindi';
      if (o.status === 'completed') {
        localStatus = 'Kargoya_Verildi';
      } else if (o.status === 'processing') {
        localStatus = 'Kesimde';
      } else if (o.status === 'cancelled') {
        localStatus = 'Iptal_Edildi';
      }

      const orderObj = {
        id: orderId,
        order_number: String(o.number || o.id),
        user_id: null,
        is_guest: o.customer_id === 0 ? 1 : 0,
        customer_name: customerFullName,
        customer_email: o.billing?.email || '',
        customer_phone: o.billing?.phone || '',
        shipping_address: {
          fullName: [o.shipping?.first_name, o.shipping?.last_name].filter(Boolean).join(' ') || customerFullName,
          phone: o.shipping?.phone || o.billing?.phone || '',
          city: o.shipping?.city || o.billing?.city || '',
          district: o.shipping?.state || o.billing?.state || '',
          addressLine: [o.shipping?.address_1, o.shipping?.address_2].filter(Boolean).join(' ') || o.billing?.address_1 || '',
          postalCode: o.shipping?.postcode || o.billing?.postcode || '',
          isCorporate: Boolean(o.billing?.company),
          companyName: o.billing?.company || '',
          taxNumber: '',
          taxOffice: '',
        },
        billing_address: {
          fullName: customerFullName,
          phone: o.billing?.phone || '',
          city: o.billing?.city || '',
          district: o.billing?.state || '',
          addressLine: [o.billing?.address_1, o.billing?.address_2].filter(Boolean).join(' ') || '',
          postalCode: o.billing?.postcode || '',
          isCorporate: Boolean(o.billing?.company),
          companyName: o.billing?.company || '',
          taxNumber: '',
          taxOffice: '',
        },
        subtotal: Number(o.total) - Number(o.shipping_total || 0),
        discount_total: Number(o.discount_total || 0),
        payment_discount: 0,
        payment_fee: 0,
        coupon_code: (o.coupon_lines && o.coupon_lines[0]?.code) || null,
        shipping_total: Number(o.shipping_total || 0),
        tax_total: Number(o.total_tax || 0),
        grand_total: Number(o.total || 0),
        status: localStatus,
        payment_status: ['completed', 'processing'].includes(o.status) ? 'paid' : 'pending',
        payment_method: o.payment_method || 'paytr',
        order_notes: o.customer_note || '',
        carrier_name: 'DHL Kargo (MNG Kargo)',
        tracking_number: '',
        tracking_url: '',
        invoice_status: 'pending',
        invoice_number: '',
        created_at: o.date_created || new Date().toISOString(),
        updated_at: o.date_modified || new Date().toISOString(),
        wc_id: o.id,
      };

      orderMap.set(orderId, orderObj);

      if (Array.isArray(o.line_items)) {
        for (const it of o.line_items) {
          const itemId = `item-wc-${it.id}`;
          const prodId = `prod-${it.product_id}`;
          const varId = it.variation_id ? `var-${it.product_id}-${it.variation_id}` : null;

          const itemObj = {
            id: itemId,
            order_id: orderId,
            product_id: prodId,
            variant_id: varId,
            product_name: it.name || 'Kumaş',
            sku: it.sku || `BKD-${it.product_id}`,
            meter_quantity: Number(it.quantity || 1),
            unit_price: Number(it.price || 0),
            total_price: Number(it.total || 0),
            tax_rate: 20,
            image_url: it.image?.src || '/placeholder.jpg',
            created_at: o.date_created || new Date().toISOString(),
          };

          itemMap.set(itemId, itemObj);
        }
      }
    }

    db.orders = Array.from(orderMap.values());
    db.order_items = Array.from(itemMap.values());
    ordersCount = allWcOrders.length;
    log(`${ordersCount} sipariş senkronize edildi.`);
  }

  writeDb(db);
  log('Senkronizasyon tamamlandı ve veritabanı başarıyla güncellendi!');

  return {
    success: true,
    categoriesCount,
    productsCount,
    variationsCount,
    ordersCount,
  };
}
