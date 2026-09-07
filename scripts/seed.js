const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'bursakumas.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Schema init
const schemaPath = path.join(__dirname, '..', 'lib', 'db', 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

console.log('--- Bursa Kumaş Dünyası Veritabanı Temizleniyor ve Dolduruluyor ---');

// Clean existing data for clean seed
const tablesToClean = [
  'sms_logs', 'email_logs', 'audit_logs', 'blog_posts', 'homepage_banners', 'homepage_sections',
  'wishlists', 'reviews', 'invoice_logs', 'shipping_logs', 'payments', 'order_status_history',
  'order_items', 'orders', 'cart_discount_rules', 'coupon_usages', 'coupons', 'cart_items',
  'carts', 'product_images', 'product_variant_attributes', 'product_variants', 'products',
  'attribute_values', 'attributes', 'categories', 'user_addresses', 'users', 'admin_users', 'admin_roles'
];

for (const tbl of tablesToClean) {
  try {
    db.prepare(`DELETE FROM ${tbl}`).run();
  } catch (e) {
    // Ignore if table not yet created
  }
}

// 1. ROLES & ADMIN USERS
db.prepare(`
  INSERT INTO admin_roles (id, name, description, permissions)
  VALUES 
  ('role-super', 'Süper Yönetici', 'Tüm yetkilere sahip üst yönetici', '["all", "products", "orders", "reports", "settings", "discounts", "blog", "users"]'),
  ('role-orders', 'Sipariş & Kesim Yetkilisi', 'Sipariş durumları, kargo ve çıktı yönetimi', '["orders", "reports"]'),
  ('role-products', 'Ürün & Stok Yetkilisi', 'Ürün, kategori, varyasyon ve stok yönetimi', '["products", "reports"]'),
  ('role-accounting', 'Muhasebe', 'Faturalandırma ve satış raporları', '["reports", "orders"]')
`).run();

db.prepare(`
  INSERT INTO admin_users (id, role_id, full_name, email, password_hash, is_active)
  VALUES 
  ('admin-1', 'role-super', 'Bursa Kumaş Dünyası Yönetici', 'admin@bursakumasdunyasi.com', 'admin123', 1),
  ('admin-2', 'role-orders', 'Murat Kesim & Sevkiyat', 'siparis@bursakumasdunyasi.com', 'siparis123', 1)
`).run();

// 2. USERS
db.prepare(`
  INSERT INTO users (id, full_name, email, phone, password_hash, is_email_verified)
  VALUES 
  ('user-1', 'Ahmet Yılmaz', 'ahmet.yilmaz@example.com', '0532 111 22 33', 'user123', 1),
  ('user-2', 'Zeynep Kaya', 'zeynep.kaya@example.com', '0544 222 33 44', 'user123', 1)
`).run();

db.prepare(`
  INSERT INTO user_addresses (id, user_id, title, full_name, phone, city, district, neighborhood, address_line, postal_code, is_default_shipping, is_default_billing)
  VALUES 
  ('addr-1', 'user-1', 'Evim', 'Ahmet Yılmaz', '0532 111 22 33', 'Bursa', 'Nilüfer', 'İhsaniye Mah.', 'Barbaros Cad. No:14 Daire:6', '16130', 1, 1),
  ('addr-2', 'user-2', 'Atölye / İş Yeri', 'Zeynep Kaya', '0544 222 33 44', 'İstanbul', 'Kadıköy', 'Moda', 'Caferağa Mah. Şair Nefi Sok. No:8', '34710', 1, 1)
`).run();

// 3. CATEGORIES
const categories = [
  { id: 'cat-dosemelik', parent_id: null, name: 'Döşemelik Kumaşlar', slug: 'dosemelik-kumaslar', desc: 'Koltuk, sandalye, berjer ve kırlentler için yüksek aşınma dayanımlı premium kumaşlar.', img: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80', order: 1, home: 1 },
  { id: 'cat-kadife', parent_id: 'cat-dosemelik', name: 'Kadife Döşemelik Kumaş', slug: 'kadife-dosemelik-kumas', desc: 'Lüks dokulu, silinebilir ve leke tutmaz su itici kadifeler.', img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80', order: 2, home: 1 },
  { id: 'cat-sonil', parent_id: 'cat-dosemelik', name: 'Şönil & Buklet Kumaşlar', slug: 'sonil-buklet-kumaslar', desc: 'Trend bukle dokulu, sıcak ve yumuşak yüzeyli mobilya kumaşları.', img: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=600&q=80', order: 3, home: 1 },
  { id: 'cat-nubuk', parent_id: 'cat-dosemelik', name: 'Nubuk & Süet Kumaşlar', slug: 'nubuk-suet-kumaslar', desc: 'Deri şıklığında, nefes alan ve leke tutmayan nubuk yüzeyler.', img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80', order: 4, home: 0 },
  
  { id: 'cat-perdelik', parent_id: null, name: 'Perdelik Kumaşlar', slug: 'perdelik-kumaslar', desc: 'Salon, yatak odası ve otel projeleri için fon, tül ve blackout perde kumaşları.', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80', order: 5, home: 1 },
  { id: 'cat-fon', parent_id: 'cat-perdelik', name: 'Fon Perdelik Kumaşlar', slug: 'fon-perdelik-kumaslar', desc: 'Dökümlü, şık duruşlu ve zengin renk seçenekli fon perdelikler.', img: 'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?auto=format&fit=crop&w=600&q=80', order: 6, home: 1 },
  { id: 'cat-blackout', parent_id: 'cat-perdelik', name: 'Blackout Karartma Perde', slug: 'blackout-karartma-kumaslar', desc: '%100 ışık ve ısı yalıtımı sağlayan profesyonel karartma kumaşları.', img: 'https://images.unsplash.com/photo-1540518614846-7ede433c4b13?auto=format&fit=crop&w=600&q=80', order: 7, home: 0 },
  { id: 'cat-tul', parent_id: 'cat-perdelik', name: 'Keten Tül Perdelik', slug: 'keten-tul-perdelik', desc: 'Doğal keten dokulu, ferah ve modern tül kumaşlar.', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80', order: 8, home: 0 },

  { id: 'cat-giyimlik', parent_id: null, name: 'Giyimlik Kumaşlar', slug: 'giyimlik-kumaslar', desc: 'Elbise, gömlek, ceket ve pantolon üretimine uygun doğal ve nefes alan kumaşlar.', img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80', order: 9, home: 1 },
  { id: 'cat-poplin', parent_id: 'cat-giyimlik', name: 'Pamuk Poplin & Müslin', slug: 'pamuk-poplin-muslin', desc: '%100 Pamuklu, bebek ve yazlık giyime uygun doğal kumaşlar.', img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80', order: 10, home: 0 },
  { id: 'cat-saten', parent_id: 'cat-giyimlik', name: 'İpek & Likralı Saten', slug: 'ipek-likrali-saten', desc: 'Abiye, gömlek ve astar için parlak, akıcı satenler.', img: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80', order: 11, home: 0 },

  { id: 'cat-masa', parent_id: null, name: 'Masa Örtüsü & Duck Keten', slug: 'masa-ortusu-duck-keten', desc: 'Leke tutmaz dertsiz masa örtülük kumaşlar ve dekoratif duck ketenler.', img: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=600&q=80', order: 12, home: 1 }
];

const insertCat = db.prepare(`
  INSERT INTO categories (id, parent_id, name, slug, description, image_url, display_order, is_active, is_featured_home, meta_title, meta_description)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
`);

for (const c of categories) {
  insertCat.run(c.id, c.parent_id, c.name, c.slug, c.desc, c.img, c.order, c.home, `${c.name} - Bursa Kumaş Dünyası`, `${c.name} en uygun metre fiyatları ve toptan/perakende seçenekleriyle Bursa Kumaş Dünyası'nda.`);
}

// 4. ATTRIBUTES & VALUES
db.prepare(`
  INSERT INTO attributes (id, name, type) VALUES 
  ('attr-color', 'Renk', 'color'),
  ('attr-pattern', 'Desen', 'badge'),
  ('attr-width', 'Kumaş Eni', 'select'),
  ('attr-weight', 'Gramaj', 'select')
`).run();

const attrValues = [
  { id: 'val-col-antrasit', attr: 'attr-color', name: 'Antrasit', color: '#2D3748' },
  { id: 'val-col-lacivert', attr: 'attr-color', name: 'Gece Mavisi / Lacivert', color: '#1E3A8A' },
  { id: 'val-col-zumrut', attr: 'attr-color', name: 'Zümrüt Yeşili', color: '#065F46' },
  { id: 'val-col-bordo', attr: 'attr-color', name: 'Bordo / Şarap', color: '#991B1B' },
  { id: 'val-col-vizon', attr: 'attr-color', name: 'Vizon / Toprak', color: '#8C7D70' },
  { id: 'val-col-bej', attr: 'attr-color', name: 'Krem / Bej', color: '#F5F5DC' },
  { id: 'val-col-hardal', attr: 'attr-color', name: 'Hardal Sarısı', color: '#D97706' },
  { id: 'val-col-pudra', attr: 'attr-color', name: 'Pudra / Somon', color: '#FBCFE8' },
  
  { id: 'val-pat-duz', attr: 'attr-pattern', name: 'Düz Dokuma', color: null },
  { id: 'val-pat-jakar', attr: 'attr-pattern', name: 'Jakarlı / Kendinden Desenli', color: null },
  { id: 'val-pat-cizgili', attr: 'attr-pattern', name: 'Çizgili Marin', color: null },
  { id: 'val-pat-cicek', attr: 'attr-pattern', name: 'Vintage Çiçekli', color: null },
  
  { id: 'val-wid-140', attr: 'attr-width', name: '140 cm', color: null },
  { id: 'val-wid-280', attr: 'attr-width', name: '280 cm', color: null },
  { id: 'val-wid-300', attr: 'attr-width', name: '300 cm', color: null },
  
  { id: 'val-wgt-280', attr: 'attr-weight', name: '280 gr/m²', color: null },
  { id: 'val-wgt-380', attr: 'attr-weight', name: '380 gr/m²', color: null },
  { id: 'val-wgt-450', attr: 'attr-weight', name: '450 gr/m²', color: null }
];

const insertAttrVal = db.prepare(`
  INSERT INTO attribute_values (id, attribute_id, name, color_code, display_order)
  VALUES (?, ?, ?, ?, 0)
`);
for (const av of attrValues) {
  insertAttrVal.run(av.id, av.attr, av.name, av.color);
}

// 5. PRODUCTS & VARIANTS
const products = [
  {
    id: 'prod-1',
    category_id: 'cat-kadife',
    sku: 'BKD-KAD-001',
    name: 'Royal Lüks İtalyan Dokuma Kadife Döşemelik Kumaş',
    slug: 'royal-luks-italyan-kadife-dosemelik-kumas',
    short_desc: 'Su itici, silinebilir, 60.000 Martindale aşınma dayanımlı birinci sınıf koltuk ve berjer kadifesi.',
    desc: `Bursa Kumaş Dünyası'nın en çok tercih edilen tescilli Royal serisi kadife kumaşı, yüksek yoğunluklu dokusu sayesinde koltuk, sandalye, baza başlığı ve dekoratif kırlentleriniz için benzersiz bir konfor ve zarafet sunar.
    
    Özellikler:
    - Sıvı dökülmelerinde yüzeyde damlacık oluşturur, leke tutmaz ve nemli bezle kolayca silinir.
    - Evcil hayvan tırmalamalarına karşı ekstra sık dokunmuştur (Pet-friendly).
    - Renkleri solmaz, dökülme ve keçeleşme yapmaz.
    - 1 metreden itibaren 0.5m adımlarla dilediğiniz ölçüde sipariş verebilirsiniz.`,
    specs: JSON.stringify({
      "Kumaş Eni": "140 cm",
      "Gramaj": "420 gr/m² (±%5)",
      "İçerik": "%100 Mikrofiber Polyester",
      "Aşınma Dayanımı (Martindale)": "60.000 Rubs",
      "Kullanım Alanları": "Koltuk Takımı, Sandalye, Puf, Yatak Başı, Kırlent",
      "Bakım & Temizlik": "Nemli mikrofiber bez ve beyaz sabunlu su ile silinebilir, 30°C hassas yıkanabilir."
    }),
    base_price: 340.00,
    discount_price: 295.00,
    min_order_meter: 1.0,
    meter_step: 0.5,
    max_order_meter: 50.0,
    stock_meter: 180.0,
    has_variants: 1,
    main_image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    is_featured: 1,
    is_bestseller: 1,
    is_new: 1,
    vitrin_order: 1,
    variants: [
      { id: 'var-1-antrasit', sku: 'BKD-KAD-001-ANT', title: 'Antrasit Gri', price: 295.00, stock: 65.0, col_id: 'val-col-antrasit', img: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80' },
      { id: 'var-1-lacivert', sku: 'BKD-KAD-001-LAC', title: 'Gece Mavisi / Lacivert', price: 295.00, stock: 45.0, col_id: 'val-col-lacivert', img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80' },
      { id: 'var-1-zumrut', sku: 'BKD-KAD-001-ZUM', title: 'Zümrüt Yeşili', price: 295.00, stock: 35.0, col_id: 'val-col-zumrut', img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80' },
      { id: 'var-1-bordo', sku: 'BKD-KAD-001-BOR', title: 'Asil Bordo', price: 295.00, stock: 35.0, col_id: 'val-col-bordo', img: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prod-2',
    category_id: 'cat-sonil',
    sku: 'BKD-BUK-002',
    name: 'Tulum Dokulu İskandinav Buklet Döşemelik Kumaş',
    slug: 'tulum-dokulu-iskandinav-buklet-dosemelik-kumas',
    short_desc: 'Modern mimarinin gözdesi bukle doku; tok, hacimli ve sıcak yüzeyli koltuk kumaşı.',
    desc: `İskandinav ve modern minimal mobilya tasarımlarının vazgeçilmezi olan bukle kumaş serimiz, üç boyutlu bukle iplik dokusu ile yaşam alanlarınıza derinlik ve sıcaklık katar. Koltuk yenileme ve yeni mobilya projelerinde tasarımcıların ilk tercihidir.`,
    specs: JSON.stringify({
      "Kumaş Eni": "140 cm",
      "Gramaj": "540 gr/m²",
      "İçerik": "%85 Polyester, %15 Akrilik",
      "Aşınma": "45.000 Martindale",
      "Kullanım": "Koltuk, Puf, Berjer, Yatak Başı, Kırlent"
    }),
    base_price: 420.00,
    discount_price: 365.00,
    min_order_meter: 1.0,
    meter_step: 0.5,
    max_order_meter: 40.0,
    stock_meter: 120.0,
    has_variants: 1,
    main_image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80',
    is_featured: 1,
    is_bestseller: 1,
    is_new: 1,
    vitrin_order: 2,
    variants: [
      { id: 'var-2-bej', sku: 'BKD-BUK-002-BEJ', title: 'Doğal Krem / Bej', price: 365.00, stock: 50.0, col_id: 'val-col-bej', img: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80' },
      { id: 'var-2-vizon', sku: 'BKD-BUK-002-VIZ', title: 'Toprak Vizon', price: 365.00, stock: 40.0, col_id: 'val-col-vizon', img: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80' },
      { id: 'var-2-ant', sku: 'BKD-BUK-002-ANT', title: 'Duman Antrasit', price: 365.00, stock: 30.0, col_id: 'val-col-antrasit', img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prod-3',
    category_id: 'cat-fon',
    sku: 'BKD-FON-003',
    name: 'Ekstra Dökümlü Keten Dokulu Fon Perdelik Kumaş (En: 280 cm)',
    slug: 'ekstra-dokumlu-keten-dokulu-fon-perdelik-kumas-280-cm',
    short_desc: '280 cm çift en avantajı ile ek yapmadan dikişe uygun, kırışmaz doğal keten efektli fonluk kumaş.',
    desc: `Salon ve odalarınıza doğal bir zarafet getiren 280 cm genişliğindeki çift en fon perdelik kumaşımız, özel keten karışımlı iplikleri sayesinde gün ışığını yumuşatarak içeri alır. Kırışma yapmaz, ütü gerektirmez, asıldığında mükemmel döküm sağlar.`,
    specs: JSON.stringify({
      "Kumaş Eni": "280 cm (Çift En - Ekonomik Metraj)",
      "Gramaj": "320 gr/m²",
      "İçerik": "%30 Keten, %70 Polyester",
      "Işık Geçirgenliği": "Yarı Geçirgen (Dimout)",
      "Kullanım": "Fon Perde, Katlamalı Perde, Rustik Perde"
    }),
    base_price: 490.00,
    discount_price: 420.00,
    min_order_meter: 1.0,
    meter_step: 0.5,
    max_order_meter: 60.0,
    stock_meter: 140.0,
    has_variants: 1,
    main_image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    is_featured: 1,
    is_bestseller: 1,
    is_new: 0,
    vitrin_order: 3,
    variants: [
      { id: 'var-3-krem', sku: 'BKD-FON-003-KRM', title: 'Ham Keten Ekru', price: 420.00, stock: 60.0, col_id: 'val-col-bej', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' },
      { id: 'var-3-vizon', sku: 'BKD-FON-003-VIZ', title: 'Açık Vizon', price: 420.00, stock: 40.0, col_id: 'val-col-vizon', img: 'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?auto=format&fit=crop&w=800&q=80' },
      { id: 'var-3-ant', sku: 'BKD-FON-003-ANT', title: 'Keten Antrasit', price: 420.00, stock: 40.0, col_id: 'val-col-antrasit', img: 'https://images.unsplash.com/photo-1540518614846-7ede433c4b13?auto=format&fit=crop&w=800&q=80' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prod-4',
    category_id: 'cat-blackout',
    sku: 'BKD-BLK-004',
    name: '3 Katmanlı Termal %100 Karartma Blackout Perde Kumaşı',
    slug: '3-katmanli-termal-karartma-blackout-perde-kumasi',
    short_desc: 'Otel standardında tam karanlık sağlayan, ses ve ısı izolasyonlu blackout kumaş.',
    desc: `Yatak odaları, bebek odaları, projeksiyon/sinema odaları ve oteller için özel olarak üretilen 3 katmanlı blackout kumaşımız, gün ortasında dahi içeriye sıfır ışık sızdırır. Kışın soğuğu, yazın sıcağı keserek enerji tasarrufu sağlar.`,
    specs: JSON.stringify({
      "Kumaş Eni": "280 cm",
      "Gramaj": "360 gr/m²",
      "İçerik": "%100 Karartma Polyester Dokuma",
      "Karartma Oranı": "%100 Işık Geçirmez",
      "Termal İzolasyon": "Evet (Sıcak/Soğuk Bariyeri)"
    }),
    base_price: 460.00,
    discount_price: 390.00,
    min_order_meter: 1.0,
    meter_step: 0.5,
    max_order_meter: 50.0,
    stock_meter: 110.0,
    has_variants: 1,
    main_image: 'https://images.unsplash.com/photo-1540518614846-7ede433c4b13?auto=format&fit=crop&w=800&q=80',
    is_featured: 1,
    is_bestseller: 0,
    is_new: 1,
    vitrin_order: 4,
    variants: [
      { id: 'var-4-lacivert', sku: 'BKD-BLK-004-LAC', title: 'Blackout Lacivert', price: 390.00, stock: 40.0, col_id: 'val-col-lacivert', img: 'https://images.unsplash.com/photo-1540518614846-7ede433c4b13?auto=format&fit=crop&w=800&q=80' },
      { id: 'var-4-antrasit', sku: 'BKD-BLK-004-ANT', title: 'Blackout Antrasit', price: 390.00, stock: 40.0, col_id: 'val-col-antrasit', img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80' },
      { id: 'var-4-bej', sku: 'BKD-BLK-004-BEJ', title: 'Blackout Sıcak Bej', price: 390.00, stock: 30.0, col_id: 'val-col-bej', img: 'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?auto=format&fit=crop&w=800&q=80' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1540518614846-7ede433c4b13?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prod-5',
    category_id: 'cat-masa',
    sku: 'BKD-DCK-005',
    name: 'Leke Tutmaz Su İtici Desenli Duck Keten Masa Örtüsü Kumaşı',
    slug: 'leke-tutmaz-su-itici-desenli-duck-keten-kumas',
    short_desc: 'Masa örtüsü, runner, minder, fon perde ve bez çanta yapımına uygun leke tutmaz duck kumaş.',
    desc: `Bursa dokuma tezgahlarının en sevilen dertsiz kumaşı. Su, yağ ve çay dökülmelerinde sıvıyı içine çekmez, peçeteyle tek harekette temizlenir. Ev, kafe ve restoran masa örtüleri ile bahçe mobilyası minderleri için mükemmel seçim.`,
    specs: JSON.stringify({
      "Kumaş Eni": "180 cm (Geniş En)",
      "Gramaj": "220 gr/m²",
      "İçerik": "%65 Pamuk, %35 Polyester",
      "Apre": "Leke Tutmaz & Su İtici Nano Apre",
      "Kullanım": "Masa Örtüsü, Runner, Sandalye Minderi, Mutfak Önlüğü, Fon Perde"
    }),
    base_price: 240.00,
    discount_price: 195.00,
    min_order_meter: 1.0,
    meter_step: 0.5,
    max_order_meter: 100.0,
    stock_meter: 250.0,
    has_variants: 1,
    main_image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80',
    is_featured: 1,
    is_bestseller: 1,
    is_new: 0,
    vitrin_order: 5,
    variants: [
      { id: 'var-5-cizgi', sku: 'BKD-DCK-005-CIZ', title: 'Marin Çizgili Lacivert', price: 195.00, stock: 90.0, col_id: 'val-col-lacivert', img: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80' },
      { id: 'var-5-cicek', sku: 'BKD-DCK-005-CIK', title: 'Pastel Vintage Çiçekli', price: 195.00, stock: 80.0, col_id: 'val-col-pudra', img: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80' },
      { id: 'var-5-duz', sku: 'BKD-DCK-005-DUZ', title: 'Doğal Keten Bej Düz', price: 195.00, stock: 80.0, col_id: 'val-col-bej', img: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prod-6',
    category_id: 'cat-poplin',
    sku: 'BKD-POP-006',
    name: '%100 Organik Pamuk Poplin Gömleklik ve Elbiselik Kumaş',
    slug: '100-organik-pamuk-poplin-gomleklik-elbiselik-kumas',
    short_desc: 'Yumuşacık tuşeli, terletmeyen, OEKO-TEX sertifikalı birinci sınıf saf pamuk poplin kumaş.',
    desc: `Yazlık elbiseler, gömlekler, tunikler, pijama takımları ve bebek tekstili için en sağlıklı seçim. %100 saf Ege pamuğundan üretilmiş olup cildi tahriş etmez, terletmez ve hava geçirgenliği maksimum seviyededir.`,
    specs: JSON.stringify({
      "Kumaş Eni": "150 cm",
      "Gramaj": "130 gr/m²",
      "İçerik": "%100 Taranmış Pamuk",
      "Sertifika": "OEKO-TEX Standard 100",
      "Kullanım": "Gömlek, Elbise, Pijama, Bebek Kıyafetleri, Nevresim"
    }),
    base_price: 210.00,
    discount_price: 175.00,
    min_order_meter: 1.0,
    meter_step: 0.5,
    max_order_meter: 50.0,
    stock_meter: 190.0,
    has_variants: 1,
    main_image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
    is_featured: 1,
    is_bestseller: 0,
    is_new: 1,
    vitrin_order: 6,
    variants: [
      { id: 'var-6-beyaz', sku: 'BKD-POP-006-BEY', title: 'Optik Kar Beyazı', price: 175.00, stock: 70.0, col_id: 'val-col-bej', img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80' },
      { id: 'var-6-lacivert', sku: 'BKD-POP-006-LAC', title: 'Klasik Koyu Lacivert', price: 175.00, stock: 60.0, col_id: 'val-col-lacivert', img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80' },
      { id: 'var-6-pudra', sku: 'BKD-POP-006-PUD', title: 'Pastel Pudra Pembe', price: 175.00, stock: 60.0, col_id: 'val-col-pudra', img: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

const insertProd = db.prepare(`
  INSERT INTO products (
    id, category_id, sku, name, slug, short_description, description, technical_specs,
    base_price, discount_price, tax_rate, is_meter_sale, min_order_meter, meter_step, max_order_meter, stock_meter,
    has_variants, main_image_url, is_active, is_featured, is_bestseller, is_new, vitrin_order, meta_title, meta_description
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 20, 1, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
`);

const insertVar = db.prepare(`
  INSERT INTO product_variants (id, product_id, sku, title, price, discount_price, stock_meter, image_url, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
`);

const insertVarAttr = db.prepare(`
  INSERT INTO product_variant_attributes (variant_id, attribute_id, attribute_value_id)
  VALUES (?, 'attr-color', ?)
`);

const insertImg = db.prepare(`
  INSERT INTO product_images (id, product_id, variant_id, image_url, thumbnail_url, alt_text, display_order, is_main)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const p of products) {
  insertProd.run(
    p.id, p.category_id, p.sku, p.name, p.slug, p.short_desc, p.desc, p.specs,
    p.base_price, p.discount_price, p.min_order_meter, p.meter_step, p.max_order_meter, p.stock_meter,
    p.has_variants, p.main_image, p.is_featured, p.is_bestseller, p.is_new, p.vitrin_order,
    `${p.name} Metre Fiyatı - Bursa Kumaş Dünyası`,
    `${p.short_desc} Bursa Kumaş Dünyası güvencesiyle aynı gün kargo ve uygun metre fiyatlarıyla satın alın.`
  );

  let imgIdx = 0;
  for (const imgUrl of p.gallery) {
    insertImg.run(`img-${p.id}-${imgIdx}`, p.id, null, imgUrl, imgUrl, p.name, imgIdx, imgIdx === 0 ? 1 : 0);
    imgIdx++;
  }

  for (const v of p.variants) {
    insertVar.run(v.id, p.id, v.sku, v.title, v.price, v.price, v.stock, v.img);
    insertVarAttr.run(v.id, v.col_id);
    insertImg.run(`img-var-${v.id}`, p.id, v.id, v.img, v.img, `${p.name} - ${v.title}`, imgIdx++, 0);
  }
}

// 6. COUPONS & CART RULES
db.prepare(`
  INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, used_count, per_user_limit, is_active)
  VALUES 
  ('coup-1', 'BURSA10', 'percent', 10.00, 500.00, 300.00, 500, 12, 1, 1),
  ('coup-2', 'KUMAS150', 'fixed', 150.00, 1200.00, 150.00, 200, 5, 1, 1),
  ('coup-3', 'HOSGELDIN50', 'fixed', 50.00, 400.00, 50.00, 1000, 28, 1, 1)
`).run();

db.prepare(`
  INSERT INTO cart_discount_rules (id, title, min_cart_total, discount_percent, discount_fixed, is_active)
  VALUES 
  ('rule-1', '1.500 TL Üzeri Otomatik %10 Sepet İndirimi', 1500.00, 10.00, 0.00, 1),
  ('rule-2', '3.000 TL Üzeri Ücretsiz Kargo & 200 TL Hediye', 3000.00, 0.00, 200.00, 1)
`).run();

// 7. HOMEPAGE SECTIONS & BANNERS
db.prepare(`
  INSERT INTO homepage_sections (id, section_key, title, subtitle, section_type, display_order, is_active)
  VALUES 
  ('sec-hero', 'hero_slider', 'Bursa Kumaş Dünyası Ana Vitrin', 'Doğrudan Dokuma Tezgahından Kapınıza', 'hero', 1, 1),
  ('sec-features', 'advantages_bar', 'Neden Bursa Kumaş Dünyası?', 'Türkiye Geneli Hızlı Teslimat & Metre Kesim Garantisi', 'advantages', 2, 1),
  ('sec-cats', 'category_grid', 'Popüler Kumaş Kategorileri', 'Döşemelik, Perdelik, Giyimlik ve Ev Tekstili', 'categories', 3, 1),
  ('sec-vitrin', 'featured_fabrics', 'Haftanın Öne Çıkan Kumaşları', 'Mimarların ve Evini Yenileyenlerin Favori Seçimleri', 'featured_products', 4, 1),
  ('sec-best', 'bestseller_fabrics', 'Çok Satan Kumaşlarımız', 'Müşterilerimizin En Yüksek Puan Verdiği Dokumalar', 'bestsellers', 5, 1),
  ('sec-reviews', 'customer_testimonials', 'Gerçek Müşteri Yorumları', 'Binlerce Mutlu Kumaş Severin Deneyimleri', 'reviews', 6, 1),
  ('sec-blog', 'latest_articles', 'Kumaş Rehberi & Blog', 'Kumaş seçimi, metre hesabı ve bakım önerileri', 'blog', 7, 1)
`).run();

db.prepare(`
  INSERT INTO homepage_banners (id, title, subtitle, image_url, mobile_image_url, link_url, button_text, display_order, is_active)
  VALUES 
  ('ban-1', 'Premium Kadife & Buklet Döşemelik Kumaşlar', 'Mobilyalarınıza İtalyan şıklığı katın. Leke tutmaz su itici teknolojisiyle 0.5m adımlarla dilediğiniz kadar satın alın.', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=85', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80', '/kategori/kadife-dosemelik-kumas', 'Döşemelik Kumaşları İncele', 1, 1),
  ('ban-2', '280 cm Çift En Fon Perdelik Kumaşlarda Kampanya', 'Ek yapmadan tek parça dökümlü fon perdeler. Kırışmaz keten dokulu kumaşlarda %20 indirim.', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=85', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', '/kategori/fon-perdelik-kumaslar', 'Perdelik Kumaşları Keşfet', 2, 1)
`).run();

// 8. BLOG POSTS (SEO Zengin İçerik)
db.prepare(`
  INSERT INTO blog_posts (id, title, slug, summary, content, cover_image, author, category, tags, meta_title, meta_description, is_published)
  VALUES 
  ('blog-1', 'Koltuk Döşemelik Kumaş Seçerken Dikkat Edilmesi Gereken 7 Altın Kural', 'koltuk-dosemelik-kumas-secerken-dikkat-edilmesi-gereken-7-altin-kural', 
  'Eviniz için en doğru döşemelik kumaşı seçmek; dayanıklılık, leke tutmazlık, evcil hayvan uyumu ve doku dengesi gerektirir. İşte uzman rehberi.',
  '## Koltuk Döşemelik Kumaş Seçim Rehberi\n\nEvinizin en çok kullanılan mobilyası olan koltukların kumaşını yenilerken dikkat etmeniz gereken en önemli kriterler şunlardır:\n\n### 1. Martindale Aşınma Dayanımı\nDöşemelik kumaşlarda sürtünme testi (Martindale) en az 30.000 rubs olmalıdır. Yoğun kullanılan oturma odaları için 50.000+ Martindale kadife ve şönil kumaşları tercih etmelisiniz.\n\n### 2. Su İticilik ve Leke Tutmaz Nano Apre\nSıvı döküldüğünde içine çekmeyen, yüzeyde boncuklaşan kumaşlar özellikle çocuklu ve evcil hayvanlı aileler için vazgeçilmezdir.\n\n### 3. Pet-Friendly (Evcil Hayvan Dostu) Sık Dokuma\nKedili ve köpekli evlerde tırnak takılmasını engelleyen tulum kadife ve sık dokuma nubuk kumaşlar önerilir.\n\n### 4. Renk ve Işık Uyumu\nGüneş alan salonlarda solmaya karşı UV dirençli kumaşlar seçilmeli, küçük mekanlarda açık bej ve vizon tonları tercih edilmelidir.\n\nBursa Kumaş Dünyası olarak tüm döşemelik kumaşlarımızı metre bazında 0.5m adımlarla doğrudan üreticiden kapınıza ulaştırıyoruz.',
  'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1200&q=80',
  'Bursa Kumaş Dünyası Tekstil Mimarı', 'Döşemelik Rehberi', 'Döşemelik Kumaş, Kadife, Koltuk Kaplama, Leke Tutmaz',
  'Koltuk Döşemelik Kumaş Seçimi 7 Kural - Bursa Kumaş Dünyası',
  'Koltuk kaplama kumaşı seçerken nelere dikkat edilmeli? Martindale testi, su iticilik, evcil hayvan uyumu ve kumaş metre hesabı.', 1),

  ('blog-2', 'Fon Perde Metre Hesabı Nasıl Yapılır? Adım Adım Ölçü Alma Rehberi', 'fon-perde-metre-hesabi-nasil-yapilir',
  'Pencereleriniz için fon perde diktirirken ne kadar kumaşa ihtiyacınız olduğunu 280 cm çift en ve pile sıklığına göre nasıl hesaplayacağınızı öğrenin.',
  '## Fon Perde Metre Hesabı Nasıl Yapılır?\n\nFon perde dikiminde en kritik konu, kumaşın eni ve istenen pile oranıdır:\n\n### Çift En (280 cm) Kumaş Avantajı\nEğer tavan yüksekliğiniz 260 - 270 cm arasındaysa, 280 cm enindeki kumaş tek parça olarak boydan kullanılır. Böylece sadece pencere genişliğiniz kadar kumaş metresi almanız yeterli olur!\n\n### Pile Oranlarına Göre Hesaplama:\n- **1/2 Seyrek Pile**: Pencere eni x 2 metre kumaş\n- **1/2.5 Normal Pile**: Pencere eni x 2.5 metre kumaş\n- **1/3 Sık (Kanun) Pile**: Pencere eni x 3 metre kumaş\n\nÖrnek: 1 metrelik tek kanat fon için 1/2.5 pilede tam 2.5 metre kumaş almanız gerekmektedir.',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
  'Perde & Dekorasyon Uzmanı', 'Perdelik Rehberi', 'Fon Perde, Metre Hesabı, 280 cm Çift En, Perdelik Kumaş',
  'Fon Perde Kumaş Metre Hesabı Nasıl Yapılır? - Bursa Kumaş Dünyası',
  'Fon perde için kaç metre kumaş gider? 280 cm çift en avantajı, pile oranları ve doğru pencere ölçüsü alma formülü.', 1)
`).run();

// 9. REVIEWS
db.prepare(`
  INSERT INTO reviews (id, product_id, user_id, customer_name, rating, comment, is_verified_purchase, is_approved)
  VALUES 
  ('rev-1', 'prod-1', 'user-1', 'Ahmet Yılmaz', 5, 'Koltuklarımızı kaplatmak için 14 metre Royal antrasit kadife aldık. Kumaşın dokusu ve kalitesi harika. Su damlatıp denedik hemen süzülüp aktı, döşemecimiz de kumaşı çok beğendi.', 1, 1),
  ('rev-2', 'prod-1', 'user-2', 'Zeynep K.', 5, 'Zümrüt yeşili rengi fotoğraftakinden bile daha zengin duruyor. 0.5m adımla tam istediğimiz ölçüde alabilmek büyük kolaylık sağladı, teşekkürler Bursa Kumaş Dünyası.', 1, 1),
  ('rev-3', 'prod-3', 'user-1', 'Ahmet Y.', 5, '280 cm çift en olması sayesinde ek dikiş olmadan salonuma harika fon perde dikildi. Keten dökümü mükemmel.', 1, 1)
`).run();

// 10. SAMPLE ORDERS (Gerçekçi Siparişler, Sipariş Çıktısı & Kargo Simülasyonu)
const sampleOrder1Id = 'ord-bkd-001';
db.prepare(`
  INSERT INTO orders (
    id, order_number, user_id, is_guest, customer_name, customer_email, customer_phone,
    shipping_address, billing_address, subtotal, discount_total, coupon_code, shipping_total, tax_total, grand_total,
    status, payment_status, payment_method, order_notes, carrier_name, tracking_number, tracking_url,
    invoice_status, invoice_number, created_at
  ) VALUES (
    ?, 'BKD-2026-000101', 'user-1', 0, 'Ahmet Yılmaz', 'ahmet.yilmaz@example.com', '0532 111 22 33',
    ?, ?, 2950.00, 295.00, 'BURSA10', 0.00, 531.00, 2655.00,
    'Kargoya_Verildi', 'paid', 'paytr', 'Lütfen kumaşı 2 parça halinde değil tek parça 10 metre kesiniz.',
    'Yurtiçi Kargo', 'YK-98234710293', 'https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=YK-98234710293',
    'created', 'EAF2026000000412', datetime('now', '-2 days')
  )
`).run(
  sampleOrder1Id,
  JSON.stringify({
    fullName: 'Ahmet Yılmaz',
    phone: '0532 111 22 33',
    city: 'Bursa',
    district: 'Nilüfer',
    addressLine: 'İhsaniye Mah. Barbaros Cad. No:14 D:6',
    postalCode: '16130'
  }),
  JSON.stringify({
    fullName: 'Ahmet Yılmaz',
    phone: '0532 111 22 33',
    city: 'Bursa',
    district: 'Nilüfer',
    addressLine: 'İhsaniye Mah. Barbaros Cad. No:14 D:6'
  })
);

db.prepare(`
  INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, variant_title, product_sku, product_image, meter_quantity, unit_price, total_price)
  VALUES 
  ('item-1', ?, 'prod-1', 'var-1-antrasit', 'Royal Lüks İtalyan Dokuma Kadife Döşemelik Kumaş', 'Antrasit Gri', 'BKD-KAD-001-ANT', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80', 10.00, 295.00, 2950.00)
`).run(sampleOrder1Id);

db.prepare(`
  INSERT INTO order_status_history (id, order_id, old_status, new_status, changed_by, notes, created_at)
  VALUES 
  ('hist-1', ?, NULL, 'Siparis_Alindi', 'Sistem (PayTR Webhook)', 'Ödeme PayTR üzerinden 2.655,00 TL olarak başarıyla tahsil edildi.', datetime('now', '-2 days')),
  ('hist-2', ?, 'Siparis_Alindi', 'Hazirlaniyor', 'Murat Kesim & Sevkiyat', 'Kumaş kesim masasına alındı, 10.0 metre rulo kontrolü yapıldı.', datetime('now', '-1 day', '+2 hours')),
  ('hist-3', ?, 'Hazirlaniyor', 'Cikti_Alindi', 'Murat Kesim & Sevkiyat', 'Sipariş ve kesim fişi A4 yazdırıldı.', datetime('now', '-1 day', '+3 hours')),
  ('hist-4', ?, 'Cikti_Alindi', 'Kargoya_Verildi', 'Yurtiçi Kargo Entegrasyonu', 'Takip No: YK-98234710293 ile kuryeye teslim edildi.', datetime('now', '-18 hours'))
`).run(sampleOrder1Id, sampleOrder1Id, sampleOrder1Id, sampleOrder1Id);

db.prepare(`
  INSERT INTO payments (id, order_id, provider, merchant_oid, transaction_id, amount, status, installment_count, raw_response)
  VALUES ('pay-1', ?, 'paytr', 'BKD-2026-000101', 'PAYTR-TX-99882211', 2655.00, 'success', 1, '{"status":"success","total_amount":265500,"hash":"verified_ok"}')
`).run(sampleOrder1Id);

console.log('--- Veritabanı Başarıyla Dolduruldu (Seed Tamamlandı) ---');
db.close();
