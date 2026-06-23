const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables (defaults if not provided)
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'scholarmart';
const DB_PORT = process.env.DB_PORT || 5432;

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.warn('Supabase URL or Key is missing. Supabase Auth will not work properly.');
}

let pool = null;

const connectionString = process.env.DATABASE_URL || `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?pgbouncer=true`;

try {
    pool = new Pool({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000 // Give it 15 seconds for remote Supabase DB
    });
} catch (e) {
    console.error('PostgreSQL Pool initialization failed:', e.message);
}

// Test connection helper
const testConnection = async () => {
    if (!pool) return;
    try {
        await pool.query('SELECT NOW()');
        console.log('PostgreSQL Database Connected Successfully on port', DB_PORT);
    } catch (err) {
        console.error('PostgreSQL Database Connection Failed:', err.message);
    }
};

testConnection();

module.exports = {
    query: async (text, params) => {
        if (!pool) {
            throw new Error('Database pool is not initialized.');
        }
        return await pool.query(text, params);
    },
    isFallback: () => false,
    supabase
};
