import { dbRepo } from '../db/repo';

export interface BankAccount {
  id: string;
  bank_name: string;
  account_holder: string;
  iban: string;
  branch_code?: string;
  account_number?: string;
  is_active: number;
}

export interface PaymentSettings {
  paytr: {
    is_active: number;
    title: string;
    description: string;
    merchant_id: string;
    merchant_key: string;
    merchant_salt: string;
    test_mode: number;
    max_installment: number;
  };
  bank_transfer: {
    is_active: number;
    title: string;
    description: string;
    discount_percentage: number;
    accounts: BankAccount[];
  };
  cash_on_delivery: {
    is_active: number;
    title: string;
    description: string;
    additional_fee: number;
  };
  card_on_delivery: {
    is_active: number;
    title: string;
    description: string;
    additional_fee: number;
  };
}

export const defaultPaymentSettings: PaymentSettings = {
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
};

export function getPaymentSettings(): PaymentSettings {
  const db = dbRepo.read();
  if (!db.payment_settings) {
    return defaultPaymentSettings;
  }
  return {
    paytr: { ...defaultPaymentSettings.paytr, ...db.payment_settings.paytr },
    bank_transfer: {
      ...defaultPaymentSettings.bank_transfer,
      ...db.payment_settings.bank_transfer,
      accounts: db.payment_settings.bank_transfer?.accounts || defaultPaymentSettings.bank_transfer.accounts,
    },
    cash_on_delivery: { ...defaultPaymentSettings.cash_on_delivery, ...db.payment_settings.cash_on_delivery },
    card_on_delivery: { ...defaultPaymentSettings.card_on_delivery, ...db.payment_settings.card_on_delivery },
  };
}

export function getPublicPaymentSettings() {
  const settings = getPaymentSettings();
  return {
    paytr: {
      is_active: settings.paytr.is_active,
      title: settings.paytr.title,
      description: settings.paytr.description,
      test_mode: settings.paytr.test_mode,
      max_installment: settings.paytr.max_installment,
    },
    bank_transfer: {
      is_active: settings.bank_transfer.is_active,
      title: settings.bank_transfer.title,
      description: settings.bank_transfer.description,
      discount_percentage: settings.bank_transfer.discount_percentage,
      accounts: (settings.bank_transfer.accounts || []).filter((a) => a.is_active === 1),
    },
    cash_on_delivery: {
      is_active: settings.cash_on_delivery.is_active,
      title: settings.cash_on_delivery.title,
      description: settings.cash_on_delivery.description,
      additional_fee: settings.cash_on_delivery.additional_fee,
    },
    card_on_delivery: {
      is_active: settings.card_on_delivery.is_active,
      title: settings.card_on_delivery.title,
      description: settings.card_on_delivery.description,
      additional_fee: settings.card_on_delivery.additional_fee,
    },
  };
}

export function updatePaymentSettings(updates: Partial<PaymentSettings>): PaymentSettings {
  const current = getPaymentSettings();
  const merged: PaymentSettings = {
    paytr: { ...current.paytr, ...(updates.paytr || {}) },
    bank_transfer: {
      ...current.bank_transfer,
      ...(updates.bank_transfer || {}),
      accounts: updates.bank_transfer?.accounts !== undefined ? updates.bank_transfer.accounts : current.bank_transfer.accounts,
    },
    cash_on_delivery: { ...current.cash_on_delivery, ...(updates.cash_on_delivery || {}) },
    card_on_delivery: { ...current.card_on_delivery, ...(updates.card_on_delivery || {}) },
  };

  const db = dbRepo.read();
  db.payment_settings = merged;
  dbRepo.write(db);
  return merged;
}

export function calculatePaymentAdjustments({
  subtotal,
  couponDiscount,
  paymentMethod,
}: {
  subtotal: number;
  couponDiscount: number;
  paymentMethod: string;
}) {
  const settings = getPaymentSettings();
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  
  let paymentFee = 0;
  let paymentDiscount = 0;

  if (paymentMethod === 'cash_on_delivery' && settings.cash_on_delivery.is_active) {
    paymentFee = Number(settings.cash_on_delivery.additional_fee) || 0;
  } else if (paymentMethod === 'card_on_delivery' && settings.card_on_delivery.is_active) {
    paymentFee = Number(settings.card_on_delivery.additional_fee) || 0;
  } else if (paymentMethod === 'bank_transfer' && settings.bank_transfer.is_active) {
    const rate = Number(settings.bank_transfer.discount_percentage) || 0;
    if (rate > 0) {
      paymentDiscount = Number(((discountedSubtotal * rate) / 100).toFixed(2));
    }
  }

  return {
    paymentFee: Number(paymentFee.toFixed(2)),
    paymentDiscount: Number(paymentDiscount.toFixed(2)),
  };
}
