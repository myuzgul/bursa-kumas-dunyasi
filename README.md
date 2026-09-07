# BURSA KUMAŞ DÜNYASI (bursakumasdunyasi.com)

**Bursa Kumaş Dünyası**, doğrudan Bursa dokuma merkezinden metre bazlı toptan ve perakende kumaş satışı yapan, yüksek performanslı, kurumsal ve ölçeklenebilir e-ticaret platformudur.

---

## 🚀 Öne Çıkan Sistem Mimarisi & Özellikler

1. **Next.js 14+ App Router & TypeScript**: Düşük TTFB, yüksek hızlı SSR/SSG ve responsive WebP görsel optimizasyonu.
2. **Metre Bazlı Canlı Satış Motoru**: 
   - 0.5m adımlarla fractional metraj seçimi (1m, 1.5m, 2.5m vb.).
   - Canlı anlık fiyat hesaplama ve sepette dinamik metre kırılımı.
3. **Çoklu Varyasyon & Nitelik Sistemi**:
   - Renk (Hex swatch & kumaş dokusu), desen (Düz, Jakarlı, Çizgili, Vintage Çiçekli), 280 cm çift en ve gramaj varyasyonları.
   - Her varyasyona özel bağımsız SKU, stok ve fiyat tanımlaması.
4. **Entegrasyon Katmanları**:
   - **PayTR**: HMAC-SHA256 imzalı güvenli iframe & direct token, webhook callback ve idempotent ödeme doğrulama.
   - **Yurtiçi Kargo**: Gönderi kaydı, otomatik takip numarası ve canlı kargo sorgulama timeline'ı.
   - **Park Bulut**: Otomatik E-Arşiv / E-Fatura taslağı oluşturma ve durum takibi.
   - **E-Posta & SMS**: Sipariş onayı, kesim bildirimi ve kargo SMS kuyruğu.
5. **Kapsamlı Yönetim Paneli (Admin Portal)**:
   - **"Sipariş & Kesim Çıktısı" (FATURA DEĞİLDİR / SİPARİŞ ÇIKTISIDIR)** tek tıkla A4 yazdırma fişi.
   - **Metre Bazlı Ürün Satış Raporları**: Hangi kumaştan kaç metre satıldı, ne kadar ciro oluşturuldu?
   - **Toplu Fiyat & Stok Güncelleme**: Kategori bazında % zam/indirim uygulama ve audit logları.
   - **Sekmeli Ürün & Varyasyon Editörü**: SEO karakter sayacı, vitrin sırası ve galeri yönetimi.
6. **SEO & Standartlar**:
   - Dinamik `/sitemap.xml` ve `/robots.txt`.
   - JSON-LD Structured Data: `Product`, `Offer`, `AggregateRating`, `Organization`, `BreadcrumbList`, `Article`.
   - 1-Step Hızlı Checkout (Üyeliksiz Alışveriş & Kurumsal Fatura desteği).

---

## 📦 Kurulum ve Çalıştırma

### 1. Gereksinimler
- Node.js 18+ veya Node.js 20+ / 24+
- NPM / PNPM / Yarn

### 2. Bağımlılıkların Yüklenmesi
```bash
npm install
```

### 3. Geliştirme Sunucusunu Başlatma
```bash
npm run dev
```
Tarayıcınızda `http://localhost:3000` adresini açarak platformu inceleyebilirsiniz.

### 4. Admin Yönetim Paneli Girişi
- **URL**: `http://localhost:3000/admin`
- **E-Posta**: `admin@bursakumasdunyasi.com`
- **Şifre**: `admin123`

---

## ⚙️ Ortam Değişkenleri (.env.example)

```env
NODE_ENV=development
PORT=3000

# Güvenlik & JWT
JWT_SECRET=bursa-kumas-dunyasi-super-secure-production-secret-2026-key

# PayTR Ödeme Entegrasyonu
PAYTR_MERCHANT_ID=123456
PAYTR_MERCHANT_KEY=test_merchant_key_2026
PAYTR_MERCHANT_SALT=test_merchant_salt_2026
PAYTR_TEST_MODE=true

# Yurtiçi Kargo API
YURTICI_USER=bursakumas_api
YURTICI_PASSWORD=secret_kargo_pass
YURTICI_ENDPOINT=https://ws.yurticikargo.com/KOPSWebServices/ShippingOrderDispatcherServices

# Park Bulut E-Fatura API
PARK_BULUT_API_KEY=park_bulut_api_token_xyz
PARK_BULUT_ENDPOINT=https://api.parkbulut.com/v1/invoices

# SMTP E-Posta
SMTP_HOST=smtp.bursakumasdunyasi.com
SMTP_PORT=587
SMTP_USER=destek@bursakumasdunyasi.com
SMTP_PASS=secure_smtp_password

# SMS Gateway (Netgsm / İletimerkezi)
SMS_HEADER=BURSAKUMAS
SMS_USER=netgsm_user
SMS_PASSWORD=netgsm_pass
```

---

## 📑 Veritabanı ve Tablo Yapısı

Veritabanı ilişkisel ve normalize edilmiş olarak tasarlanmıştır:
- `products`, `product_variants`, `product_images`, `product_variant_attributes`
- `categories`, `attributes`, `attribute_values`
- `orders`, `order_items`, `order_status_history`
- `carts`, `cart_items`, `coupons`, `cart_discount_rules`
- `payments`, `shipping_logs`, `invoice_logs`
- `admin_users`, `admin_roles`, `audit_logs`, `reviews`, `blog_posts`, `homepage_banners`

---

## 🛡️ Güvenlik ve Doğrulama İlkeleri
- Fiyatlar, stoklar ve indirimler **asla istemciye (frontend) emanet edilmez**; backend tarafında sipariş anında atomik olarak tekrar hesaplanır.
- Metre bazlı stok düşümü transaction ile yapılarak eksiye düşme ve race condition engellenir.
