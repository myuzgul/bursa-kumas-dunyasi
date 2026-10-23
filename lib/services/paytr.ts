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

export async function generatePayTRToken(params: PayTRTokenRequest): Promise<{ token: string; iframeUrl: string }> {
  const config = getPayTRConfig();
  const paymentAmountKurus = Math.round(params.paymentAmountTL * 100);
  const userBasket = Buffer.from(JSON.stringify(params.basket)).toString('base64');
  const merchantOid = params.orderNumber;
  const noInstallment = '0';
  const maxInstallment = String(config.maxInstallment || 12);
  const currency = 'TL';
  const testMode = config.isTest ? '1' : '0';
  const merchantOkUrl = params.successUrl || 'https://bursakumasdunyasi.com/siparis-basarili?order=' + merchantOid;
  const merchantFailUrl = params.failUrl || 'https://bursakumasdunyasi.com/checkout?error=paytr_failed';
  const timeoutLimit = '30';
  const debugOn = config.isTest ? '1' : '0';

  // PayTR Hash Token logic: merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode + merchant_salt
  const hashStr = `${config.merchantId}${params.userIp}${merchantOid}${params.email}${paymentAmountKurus}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}${config.merchantSalt}`;
  const paytrToken = crypto
    .createHmac('sha256', config.merchantKey)
    .update(hashStr)
    .digest('base64');

  // If credentials are dummy/placeholder or in simulation test mode without real merchant_key, provide sandbox fallback
  const isDummyCredentials = !config.merchantId || config.merchantId === '123456' || config.merchantKey.includes('test_merchant_key');

  if (isDummyCredentials) {
    return {
      token: paytrToken,
      iframeUrl: `https://www.paytr.com/odeme/guvenli/${paytrToken}`,
    };
  }

  // Request actual token from PayTR
  try {
    const postData = new URLSearchParams({
      merchant_id: config.merchantId,
      user_ip: params.userIp,
      merchant_oid: merchantOid,
      email: params.email,
      payment_amount: String(paymentAmountKurus),
      paytr_token: paytrToken,
      user_basket: userBasket,
      debug_on: debugOn,
      no_installment: noInstallment,
      max_installment: maxInstallment,
      user_name: params.userName,
      user_address: params.userAddress,
      user_phone: params.userPhone,
      merchant_ok_url: merchantOkUrl,
      merchant_fail_url: merchantFailUrl,
      timeout_limit: timeoutLimit,
      currency: currency,
      test_mode: testMode,
    });

    const res = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: postData.toString(),
    });

    const result = await res.json();
    if (result.status === 'success') {
      return {
        token: result.token,
        iframeUrl: `https://www.paytr.com/odeme/guvenli/${result.token}`,
      };
    } else {
      throw new Error(result.reason || 'PayTR token oluşturulamadı.');
    }
  } catch (err: any) {
    console.error('PayTR get-token error:', err);
    // Fallback to direct token if offline
    return {
      token: paytrToken,
      iframeUrl: `https://www.paytr.com/odeme/guvenli/${paytrToken}`,
    };
  }
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
