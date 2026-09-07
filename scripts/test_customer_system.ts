import { readDb, writeDb } from '../lib/db/repo';
import { hashPassword, verifyPassword, generateSecureToken, hashToken } from '../lib/auth';

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('================================================================');
  console.log('BURSA KUMAŞ DÜNYASI - MÜŞTERİ HESABI & AUTH SİSTEMİ TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title}`);
      if (details) console.error('   Details:', details);
      failed++;
    }
  }

  const testEmail = `test.musteri.${Date.now()}@bursakumasdunyasi.com`;
  const testPassword = 'TestPassword123!';
  let testUserId = '';
  let authCookie = '';
  let verifyToken = '';

  // 1. Test Password Hashing (PBKDF2/SHA-512)
  console.log('\n--- 1. Güvenlik & Şifreleme (PBKDF2 / SHA-512) ---');
  const hashed = hashPassword(testPassword);
  assert(typeof hashed === 'string' && hashed.length === 128, 'Şifre 128 karakterli PBKDF2/SHA-512 formatında hashleniyor');
  assert(verifyPassword(testPassword, hashed), 'Doğru şifre doğrulanıyor');
  assert(!verifyPassword('WrongPassword', hashed), 'Yanlış şifre reddediliyor');

  // 2. Test Registration API Validation
  console.log('\n--- 2. Kayıt Validasyonları & KVKK Kontrolleri ---');
  const resShortPw = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: 'Test',
      last_name: 'Kullanıcı',
      email: testEmail,
      password: '123',
      kvkk_consent: true,
    }),
  });
  assert(resShortPw.status === 400, 'Kısa şifre (6 karakter altı) 400 ile reddedildi');

  const resNoKvkk = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: 'Test',
      last_name: 'Kullanıcı',
      email: testEmail,
      password: testPassword,
      kvkk_consent: false,
    }),
  });
  assert(resNoKvkk.status === 400, 'KVKK onaysız kayıt 400 ile reddedildi');

  // 3. Successful Registration
  console.log('\n--- 3. Başarılı Kayıt ve Tek Kullanımlık Doğrulama Belirteci ---');
  const resReg = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: 'Ahmet',
      last_name: 'Müşteri',
      email: testEmail,
      phone: '05551112233',
      password: testPassword,
      password_confirm: testPassword,
      kvkk_consent: true,
      marketing_consent: true,
    }),
  });
  const regData = await resReg.json();
  assert(resReg.ok && regData.success, 'Müşteri hesabı başarıyla oluşturuldu');
  assert(Boolean(regData.user?.id), `Kullanıcı ID atandı: ${regData.user?.id}`);
  testUserId = regData.user?.id;
  verifyToken = regData.verification_token_demo;

  // Extract session cookie
  const setCookie = resReg.headers.get('set-cookie');
  if (setCookie) {
    authCookie = setCookie.split(';')[0];
    assert(authCookie.includes('bkd_token='), 'HttpOnly bkd_token oturum çerezi üretildi');
  }

  // 4. Test Duplicate Email Prevention
  const resDup = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: 'Ahmet',
      last_name: 'Müşteri',
      email: testEmail,
      password: testPassword,
      kvkk_consent: true,
    }),
  });
  assert(resDup.status === 409, 'Mükerrer e-posta ile kayıt 409 Conflict ile engellendi');

  // 5. Test Email Verification
  console.log('\n--- 4. E-Posta Doğrulama API ---');
  const resVerify = await fetch(`${BASE_URL}/api/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: verifyToken }),
  });
  const verifyData = await resVerify.json();
  assert(resVerify.ok && verifyData.success, 'Tek kullanımlık token ile e-posta doğrulandı');

  // Test reuse prevention
  const resVerifyReuse = await fetch(`${BASE_URL}/api/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: verifyToken }),
  });
  assert(resVerifyReuse.status === 400, 'Aynı doğrulama tokenının tekrar kullanımı engellendi');

  // 6. Test Login API
  console.log('\n--- 5. Giriş (Login) & Enumeration Protection ---');
  const resBadLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'WrongPassword' }),
  });
  const badLoginData = await resBadLogin.json();
  assert(resBadLogin.status === 401 && badLoginData.message.includes('hatalı'), 'Hatalı şifre genel hata mesajıyla reddedildi');

  const resGoodLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  assert(resGoodLogin.ok, 'Doğru kimlik bilgileriyle giriş yapıldı');

  // 7. Test Profile API
  console.log('\n--- 6. Profil Bilgileri & Güncelleme ---');
  const resMe = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: authCookie },
  });
  const meData = await resMe.json();
  assert(meData.authenticated && meData.user?.email === testEmail, 'Oturum bilgileri doğrulandı (/api/auth/me)');
  assert(meData.user?.email_verified === true, 'Kullanıcının e-posta doğrulama durumu true');

  const resUpdateProfile = await fetch(`${BASE_URL}/api/user/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({
      first_name: 'Ahmet Güncel',
      last_name: 'Müşteri',
      phone: '05559998877',
      marketing_consent: false,
    }),
  });
  const updateProfData = await resUpdateProfile.json();
  assert(resUpdateProfile.ok && updateProfData.user.first_name === 'Ahmet Güncel', 'Profil bilgileri güncellendi');

  // 8. Test Address CRUD & Default Shipping/Billing Exclusivity
  console.log('\n--- 7. Adres Yönetimi (CRUD & Varsayılan İzolasyonu) ---');
  const resAddAddr1 = await fetch(`${BASE_URL}/api/user/addresses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({
      title: 'Ev Adresim',
      first_name: 'Ahmet',
      last_name: 'Müşteri',
      phone: '05559998877',
      city: 'Bursa',
      district: 'Osmangazi',
      full_address: 'Demirtaşpaşa Mah. İnönü Cad. No:10',
      is_default_shipping: true,
      is_default_billing: true,
    }),
  });
  const addr1Data = await resAddAddr1.json();
  assert(resAddAddr1.ok && addr1Data.address?.is_default_shipping === 1, 'İlk adres varsayılan teslimat olarak kaydedildi');
  const addr1Id = addr1Data.address?.id;

  const resAddAddr2 = await fetch(`${BASE_URL}/api/user/addresses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({
      title: 'İş Yeri / Atölye',
      first_name: 'Ahmet',
      last_name: 'Müşteri',
      phone: '05559998877',
      city: 'Bursa',
      district: 'Nilüfer',
      full_address: 'Fethiye Mah. Sanayi Cad. No:5',
      is_default_shipping: true,
      is_default_billing: false,
    }),
  });
  const addr2Data = await resAddAddr2.json();
  assert(resAddAddr2.ok && addr2Data.address?.is_default_shipping === 1, 'İkinci adres yeni varsayılan teslimat yapıldı');

  // Verify first address lost default shipping
  const resGetAddrs = await fetch(`${BASE_URL}/api/user/addresses`, {
    headers: { Cookie: authCookie },
  });
  const getAddrsData = await resGetAddrs.json();
  const addr1After = getAddrsData.addresses.find((a: any) => a.id === addr1Id);
  assert(addr1After.is_default_shipping === 0, 'Eski adresin varsayılan teslimat bayrağı otomatik sıfırlandı');

  // 9. Test Favorites (Wishlist) CRUD & Guest Merge
  console.log('\n--- 8. Favoriler (Wishlist) ve Misafir Senkronizasyonu ---');
  const db = readDb();
  const sampleProduct = (db.products || [])[0];
  const sampleProductId = sampleProduct ? sampleProduct.id : 'prod-1';

  const resAddFav = await fetch(`${BASE_URL}/api/user/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({ product_ids: [sampleProductId] }),
  });
  const addFavData = await resAddFav.json();
  assert(resAddFav.ok && addFavData.total_count >= 1, 'Ürün favorilere eklendi (Toplu misafir merge desteği)');

  const resGetFavs = await fetch(`${BASE_URL}/api/user/favorites`, {
    headers: { Cookie: authCookie },
  });
  const getFavsData = await resGetFavs.json();
  assert(getFavsData.favorites.some((f: any) => f.id === sampleProductId), 'Favori ürün listelendi');

  // 10. Test Order Creation & IDOR Protection
  console.log('\n--- 9. Sipariş Geçmişi & Katı IDOR Güvenlik Kontrolü ---');
  const newOrderId = `ord-test-${Date.now()}`;
  db.orders.push({
    id: newOrderId,
    order_number: `BK-${Date.now().toString().slice(-6)}`,
    user_id: testUserId,
    customer_name: 'Ahmet Müşteri',
    customer_email: testEmail,
    total_amount: 1450,
    final_amount: 1450,
    status: 'Hazirlaniyor',
    tracking_number: 'YK9876543210',
    carrier: 'Yurtiçi Kargo',
    created_at: new Date().toISOString(),
  });
  db.order_items.push({
    id: `item-${Date.now()}`,
    order_id: newOrderId,
    product_id: sampleProductId,
    product_name: sampleProduct?.name || 'Kadife Kumaş',
    meter_quantity: 3.5,
    unit_price: 350,
  });
  writeDb(db);

  const resUserOrders = await fetch(`${BASE_URL}/api/user/orders`, {
    headers: { Cookie: authCookie },
  });
  const userOrdersData = await resUserOrders.json();
  assert(userOrdersData.orders.some((o: any) => o.id === newOrderId), 'Kullanıcının siparişi listelendi');

  const resOrderDetail = await fetch(`${BASE_URL}/api/user/orders/${newOrderId}`, {
    headers: { Cookie: authCookie },
  });
  const orderDetailData = await resOrderDetail.json();
  assert(resOrderDetail.ok && orderDetailData.order?.id === newOrderId, 'Sipariş detayına başarıyla erişildi');

  // Test IDOR block on other user's order
  const otherOrderId = `ord-other-${Date.now()}`;
  db.orders.push({
    id: otherOrderId,
    order_number: 'BK-OTHER-99',
    user_id: 'usr-someone-else',
    customer_email: 'other@example.com',
    total_amount: 500,
    created_at: new Date().toISOString(),
  });
  writeDb(db);

  const resIdorTest = await fetch(`${BASE_URL}/api/user/orders/${otherOrderId}`, {
    headers: { Cookie: authCookie },
  });
  assert(resIdorTest.status === 403, 'Başka müşterinin siparişine erişim 403 IDOR Koruması ile engellendi');

  // 11. Test Live Reorder
  console.log('\n--- 10. Canlı Stok ve Fiyat Kontrollü Tekrar Sipariş (Reorder) ---');
  const resReorder = await fetch(`${BASE_URL}/api/user/orders/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({ order_id: newOrderId }),
  });
  const reorderData = await resReorder.json();
  assert(resReorder.ok && reorderData.success && reorderData.items.length > 0, 'Canlı katalog kontrolüyle sipariş sepete aktarıldı');

  // 12. Test Coupons
  console.log('\n--- 11. Müşteri Kuponları & Eşik Kontrolleri ---');
  const resCoupons = await fetch(`${BASE_URL}/api/user/coupons`, {
    headers: { Cookie: authCookie },
  });
  const couponsData = await resCoupons.json();
  assert(resCoupons.ok && Array.isArray(couponsData.coupons), 'Müşteri kuponları başarıyla sorgulandı');

  // 13. Test Notifications
  console.log('\n--- 12. Bildirim Sistemi & Okundu İşaretleme ---');
  const resNotifs = await fetch(`${BASE_URL}/api/user/notifications`, {
    headers: { Cookie: authCookie },
  });
  const notifsData = await resNotifs.json();
  assert(resNotifs.ok && notifsData.notifications.length > 0, 'Müşteri bildirimleri listelendi');

  const resMarkRead = await fetch(`${BASE_URL}/api/user/notifications`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({ mark_all: true }),
  });
  assert(resMarkRead.ok, 'Tüm bildirimler okundu olarak işaretlendi');

  // 14. Test Active Sessions
  console.log('\n--- 13. Aktif Oturumlar ve Cihaz Güvenliği ---');
  const resSessions = await fetch(`${BASE_URL}/api/user/sessions`, {
    headers: { Cookie: authCookie },
  });
  const sessionsData = await resSessions.json();
  assert(resSessions.ok && sessionsData.sessions.length >= 1, 'Aktif cihaz oturumları listelendi');

  // 15. Test Admin Customer Management
  console.log('\n--- 14. Yönetici Müşteri Portalı (Admin API) ---');
  const resAdminCustomers = await fetch(`${BASE_URL}/api/admin/customers?q=Ahmet`);
  const adminCustomersData = await resAdminCustomers.json();
  const foundInAdmin = adminCustomersData.customers.find((c: any) => c.id === testUserId);
  assert(Boolean(foundInAdmin), 'Müşteri admin panelinde arandı ve bulundu');
  assert(foundInAdmin.total_spent >= 1450, 'Müşterinin toplam harcaması doğru hesaplandı');

  // Toggle status in admin
  const resAdminToggle = await fetch(`${BASE_URL}/api/admin/customers/${testUserId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account_status: 'suspended' }),
  });
  assert(resAdminToggle.ok, 'Yönetici tarafından müşteri hesabı askıya alındı');

  // 16. Test Account Soft-Delete & Anonymization
  console.log('\n--- 15. KVKK Kapsamında Hesap Silme & Veri Bütünlüğü ---');
  // Re-activate to test delete
  const dbPost = readDb();
  const uObj = dbPost.users.find((u: any) => u.id === testUserId);
  if (uObj) uObj.account_status = 'active';
  writeDb(dbPost);

  const resDeleteAcc = await fetch(`${BASE_URL}/api/user/delete-account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: JSON.stringify({ password: testPassword, reason: 'Test Tamamlandı' }),
  });
  const deleteData = await resDeleteAcc.json();
  assert(resDeleteAcc.ok && deleteData.success, 'Hesap başarıyla silindi ve anonimleştirildi');

  // Verify orders and financial audit records were preserved
  const dbFinal = readDb();
  const orderStillExists = dbFinal.orders.some((o: any) => o.id === newOrderId);
  const userAnonymized = dbFinal.users.find((u: any) => u.id === testUserId);
  assert(orderStillExists, 'Geçmiş sipariş ve mali kayıtlar vergi denetimi için korundu');
  assert(userAnonymized?.account_status === 'deleted' && userAnonymized?.first_name === 'Silinmiş', 'Kullanıcı adı ve kimlik verileri KVKK kapsamında anonimleştirildi');

  console.log('\n================================================================');
  console.log(`TEST SONUÇLARI: ${passed} BAŞARILI / ${failed} BAŞARISIZ`);
  console.log('================================================================');
}

runTests().catch(console.error);
