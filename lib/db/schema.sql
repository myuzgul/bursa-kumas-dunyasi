-- ==============================================================================
-- BURSA KUMAŞ DÜNYASI (bursakumasdunyasi.com) - RELATIONAL DATABASE SCHEMA
-- ==============================================================================

-- 1. ADMIN & AUTH ROLES
CREATE TABLE IF NOT EXISTS admin_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT NOT NULL, -- JSON array: ["products", "orders", "reports", "settings", "discounts", "blog"]
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    role_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES admin_roles(id)
);

-- 2. USERS & ADDRESSES (Müşteriler)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password_hash TEXT,
    is_email_verified INTEGER DEFAULT 0,
    role TEXT DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL, -- "Evim", "İş Yeri", "Yazlık"
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    neighborhood TEXT,
    address_line TEXT NOT NULL,
    postal_code TEXT,
    is_corporate INTEGER DEFAULT 0,
    company_name TEXT,
    tax_number TEXT,
    tax_office TEXT,
    is_default_shipping INTEGER DEFAULT 0,
    is_default_billing INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. CATEGORIES (Hiyerarşik Kategori Sistemi)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    parent_id TEXT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    is_featured_home INTEGER DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 4. ATTRIBUTES & VALUES (Renk, Desen, En, Gramaj, Kalite)
CREATE TABLE IF NOT EXISTS attributes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- "Renk", "Desen", "Kumaş Eni", "Gramaj", "Kullanım Alanı"
    type TEXT DEFAULT 'select', -- "select", "color", "badge"
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attribute_values (
    id TEXT PRIMARY KEY,
    attribute_id TEXT NOT NULL,
    name TEXT NOT NULL, -- "Antrasit", "140 cm", "Jakarlı"
    color_code TEXT, -- Hex code for color swatches, e.g. "#2c3e50"
    image_url TEXT, -- Pattern swatch image
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE
);

-- 5. PRODUCTS (Kumaş Ana Ürün Tablosu)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_description TEXT,
    description TEXT,
    technical_specs TEXT, -- JSON key-value: {"En": "140 cm", "Gramaj": "380 gr/m2", "İçerik": "%100 Polyester", "Kullanım": "Döşeme, Kırlent, Fon Perde"}
    base_price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    tax_rate INTEGER DEFAULT 20, -- KDV %20
    is_meter_sale INTEGER DEFAULT 1, -- 1: Metre bazlı satış, 0: Adet bazlı
    min_order_meter DECIMAL(5, 2) DEFAULT 1.00,
    meter_step DECIMAL(5, 2) DEFAULT 0.50,
    max_order_meter DECIMAL(5, 2) DEFAULT 100.00,
    stock_meter DECIMAL(10, 2) DEFAULT 100.00,
    has_variants INTEGER DEFAULT 0,
    main_image_url TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,
    is_bestseller INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 0,
    vitrin_order INTEGER DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    canonical_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 6. PRODUCT VARIANTS & ATTRIBUTES (Varyasyonlar)
CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL, -- "Antrasit / 140 cm"
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    stock_meter DECIMAL(10, 2) DEFAULT 50.00,
    image_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_variant_attributes (
    variant_id TEXT NOT NULL,
    attribute_id TEXT NOT NULL,
    attribute_value_id TEXT NOT NULL,
    PRIMARY KEY (variant_id, attribute_id, attribute_value_id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES attributes(id),
    FOREIGN KEY (attribute_value_id) REFERENCES attribute_values(id)
);

-- 7. PRODUCT IMAGES (Galeri Görselleri)
CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text TEXT,
    display_order INTEGER DEFAULT 0,
    is_main INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- 8. CARTS & CART ITEMS (Metre ve Varyasyon Destekli Sepet)
CREATE TABLE IF NOT EXISTS carts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    session_id TEXT NOT NULL UNIQUE,
    coupon_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,
    cart_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    meter_quantity DECIMAL(8, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

-- 9. COUPONS & CART RULES (İndirim Motoru)
CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL, -- 'percent' veya 'fixed'
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
    max_discount_amount DECIMAL(10, 2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    start_date DATETIME,
    end_date DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupon_usages (
    id TEXT PRIMARY KEY,
    coupon_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    user_id TEXT,
    discount_amount DECIMAL(10, 2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id)
);

CREATE TABLE IF NOT EXISTS cart_discount_rules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL, -- "1.000 TL Üzeri %10 Sepet İndirimi"
    min_cart_total DECIMAL(10, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0.00,
    discount_fixed DECIMAL(10, 2) DEFAULT 0.00,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. ORDERS & ORDER ITEMS (Sipariş Yönetimi)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE, -- "BKD-2026-000101"
    user_id TEXT,
    is_guest INTEGER DEFAULT 1,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    
    -- Adres Bilgileri (JSON snapshot)
    shipping_address TEXT NOT NULL,
    billing_address TEXT NOT NULL,
    
    -- Finansal Döküm
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_total DECIMAL(10, 2) DEFAULT 0.00,
    coupon_code TEXT,
    shipping_total DECIMAL(10, 2) DEFAULT 0.00,
    tax_total DECIMAL(10, 2) NOT NULL,
    grand_total DECIMAL(10, 2) NOT NULL,
    
    -- Durumlar
    status TEXT NOT NULL DEFAULT 'Siparis_Alindi', 
    -- 'Siparis_Alindi', 'Odeme_Onaylandi', 'Hazirlaniyor', 'Cikti_Alindi', 'Kargoya_Verildi', 'Teslim_Edildi', 'Iptal_Edildi', 'Iade_Edildi'
    payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
    payment_method TEXT DEFAULT 'paytr',
    order_notes TEXT,
    
    -- Kargo Bilgileri
    carrier_name TEXT DEFAULT 'Yurtiçi Kargo',
    tracking_number TEXT,
    tracking_url TEXT,
    
    -- Fatura Bilgileri
    invoice_status TEXT DEFAULT 'pending', -- 'pending', 'created', 'failed'
    invoice_number TEXT,
    invoice_pdf_url TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    product_name TEXT NOT NULL,
    variant_title TEXT,
    product_sku TEXT NOT NULL,
    product_image TEXT,
    meter_quantity DECIMAL(8, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 11. PAYMENTS (PayTR & Güvenlik Logları)
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'paytr',
    merchant_oid TEXT NOT NULL,
    transaction_id TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL, -- 'success', 'failed', 'pending'
    installment_count INTEGER DEFAULT 1,
    raw_response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- 12. SHIPMENTS & INVOICES (Kargo & Park Bulut Logları)
CREATE TABLE IF NOT EXISTS shipping_logs (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    carrier TEXT NOT NULL DEFAULT 'Yurtici',
    request_payload TEXT,
    response_payload TEXT,
    status TEXT NOT NULL,
    tracking_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_logs (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'ParkBulut',
    request_payload TEXT,
    response_payload TEXT,
    invoice_uuid TEXT,
    invoice_number TEXT,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. REVIEWS & WISHLISTS (Müşteri Etkileşimi)
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    user_id TEXT,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    is_verified_purchase INTEGER DEFAULT 0,
    is_approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wishlists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 14. HOMEPAGE SECTIONS & BANNERS (Dinamik Vitrin Yönetimi)
CREATE TABLE IF NOT EXISTS homepage_sections (
    id TEXT PRIMARY KEY,
    section_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    section_type TEXT NOT NULL, -- 'hero', 'categories', 'featured_products', 'bestsellers', 'advantages', 'reviews', 'blog'
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    config_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS homepage_banners (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    link_url TEXT NOT NULL,
    button_text TEXT DEFAULT 'Hemen Keşfet',
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. BLOG (SEO & İçerik Pazarlaması)
CREATE TABLE IF NOT EXISTS blog_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    summary TEXT,
    content TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    author TEXT DEFAULT 'Bursa Kumaş Dünyası Uzman Ekibi',
    category TEXT DEFAULT 'Kumaş Rehberi',
    tags TEXT, -- JSON or comma separated: "Kadife, Keten, Döşemelik"
    meta_title TEXT,
    meta_description TEXT,
    is_published INTEGER DEFAULT 1,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. SYSTEM AUDIT & COMMUNICATION LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT,
    admin_email TEXT,
    action TEXT NOT NULL, -- 'PRODUCT_PRICE_UPDATE', 'ORDER_STATUS_UPDATE', 'COUPON_CREATE', etc.
    details TEXT NOT NULL,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_type TEXT NOT NULL,
    status TEXT NOT NULL, -- 'sent', 'failed'
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sms_logs (
    id TEXT PRIMARY KEY,
    phone_number TEXT NOT NULL,
    message_content TEXT NOT NULL,
    provider TEXT DEFAULT 'Netgsm',
    status TEXT NOT NULL, -- 'sent', 'failed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INDEXES FOR HIGH-SPEED QUERYING & CORE WEB VITALS OPTIMIZATION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active_vitrin ON products(is_active, vitrin_order);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(base_price);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_session ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
