import fs from 'fs';
import path from 'path';

export interface DatabaseData {
  admin_roles: any[];
  admin_users: any[];
  users: any[];
  user_addresses: any[];
  categories: any[];
  attributes: any[];
  attribute_values: any[];
  products: any[];
  product_variants: any[];
  product_images: any[];
  carts: any[];
  cart_items: any[];
  coupons: any[];
  coupon_usages: any[];
  cart_discount_rules: any[];
  orders: any[];
  order_items: any[];
  order_status_history: any[];
  payments: any[];
  shipping_logs: any[];
  invoice_logs: any[];
  reviews: any[];
  wishlists: any[];
  homepage_sections: any[];
  homepage_banners: any[];
  blog_posts: any[];
  audit_logs: any[];
  email_logs: any[];
  sms_logs: any[];
  user_sessions?: any[];
  user_notifications?: any[];
  security_logs?: any[];
  navigation_menus?: any[];
  product_badges?: any[];
  stock_history?: any[];
  price_history?: any[];
  tracking_settings?: any;
  shipping_settings?: any;
  payment_settings?: any;
  showcase_settings?: any;
  invoice_settings?: any;
  stories?: any[];
}

const DB_FILE = path.join(process.cwd(), 'data', 'bursakumas_db.json');

const initialData: DatabaseData = {
  admin_roles: [],
  admin_users: [],
  users: [],
  user_addresses: [],
  categories: [],
  attributes: [],
  attribute_values: [],
  products: [],
  product_variants: [],
  product_images: [],
  carts: [],
  cart_items: [],
  coupons: [],
  coupon_usages: [],
  cart_discount_rules: [],
  orders: [],
  order_items: [],
  order_status_history: [],
  payments: [],
  shipping_logs: [],
  invoice_logs: [],
  reviews: [],
  wishlists: [],
  homepage_sections: [],
  homepage_banners: [],
  blog_posts: [],
  audit_logs: [],
  email_logs: [],
  sms_logs: [],
  navigation_menus: [],
  product_badges: [],
  stock_history: [],
  price_history: [],
  stories: [
    {
      id: 'story-1',
      title: 'Yeni Sezon',
      cover_image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
      order_index: 1,
      is_active: 1,
      slides: [
        {
          id: 'slide-1-1',
          image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=85',
          title: '2026 Jakarlı Kadife Koleksiyonu',
          subtitle: 'İtalyan dokuma kalitesi ve leke tutmaz su itici teknoloji.',
          button_text: 'Kadife Kumaşları İncele',
          button_link: '/kategori/kadife-dosemelik-kumas',
          duration: 5,
        },
        {
          id: 'slide-1-2',
          image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=85',
          title: 'Zümrüt Yeşili & Asil Bordo',
          subtitle: 'Koltuk ve berjerleriniz için sezonun en trend renk tonları.',
          button_text: 'Tüm Renkleri Gör',
          button_link: '/kategori/kadife-dosemelik-kumas',
          duration: 5,
        },
      ],
    },
    {
      id: 'story-2',
      title: 'Çift En Fonluk',
      cover_image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
      order_index: 2,
      is_active: 1,
      slides: [
        {
          id: 'slide-2-1',
          image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=85',
          title: '280 cm Ekstra Geniş En',
          subtitle: 'Ek dikişsiz dökümlü keten fon perdeler.',
          button_text: 'Fonluk Kumaşları İncele',
          button_link: '/kategori/fon-perdelik-kumaslar',
          duration: 5,
        },
        {
          id: 'slide-2-2',
          image_url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?auto=format&fit=crop&w=1000&q=85',
          title: 'Işık Geçirmez Karartma Blackout',
          subtitle: 'Yatak odası ve salonlar için %100 karartma kumaşlar.',
          button_text: 'Modelleri Keşfet',
          button_link: '/kategori/fon-perdelik-kumaslar',
          duration: 5,
        },
      ],
    },
    {
      id: 'story-3',
      title: 'Masa & Duck',
      cover_image: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=600&q=80',
      order_index: 3,
      is_active: 1,
      slides: [
        {
          id: 'slide-3-1',
          image_url: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1000&q=85',
          title: 'Leke Tutmaz Duck Keten',
          subtitle: 'Masa örtüsü, minder ve runner için su geçirmez kumaşlar.',
          button_text: 'Duck Ketenleri Gör',
          button_link: '/kategori/masa-ortusu-duck-keten',
          duration: 5,
        },
      ],
    },
    {
      id: 'story-4',
      title: '0.5m Kesim',
      cover_image: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=600&q=80',
      order_index: 4,
      is_active: 1,
      slides: [
        {
          id: 'slide-4-1',
          image_url: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1000&q=85',
          title: 'Hassas 0.5 Metre Kesim Sistemi',
          subtitle: 'İsraf etmeden tam ihtiyacınız olan ölçüde kumaş siparişi verin.',
          button_text: 'Kumaşları Keşfet',
          button_link: '/',
          duration: 5,
        },
      ],
    },
    {
      id: 'story-5',
      title: 'Bursa Dokuması',
      cover_image: 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=600&q=80',
      order_index: 5,
      is_active: 1,
      slides: [
        {
          id: 'slide-5-1',
          image_url: 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=1000&q=85',
          title: 'Bursa Tekstil Başkentinden',
          subtitle: 'Doğrudan dokuma tezgahından birinci el fabrika fiyatlarıyla kapınızda.',
          button_text: 'Hakkımızda',
          button_link: '/kurumsal/hakkimizda',
          duration: 5,
        },
      ],
    },
  ],
  tracking_settings: {
    meta_pixel_id: '123456789012345',
    meta_capi_token: 'EAAG...',
    meta_test_code: '',
    ga4_measurement_id: 'G-BKD2026XYZ',
    gtm_id: 'GTM-BKD2026',
    google_ads_conversion_id: 'AW-123456789',
    google_ads_conversion_label: 'AbCdEfGhIjKlMnOpQrSt',
    is_active: 1,
  },
  shipping_settings: {
    free_shipping_threshold: 1000,
    shipping_cost: 79.90,
    carrier_name: 'DHL Kargo (MNG Kargo)',
    announcement_text: '1.000 TL Üzeri Ücretsiz Kargo',
    is_active: 1,
  },
  showcase_settings: {
    title: 'Öne Çıkan Kumaşlarımız',
    subtitle: '',
    badge_suffix: 'Kumaş',
    show_model_count: 1,
    show_all_tab: 1,
    all_tab_title: 'Tümü',
    max_items: 24,
    is_active: 1,
  },
  payment_settings: {
    paytr: {
      is_active: 1,
      title: 'Kredi / Banka Kartı (PayTR)',
      description: 'Tüm banka ve kredi kartları ile 256-Bit SSL güvenliğinde tek çekim veya taksitle ödeme yapabilirsiniz.',
      merchant_id: '123456',
      merchant_key: 'test_merchant_key_2026',
      merchant_salt: 'test_merchant_salt_2026',
      test_mode: 1,
      max_installment: 12,
    },
    bank_transfer: {
      is_active: 1,
      title: 'Havale / EFT İle Ödeme',
      description: 'Banka hesaplarımıza Havale/EFT yaparak anında indirimli ödeme yapabilirsiniz.',
      discount_percentage: 2,
      accounts: [
        {
          id: 'bank-1',
          bank_name: 'Garanti BBVA',
          account_holder: 'Bursa Kumaş Dünyası Tekstil Tic. Ltd. Şti.',
          iban: 'TR12 0006 2000 0001 2345 6789 01',
          branch_code: '0123',
          account_number: '1234567',
          is_active: 1,
        },
        {
          id: 'bank-2',
          bank_name: 'Ziraat Bankası',
          account_holder: 'Bursa Kumaş Dünyası Tekstil Tic. Ltd. Şti.',
          iban: 'TR34 0001 0000 0009 8765 4321 02',
          branch_code: '0456',
          account_number: '7654321',
          is_active: 1,
        },
        {
          id: 'bank-3',
          bank_name: 'İş Bankası',
          account_holder: 'Bursa Kumaş Dünyası Tekstil Tic. Ltd. Şti.',
          iban: 'TR56 0006 4000 0003 4567 8901 03',
          branch_code: '0789',
          account_number: '9876543',
          is_active: 1,
        },
      ],
    },
    cash_on_delivery: {
      is_active: 1,
      title: 'Kapıda Nakit Ödeme',
      description: 'Siparişiniz kargo görevlisi tarafından teslim edilirken nakit olarak ödeme yapabilirsiniz.',
      additional_fee: 100,
    },
    card_on_delivery: {
      is_active: 1,
      title: 'Kapıda Kredi Kartı Tek Çekim',
      description: 'Sipariş teslimatı esnasında kargo görevlisinin POS cihazından kredi kartı ile tek çekim ödeme yapabilirsiniz.',
      additional_fee: 100,
    },
  },
  invoice_settings: {
    is_active: 1,
    is_test_mode: 0,
    is_auto_invoice: 1,
    parkbulut_api_url: 'https://api.parkbulut.com',
    parkbulut_username: '',
    parkbulut_password: '',
    parkbulut_company_code: '',
    series_prefix_efatura: 'EFB',
    series_prefix_earsiv: 'EAF',
    sender_title: 'Bursa Kumaş Dünyası Tekstil Tic. Ltd. Şti.',
    sender_tax_number: '1234567890',
    sender_tax_office: 'Yıldırım Vergi Dairesi',
    sender_address: 'İhsaniye Mah. Barbaros Cad. No:14 Nilüfer / Bursa',
    sender_email: 'fatura@bursakumasdunyasi.com',
    sender_phone: '05423939816',
    default_vat_rate: 10,
  },
};

// Ensure data folder and file exist
function getDbPath(): string {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
  return DB_FILE;
}

export function readDb(): DatabaseData {
  const file = getDbPath();
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return initialData;
  }
}

export function writeDb(data: DatabaseData): void {
  const file = getDbPath();
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // Retry once
    try {
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }
}

// Atomic transaction helper
export function transaction<T>(callback: (db: DatabaseData) => { data: DatabaseData; result: T }): T {
  const currentDb = readDb();
  const { data: updatedDb, result } = callback(currentDb);
  writeDb(updatedDb);
  return result;
}

export const dbRepo = {
  read: readDb,
  write: writeDb,
  transaction,
};
