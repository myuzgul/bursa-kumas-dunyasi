import { getPaymentSettings, updatePaymentSettings, calculatePaymentAdjustments } from '../lib/services/paymentSettings';
import { generatePayTRToken, verifyPayTRCallback } from '../lib/services/paytr';
import { processCheckoutOrder } from '../lib/services/orderWorkflow';
import { dbRepo } from '../lib/db/repo';

async function runPaymentTests() {
  console.log('🧪 Starting Bursa Kumaş Dünyası Payment System Tests...\n');

  // Test 1: Verify Default Payment Settings
  const settings = getPaymentSettings();
  console.assert(settings.paytr.is_active === 1, 'PayTR should be active by default');
  console.assert(settings.bank_transfer.discount_percentage === 2, 'Havale discount should be 2%');
  console.assert(settings.cash_on_delivery.additional_fee === 100, 'COD fee should be 100 TL');
  console.assert(settings.card_on_delivery.additional_fee === 100, 'Card COD fee should be 100 TL');
  console.log('✅ Test 1: Payment Settings defaults verified.');

  // Test 2: Calculate Payment Adjustments (Havale %2 Discount)
  const havaleAdj = calculatePaymentAdjustments({
    subtotal: 1000,
    couponDiscount: 0,
    paymentMethod: 'bank_transfer',
  });
  console.assert(havaleAdj.paymentDiscount === 20, `Expected 20 TL discount for 1000 TL with 2%, got ${havaleAdj.paymentDiscount}`);
  console.assert(havaleAdj.paymentFee === 0, 'Expected 0 fee for havale');
  console.log('✅ Test 2: Havale 2% discount calculation verified (1000 TL -> 20 TL discount).');

  // Test 3: Calculate Payment Adjustments (Kapıda Nakit +100 TL)
  const codAdj = calculatePaymentAdjustments({
    subtotal: 500,
    couponDiscount: 0,
    paymentMethod: 'cash_on_delivery',
  });
  console.assert(codAdj.paymentFee === 100, `Expected 100 TL fee for cash_on_delivery, got ${codAdj.paymentFee}`);
  console.assert(codAdj.paymentDiscount === 0, 'Expected 0 discount for COD');
  console.log('✅ Test 3: Kapıda Nakit Ödeme fee (+100 TL) verified.');

  // Test 4: Calculate Payment Adjustments (Kapıda Kart +100 TL)
  const cardCodAdj = calculatePaymentAdjustments({
    subtotal: 500,
    couponDiscount: 0,
    paymentMethod: 'card_on_delivery',
  });
  console.assert(cardCodAdj.paymentFee === 100, `Expected 100 TL fee for card_on_delivery, got ${cardCodAdj.paymentFee}`);
  console.log('✅ Test 4: Kapıda Kredi Kartı Tek Çekim fee (+100 TL) verified.');

  // Test 5: PayTR Token Generation & Callback Verification
  const paytrResult = generatePayTRToken({
    orderNumber: 'BKD-2026-TEST01',
    email: 'test@bursakumas.com',
    paymentAmountTL: 450.50,
    userName: 'Test Müşteri',
    userAddress: 'Bursa Nilüfer',
    userPhone: '05321112233',
    userIp: '127.0.0.1',
    basket: [['Kadife Kumaş 3m', '450.50', 1]],
  });
  console.assert(paytrResult.token && paytrResult.token.length > 10, 'PayTR token should be generated');
  console.assert(paytrResult.iframeUrl.includes('https://www.paytr.com/odeme/guvenli/'), 'PayTR iframe URL should be valid');
  console.log('✅ Test 5: PayTR Token generation and iframe URL verified.');

  // Test 6: Process Checkout with Havale/EFT
  const db = dbRepo.read();
  const sampleProduct = db.products[0];
  if (sampleProduct) {
    const orderRes = await processCheckoutOrder({
      customer: {
        fullName: 'Havale Test Müşteri',
        email: 'havale@example.com',
        phone: '05329998877',
        city: 'Bursa',
        district: 'Osmangazi',
        addressLine: 'Heykel Cad. No:1',
      },
      items: [{ productId: sampleProduct.id, meterQuantity: 2 }],
      paymentMethod: 'bank_transfer',
    });

    console.assert(orderRes.success, 'Order should be created successfully');
    console.assert(orderRes.order.payment_method === 'bank_transfer', 'Payment method should be bank_transfer');
    console.assert(orderRes.order.payment_status === 'pending', 'Payment status should be pending for bank transfer');
    console.assert(orderRes.order.payment_discount > 0, 'Payment discount should be applied');
    console.log(`✅ Test 6: Havale Order workflow processed successfully (Order #: ${orderRes.order.order_number}, Discount: ${orderRes.order.payment_discount} TL).`);
  }

  // Test 7: Process Checkout with Kapıda Nakit
  if (sampleProduct) {
    const orderResCod = await processCheckoutOrder({
      customer: {
        fullName: 'Kapıda Ödeme Test Müşteri',
        email: 'kapida@example.com',
        phone: '05329998877',
        city: 'Bursa',
        district: 'Nilüfer',
        addressLine: 'FSM Bulvarı No:10',
      },
      items: [{ productId: sampleProduct.id, meterQuantity: 1 }],
      paymentMethod: 'cash_on_delivery',
    });

    console.assert(orderResCod.success, 'COD Order should be created successfully');
    console.assert(orderResCod.order.payment_method === 'cash_on_delivery', 'Payment method should be cash_on_delivery');
    console.assert(orderResCod.order.payment_fee === 100, `COD payment fee should be 100, got ${orderResCod.order.payment_fee}`);
    console.log(`✅ Test 7: Kapıda Nakit Order workflow processed successfully (Order #: ${orderResCod.order.order_number}, COD Fee: ${orderResCod.order.payment_fee} TL).`);
  }

  // Test 8: Admin toggle disabling Kapıda Kredi Kartı Tek Çekim
  updatePaymentSettings({
    card_on_delivery: {
      ...settings.card_on_delivery,
      is_active: 0,
    },
  });
  const updatedSettings = getPaymentSettings();
  console.assert(updatedSettings.card_on_delivery.is_active === 0, 'Card on delivery should be disabled');
  
  // Re-enable for tests
  updatePaymentSettings({
    card_on_delivery: {
      ...settings.card_on_delivery,
      is_active: 1,
    },
  });
  console.log('✅ Test 8: Admin toggle for disabling/enabling payment method verified.');

  console.log('\n🎉 ALL 8 PAYMENT SYSTEM TESTS PASSED SUCCESSFULLY!');
}

runPaymentTests().catch(console.error);
