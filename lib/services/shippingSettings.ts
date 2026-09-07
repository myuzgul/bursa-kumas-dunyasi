import { readDb, writeDb } from '../db/repo';

export interface ShippingSettings {
  free_shipping_threshold: number; // e.g. 1000. If 0, all orders have free shipping!
  shipping_cost: number; // e.g. 79.90
  carrier_name: string; // e.g. 'Yurtiçi Kargo'
  announcement_text?: string;
  is_active: number;
  updated_at?: string;
}

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  free_shipping_threshold: 1000,
  shipping_cost: 79.90,
  carrier_name: 'DHL Kargo (MNG Kargo)',
  announcement_text: '1.000 TL Üzeri Ücretsiz Kargo',
  is_active: 1,
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
