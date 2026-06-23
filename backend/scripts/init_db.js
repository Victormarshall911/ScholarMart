require('dotenv').config();
const { Pool } = require('pg');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'postgres';
const DB_PORT = process.env.DB_PORT || 5432;

const connectionString = process.env.DATABASE_URL || `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?pgbouncer=true`;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function initDB() {
    try {
        console.log('Initializing Postgres Database Schema...');

        // 1. Users Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                whatsapp_number VARCHAR(20),
                university VARCHAR(50),
                campus VARCHAR(100),
                password_hash VARCHAR(255),
                role VARCHAR(20) DEFAULT 'buyer',
                email_verified BOOLEAN DEFAULT FALSE,
                status VARCHAR(20) DEFAULT 'active',
                portrait VARCHAR(255),
                last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('- users table created');

        // 2. Products Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(12, 2) NOT NULL,
                condition VARCHAR(50),
                category VARCHAR(100),
                image_url VARCHAR(255),
                university VARCHAR(50),
                campus VARCHAR(100),
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('- products table created');

        // 3. Testimonials Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS testimonials (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                user_name VARCHAR(200) NOT NULL,
                campus VARCHAR(200),
                university VARCHAR(200),
                message TEXT NOT NULL,
                rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('- testimonials table created');

        // 4. Categories Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('- categories table created');

        // 5. Cart Items Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cart_items (
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, product_id)
            );
        `);
        console.log('- cart_items table created');

        // 6. Deals/Orders Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS deals (
                id SERIAL PRIMARY KEY,
                buyer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                amount DECIMAL(12, 2) NOT NULL,
                status VARCHAR(30) DEFAULT 'pending_confirmation',
                confirmed_by_buyer BOOLEAN DEFAULT FALSE,
                rating INTEGER,
                review TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('- deals table created');

        // 7. Reports Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reports (
                id SERIAL PRIMARY KEY,
                reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                reported_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                reported_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                reason TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('- reports table created');

        console.log('Database initialization completed successfully!');

    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        pool.end();
    }
}

initDB();
