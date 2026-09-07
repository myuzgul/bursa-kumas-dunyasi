import { dbRepo, DatabaseData } from './repo';

export function seedDatabase(): void {
  const current = dbRepo.read();
  // If already seeded with products, don't overwrite unless empty
  if (current.products && current.products.length > 0) {
    return;
  }

  const initialSeed: DatabaseData = {
    admin_roles: [
      { id: 'role-super', name: 'Süper Yönetici', description: 'Tüm yetkilere sahip üst yönetici', permissions: ['all', 'products', 'orders', 'reports', 'settings', 'discounts', 'blog', 'users'], created_at: new Date().toISOString() },
      { id: 'role-orders', name: 'Sipariş & Kesim Yetkilisi', description: 'Sipariş durumları, kargo ve çıktı yönetimi', permissions: ['orders', 'reports'], created_at: new Date().toISOString() },
      { id: 'role-products', name: 'Ürün & Stok Yetkilisi', description: 'Ürün, kategori, varyasyon ve stok yönetimi', permissions: ['products', 'reports'], created_at: new Date().toISOString() },
      { id: 'role-accounting', name: 'Muhasebe', description: 'Faturalandırma ve satış raporları', permissions: ['reports', 'orders'], created_at: new Date().toISOString() }
    ],
    admin_users: [
      { id: 'admin-1', role_id: 'role-super', full_name: 'Bursa Kumaş Dünyası Yönetici', email: 'admin@bursakumasdunyasi.com', password_hash: 'admin123', is_active: 1, last_login_at: new Date().toISOString(), created_at: new Date().toISOString() },
      { id: 'admin-2', role_id: 'role-orders', full_name: 'Murat Kesim & Sevkiyat', email: 'siparis@bursakumasdunyasi.com', password_hash: 'siparis123', is_active: 1, last_login_at: new Date().toISOString(), created_at: new Date().toISOString() }
    ],
    users: [
      { id: 'user-1', full_name: 'Ahmet Yılmaz', email: 'ahmet.yilmaz@example.com', phone: '0532 111 22 33', password_hash: 'user123', is_email_verified: 1, role: 'customer', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'user-2', full_name: 'Zeynep Kaya', email: 'zeynep.kaya@example.com', phone: '0544 222 33 44', password_hash: 'user123', is_email_verified: 1, role: 'customer', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ],
    user_addresses: [
      { id: 'addr-1', user_id: 'user-1', title: 'Evim', full_name: 'Ahmet Yılmaz', phone: '0532 111 22 33', city: 'Bursa', district: 'Nilüfer', neighborhood: 'İhsaniye Mah.', address_line: 'Barbaros Cad. No:14 Daire:6', postal_code: '16130', is_corporate: 0, is_default_shipping: 1, is_default_billing: 1, created_at: new Date().toISOString() },
      { id: 'addr-2', user_id: 'user-2', title: 'Atölye / Tasarım Ofisi', full_name: 'Zeynep Kaya', phone: '0544 222 33 44', city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Moda', address_line: 'Caferağa Mah. Şair Nefi Sok. No:8', postal_code: '34710', is_corporate: 0, is_default_shipping: 1, is_default_billing: 1, created_at: new Date().toISOString() }
    ],
    categories: [
      { id: 'cat-dosemelik', parent_id: null, name: 'Döşemelik Kumaşlar', slug: 'dosemelik-kumaslar', description: 'Koltuk, sandalye, berjer ve kırlentler için yüksek aşınma dayanımlı premium kumaşlar.', image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80', display_order: 1, is_active: 1, is_featured_home: 1, meta_title: 'Döşemelik Kumaş Modelleri ve Metre Fiyatları - Bursa Kumaş Dünyası', meta_description: 'Silinebilir kadife, şönil, buklet ve leke tutmaz döşemelik kumaşlar uygun metre fiyatlarıyla.', created_at: new Date().toISOString() },
      { id: 'cat-kadife', parent_id: 'cat-dosemelik', name: 'Kadife Döşemelik Kumaş', slug: 'kadife-dosemelik-kumas', description: 'Lüks dokulu, silinebilir ve leke tutmaz su itici kadifeler.', image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80', display_order: 2, is_active: 1, is_featured_home: 1, meta_title: 'Kadife Koltuk Kumaşı Fiyatları', meta_description: 'Su itici, pet-friendly döşemelik kadife kumaş çeşitleri.', created_at: new Date().toISOString() },
      { id: 'cat-sonil', parent_id: 'cat-dosemelik', name: 'Şönil & Buklet Kumaşlar', slug: 'sonil-buklet-kumaslar', description: 'Trend bukle dokulu, sıcak ve yumuşak yüzeyli mobilya kumaşları.', image_url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=600&q=80', display_order: 3, is_active: 1, is_featured_home: 1, meta_title: 'Buklet & Şönil Koltuk Kumaşları', meta_description: 'İskandinav tasarım modern buklet ve şönil kumaşlar.', created_at: new Date().toISOString() },
      { id: 'cat-perdelik', parent_id: null, name: 'Perdelik Kumaşlar', slug: 'perdelik-kumaslar', description: 'Salon, yatak odası ve otel projeleri için fon, tül ve blackout perde kumaşları.', image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80', display_order: 4, is_active: 1, is_featured_home: 1, meta_title: 'Perdelik Kumaş Modelleri - Çift En 280 cm', meta_description: '280 cm geniş en fon perde ve keten tül kumaşlar.', created_at: new Date().toISOString() },
      { id: 'cat-fon', parent_id: 'cat-perdelik', name: 'Fon Perdelik Kumaşlar', slug: 'fon-perdelik-kumaslar', description: 'Dökümlü, şık duruşlu ve zengin renk seçenekli fon perdelikler.', image_url: 'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?auto=format&fit=crop&w=600&q=80', display_order: 5, is_active: 1, is_featured_home: 1, meta_title: 'Fon Perdelik Kumaşlar', meta_description: 'Kırışmaz dökümlü keten fon perdelik kumaş modelleri.', created_at: new Date().toISOString() },
      { id: 'cat-blackout', parent_id: 'cat-perdelik', name: 'Blackout Karartma Perde', slug: 'blackout-karartma-kumaslar', description: '%100 ışık ve ısı yalıtımı sağlayan profesyonel karartma kumaşları.', image_url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4b13?auto=format&fit=crop&w=600&q=80', display_order: 6, is_active: 1, is_featured_home: 0, meta_title: 'Blackout Karartma Perde Kumaşı', meta_description: '%100 ışık geçirmez termal yalıtımlı blackout kumaşlar.', created_at: new Date().toISOString() },
      { id: 'cat-giyimlik', parent_id: null, name: 'Giyimlik Kumaşlar', slug: 'giyimlik-kumaslar', description: 'Elbise, gömlek, ceket ve pantolon üretimine uygun doğal ve nefes alan kumaşlar.', image_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80', display_order: 7, is_active: 1, is_featured_home: 1, meta_title: 'Giyimlik Kumaşlar - Saf Pamuk & Poplin', meta_description: 'Pamuk, poplin, saten ve keten elbiselik kumaşlar.', created_at: new Date().toISOString() },
      { id: 'cat-masa', parent_id: null, name: 'Masa Örtüsü & Duck Keten', slug: 'masa-ortusu-duck-keten', description: 'Leke tutmaz dertsiz masa örtülük kumaşlar ve dekoratif duck ketenler.', image_url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=600&q=80', display_order: 8, is_active: 1, is_featured_home: 1, meta_title: 'Duck Keten & Dertsiz Masa Örtüsü Kumaşları', meta_description: 'Su ve leke tutmaz dertsiz masa örtüsü kumaşları.', created_at: new Date().toISOString() }
    ],
    attributes: [
      { id: 'attr-color', name: 'Renk', type: 'color' },
      { id: 'attr-pattern', name: 'Desen', type: 'badge' },
      { id: 'attr-width', name: 'Kumaş Eni', type: 'select' }
    ],
    attribute_values: [
      { id: 'val-col-antrasit', attribute_id: 'attr-color', name: 'Antrasit', color_code: '#2D3748', display_order: 1 },
      { id: 'val-col-lacivert', attribute_id: 'attr-color', name: 'Gece Mavisi / Lacivert', color_code: '#1E3A8A', display_order: 2 },
      { id: 'val-col-zumrut', attribute_id: 'attr-color', name: 'Zümrüt Yeşili', color_code: '#065F46', display_order: 3 },
      { id: 'val-col-bordo', attribute_id: 'attr-color', name: 'Bordo / Şarap', color_code: '#991B1B', display_order: 4 },
      { id: 'val-col-vizon', attribute_id: 'attr-color', name: 'Vizon / Toprak', color_code: '#8C7D70', display_order: 5 },
      { id: 'val-col-bej', attribute_id: 'attr-color', name: 'Krem / Bej', color_code: '#F5F5DC', display_order: 6 },
      { id: 'val-col-pudra', attribute_id: 'attr-color', name: 'Pudra Pembe', color_code: '#FBCFE8', display_order: 7 }
    ],
    products: [
      {
        id: 'prod-1',
        category_id: 'cat-kadife',
        sku: 'BKD-KAD-001',
        name: 'Royal Lüks İtalyan Dokuma Kadife Döşemelik Kumaş',
        slug: 'royal-luks-italyan-kadife-dosemelik-kumas',
        short_description: 'Su itici, silinebilir, 60.000 Martindale aşınma dayanımlı birinci sınıf koltuk ve berjer kadifesi.',
        description: 'Bursa Kumaş Dünyası\'nın en çok tercih edilen tescilli Royal serisi kadife kumaşı, yüksek yoğunluklu dokusu sayesinde koltuk, sandalye, baza başlığı ve dekoratif kırlentleriniz için benzersiz bir konfor ve zarafet sunar.\n\n- Sıvı dökülmelerinde yüzeyde damlacık oluşturur, leke tutmaz ve nemli bezle kolayca silinir.\n- Evcil hayvan tırmalamalarına karşı ekstra sık dokunmuştur (Pet-friendly).\n- Renkleri solmaz, dökülme ve keçeleşme yapmaz.\n- 1 metreden itibaren 0.5m adımlarla dilediğiniz ölçüde sipariş verebilirsiniz.',
        technical_specs: {
          "Kumaş Eni": "140 cm",
          "Gramaj": "420 gr/m² (±%5)",
          "İçerik": "%100 Mikrofiber Polyester",
          "Aşınma Dayanımı": "60.000 Martindale Rubs",
          "Kullanım Alanları": "Koltuk Takımı, Sandalye, Puf, Yatak Başı, Kırlent",
          "Bakım": "Nemli bez ve beyaz sabun ile silinebilir, 30°C hassas yıkama"
        },
        base_price: 340.00,
        discount_price: 295.00,
        tax_rate: 20,
        is_meter_sale: 1,
        min_order_meter: 1.0,
        meter_step: 0.5,
        max_order_meter: 50.0,
        stock_meter: 180.0,
        has_variants: 1,
        main_image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
        is_active: 1,
        is_featured: 1,
        is_bestseller: 1,
        is_new: 1,
        vitrin_order: 1,
        meta_title: 'Royal Lüks İtalyan Kadife Döşemelik Kumaş - Bursa Kumaş Dünyası',
        meta_description: 'Leke tutmaz, su itici ve silinebilir 60.000 Martindale döşemelik kadife kumaş metre fiyatı.',
        canonical_url: '/urun/royal-luks-italyan-kadife-dosemelik-kumas',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-2',
        category_id: 'cat-sonil',
        sku: 'BKD-BUK-002',
        name: 'Tulum Dokulu İskandinav Buklet Döşemelik Kumaş',
        slug: 'tulum-dokulu-iskandinav-buklet-dosemelik-kumas',
        short_description: 'Modern mimarinin gözdesi bukle doku; tok, hacimli ve sıcak yüzeyli koltuk kumaşı.',
        description: 'İskandinav ve modern minimal mobilya tasarımlarının vazgeçilmezi olan bukle kumaş serimiz, üç boyutlu bukle iplik dokusu ile yaşam alanlarınıza derinlik ve sıcaklık katar. Koltuk yenileme ve yeni mobilya projelerinde tasarımcıların ilk tercihidir.',
        technical_specs: {
          "Kumaş Eni": "140 cm",
          "Gramaj": "540 gr/m²",
          "İçerik": "%85 Polyester, %15 Akrilik",
          "Aşınma": "45.000 Martindale",
          "Kullanım": "Koltuk, Puf, Berjer, Yatak Başı, Kırlent"
        },
        base_price: 420.00,
        discount_price: 365.00,
        tax_rate: 20,
        is_meter_sale: 1,
        min_order_meter: 1.0,
        meter_step: 0.5,
        max_order_meter: 40.0,
        stock_meter: 120.0,
        has_variants: 1,
        main_image_url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80',
        is_active: 1,
        is_featured: 1,
        is_bestseller: 1,
        is_new: 1,
        vitrin_order: 2,
        meta_title: 'Tulum Dokulu Buklet Koltuk Kumaşı Metre Fiyatı',
        meta_description: 'Trend buklet döşemelik kumaşlar; leke tutmaz ve dökümlü yapısıyla Bursa Kumaş Dünyası güvencesiyle.',
        canonical_url: '/urun/tulum-dokulu-iskandinav-buklet-dosemelik-kumas',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-3',
        category_id: 'cat-fon',
        sku: 'BKD-FON-003',
        name: 'Ekstra Dökümlü Keten Dokulu Fon Perdelik Kumaş (En: 280 cm)',
        slug: 'ekstra-dokumlu-keten-dokulu-fon-perdelik-kumas-280-cm',
        short_description: '280 cm çift en avantajı ile ek yapmadan dikişe uygun, kırışmaz doğal keten efektli fonluk kumaş.',
        description: 'Salon ve odalarınıza doğal bir zarafet getiren 280 cm genişliğindeki çift en fon perdelik kumaşımız, özel keten karışımlı iplikleri sayesinde gün ışığını yumuşatarak içeri alır. Kırışma yapmaz, ütü gerektirmez, asıldığında mükemmel döküm sağlar.',
        technical_specs: {
          "Kumaş Eni": "280 cm (Çift En - Ekonomik Metraj)",
          "Gramaj": "320 gr/m²",
          "İçerik": "%30 Keten, %70 Polyester",
          "Işık Geçirgenliği": "Yarı Geçirgen (Dimout)",
          "Kullanım": "Fon Perde, Katlamalı Perde, Rustik Perde"
        },
        base_price: 490.00,
        discount_price: 420.00,
        tax_rate: 20,
        is_meter_sale: 1,
        min_order_meter: 1.0,
        meter_step: 0.5,
        max_order_meter: 60.0,
        stock_meter: 140.0,
        has_variants: 1,
        main_image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        is_active: 1,
        is_featured: 1,
        is_bestseller: 1,
        is_new: 0,
        vitrin_order: 3,
        meta_title: '280 cm Çift En Keten Fon Perdelik Kumaş Metre Fiyatı',
        meta_description: 'Ek dikişsiz dökümlü keten fon perdelik kumaşlar en uygun metre fiyatlarıyla.',
        canonical_url: '/urun/ekstra-dokumlu-keten-dokulu-fon-perdelik-kumas-280-cm',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-4',
        category_id: 'cat-blackout',
        sku: 'BKD-BLK-004',
        name: '3 Katmanlı Termal %100 Karartma Blackout Perde Kumaşı',
        slug: '3-katmanli-termal-karartma-blackout-perde-kumasi',
        short_description: 'Otel standardında tam karanlık sağlayan, ses ve ısı izolasyonlu blackout kumaş.',
        description: 'Yatak odaları, bebek odaları, projeksiyon/sinema odaları ve oteller için özel olarak üretilen 3 katmanlı blackout kumaşımız, gün ortasında dahi içeriye sıfır ışık sızdırır. Kışın soğuğu, yazın sıcağı keserek enerji tasarrufu sağlar.',
        technical_specs: {
          "Kumaş Eni": "280 cm",
          "Gramaj": "360 gr/m²",
          "İçerik": "%100 Karartma Polyester Dokuma",
          "Karartma Oranı": "%100 Işık Geçirmez",
          "Termal İzolasyon": "Evet (Sıcak/Soğuk Bariyeri)"
        },
        base_price: 460.00,
        discount_price: 390.00,
        tax_rate: 20,
        is_meter_sale: 1,
        min_order_meter: 1.0,
        meter_step: 0.5,
        max_order_meter: 50.0,
        stock_meter: 110.0,
        has_variants: 1,
        main_image_url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4b13?auto=format&fit=crop&w=800&q=80',
        is_active: 1,
        is_featured: 1,
        is_bestseller: 0,
        is_new: 1,
        vitrin_order: 4,
        meta_title: '%100 Karartma Blackout Perde Kumaşı - Bursa Kumaş Dünyası',
        meta_description: 'Termal ısı ve ışık yalıtımlı 280 cm blackout kumaş metre fiyatı.',
        canonical_url: '/urun/3-katmanli-termal-karartma-blackout-perde-kumasi',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-5',
        category_id: 'cat-masa',
        sku: 'BKD-DCK-005',
        name: 'Leke Tutmaz Su İtici Desenli Duck Keten Masa Örtüsü Kumaşı',
        slug: 'leke-tutmaz-su-itici-desenli-duck-keten-kumas',
        short_description: 'Masa örtüsü, runner, minder, fon perde ve bez çanta yapımına uygun leke tutmaz duck kumaş.',
        description: 'Bursa dokuma tezgahlarının en sevilen dertsiz kumaşı. Su, yağ ve çay dökülmelerinde sıvıyı içine çekmez, peçeteyle tek harekette temizlenir. Ev, kafe ve restoran masa örtüleri ile bahçe mobilyası minderleri için mükemmel seçim.',
        technical_specs: {
          "Kumaş Eni": "180 cm (Geniş En)",
          "Gramaj": "220 gr/m²",
          "İçerik": "%65 Pamuk, %35 Polyester",
          "Apre": "Leke Tutmaz & Su İtici Nano Apre",
          "Kullanım": "Masa Örtüsü, Runner, Sandalye Minderi, Mutfak Önlüğü"
        },
        base_price: 240.00,
        discount_price: 195.00,
        tax_rate: 20,
        is_meter_sale: 1,
        min_order_meter: 1.0,
        meter_step: 0.5,
        max_order_meter: 100.0,
        stock_meter: 250.0,
        has_variants: 1,
        main_image_url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80',
        is_active: 1,
        is_featured: 1,
        is_bestseller: 1,
        is_new: 0,
        vitrin_order: 5,
        meta_title: 'Dertsiz Leke Tutmaz Duck Keten Kumaş Fiyatları',
        meta_description: 'Su itici 180 cm duck keten masa örtüsü ve minder kumaşları.',
        canonical_url: '/urun/leke-tutmaz-su-itici-desenli-duck-keten-kumas',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-6',
        category_id: 'cat-giyimlik',
        sku: 'BKD-POP-006',
        name: '%100 Organik Pamuk Poplin Gömleklik ve Elbiselik Kumaş',
        slug: '100-organik-pamuk-poplin-gomleklik-elbiselik-kumas',
        short_description: 'Yumuşacık tuşeli, terletmeyen, OEKO-TEX sertifikalı birinci sınıf saf pamuk poplin kumaş.',
        description: 'Yazlık elbiseler, gömlekler, tunikler, pijama takımları ve bebek tekstili için en sağlıklı seçim. %100 saf Ege pamuğundan üretilmiş olup cildi tahriş etmez, terletmez ve hava geçirgenliği maksimum seviyededir.',
        technical_specs: {
          "Kumaş Eni": "150 cm",
          "Gramaj": "130 gr/m²",
          "İçerik": "%100 Taranmış Pamuk",
          "Sertifika": "OEKO-TEX Standard 100",
          "Kullanım": "Gömlek, Elbise, Pijama, Bebek Kıyafetleri"
        },
        base_price: 210.00,
        discount_price: 175.00,
        tax_rate: 20,
        is_meter_sale: 1,
        min_order_meter: 1.0,
        meter_step: 0.5,
        max_order_meter: 50.0,
        stock_meter: 190.0,
        has_variants: 1,
        main_image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
        is_active: 1,
        is_featured: 1,
        is_bestseller: 0,
        is_new: 1,
        vitrin_order: 6,
        meta_title: '%100 Saf Pamuk Poplin Elbiselik Kumaş Metre Fiyatı',
        meta_description: 'Doğal nefes alan pamuk poplin kumaşlar toptan ve perakende metre satışı.',
        canonical_url: '/urun/100-organik-pamuk-poplin-gomleklik-elbiselik-kumas',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    product_variants: [
      { id: 'var-1-antrasit', product_id: 'prod-1', sku: 'BKD-KAD-001-ANT', title: 'Antrasit Gri', price: 295.00, discount_price: 295.00, stock_meter: 65.0, image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80', color_code: '#2D3748', is_active: 1 },
      { id: 'var-1-lacivert', product_id: 'prod-1', sku: 'BKD-KAD-001-LAC', title: 'Gece Mavisi / Lacivert', price: 295.00, discount_price: 295.00, stock_meter: 45.0, image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80', color_code: '#1E3A8A', is_active: 1 },
      { id: 'var-1-zumrut', product_id: 'prod-1', sku: 'BKD-KAD-001-ZUM', title: 'Zümrüt Yeşili', price: 295.00, discount_price: 295.00, stock_meter: 35.0, image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80', color_code: '#065F46', is_active: 1 },
      { id: 'var-1-bordo', product_id: 'prod-1', sku: 'BKD-KAD-001-BOR', title: 'Asil Bordo', price: 295.00, discount_price: 295.00, stock_meter: 35.0, image_url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80', color_code: '#991B1B', is_active: 1 },

      { id: 'var-2-bej', product_id: 'prod-2', sku: 'BKD-BUK-002-BEJ', title: 'Doğal Krem / Bej', price: 365.00, discount_price: 365.00, stock_meter: 50.0, image_url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80', color_code: '#F5F5DC', is_active: 1 },
      { id: 'var-2-vizon', product_id: 'prod-2', sku: 'BKD-BUK-002-VIZ', title: 'Toprak Vizon', price: 365.00, discount_price: 365.00, stock_meter: 40.0, image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80', color_code: '#8C7D70', is_active: 1 },
      { id: 'var-2-ant', product_id: 'prod-2', sku: 'BKD-BUK-002-ANT', title: 'Duman Antrasit', price: 365.00, discount_price: 365.00, stock_meter: 30.0, image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80', color_code: '#2D3748', is_active: 1 },

      { id: 'var-3-krem', product_id: 'prod-3', sku: 'BKD-FON-003-KRM', title: 'Ham Keten Ekru', price: 420.00, discount_price: 420.00, stock_meter: 60.0, image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', color_code: '#F5F5DC', is_active: 1 },
      { id: 'var-3-vizon', product_id: 'prod-3', sku: 'BKD-FON-003-VIZ', title: 'Açık Vizon', price: 420.00, discount_price: 420.00, stock_meter: 40.0, image_url: 'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?auto=format&fit=crop&w=800&q=80', color_code: '#8C7D70', is_active: 1 },

      { id: 'var-4-lacivert', product_id: 'prod-4', sku: 'BKD-BLK-004-LAC', title: 'Blackout Lacivert', price: 390.00, discount_price: 390.00, stock_meter: 40.0, image_url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4b13?auto=format&fit=crop&w=800&q=80', color_code: '#1E3A8A', is_active: 1 },
      { id: 'var-4-antrasit', product_id: 'prod-4', sku: 'BKD-BLK-004-ANT', title: 'Blackout Antrasit', price: 390.00, discount_price: 390.00, stock_meter: 40.0, image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80', color_code: '#2D3748', is_active: 1 },

      { id: 'var-5-cizgi', product_id: 'prod-5', sku: 'BKD-DCK-005-CIZ', title: 'Marin Çizgili Lacivert', price: 195.00, discount_price: 195.00, stock_meter: 90.0, image_url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80', color_code: '#1E3A8A', is_active: 1 },
      { id: 'var-5-duz', product_id: 'prod-5', sku: 'BKD-DCK-005-DUZ', title: 'Doğal Keten Bej Düz', price: 195.00, discount_price: 195.00, stock_meter: 80.0, image_url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80', color_code: '#F5F5DC', is_active: 1 },

      { id: 'var-6-beyaz', product_id: 'prod-6', sku: 'BKD-POP-006-BEY', title: 'Optik Kar Beyazı', price: 175.00, discount_price: 175.00, stock_meter: 70.0, image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80', color_code: '#FFFFFF', is_active: 1 },
      { id: 'var-6-lacivert', product_id: 'prod-6', sku: 'BKD-POP-006-LAC', title: 'Klasik Lacivert', price: 175.00, discount_price: 175.00, stock_meter: 60.0, image_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80', color_code: '#1E3A8A', is_active: 1 }
    ],
    product_images: [
      { id: 'img-1-1', product_id: 'prod-1', image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80', is_main: 1, display_order: 1 },
      { id: 'img-1-2', product_id: 'prod-1', image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80', is_main: 0, display_order: 2 },
      { id: 'img-1-3', product_id: 'prod-1', image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80', is_main: 0, display_order: 3 },
      { id: 'img-2-1', product_id: 'prod-2', image_url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80', is_main: 1, display_order: 1 },
      { id: 'img-3-1', product_id: 'prod-3', image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', is_main: 1, display_order: 1 },
      { id: 'img-4-1', product_id: 'prod-4', image_url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4b13?auto=format&fit=crop&w=800&q=80', is_main: 1, display_order: 1 },
      { id: 'img-5-1', product_id: 'prod-5', image_url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80', is_main: 1, display_order: 1 },
      { id: 'img-6-1', product_id: 'prod-6', image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80', is_main: 1, display_order: 1 }
    ],
    carts: [],
    cart_items: [],
    coupons: [
      { id: 'coup-1', code: 'BURSA10', discount_type: 'percent', discount_value: 10.0, min_order_amount: 500.0, max_discount_amount: 300.0, usage_limit: 500, used_count: 12, per_user_limit: 1, is_active: 1, created_at: new Date().toISOString() },
      { id: 'coup-2', code: 'KUMAS150', discount_type: 'fixed', discount_value: 150.0, min_order_amount: 1200.0, max_discount_amount: 150.0, usage_limit: 200, used_count: 5, per_user_limit: 1, is_active: 1, created_at: new Date().toISOString() },
      { id: 'coup-3', code: 'HOSGELDIN50', discount_type: 'fixed', discount_value: 50.0, min_order_amount: 400.0, max_discount_amount: 50.0, usage_limit: 1000, used_count: 28, per_user_limit: 1, is_active: 1, created_at: new Date().toISOString() }
    ],
    coupon_usages: [],
    cart_discount_rules: [
      { id: 'rule-1', title: '1.500 TL Üzeri Otomatik %10 Sepet İndirimi', min_cart_total: 1500.0, discount_percent: 10.0, discount_fixed: 0.0, is_active: 1, created_at: new Date().toISOString() },
      { id: 'rule-2', title: '3.000 TL Üzeri Ücretsiz Kargo & 200 TL Hediye', min_cart_total: 3000.0, discount_percent: 0.0, discount_fixed: 200.0, is_active: 1, created_at: new Date().toISOString() }
    ],
    orders: [
      {
        id: 'ord-bkd-001',
        order_number: 'BKD-2026-000101',
        user_id: 'user-1',
        is_guest: 0,
        customer_name: 'Ahmet Yılmaz',
        customer_email: 'ahmet.yilmaz@example.com',
        customer_phone: '0532 111 22 33',
        shipping_address: {
          fullName: 'Ahmet Yılmaz',
          phone: '0532 111 22 33',
          city: 'Bursa',
          district: 'Nilüfer',
          addressLine: 'İhsaniye Mah. Barbaros Cad. No:14 D:6',
          postalCode: '16130'
        },
        billing_address: {
          fullName: 'Ahmet Yılmaz',
          phone: '0532 111 22 33',
          city: 'Bursa',
          district: 'Nilüfer',
          addressLine: 'İhsaniye Mah. Barbaros Cad. No:14 D:6'
        },
        subtotal: 2950.00,
        discount_total: 295.00,
        coupon_code: 'BURSA10',
        shipping_total: 0.00,
        tax_total: 531.00,
        grand_total: 2655.00,
        status: 'Kargoya_Verildi',
        payment_status: 'paid',
        payment_method: 'paytr',
        order_notes: 'Lütfen kumaşı 2 parça halinde değil tek parça 10 metre kesiniz.',
        carrier_name: 'DHL Kargo (MNG Kargo)',
        tracking_number: 'YK-98234710293',
        tracking_url: 'https://www.mngkargo.com.tr/gonderitakip?takipNo=YK-98234710293',
        invoice_status: 'created',
        invoice_number: 'EAF2026000000412',
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ord-bkd-002',
        order_number: 'BKD-2026-000102',
        user_id: 'user-2',
        is_guest: 0,
        customer_name: 'Zeynep Kaya',
        customer_email: 'zeynep.kaya@example.com',
        customer_phone: '0544 222 33 44',
        shipping_address: {
          fullName: 'Zeynep Kaya',
          phone: '0544 222 33 44',
          city: 'İstanbul',
          district: 'Kadıköy',
          addressLine: 'Caferağa Mah. Şair Nefi Sok. No:8',
          postalCode: '34710'
        },
        billing_address: {
          fullName: 'Zeynep Kaya',
          phone: '0544 222 33 44',
          city: 'İstanbul',
          district: 'Kadıköy',
          addressLine: 'Caferağa Mah. Şair Nefi Sok. No:8'
        },
        subtotal: 1825.00,
        discount_total: 182.50,
        coupon_code: 'BURSA10',
        shipping_total: 0.00,
        tax_total: 328.50,
        grand_total: 1642.50,
        status: 'Hazirlaniyor',
        payment_status: 'paid',
        payment_method: 'paytr',
        order_notes: 'Atölye teslimatıdır, hafta içi 09:00 - 18:00 arası teslim ediniz.',
        carrier_name: 'DHL Kargo (MNG Kargo)',
        tracking_number: '',
        tracking_url: '',
        invoice_status: 'pending',
        invoice_number: '',
        created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    order_items: [
      {
        id: 'item-1',
        order_id: 'ord-bkd-001',
        product_id: 'prod-1',
        variant_id: 'var-1-antrasit',
        product_name: 'Royal Lüks İtalyan Dokuma Kadife Döşemelik Kumaş',
        variant_title: 'Antrasit Gri',
        product_sku: 'BKD-KAD-001-ANT',
        product_image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
        meter_quantity: 10.0,
        unit_price: 295.0,
        total_price: 2950.0
      },
      {
        id: 'item-2',
        order_id: 'ord-bkd-002',
        product_id: 'prod-2',
        variant_id: 'var-2-bej',
        product_name: 'Tulum Dokulu İskandinav Buklet Döşemelik Kumaş',
        variant_title: 'Doğal Krem / Bej',
        product_sku: 'BKD-BUK-002-BEJ',
        product_image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80',
        meter_quantity: 5.0,
        unit_price: 365.0,
        total_price: 1825.0
      }
    ],
    order_status_history: [
      { id: 'hist-1', order_id: 'ord-bkd-001', old_status: null, new_status: 'Siparis_Alindi', changed_by: 'Sistem (PayTR Webhook)', notes: 'Ödeme PayTR üzerinden 2.655,00 TL olarak başarıyla tahsil edildi.', created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
      { id: 'hist-2', order_id: 'ord-bkd-001', old_status: 'Siparis_Alindi', new_status: 'Hazirlaniyor', changed_by: 'Murat Kesim & Sevkiyat', notes: 'Kumaş kesim masasına alındı, 10.0 metre rulo kontrolü yapıldı.', created_at: new Date(Date.now() - 1.5 * 24 * 3600 * 1000).toISOString() },
      { id: 'hist-3', order_id: 'ord-bkd-001', old_status: 'Hazirlaniyor', new_status: 'Cikti_Alindi', changed_by: 'Murat Kesim & Sevkiyat', notes: 'Sipariş ve kesim fişi A4 yazdırıldı.', created_at: new Date(Date.now() - 1.2 * 24 * 3600 * 1000).toISOString() },
      { id: 'hist-4', order_id: 'ord-bkd-001', old_status: 'Cikti_Alindi', new_status: 'Kargoya_Verildi', changed_by: 'DHL Kargo (MNG Kargo) Entegrasyonu', notes: 'Takip No: YK-98234710293 ile kuryeye teslim edildi.', created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString() },
      
      { id: 'hist-5', order_id: 'ord-bkd-002', old_status: null, new_status: 'Siparis_Alindi', changed_by: 'Sistem (PayTR Webhook)', notes: 'Ödeme PayTR üzerinden 1.642,50 TL tahsil edildi.', created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString() },
      { id: 'hist-6', order_id: 'ord-bkd-002', old_status: 'Siparis_Alindi', new_status: 'Hazirlaniyor', changed_by: 'Murat Kesim & Sevkiyat', notes: '5.0 metre Krem Buklet kesim programına eklendi.', created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString() }
    ],
    payments: [
      { id: 'pay-1', order_id: 'ord-bkd-001', provider: 'paytr', merchant_oid: 'BKD-2026-000101', transaction_id: 'PAYTR-TX-99882211', amount: 2655.00, status: 'success', installment_count: 1, raw_response: '{"status":"success","total_amount":265500,"hash":"verified_ok"}', created_at: new Date().toISOString() },
      { id: 'pay-2', order_id: 'ord-bkd-002', provider: 'paytr', merchant_oid: 'BKD-2026-000102', transaction_id: 'PAYTR-TX-99882212', amount: 1642.50, status: 'success', installment_count: 1, raw_response: '{"status":"success","total_amount":164250,"hash":"verified_ok"}', created_at: new Date().toISOString() }
    ],
    shipping_logs: [
      { id: 'ship-1', order_id: 'ord-bkd-001', carrier: 'Yurtici', request_payload: '{"order":"BKD-2026-000101"}', response_payload: '{"trackingNumber":"YK-98234710293"}', status: 'success', tracking_number: 'YK-98234710293', created_at: new Date().toISOString() }
    ],
    invoice_logs: [
      { id: 'inv-1', order_id: 'ord-bkd-001', provider: 'ParkBulut', request_payload: '{"orderNumber":"BKD-2026-000101"}', response_payload: '{"invoiceNumber":"EAF2026000000412","status":"created"}', invoice_uuid: 'uuid-412', invoice_number: 'EAF2026000000412', status: 'created', created_at: new Date().toISOString() }
    ],
    reviews: [
      { id: 'rev-1', product_id: 'prod-1', user_id: 'user-1', customer_name: 'Ahmet Yılmaz', rating: 5, comment: 'Koltuklarımızı kaplatmak için 10 metre Royal antrasit kadife aldık. Kumaşın dokusu ve kalitesi harika. Su damlatıp denedik hemen süzülüp aktı, döşemecimiz de kumaşı çok beğendi.', is_verified_purchase: 1, is_approved: 1, created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
      { id: 'rev-2', product_id: 'prod-1', user_id: 'user-2', customer_name: 'Zeynep K.', rating: 5, comment: 'Zümrüt yeşili rengi fotoğraftakinden bile daha zengin duruyor. 0.5m adımla tam istediğimiz ölçüde alabilmek büyük kolaylık sağladı, teşekkürler Bursa Kumaş Dünyası.', is_verified_purchase: 1, is_approved: 1, created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
      { id: 'rev-3', product_id: 'prod-3', user_id: 'user-1', customer_name: 'Ahmet Y.', rating: 5, comment: '280 cm çift en olması sayesinde ek dikiş olmadan salonuma harika fon perde dikildi. Keten dökümü mükemmel.', is_verified_purchase: 1, is_approved: 1, created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() }
    ],
    wishlists: [],
    homepage_sections: [
      { id: 'sec-hero', section_key: 'hero_slider', title: 'Bursa Kumaş Dünyası Ana Vitrin', subtitle: 'Doğrudan Dokuma Tezgahından Kapınıza', section_type: 'hero', display_order: 1, is_active: 1, config_json: null, created_at: new Date().toISOString() },
      { id: 'sec-features', section_key: 'advantages_bar', title: 'Neden Bursa Kumaş Dünyası?', subtitle: 'Türkiye Geneli Hızlı Teslimat & Metre Kesim Garantisi', section_type: 'advantages', display_order: 2, is_active: 1, config_json: null, created_at: new Date().toISOString() },
      { id: 'sec-cats', section_key: 'category_grid', title: 'Popüler Kumaş Kategorileri', subtitle: 'Döşemelik, Perdelik, Giyimlik ve Ev Tekstili', section_type: 'categories', display_order: 3, is_active: 1, config_json: null, created_at: new Date().toISOString() },
      { id: 'sec-vitrin', section_key: 'featured_fabrics', 'title': 'Haftanın Öne Çıkan Kumaşları', subtitle: 'Mimarların ve Evini Yenileyenlerin Favori Seçimleri', section_type: 'featured_products', display_order: 4, is_active: 1, config_json: null, created_at: new Date().toISOString() },
      { id: 'sec-best', section_key: 'bestseller_fabrics', title: 'Çok Satan Kumaşlarımız', subtitle: 'Müşterilerimizin En Yüksek Puan Verdiği Dokumalar', section_type: 'bestsellers', display_order: 5, is_active: 1, config_json: null, created_at: new Date().toISOString() },
      { id: 'sec-reviews', section_key: 'customer_testimonials', title: 'Gerçek Müşteri Yorumları', subtitle: 'Binlerce Mutlu Kumaş Severin Deneyimleri', section_type: 'reviews', display_order: 6, is_active: 1, config_json: null, created_at: new Date().toISOString() },
      { id: 'sec-blog', section_key: 'latest_articles', title: 'Kumaş Rehberi & Blog', subtitle: 'Kumaş seçimi, metre hesabı ve bakım önerileri', section_type: 'blog', display_order: 7, is_active: 1, config_json: null, created_at: new Date().toISOString() }
    ],
    homepage_banners: [
      { id: 'ban-1', title: 'İlham Veren Kumaşlar: Viskon, Krep ve Ayrobin Koleksiyonu', subtitle: 'Gömlek, ceket ve şık kışlık tasarımlarınız için tok ve yumuşak dokulu oduncu kumaşlar uygun parça fiyatlarıyla sizi bekliyor.', image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1600&q=85', mobile_image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80', link_url: '/kategori/tum-kumaslar', button_text: 'Ürünleri İnceleyin', display_order: 1, is_active: 1, created_at: new Date().toISOString() },
    ],
    blog_posts: [
      {
        id: 'blog-1',
        title: 'Koltuk Döşemelik Kumaş Seçerken Dikkat Edilmesi Gereken 7 Altın Kural',
        slug: 'koltuk-dosemelik-kumas-secerken-dikkat-edilmesi-gereken-7-altin-kural',
        summary: 'Eviniz için en doğru döşemelik kumaşı seçmek; dayanıklılık, leke tutmazlık, evcil hayvan uyumu ve doku dengesi gerektirir. İşte uzman rehberi.',
        content: `## Koltuk Döşemelik Kumaş Seçim Rehberi\n\nEvinizin en çok kullanılan mobilyası olan koltukların kumaşını yenilerken dikkat etmeniz gereken en önemli kriterler şunlardır:\n\n### 1. Martindale Aşınma Dayanımı\nDöşemelik kumaşlarda sürtünme testi (Martindale) en az 30.000 rubs olmalıdır. Yoğun kullanılan oturma odaları için 50.000+ Martindale kadife ve şönil kumaşları tercih etmelisiniz.\n\n### 2. Su İticilik ve Leke Tutmaz Nano Apre\nSıvı döküldüğünde içine çekmeyen, yüzeyde boncuklaşan kumaşlar özellikle çocuklu ve evcil hayvanlı aileler için vazgeçilmezdir.\n\n### 3. Pet-Friendly (Evcil Hayvan Dostu) Sık Dokuma\nKedili ve köpekli evlerde tırnak takılmasını engelleyen tulum kadife ve sık dokuma nubuk kumaşlar önerilir.\n\n### 4. Renk ve Işık Uyumu\nGüneş alan salonlarda solmaya karşı UV dirençli kumaşlar seçilmeli, küçük mekanlarda açık bej ve vizon tonları tercih edilmelidir.\n\nBursa Kumaş Dünyası olarak tüm döşemelik kumaşlarımızı metre bazında 0.5m adımlarla doğrudan üreticiden kapınıza ulaştırıyoruz.`,
        cover_image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1200&q=80',
        author: 'Bursa Kumaş Dünyası Tekstil Mimarı',
        category: 'Döşemelik Rehberi',
        tags: 'Döşemelik Kumaş, Kadife, Koltuk Kaplama, Leke Tutmaz',
        meta_title: 'Koltuk Döşemelik Kumaş Seçimi 7 Kural - Bursa Kumaş Dünyası',
        meta_description: 'Koltuk kaplama kumaşı seçerken nelere dikkat edilmeli? Martindale testi, su iticilik, evcil hayvan uyumu ve kumaş metre hesabı.',
        is_published: 1,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'blog-2',
        title: 'Fon Perde Metre Hesabı Nasıl Yapılır? Adım Adım Ölçü Alma Rehberi',
        slug: 'fon-perde-metre-hesabi-nasil-yapilir',
        summary: 'Pencereleriniz için fon perde diktirirken ne kadar kumaşa ihtiyacınız olduğunu 280 cm çift en ve pile sıklığına göre nasıl hesaplayacağınızı öğrenin.',
        content: `## Fon Perde Metre Hesabı Nasıl Yapılır?\n\nFon perde dikiminde en kritik konu, kumaşın eni ve istenen pile oranıdır:\n\n### Çift En (280 cm) Kumaş Avantajı\nEğer tavan yüksekliğiniz 260 - 270 cm arasındaysa, 280 cm enindeki kumaş tek parça olarak boydan kullanılır. Böylece sadece pencere genişliğiniz kadar kumaş metresi almanız yeterli olur!\n\n### Pile Oranlarına Göre Hesaplama:\n- **1/2 Seyrek Pile**: Pencere eni x 2 metre kumaş\n- **1/2.5 Normal Pile**: Pencere eni x 2.5 metre kumaş\n- **1/3 Sık (Kanun) Pile**: Pencere eni x 3 metre kumaş\n\nÖrnek: 1 metrelik tek kanat fon için 1/2.5 pilede tam 2.5 metre kumaş almanız gerekmektedir.`,
        cover_image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
        author: 'Perde & Dekorasyon Uzmanı',
        category: 'Perdelik Rehberi',
        tags: 'Fon Perde, Metre Hesabı, 280 cm Çift En, Perdelik Kumaş',
        meta_title: 'Fon Perde Kumaş Metre Hesabı Nasıl Yapılır? - Bursa Kumaş Dünyası',
        meta_description: 'Fon perde için kaç metre kumaş gider? 280 cm çift en avantajı, pile oranları ve doğru pencere ölçüsü alma formülü.',
        is_published: 1,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ],
    audit_logs: [
      { id: 'audit-1', admin_id: 'admin-1', admin_email: 'admin@bursakumasdunyasi.com', action: 'SYSTEM_INIT', details: 'Sistem ilk kurulum ve kumaş katalogları başarıyla yüklendi.', ip_address: '127.0.0.1', created_at: new Date().toISOString() }
    ],
    email_logs: [
      { id: 'em-1', recipient_email: 'ahmet.yilmaz@example.com', subject: 'Bursa Kumaş Dünyası – Siparişiniz Kargoya Verildi (#BKD-2026-000101)', template_type: 'ORDER_SHIPPED', status: 'sent', error_message: null, created_at: new Date().toISOString() }
    ],
    sms_logs: [
      { id: 'sms-1', phone_number: '0532 111 22 33', message_content: 'Bursa Kumaş Dünyası: #BKD-2026-000101 nolu kumaş siparişiniz DHL Kargo (MNG Kargo) (YK-98234710293) ile kargoya verilmiştir.', provider: 'Netgsm', status: 'sent', created_at: new Date().toISOString() }
    ]
  };

  dbRepo.write(initialSeed);
}
