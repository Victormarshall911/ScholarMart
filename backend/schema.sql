-- PostgreSQL Database Schema for Scholarmart MVP

-- Enable extension for UUID if needed, though we will use standard serial/auto-incrementing IDs for simplicity
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    phone VARCHAR(20) NOT NULL,
    university VARCHAR(100) DEFAULT 'COOU',
    campus VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'buyer', -- 'buyer', 'vendor', 'admin'
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    verification_method VARCHAR(20), -- 'email' or 'id_card'
    verification_file VARCHAR(255), -- URL/Path to ID card upload
    verification_otp VARCHAR(6), -- OTP stored for verification
    verification_otp_expires TIMESTAMP WITH TIME ZONE,
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(20),
    bank_account_name VARCHAR(150),
    paystack_subaccount_code VARCHAR(50),
    portrait VARCHAR(255), -- profile picture url
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Electronics', 'Fashion', 'Books', 'Hostel Essentials', 'Gadgets', 'Beauty Products', 'Food & Snacks'
    university VARCHAR(100) DEFAULT 'COOU',
    campus VARCHAR(100) NOT NULL,
    vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs/paths
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'reported', 'moderated', 'deleted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL, -- Product Price
    service_fee DECIMAL(12, 2) DEFAULT 500.00, -- Platfee (₦500)
    total_amount DECIMAL(12, 2) NOT NULL, -- Price + Service Fee
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'completed', 'cancelled'
    paystack_reference VARCHAR(100) UNIQUE,
    paystack_split_code VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Saved Products Table (Bookmarks)
CREATE TABLE IF NOT EXISTS saved_products (
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

-- Insert Pilot Campuses
INSERT INTO campuses (university_code, name) VALUES 
('COOU', 'Igbariam Campus'),
('COOU', 'Uli Campus'),
('UNIZIK', 'Awka Campus'),
('UNIZIK', 'Nnewi Campus'),
('UNN', 'Nsukka Campus'),
('UNN', 'Enugu Campus'),
('FUTO', 'Owerri Campus'),
('UNILAG', 'Akoka Campus'),
('UNILAG', 'Yaba Campus'),
('LASU', 'Ojo Campus'),
('LASU', 'Ikeja Campus'),
('OAU', 'Ile-Ife Campus'),
('ABSU', 'Uturu Campus'),
('ESUT', 'Agbani Campus')
ON CONFLICT DO NOTHING;

-- Migration to ensure portrait column exists on existing installations
ALTER TABLE users ADD COLUMN IF NOT EXISTS portrait VARCHAR(255);
