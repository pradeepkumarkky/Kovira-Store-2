-- ==============================================================================
-- KOVIRA & SHIVORA STORE - FINAL UPDATED SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================
-- Target Stack: Supabase PostgreSQL + Vercel Hosting + GitHub
-- Platforms: DeoDap, Baapstore, CJ Dropshipping, Shivora Boutique
-- Payments: Direct UPI Gateway (9656850012@upi) & QR Scan & Pay
-- Safe & Idempotent: Can be run on brand new OR existing Supabase projects!
-- ==============================================================================
-- Run this script in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. SUPPLIERS TABLE (DeoDap, Baapstore, CJ Dropshipping, Shivora)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY DEFAULT ('sup_' || substring(uuid_generate_v4()::text, 1, 8)),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    country TEXT DEFAULT 'India',
    lead_time_days INTEGER DEFAULT 2,
    fulfillment_method TEXT DEFAULT 'Automated EDI',
    active_products_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. PRODUCTS TABLE (General Gadgets, Dropship Items, Factory Direct)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT ('prod_' || substring(uuid_generate_v4()::text, 1, 12)),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Lifestyle Essentials',
    price_usd NUMERIC(10, 2) NOT NULL DEFAULT 19.99,
    cost_usd NUMERIC(10, 2) NOT NULL DEFAULT 9.99,
    stock INTEGER NOT NULL DEFAULT 50,
    reorder_point INTEGER DEFAULT 15,
    reorder_quantity INTEGER DEFAULT 50,
    sku TEXT UNIQUE,
    supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT,
    supplier_platform TEXT DEFAULT 'Direct Factory',
    supplier_lead_days INTEGER DEFAULT 2,
    supplier_link TEXT,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    rating NUMERIC(3, 2) DEFAULT 4.8,
    reviews_count INTEGER DEFAULT 28,
    reviews JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    weight_kg NUMERIC(6, 3) DEFAULT 0.450,
    is_dropshipped BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    margin_percent NUMERIC(5, 2) DEFAULT 50,
    wholesale_inr NUMERIC(10, 2) DEFAULT 350,
    delivery_charge_inr NUMERIC(10, 2) DEFAULT 0,
    min_price_floor_inr NUMERIC(10, 2) DEFAULT 99,
    discount_percent NUMERIC(5, 2) DEFAULT 0,
    show_discount_banner BOOLEAN DEFAULT false,
    discount_banner_text TEXT,
    live_sync JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe Column Migrations for Existing 'products' tables
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reviews JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_inr NUMERIC(10, 2) DEFAULT 350;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_charge_inr NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_price_floor_inr NUMERIC(10, 2) DEFAULT 99;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS margin_percent NUMERIC(5, 2) DEFAULT 50;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS live_sync JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS show_discount_banner BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_banner_text TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS last_synced TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS external_product_id TEXT;

