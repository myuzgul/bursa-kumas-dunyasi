import { readDb, writeDb } from '../db/repo';

export interface ShippingSettings {
  free_shipping_threshold: number; // e.g. 1000. If 0, all orders have free shipping!
  shipping_cost: number; // e.g. 79.90
  carrier_name: string; // e.g. 'DHL Kargo'
  announcement_text?: string;
  is_active: number;
  
  // DHL Kargo (DHL eCommerce Turkey) Integration Fields
  dhl_integration_active?: number; // 1 = Active, 0 = Passive
  dhl_test_mode?: number; // 1 = Test Sandbox, 0 = Live Production
  dhl_customer_code?: string; // DHL / MNG Cari Müşteri No
  dhl_api_key?: string; // DHL API Client Key / App ID
  dhl_api_secret?: string; // DHL API Secret / Password
  dhl_branch_code?: string; // Gönderici Şube Kodu
  dhl_sender_name?: string; // Bursa Kumaş Dünyası
  dhl_sender_phone?: string; // 0 (542) 393 98 16
  dhl_sender_address?: string; // Kazım Karabekir Mah. Yıldırım / BURSA
  dhl_auto_generate_label?: number; // 1 = Auto generate on print/order
  
  updated_at?: string;
}

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  free_shipping_threshold: 1000,
  shipping_cost: 79.90,
  carrier_name: 'DHL Kargo',
  announcement_text: '1.000 TL Üzeri Ücretsiz Kargo',
  is_active: 1,
  dhl_integration_active: 1,
  dhl_test_mode: 0,
  dhl_customer_code: '',
  dhl_api_key: '',
  dhl_api_secret: '',
  dhl_branch_code: '',
  dhl_sender_name: 'Bursa Kumaş Dünyası',
  dhl_sender_phone: '0 (542) 393 98 16',
  dhl_sender_address: 'Kazım Karabekir Mah. Yıldırım / BURSA',
  dhl_auto_generate_label: 1,
};

export function getShippingSettings(): ShippingSettings {
  try {
    const db = readDb();
    if (!db.shipping_settings) {
      db.shipping_settings = { ...DEFAULT_SHIPPING_SETTINGS };
      writeDb(db);
    }
    return db.shipping_settings;
  } catch (e) {
    return DEFAULT_SHIPPING_SETTINGS;
  }
}

export function calculateShippingFee(subtotal: number): {
  fee: number;
  isFree: boolean;
  threshold: number;
  remainingForFree: number;
  carrierName: string;
} {
  const settings = getShippingSettings();
  const threshold = Number(settings.free_shipping_threshold) || 0;
  const cost = Number(settings.shipping_cost) || 79.90;
  const carrierName = settings.carrier_name || 'DHL Kargo (MNG Kargo)';

  if (threshold === 0 || subtotal >= threshold) {
    return {
      fee: 0,
      isFree: true,
      threshold,
      remainingForFree: 0,
      carrierName,
    };
  }

  return {
    fee: cost,
    isFree: false,
    threshold,
    remainingForFree: Math.max(0, Number((threshold - subtotal).toFixed(2))),
    carrierName,
  };
}
