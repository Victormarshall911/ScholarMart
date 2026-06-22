-- PostgreSQL Database Schema for Scholarmart MVP (v2 - WhatsApp Commerce & Reputation System)

-- Universities Table
CREATE TABLE IF NOT EXISTS universities (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Campuses Table
CREATE TABLE IF NOT EXISTS campuses (
    id SERIAL PRIMARY KEY,
    university_code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    whatsapp_number VARCHAR(20), -- Required for vendors, optional for buyers
    university VARCHAR(100) DEFAULT 'COOU',
    campus VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'buyer', -- 'buyer', 'vendor', 'admin'
    email_verified BOOLEAN DEFAULT FALSE,
    email_otp VARCHAR(6),
    email_otp_expires TIMESTAMP WITH TIME ZONE,
    portrait VARCHAR(255), -- profile picture url
    deals_completed INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'banned'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    university VARCHAR(100) DEFAULT 'COOU',
    campus VARCHAR(100) NOT NULL,
    vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    images JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'sold', 'reported', 'moderated', 'deleted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Deals Table (replaces Orders - tracks WhatsApp commerce transactions)
CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL, -- Product Price at time of deal
    status VARCHAR(30) DEFAULT 'pending_confirmation', -- 'pending_confirmation', 'completed', 'cancelled'
    confirmed_by_buyer BOOLEAN DEFAULT FALSE,
    rating INTEGER, -- 1-5 stars
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reports Table (Community-based trust system)
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reported_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table initialized empty. Admin adds categories.

-- Cart Items Table (Saved/Wishlist)
CREATE TABLE IF NOT EXISTS cart_items (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id)
);

-- Indexing for fast search and filter queries
CREATE INDEX IF NOT EXISTS idx_products_campus ON products(campus);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_deals_vendor ON deals(vendor_id);
CREATE INDEX IF NOT EXISTS idx_deals_buyer ON deals(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(reported_user_id);

-- Migration helpers for existing installations
ALTER TABLE users ADD COLUMN IF NOT EXISTS portrait VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deals_completed INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