-- ------------------------------------------------------------------------------
-- 3. DRESSES TABLE (Shivora Collections In-House Boutique)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dresses (
    id TEXT PRIMARY KEY DEFAULT ('shv_' || substring(uuid_generate_v4()::text, 1, 12)),
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT NOT NULL DEFAULT 'Partywear Gowns & Apparel',
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    sizes TEXT[] DEFAULT ARRAY['M', 'L', 'XL', 'XXL']::TEXT[],
    base_cost_inr NUMERIC(10, 2) NOT NULL DEFAULT 900,
    margin_percent NUMERIC(5, 2) DEFAULT 40,
    price_inr NUMERIC(10, 2) NOT NULL DEFAULT 1499,
    price_usd NUMERIC(10, 2) NOT NULL DEFAULT 17.33,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    design_code TEXT,
    fabric TEXT DEFAULT 'Cotton Blend',
    sku TEXT UNIQUE,
    stock INTEGER DEFAULT 60,
    rating NUMERIC(3, 2) DEFAULT 4.9,
    reviews_count INTEGER DEFAULT 35,
    delivery_charge_inr NUMERIC(10, 2) DEFAULT 80,
    show_discount BOOLEAN DEFAULT false,
    discount_percent NUMERIC(5, 2) DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe Column Migrations for Existing 'dresses' tables
ALTER TABLE public.dresses ADD COLUMN IF NOT EXISTS delivery_charge_inr NUMERIC(10, 2) DEFAULT 80;
ALTER TABLE public.dresses ADD COLUMN IF NOT EXISTS show_discount BOOLEAN DEFAULT false;
ALTER TABLE public.dresses ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.dresses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- ------------------------------------------------------------------------------
-- 4. UPLOADED WEB LINKS TABLE (Drop Ship Hub Link Importer & Margin Rules)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.uploaded_web_links (
    id TEXT PRIMARY KEY DEFAULT ('link_' || substring(uuid_generate_v4()::text, 1, 8)),
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    supplier_name TEXT DEFAULT 'DeoDap Dropship Logistics',
    supplier_platform TEXT DEFAULT 'DeoDap',
    category TEXT DEFAULT 'Trending Dropship Items',
    products_count INTEGER DEFAULT 1,
    margin_percent NUMERIC(5, 2) DEFAULT 50,
    discount_percent NUMERIC(5, 2) DEFAULT 0,
    has_discount_banner BOOLEAN DEFAULT false,
    discount_banner_text TEXT,
    min_price_floor_inr NUMERIC(10, 2) DEFAULT 99,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Syncing', 'Paused', 'Archived')),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe Column Migrations for Existing 'uploaded_web_links' tables
ALTER TABLE public.uploaded_web_links ADD COLUMN IF NOT EXISTS margin_percent NUMERIC(5, 2) DEFAULT 50;
ALTER TABLE public.uploaded_web_links ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.uploaded_web_links ADD COLUMN IF NOT EXISTS has_discount_banner BOOLEAN DEFAULT false;
ALTER TABLE public.uploaded_web_links ADD COLUMN IF NOT EXISTS discount_banner_text TEXT;
ALTER TABLE public.uploaded_web_links ADD COLUMN IF NOT EXISTS min_price_floor_inr NUMERIC(10, 2) DEFAULT 99;

-- ------------------------------------------------------------------------------
-- 5. STORE OFFERS & SEASONAL OFFERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_offers (
    id TEXT PRIMARY KEY DEFAULT ('off_' || substring(uuid_generate_v4()::text, 1, 8)),
    title TEXT NOT NULL,
    offer_type TEXT NOT NULL DEFAULT 'seasonal' CHECK (offer_type IN ('seasonal', 'product', 'category', 'flash_sale', 'festival')),
    promo_code TEXT,
    discount_percent NUMERIC(5, 2) DEFAULT 15,
    discount_amount_inr NUMERIC(10, 2) DEFAULT 0,
    min_order_value_inr NUMERIC(10, 2) DEFAULT 499,
    applicable_product_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    applicable_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    is_active BOOLEAN DEFAULT true,
    banner_message TEXT,
    badge_label TEXT DEFAULT 'Special Offer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. DROPSHIP SETTINGS TABLE (CJ Dropshipping, DeoDap, Baapstore API Settings)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dropship_settings (
    platform TEXT PRIMARY KEY,
    api_key TEXT,
    api_secret TEXT,
    partner_id TEXT,
    email TEXT,
    endpoint_url TEXT,
    webhook_url TEXT,
    sync_pricing BOOLEAN DEFAULT true,
    sync_inventory BOOLEAN DEFAULT true,
    auto_push_orders BOOLEAN DEFAULT true,
    pricing_markup_multiplier NUMERIC(4, 2) DEFAULT 2.0,
    default_margin_percent NUMERIC(5, 2) DEFAULT 50,
    default_shipping_carrier TEXT,
    fulfillment_warehouse TEXT,
    is_connected BOOLEAN DEFAULT true,
    last_sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. UPI PAYMENT SETTINGS TABLE (Direct UPI 9656850012@upi)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id TEXT PRIMARY KEY DEFAULT 'upi_primary',
    gateway_type TEXT DEFAULT 'UPI_QR',
    upi_id TEXT NOT NULL DEFAULT '9656850012@upi',
    payee_name TEXT NOT NULL DEFAULT 'Kovira & Shivora Retail',
    qr_code_enabled BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    min_transaction_inr NUMERIC(10, 2) DEFAULT 1,
    max_transaction_inr NUMERIC(10, 2) DEFAULT 100000,
    instructions TEXT DEFAULT 'Scan QR code with GPay, PhonePe, Paytm or BHIM UPI and enter Transaction ID (UTR)',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. CUSTOMER USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_users (
    id TEXT PRIMARY KEY DEFAULT ('usr_' || substring(uuid_generate_v4()::text, 1, 12)),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. SAVED ADDRESSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_addresses (
    id TEXT PRIMARY KEY DEFAULT ('addr_' || substring(uuid_generate_v4()::text, 1, 8)),
    user_id TEXT REFERENCES public.customer_users(id) ON DELETE CASCADE,
    label TEXT DEFAULT 'Home',
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    postal_code TEXT NOT NULL,
    country TEXT DEFAULT 'India',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. ORDERS TABLE (Includes Stages: Accepted, Under Process, Shipping, etc.)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT ('ord_' || substring(uuid_generate_v4()::text, 1, 12)),
    order_number TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES public.customer_users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    customer_city TEXT NOT NULL,
    customer_country TEXT NOT NULL DEFAULT 'India',
    customer_postal_code TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    shipping NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'UPI',
    payment_status TEXT NOT NULL DEFAULT 'Paid',
    fulfillment_status TEXT NOT NULL DEFAULT 'Order Placed with Supplier',
    tracking_number TEXT,
    carrier TEXT DEFAULT 'Delhivery / Blue Dart / CJPacket',
    tracking_url TEXT,
    estimated_delivery TEXT DEFAULT '2–3 Business Days',
    upi_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe Column Migrations for Existing 'orders' tables
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS upi_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier TEXT DEFAULT 'Delhivery / Blue Dart / CJPacket';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery TEXT DEFAULT '2–3 Business Days';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- ------------------------------------------------------------------------------
-- 11. ORDER ITEMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id TEXT PRIMARY KEY DEFAULT ('item_' || substring(uuid_generate_v4()::text, 1, 12)),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT,
    title TEXT NOT NULL,
    sku TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'INR',
    quantity INTEGER NOT NULL DEFAULT 1,
    image TEXT,
    selected_size TEXT,
    is_dress BOOLEAN DEFAULT false,
    supplier_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 12. PRODUCT REVIEWS TABLE (Customer Ratings & Reviews)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id TEXT PRIMARY KEY DEFAULT ('rev_' || substring(uuid_generate_v4()::text, 1, 12)),
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL DEFAULT 'Verified Buyer',
    rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    photos TEXT[] DEFAULT ARRAY[]::TEXT[],
    verified_purchase BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 13. ANNOUNCEMENTS & STORE BANNERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY DEFAULT ('ann_' || substring(uuid_generate_v4()::text, 1, 8)),
    tag TEXT DEFAULT '✨ FESTIVE OFFER:',
    message TEXT NOT NULL DEFAULT 'Free Delivery on all orders over ₹999',
    promo_code TEXT DEFAULT 'KOVIRA10',
    discount_percent NUMERIC(5, 2) DEFAULT 10,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH-SPEED QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_published ON public.products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_supplier_platform ON public.products(supplier_platform);
CREATE INDEX IF NOT EXISTS idx_products_external_product_id ON public.products(external_product_id);

CREATE INDEX IF NOT EXISTS idx_customer_users_email ON public.customer_users(email);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON public.saved_addresses(user_id);

CREATE INDEX IF NOT EXISTS idx_dresses_category ON public.dresses(category);
CREATE INDEX IF NOT EXISTS idx_dresses_sku ON public.dresses(sku);
CREATE INDEX IF NOT EXISTS idx_dresses_is_published ON public.dresses(is_published);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_web_links_status ON public.uploaded_web_links(status);
CREATE INDEX IF NOT EXISTS idx_store_offers_is_active ON public.store_offers(is_active);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_web_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropship_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- 1. Storefront Public Read Policies
DROP POLICY IF EXISTS "Public can view published products" ON public.products;
CREATE POLICY "Public can view published products"
ON public.products FOR SELECT
USING (is_published IS NOT FALSE OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public can view published dresses" ON public.dresses;
CREATE POLICY "Public can view published dresses"
ON public.dresses FOR SELECT
USING (is_published = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public can view active announcements" ON public.announcements;
CREATE POLICY "Public can view active announcements"
ON public.announcements FOR SELECT
USING (is_enabled = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public can view active store offers" ON public.store_offers;
CREATE POLICY "Public can view active store offers"
ON public.store_offers FOR SELECT
USING (is_active = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public can view active payment settings" ON public.payment_settings;
CREATE POLICY "Public can view active payment settings"
ON public.payment_settings FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Public can view product reviews" ON public.product_reviews;
CREATE POLICY "Public can view product reviews"
ON public.product_reviews FOR SELECT
USING (true);

-- 2. Customer Order & Review Policies
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items"
ON public.order_items FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can track orders by number or phone" ON public.orders;
CREATE POLICY "Customers can track orders by number or phone"
ON public.orders FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Customers can view items of tracked orders" ON public.order_items;
CREATE POLICY "Customers can view items of tracked orders"
ON public.order_items FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow customers to cancel active order" ON public.orders;
CREATE POLICY "Allow customers to cancel active order"
ON public.orders FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can post product reviews" ON public.product_reviews;
CREATE POLICY "Anyone can post product reviews"
ON public.product_reviews FOR INSERT
WITH CHECK (true);

-- 3. Full Access for Service Role / Admin Backend
DROP POLICY IF EXISTS "Service role full access products" ON public.products;
CREATE POLICY "Service role full access products" ON public.products FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access dresses" ON public.dresses;
CREATE POLICY "Service role full access dresses" ON public.dresses FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access orders" ON public.orders;
CREATE POLICY "Service role full access orders" ON public.orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access order items" ON public.order_items;
CREATE POLICY "Service role full access order items" ON public.order_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access suppliers" ON public.suppliers;
CREATE POLICY "Service role full access suppliers" ON public.suppliers FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access uploaded_web_links" ON public.uploaded_web_links;
CREATE POLICY "Service role full access uploaded_web_links" ON public.uploaded_web_links FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access store_offers" ON public.store_offers;
CREATE POLICY "Service role full access store_offers" ON public.store_offers FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access dropship_settings" ON public.dropship_settings;
CREATE POLICY "Service role full access dropship_settings" ON public.dropship_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access payment_settings" ON public.payment_settings;
CREATE POLICY "Service role full access payment_settings" ON public.payment_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access announcements" ON public.announcements;
CREATE POLICY "Service role full access announcements" ON public.announcements FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access customer_users" ON public.customer_users;
CREATE POLICY "Service role full access customer_users" ON public.customer_users FOR ALL USING (true);

DROP POLICY IF EXISTS "Public can register customer accounts" ON public.customer_users;
CREATE POLICY "Public can register customer accounts" ON public.customer_users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can query customer accounts" ON public.customer_users;
CREATE POLICY "Public can query customer accounts" ON public.customer_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update customer accounts" ON public.customer_users;
CREATE POLICY "Public can update customer accounts" ON public.customer_users FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access saved_addresses" ON public.saved_addresses;
CREATE POLICY "Service role full access saved_addresses" ON public.saved_addresses FOR ALL USING (true);

DROP POLICY IF EXISTS "Public can manage saved addresses" ON public.saved_addresses;
CREATE POLICY "Public can manage saved addresses" ON public.saved_addresses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view suppliers" ON public.suppliers;
CREATE POLICY "Public can view suppliers" ON public.suppliers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can manage uploaded web links" ON public.uploaded_web_links;
CREATE POLICY "Public can manage uploaded web links" ON public.uploaded_web_links FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can manage dropship settings" ON public.dropship_settings;
CREATE POLICY "Public can manage dropship settings" ON public.dropship_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access product_reviews" ON public.product_reviews;
CREATE POLICY "Service role full access product_reviews" ON public.product_reviews FOR ALL USING (true);

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- 1. Suppliers: DeoDap, Baapstore, CJ Dropshipping, Shivora
INSERT INTO public.suppliers (id, name, contact_person, email, phone, country, lead_time_days, fulfillment_method, active_products_count)
VALUES
    ('sup_deodap', 'DeoDap Dropship Logistics (Rajkot Central Hub, Gujarat)', 'Rajkot Fulfillment Team', 'b2b-fulfillment@deodap.com', '+91 98250 12345', 'India', 2, 'Automated EDI', 450),
    ('sup_baapstore', 'Baapstore India Dropship Hub (Chennai Central)', 'Karthik Subramaniam', 'partner-orders@baapstore.com', '+91 94440 88219', 'India', 2, 'Automated EDI', 320),
    ('sup_cjdropshipping', 'CJdropshipping Global Logistics (US / Europe / Asia Hubs)', 'CJ Support Team', 'support@cjdropshipping.com', '+1 800 253 7677', 'USA / China', 4, 'API 2.0 Webhook', 520000),
    ('sup_shivora', 'Shivora In-House Boutique (Surat & Ahmedabad Hub)', 'Boutique Dispatch Manager', 'orders@shivoracollections.in', '+91 98765 43210', 'India', 1, 'In-House Direct', 25)
ON CONFLICT (id) DO NOTHING;

-- 2. Dropship Integration Settings (Default API Keys & Multipliers)
INSERT INTO public.dropship_settings (platform, api_key, api_secret, partner_id, email, endpoint_url, webhook_url, sync_pricing, sync_inventory, auto_push_orders, pricing_markup_multiplier, default_margin_percent, default_shipping_carrier, fulfillment_warehouse, is_connected)
VALUES
    ('CJdropshipping', 'cjdropship_live_token_9921fa40c', '••••••••••••••••', 'CJ-PARTNER-79124', 'support@cjdropshipping.com', 'https://developers.cjdropshipping.com/api2.0/v1', 'https://kovira.app/api/dropship/webhook/cjdropshipping', true, true, true, 2.4, 50, 'CJPacket Fast Line / USPS Priority Direct', 'CJ US West Warehouse (Chino, CA)', true),
    ('DeoDap', 'deodap_live_key_984129', '••••••••••••••••', 'DEODAP-B2B-44102', 'b2b-fulfillment@deodap.com', 'https://api.deodap.in/v1', 'https://kovira.app/api/dropship/webhook/deodap', true, true, true, 2.0, 50, 'Delhivery Surface / Express', 'DeoDap Central Hub (Rajkot, Gujarat)', true),
    ('Baapstore', 'baapstore_token_910482', '••••••••••••••••', 'BAAP-MERCHANT-8102', 'partner-orders@baapstore.com', 'https://api.baapstore.com/v2', 'https://kovira.app/api/dropship/webhook/baapstore', true, true, true, 2.0, 50, 'Blue Dart / Ecom Express', 'Baapstore Express Hub (Chennai, Tamil Nadu)', true)
ON CONFLICT (platform) DO NOTHING;

-- 3. UPI Payment Settings (UPI ID 9656850012@upi)
INSERT INTO public.payment_settings (id, gateway_type, upi_id, payee_name, qr_code_enabled, is_active, min_transaction_inr, max_transaction_inr, instructions)
VALUES
    ('upi_primary', 'UPI_QR', '9656850012@upi', 'Kovira & Shivora Retail', true, true, 1, 100000, 'Scan QR code with GPay, PhonePe, Paytm or BHIM UPI and enter Transaction ID (UTR)')
ON CONFLICT (id) DO NOTHING;

-- 4. Store Announcements
INSERT INTO public.announcements (id, tag, message, promo_code, discount_percent, is_enabled)
VALUES
    ('ann_default', '✨ FESTIVE OFFER:', 'Free Delivery on all orders over ₹999', 'KOVIRA10', 10, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Store Offers (Seasonal & Product Offers)
INSERT INTO public.store_offers (id, title, offer_type, promo_code, discount_percent, min_order_value_inr, is_active, banner_message, badge_label)
VALUES
    ('off_seasonal_festive', 'Festive Season Special Deal', 'seasonal', 'DIWALI25', 25, 999, true, 'Flat 25% OFF on all Festive Season orders above ₹999', 'Seasonal Festive Offer'),
    ('off_gadgets_launch', 'Smart Home & Audio Flash Sale', 'flash_sale', 'SMART15', 15, 499, true, 'Extra 15% OFF on Smart Lifestyle Gadgets', 'Flash Sale')
ON CONFLICT (id) DO NOTHING;
