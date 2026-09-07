import crypto from 'crypto';
import { getPaymentSettings } from './paymentSettings';

export interface PayTRTokenRequest {
  orderNumber: string;
  email: string;
  paymentAmountTL: number;
  userName: string;
  userAddress: string;
  userPhone: string;
  userIp: string;
  basket: Array<[string, string, number]>; // [name, price, quantity]
  successUrl?: string;
  failUrl?: string;
}

export function getPayTRConfig() {
  const settings = getPaymentSettings();
  const paytr = settings.paytr || {};
  return {
    merchantId: paytr.merchant_id || process.env.PAYTR_MERCHANT_ID || '123456',
    merchantKey: paytr.merchant_key || process.env.PAYTR_MERCHANT_KEY || 'test_merchant_key_2026',
    merchantSalt: paytr.merchant_salt || process.env.PAYTR_MERCHANT_SALT || 'test_merchant_salt_2026',
    isTest: Number(paytr.test_mode) === 1 || process.env.PAYTR_TEST_MODE !== 'false',
    maxInstallment: paytr.max_installment || 12,
    isActive: Number(paytr.is_active) === 1,
  };
}

export function generatePayTRToken(params: PayTRTokenRequest): { token: string; iframeUrl: string } {
  const config = getPayTRConfig();
  const paymentAmountKurus = Math.round(params.paymentAmountTL * 100);
  const userBasket = Buffer.from(JSON.stringify(params.basket)).toString('base64');
  const merchantOid = params.orderNumber;
  const noInstallment = '0';
  const maxInstallment = String(config.maxInstallment || 12);
  const currency = 'TL';
  const testMode = config.isTest ? '1' : '0';

  // PayTR Hash Token logic: merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode + merchant_salt
  const hashStr = `${config.merchantId}${params.userIp}${merchantOid}${params.email}${paymentAmountKurus}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}${config.merchantSalt}`;
  const paytrToken = crypto
    .createHmac('sha256', config.merchantKey)
    .update(hashStr)
    .digest('base64');

  return {
    token: paytrToken,
    iframeUrl: `https://www.paytr.com/odeme/guvenli/${paytrToken}`,
  };
}

export function verifyPayTRCallback(postBody: {
  merchant_oid: string;
  status: string;
  total_amount: string;
  hash: string;
}): boolean {
  const config = getPayTRConfig();
  // PayTR callback verification: merchant_oid + merchant_salt + status + total_amount
  const hashStr = `${postBody.merchant_oid}${config.merchantSalt}${postBody.status}${postBody.total_amount}`;
  const expectedHash = crypto
    .createHmac('sha256', config.merchantKey)
    .update(hashStr)
    .digest('base64');

  return expectedHash === postBody.hash;
}
