const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables (defaults if not provided)
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'scholarmart';
const DB_PORT = process.env.DB_PORT || 5432;

let pool = null;
let useFallback = false;
const fallbackFilePath = path.join(__dirname, '..', 'data', 'db_store.json');

// Ensure data folder exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Default seed data
const defaultUniversities = [];
const defaultCampuses = [];
const defaultCategories = [
    { id: 1, name: 'Electronics', created_at: new Date().toISOString() },
    { id: 2, name: 'Gadgets', created_at: new Date().toISOString() },
    { id: 3, name: 'Fashion & Clothing', created_at: new Date().toISOString() },
    { id: 4, name: 'Books & Academic Materials', created_at: new Date().toISOString() },
    { id: 5, name: 'Hostel Essentials', created_at: new Date().toISOString() },
    { id: 6, name: 'Creative & Handmade', created_at: new Date().toISOString() },
    { id: 7, name: 'Beauty & Personal Care', created_at: new Date().toISOString() },
    { id: 8, name: 'Sports & Fitness', created_at: new Date().toISOString() },
    { id: 9, name: 'Others', created_at: new Date().toISOString() }
];

let fallbackStore = {
    users: [],
    products: [],
    deals: [],
    cart_items: [],
    reports: [],
    universities: [...defaultUniversities],
    campuses: [...defaultCampuses],
    categories: [...defaultCategories],
    testimonials: []
};

// Seed default Admin in store
const seedAdminInStore = async (store) => {
    store.users = store.users.filter(u => u.email !== 'admin@scholarmart.com');

    const adminEmail = 'admin@scholarmats.com';
    const hasAdmin = store.users.find(u => u.email === adminEmail);
    if (!hasAdmin) {
        const hashedPassword = await bcrypt.hash('AdminPassword098', 10);
        store.users.push({
            id: store.users.length + 1,
            name: 'Scholarmart Admin',
            email: adminEmail,
            whatsapp_number: '08000000000',
            university: 'COOU',
            campus: 'Igbariam Campus',
            password_hash: hashedPassword,
            role: 'admin',
            email_verified: true,
            email_otp: null,
            email_otp_expires: null,
            portrait: null,
            deals_completed: 0,
            average_rating: 0,
            total_ratings: 0,
            report_count: 0,
            status: 'active',
            created_at: new Date().toISOString()
        });
    }
};

// Load store from file if it exists
if (fs.existsSync(fallbackFilePath)) {
    try {
        const fileContent = fs.readFileSync(fallbackFilePath, 'utf8');
        const loaded = JSON.parse(fileContent);
        
        // Migrate old store format to new format
        fallbackStore = {
            users: (loaded.users || []).map(u => ({
                ...u,
                whatsapp_number: u.whatsapp_number || u.phone || null,
                email_verified: u.email_verified !== undefined ? u.email_verified : (u.verification_status === 'approved'),
                email_otp: u.email_otp || u.verification_otp || null,
                email_otp_expires: u.email_otp_expires || u.verification_otp_expires || null,
                deals_completed: u.deals_completed || 0,
                average_rating: u.average_rating || 0,
                total_ratings: u.total_ratings || 0,
                report_count: u.report_count || 0
            })),
            products: loaded.products || [],
            deals: loaded.deals || loaded.orders || [],
            cart_items: loaded.cart_items || [],
            reports: loaded.reports || [],
            universities: loaded.universities && loaded.universities.length > 0 ? loaded.universities : [...defaultUniversities],
            campuses: loaded.campuses && loaded.campuses.length > 0 ? loaded.campuses : [...defaultCampuses],
            categories: loaded.categories && loaded.categories.length > 0 ? loaded.categories : [...defaultCategories],
            testimonials: loaded.testimonials || []
        };
    } catch (err) {
        console.error('Failed to parse fallback database JSON. Initializing clean store.', err);
    }
}

// Ensure admin is seeded
seedAdminInStore(fallbackStore).then(() => {
    saveFallbackStore();
});

function saveFallbackStore() {
    try {
        fs.writeFileSync(fallbackFilePath, JSON.stringify(fallbackStore, null, 2), 'utf8');
    } catch (err) {
        console.error('Failed to save fallback store to disk', err);
    }
}

// Attempt to initialize PG Pool
try {
    pool = new Pool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        port: DB_PORT,
        connectionTimeoutMillis: 2000
    });
} catch (e) {
    console.warn('PostgreSQL Pool initialization failed. Falling back to JSON Database.');
    useFallback = true;
}

// Test query helper for PostgreSQL
const testConnection = async () => {
    if (useFallback || !pool) return;
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('PostgreSQL Database Connected Successfully on port', DB_PORT);

        // Migration helper: Ensure last_login column exists in users table
        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        `);
        
        // Ensure categories table exists in Postgres
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Categories table initialized empty. Admin adds categories.

        // Ensure cart_items table exists in Postgres
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cart_items (
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, product_id)
            );
        `);

        // Ensure deals table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS deals (
                id SERIAL PRIMARY KEY,
                buyer_id INTEGER,
                product_id INTEGER NOT NULL,
                vendor_id INTEGER NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                status VARCHAR(30) DEFAULT 'pending_confirmation',
                confirmed_by_buyer BOOLEAN DEFAULT FALSE,
                rating INTEGER,
                review TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Ensure reports table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reports (
                id SERIAL PRIMARY KEY,
                reporter_id INTEGER NOT NULL,
                reported_user_id INTEGER,
                reported_product_id INTEGER,
                reason TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Ensure testimonials table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS testimonials (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                user_name VARCHAR(200) NOT NULL,
                campus VARCHAR(200),
                university VARCHAR(200),
                message TEXT NOT NULL,
                rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (err) {
        console.warn('PostgreSQL Database Connection/Init Failed. Falling back to local JSON database.', err);
        useFallback = true;
    }
};

testConnection();

// ============================================================
// FALLBACK QUERY ENGINE
// Maps SQL patterns used by controllers to local JSON operations
// ============================================================
function queryFallback(text, params = []) {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // --- CAMPUSES ---
    if (cleanText.toLowerCase().startsWith('select * from campuses')) {
        let campuses = fallbackStore.campuses || [];
        if (cleanText.includes('university_code = $1')) {
            const code = params[0];
            campuses = campuses.filter(c => c.university_code === code);
        }
        campuses = [...campuses].sort((a, b) => a.name.localeCompare(b.name));
        return { rows: campuses, rowCount: campuses.length };
    }

    // --- UNIVERSITIES ---
    if (cleanText.toLowerCase().startsWith('select * from universities') || cleanText.toLowerCase().includes('from universities')) {
        let universities = fallbackStore.universities || [];
        if (cleanText.includes('code = $1')) {
            const code = params[0]?.toLowerCase();
            universities = universities.filter(u => u.code?.toLowerCase() === code);
        }
        universities = [...universities].sort((a, b) => a.name.localeCompare(b.name));
        return { rows: universities, rowCount: universities.length };
    }

    if (cleanText.toLowerCase().includes('insert into universities')) {
        const newUniv = {
            id: (fallbackStore.universities || []).length + 1,
            code: params[0],
            name: params[1],
            created_at: new Date().toISOString()
        };
        if (!fallbackStore.universities) fallbackStore.universities = [];
        fallbackStore.universities.push(newUniv);
        saveFallbackStore();
        return { rows: [newUniv], rowCount: 1 };
    }

    if (cleanText.toLowerCase().includes('insert into campuses')) {
        const newCampus = {
            id: (fallbackStore.campuses || []).length + 1,
            university_code: params[0],
            name: params[1],
            created_at: new Date().toISOString()
        };
        if (!fallbackStore.campuses) fallbackStore.campuses = [];
        fallbackStore.campuses.push(newCampus);
        saveFallbackStore();
        return { rows: [newCampus], rowCount: 1 };
    }

    // --- USERS: SELECT BY EMAIL ---
    if (cleanText.includes('FROM users') && cleanText.includes('email = $1')) {
        const email = params[0]?.toLowerCase();
        const user = fallbackStore.users.find(u => u.email?.toLowerCase() === email);
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    // --- USERS: SELECT BY ID ---
    if (cleanText.includes('FROM users') && cleanText.includes('id = $1')) {
        const id = parseInt(params[0], 10);
        const user = fallbackStore.users.find(u => u.id === id);
        if (user) {
            const active_listings = (fallbackStore.products || []).filter(p => p.vendor_id === user.id && p.status === 'active').length;
            return { rows: [{ ...user, active_listings, last_login: user.last_login || user.created_at }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // --- USERS: INSERT ---
    if (cleanText.toLowerCase().startsWith('insert into users')) {
        const newUser = {
            id: fallbackStore.users.length + 1,
            name: params[0],
            email: params[1],
            whatsapp_number: params[2] || null,
            university: params[3] || 'COOU',
            campus: params[4],
            password_hash: params[5],
            role: params[6] || 'buyer',
            email_verified: false,
            email_otp: params[7] || null,
            email_otp_expires: params[8] || null,
            portrait: null,
            deals_completed: 0,
            average_rating: 0,
            total_ratings: 0,
            report_count: 0,
            status: 'active',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
        };
        fallbackStore.users.push(newUser);
        saveFallbackStore();
        return { rows: [newUser], rowCount: 1 };
    }

    // --- USERS: UPDATE email_otp ---
    if (cleanText.includes('UPDATE users') && cleanText.includes('email_otp = $1')) {
        const otp = params[0];
        const expires = params[1];
        const id = parseInt(params[2], 10);
        const userIdx = fallbackStore.users.findIndex(u => u.id === id);
        if (userIdx !== -1) {
            fallbackStore.users[userIdx].email_otp = otp;
            fallbackStore.users[userIdx].email_otp_expires = expires;
            saveFallbackStore();
            return { rows: [fallbackStore.users[userIdx]], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // --- USERS: UPDATE email_verified ---
    if (cleanText.includes('UPDATE users') && cleanText.includes('email_verified')) {
        const id = parseInt(params[params.length - 1], 10);
        const userIdx = fallbackStore.users.findIndex(u => u.id === id);
        if (userIdx !== -1) {
            fallbackStore.users[userIdx].email_verified = true;
            fallbackStore.users[userIdx].email_otp = null;
            fallbackStore.users[userIdx].email_otp_expires = null;
            saveFallbackStore();
            return { rows: [fallbackStore.users[userIdx]], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // --- USERS: Generic UPDATE ---
    if (cleanText.toLowerCase().startsWith('update users')) {
        const idIdx = params.length - 1;
        const id = parseInt(params[idIdx], 10);
        const userIdx = fallbackStore.users.findIndex(u => u.id === id);
        if (userIdx !== -1) {
            if (cleanText.includes('last_login =')) {
                fallbackStore.users[userIdx].last_login = new Date().toISOString();
            } else if (cleanText.includes('status = $1') && params.length === 2) {
                fallbackStore.users[userIdx].status = params[0];
            } else if (cleanText.includes('portrait = $1')) {
                fallbackStore.users[userIdx].portrait = params[0];
            } else if (cleanText.includes('deals_completed')) {
                fallbackStore.users[userIdx].deals_completed = parseInt(params[0], 10);
                if (cleanText.includes('average_rating')) {
                    fallbackStore.users[userIdx].average_rating = parseFloat(params[1]);
                    fallbackStore.users[userIdx].total_ratings = parseInt(params[2], 10);
                }
            } else if (cleanText.includes('report_count')) {
                fallbackStore.users[userIdx].report_count = parseInt(params[0], 10);
            } else if (cleanText.includes('password_hash = $1')) {
                fallbackStore.users[userIdx].password_hash = params[0];
            }
            saveFallbackStore();
            return { rows: [fallbackStore.users[userIdx]], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // --- USERS: SELECT ALL (Admin) ---
    if (cleanText.toLowerCase().startsWith('select * from users') || cleanText.toLowerCase().includes('from users u')) {
        const usersWithListings = fallbackStore.users.map(u => {
            const active_listings = (fallbackStore.products || []).filter(p => p.vendor_id === u.id && p.status === 'active').length;
            return { ...u, active_listings, last_login: u.last_login || u.created_at };
        });
        return { rows: usersWithListings, rowCount: usersWithListings.length };
    }

    // --- PRODUCTS: SELECT with vendor join (cart query or regular products) ---
    if (cleanText.toLowerCase().startsWith('select p.*, u.name as vendor_name') || 
        cleanText.toLowerCase().startsWith('select p.id, p.vendor_id') ||
        (cleanText.toLowerCase().includes('from products') && cleanText.toLowerCase().includes('join users'))) {
        // Check if this is a cart query
        if (cleanText.toLowerCase().includes('from cart_items')) {
            const userId = parseInt(params[0], 10);
            const cartItems = (fallbackStore.cart_items || [])
                .filter(sp => sp.user_id === userId)
                .map(sp => {
                    const product = fallbackStore.products.find(p => p.id === sp.product_id);
                    if (product && product.status === 'active') {
                        const vendor = fallbackStore.users.find(u => u.id === product.vendor_id);
                        return {
                            ...product,
                            vendor_name: vendor ? vendor.name : 'Unknown Vendor',
                            vendor_email_verified: vendor ? vendor.email_verified : false,
                            vendor_deals_completed: vendor ? (vendor.deals_completed || 0) : 0,
                            vendor_average_rating: vendor ? (vendor.average_rating || 0) : 0,
                            vendor_portrait: vendor ? (vendor.portrait || null) : null
                        };
                    }
                    return null;
                })
                .filter(p => p !== null);
            return { rows: cartItems, rowCount: cartItems.length };
        }

        // Regular products listing with vendor join
        let filtered = fallbackStore.products.filter(p => p.status !== 'deleted');

        if (cleanText.includes("p.status = 'active'") || cleanText.includes("status = 'active'")) {
            filtered = filtered.filter(p => p.status === 'active');
        } else if (cleanText.includes("p.status = 'pending'") || cleanText.includes("status = 'pending'")) {
            filtered = filtered.filter(p => p.status === 'pending');
        }

        if (cleanText.includes('p.vendor_id = $1') || cleanText.includes('vendor_id = $1')) {
            const vendorId = parseInt(params[0], 10);
            filtered = filtered.filter(p => p.vendor_id === vendorId);
        }

        const productsWithVendors = filtered.map(p => {
            const vendor = fallbackStore.users.find(u => u.id === p.vendor_id);
            return {
                ...p,
                vendor_name: vendor ? vendor.name : 'Unknown Vendor',
                vendor_email_verified: vendor ? vendor.email_verified : false,
                vendor_deals_completed: vendor ? (vendor.deals_completed || 0) : 0,
                vendor_average_rating: vendor ? (vendor.average_rating || 0) : 0,
                vendor_total_ratings: vendor ? (vendor.total_ratings || 0) : 0,
                vendor_role: vendor ? vendor.role : 'vendor',
                vendor_portrait: vendor ? (vendor.portrait || null) : null
            };
        });
        return { rows: productsWithVendors, rowCount: productsWithVendors.length };
    }

    // --- PRODUCTS: SELECT BY ID ---
    if (cleanText.includes('FROM products') && cleanText.includes('id = $1')) {
        const id = parseInt(params[0], 10);
        const product = fallbackStore.products.find(p => p.id === id);
        if (product) {
            const vendor = fallbackStore.users.find(u => u.id === product.vendor_id);
            const joinedProduct = {
                ...product,
                vendor_name: vendor ? vendor.name : 'Unknown Vendor',
                vendor_email: vendor ? vendor.email : '',
                vendor_whatsapp: vendor ? (vendor.whatsapp_number || '') : '',
                vendor_email_verified: vendor ? vendor.email_verified : false,
                vendor_deals_completed: vendor ? (vendor.deals_completed || 0) : 0,
                vendor_average_rating: vendor ? (vendor.average_rating || 0) : 0,
                vendor_total_ratings: vendor ? (vendor.total_ratings || 0) : 0,
                vendor_portrait: vendor ? (vendor.portrait || null) : null
            };
            return { rows: [joinedProduct], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // --- PRODUCTS: INSERT ---
    if (cleanText.toLowerCase().startsWith('insert into products')) {
        const newProduct = {
            id: fallbackStore.products.length + 1,
            name: params[0],
            description: params[1],
            price: parseFloat(params[2]),
            category: params[3],
            condition: params[4] || 'Brand New',
            university: params[5] || 'COOU',
            campus: params[6],
            vendor_id: parseInt(params[7], 10),
            image_url: params[8] || null,
            status: params[9] || 'pending',
            created_at: new Date().toISOString()
        };
        fallbackStore.products.push(newProduct);
        saveFallbackStore();
        return { rows: [newProduct], rowCount: 1 };
    }

    // --- PRODUCTS: UPDATE STATUS ---
    if (cleanText.includes('UPDATE products') && cleanText.includes('status = $1')) {
        const status = params[0];
        const id = parseInt(params[1], 10);
        const idx = fallbackStore.products.findIndex(p => p.id === id);
        if (idx !== -1) {
            fallbackStore.products[idx].status = status;
            saveFallbackStore();
            return { rows: [fallbackStore.products[idx]], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    if (cleanText.includes('UPDATE products') && (cleanText.includes("status = 'active'") || cleanText.includes("status = 'flagged'") || cleanText.includes("status = 'rejected'"))) {
        const id = parseInt(params[0], 10);
        let newStatus = 'active';
        if (cleanText.includes("status = 'flagged'")) newStatus = 'flagged';
        else if (cleanText.includes("status = 'rejected'")) newStatus = 'rejected';
        
        const idx = fallbackStore.products.findIndex(p => p.id === id);
        if (idx !== -1) {
            fallbackStore.products[idx].status = newStatus;
            saveFallbackStore();
            return { rows: [fallbackStore.products[idx]], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    if (cleanText.includes('UPDATE products') && cleanText.includes("status = 'sold'")) {
        const id = parseInt(params[0], 10);
        const idx = fallbackStore.products.findIndex(p => p.id === id);
        if (idx !== -1) {
            fallbackStore.products[idx].status = 'sold';
            saveFallbackStore();
            return { rows: [fallbackStore.products[idx]], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // --- PRODUCTS: DELETE ---
    if (cleanText.includes('DELETE FROM products') && cleanText.includes('id = $1')) {
        const id = parseInt(params[0], 10);
        const idx = fallbackStore.products.findIndex(p => p.id === id);
        if (idx !== -1) {
            fallbackStore.products[idx].status = 'deleted';
            saveFallbackStore();
            return { rows: [], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }
    if (cleanText.includes('DELETE FROM products') && cleanText.includes('vendor_id = $1')) {
        const vendorId = parseInt(params[0], 10);
        fallbackStore.products = (fallbackStore.products || []).filter(p => p.vendor_id !== vendorId);
        saveFallbackStore();
        return { rows: [], rowCount: 1 };
    }
    if (cleanText.includes('DELETE FROM users') && cleanText.includes('id = $1')) {
        const id = parseInt(params[0], 10);
        fallbackStore.users = (fallbackStore.users || []).filter(u => u.id !== id);
        saveFallbackStore();
        return { rows: [], rowCount: 1 };
    }
    if (cleanText.includes('DELETE FROM deals') && (cleanText.includes('vendor_id = $1') || cleanText.includes('buyer_id = $1'))) {
        const id = parseInt(params[0], 10);
        fallbackStore.deals = (fallbackStore.deals || []).filter(d => d.vendor_id !== id && d.buyer_id !== id);
        saveFallbackStore();
        return { rows: [], rowCount: 1 };
    }
    if (cleanText.includes('DELETE FROM cart_items') && cleanText.includes('user_id = $1')) {
        const id = parseInt(params[0], 10);
        fallbackStore.cart_items = (fallbackStore.cart_items || []).filter(c => c.user_id !== id);
        saveFallbackStore();
        return { rows: [], rowCount: 1 };
    }
    if (cleanText.includes('DELETE FROM reports') && (cleanText.includes('reporter_id = $1') || cleanText.includes('reported_user_id = $1'))) {
        const id = parseInt(params[0], 10);
        fallbackStore.reports = (fallbackStore.reports || []).filter(r => r.reporter_id !== id && r.reported_user_id !== id);
        saveFallbackStore();
        return { rows: [], rowCount: 1 };
    }
    if (cleanText.includes('DELETE FROM testimonials') && cleanText.includes('user_id = $1')) {
        const id = parseInt(params[0], 10);
        fallbackStore.testimonials = (fallbackStore.testimonials || []).filter(t => t.user_id !== id);
        saveFallbackStore();
        return { rows: [], rowCount: 1 };
    }

    // --- DEALS: UPDATE ---
    if (cleanText.toLowerCase().includes('update deals')) {
        const id = parseInt(params[params.length - 1], 10);
        if (!fallbackStore.deals) fallbackStore.deals = [];
        const idx = fallbackStore.deals.findIndex(d => d.id === id);
        if (idx !== -1) {
            if (cleanText.includes('confirmed_by_buyer')) {
                fallbackStore.deals[idx].confirmed_by_buyer = true;
                fallbackStore.deals[idx].status = 'completed';
            } else if (cleanText.includes('rating = $1')) {
                fallbackStore.deals[idx].rating = parseInt(params[0], 10);
                fallbackStore.deals[idx].review = params[1] || null;
            } else if (cleanText.includes('status = $1')) {
                fallbackStore.deals[idx].status = params[0];
            }
            saveFallbackStore();
            return { rows: [fallbackStore.deals[idx]], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // --- DEALS: SELECT with joins ---
    if (cleanText.toLowerCase().includes('from deals')) {
        // Count/volume analytics query
        if (cleanText.toLowerCase().includes('coalesce(sum(amount)')) {
            if (!fallbackStore.deals) fallbackStore.deals = [];
            const completedDeals = fallbackStore.deals.filter(d => d.status === 'completed');
            const totalDeals = completedDeals.length;
            const totalVolume = completedDeals.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
            return {
                rows: [{
                    count: totalDeals.toString(),
                    total_volume: totalVolume.toString()
                }],
                rowCount: 1
            };
        }

        if (cleanText.toLowerCase().includes('insert into deals')) {
            const newDeal = {
                id: (fallbackStore.deals || []).length + 1,
                buyer_id: params[0] ? parseInt(params[0], 10) : null,
                product_id: parseInt(params[1], 10),
                vendor_id: parseInt(params[2], 10),
                amount: parseFloat(params[3]),
                status: params[4] || 'pending_confirmation',
                confirmed_by_buyer: false,
                rating: null,
                review: null,
                created_at: new Date().toISOString()
            };
            if (!fallbackStore.deals) fallbackStore.deals = [];
            fallbackStore.deals.push(newDeal);
            saveFallbackStore();
            return { rows: [newDeal], rowCount: 1 };
        }

        // Select deals with joins
        if (!fallbackStore.deals) fallbackStore.deals = [];
        let deals = fallbackStore.deals;

        // Filter by vendor_id or buyer_id
        if (cleanText.includes('vendor_id = $1')) {
            const vendorId = parseInt(params[0], 10);
            deals = deals.filter(d => d.vendor_id === vendorId);
        } else if (cleanText.includes('buyer_id = $1')) {
            const buyerId = parseInt(params[0], 10);
            deals = deals.filter(d => d.buyer_id === buyerId);
        } else if (cleanText.includes('id = $1')) {
            const dealId = parseInt(params[0], 10);
            deals = deals.filter(d => d.id === dealId);
        }

        const dealsWithJoins = deals.map(d => {
            const product = fallbackStore.products.find(p => p.id === d.product_id);
            const buyer = fallbackStore.users.find(u => u.id === d.buyer_id);
            const vendor = fallbackStore.users.find(u => u.id === d.vendor_id);

            let imgList = [];
            if (product) {
                try {
                    imgList = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                } catch(e) {
                    imgList = [product.images];
                }
            }

            return {
                ...d,
                product_name: product ? product.name : 'Unknown Product',
                product_image: imgList && imgList.length > 0 ? imgList[0] : null,
                images: imgList || [],
                buyer_name: buyer ? buyer.name : 'Unknown Buyer',
                buyer_email: buyer ? buyer.email : '',
                buyer_whatsapp: buyer ? (buyer.whatsapp_number || '') : '',
                vendor_name: vendor ? vendor.name : 'Unknown Vendor',
                vendor_email: vendor ? vendor.email : '',
                vendor_whatsapp: vendor ? (vendor.whatsapp_number || '') : ''
            };
        });
        return { rows: dealsWithJoins, rowCount: dealsWithJoins.length };
    }

    // --- DEALS: INSERT (alternative pattern) ---
    if (cleanText.toLowerCase().startsWith('insert into deals')) {
        const newDeal = {
            id: (fallbackStore.deals || []).length + 1,
            buyer_id: params[0] ? parseInt(params[0], 10) : null,
            product_id: parseInt(params[1], 10),
            vendor_id: parseInt(params[2], 10),
            amount: parseFloat(params[3]),
            status: params[4] || 'pending_confirmation',
            confirmed_by_buyer: false,
            rating: null,
            review: null,
            created_at: new Date().toISOString()
        };
        if (!fallbackStore.deals) fallbackStore.deals = [];
        fallbackStore.deals.push(newDeal);
        saveFallbackStore();
        return { rows: [newDeal], rowCount: 1 };
    }

    // --- REPORTS: INSERT ---
    if (cleanText.toLowerCase().startsWith('insert into reports')) {
        const hasProduct = cleanText.includes('reported_product_id');
        const hasUser = cleanText.includes('reported_user_id');
        
        let reported_user_id = null;
        let reported_product_id = null;
        let reason = '';

        if (hasUser && hasProduct) {
            reported_user_id = params[1] ? parseInt(params[1], 10) : null;
            reported_product_id = params[2] ? parseInt(params[2], 10) : null;
            reason = params[3];
        } else if (hasUser) {
            reported_user_id = params[1] ? parseInt(params[1], 10) : null;
            reason = params[2];
        } else if (hasProduct) {
            reported_product_id = params[1] ? parseInt(params[1], 10) : null;
            reason = params[2];
        } else {
            reason = params[1];
        }

        const newReport = {
            id: (fallbackStore.reports || []).length + 1,
            reporter_id: parseInt(params[0], 10),
            reported_user_id,
            reported_product_id,
            reason,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        if (!fallbackStore.reports) fallbackStore.reports = [];
        fallbackStore.reports.push(newReport);
        saveFallbackStore();
        return { rows: [newReport], rowCount: 1 };
    }

    // --- REPORTS: SELECT ---
    if (cleanText.toLowerCase().includes('from reports')) {
        if (!fallbackStore.reports) fallbackStore.reports = [];
        let reports = fallbackStore.reports;

        if (cleanText.includes('reported_user_id = $1')) {
            const userId = parseInt(params[0], 10);
            reports = reports.filter(r => r.reported_user_id === userId);
        }

        const reportsWithJoins = reports.map(r => {
            const reporter = fallbackStore.users.find(u => u.id === r.reporter_id);
            const reportedUser = fallbackStore.users.find(u => u.id === r.reported_user_id);
            const reportedProduct = fallbackStore.products.find(p => p.id === r.reported_product_id);
            return {
                ...r,
                reporter_name: reporter ? reporter.name : 'Unknown',
                reporter_email: reporter ? reporter.email : '',
                reported_user_name: reportedUser ? reportedUser.name : 'N/A',
                reported_user_email: reportedUser ? reportedUser.email : '',
                reported_product_name: reportedProduct ? reportedProduct.name : 'N/A'
            };
        });
        return { rows: reportsWithJoins, rowCount: reportsWithJoins.length };
    }

    // --- CART ITEMS ---
    if (cleanText.toLowerCase().startsWith('select') && cleanText.includes('FROM cart_items WHERE user_id = $1')) {
        const userId = parseInt(params[0], 10);
        const cartItems = (fallbackStore.cart_items || [])
            .filter(sp => sp.user_id === userId)
            .map(sp => {
                const product = fallbackStore.products.find(p => p.id === sp.product_id);
                if (product) {
                    const vendor = fallbackStore.users.find(u => u.id === product.vendor_id);
                    return {
                        ...product,
                        vendor_name: vendor ? vendor.name : 'Unknown Vendor',
                        vendor_email_verified: vendor ? vendor.email_verified : false,
                        vendor_deals_completed: vendor ? (vendor.deals_completed || 0) : 0,
                        vendor_portrait: vendor ? (vendor.portrait || null) : null
                    };
                }
                return null;
            })
            .filter(p => p !== null);
        return { rows: cartItems, rowCount: cartItems.length };
    }

    if (cleanText.toLowerCase().startsWith('insert into cart_items')) {
        const userId = parseInt(params[0], 10);
        const productId = parseInt(params[1], 10);
        if (!fallbackStore.cart_items) fallbackStore.cart_items = [];
        const exists = fallbackStore.cart_items.find(sp => sp.user_id === userId && sp.product_id === productId);
        if (!exists) {
            fallbackStore.cart_items.push({ user_id: userId, product_id: productId, created_at: new Date().toISOString() });
            saveFallbackStore();
        }
        return { rows: [], rowCount: 1 };
    }

    if (cleanText.toLowerCase().includes("from cart_items where user_id = $1 and product_id = $2")) {
        const userId = parseInt(params[0], 10);
        const productId = parseInt(params[1], 10);
        if (!fallbackStore.cart_items) fallbackStore.cart_items = [];
        fallbackStore.cart_items = fallbackStore.cart_items.filter(sp => !(sp.user_id === userId && sp.product_id === productId));
        saveFallbackStore();
        return { rows: [], rowCount: 1 };
    }

    // --- CATEGORIES ---
    if (cleanText.toLowerCase().startsWith('select * from categories')) {
        const categories = fallbackStore.categories || [];
        return { rows: categories, rowCount: categories.length };
    }

    if (cleanText.toLowerCase().includes('insert into categories')) {
        const name = params[0];
        if (!fallbackStore.categories) fallbackStore.categories = [];
        const exists = fallbackStore.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            return { rows: [exists], rowCount: 1 };
        }
        const newCat = {
            id: fallbackStore.categories.length + 1,
            name,
            created_at: new Date().toISOString()
        };
        fallbackStore.categories.push(newCat);
        saveFallbackStore();
        return { rows: [newCat], rowCount: 1 };
    }

    // --- ADMIN REPORTS: Count non-admin users ---
    if (cleanText.toLowerCase().includes("select count(*) as count from users where role != 'admin'")) {
        const nonAdmin = fallbackStore.users.filter(u => u.role !== 'admin');
        return { rows: [{ count: nonAdmin.length }], rowCount: 1 };
    }

    // --- ADMIN REPORTS: Count listings ---
    if (cleanText.toLowerCase().includes("select count(*) as count from products where status != 'deleted'")) {
        const activeListings = fallbackStore.products.filter(p => p.status !== 'deleted');
        return { rows: [{ count: activeListings.length }], rowCount: 1 };
    }

    // --- ADMIN REPORTS: Deals analytics ---
    if (cleanText.toLowerCase().includes("from deals where status") || cleanText.toLowerCase().includes("from deals")) {
        if (!fallbackStore.deals) fallbackStore.deals = [];
        const completedDeals = fallbackStore.deals.filter(d => d.status === 'completed');
        const totalDeals = completedDeals.length;
        const totalVolume = completedDeals.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
        return {
            rows: [{
                count: totalDeals.toString(),
                total_volume: totalVolume.toString()
            }],
            rowCount: 1
        };
    }

    // --- TESTIMONIALS: SELECT approved ---
    if (cleanText.toLowerCase().includes('from testimonials') && cleanText.toLowerCase().includes("status = 'approved'")) {
        if (!fallbackStore.testimonials) fallbackStore.testimonials = [];
        const approved = fallbackStore.testimonials
            .filter(t => t.status === 'approved')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 20);
        return { rows: approved, rowCount: approved.length };
    }

    // --- TESTIMONIALS: SELECT pending ---
    if (cleanText.toLowerCase().includes('from testimonials') && cleanText.toLowerCase().includes("status = 'pending'")) {
        if (!fallbackStore.testimonials) fallbackStore.testimonials = [];
        const pending = fallbackStore.testimonials
            .filter(t => t.status === 'pending')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return { rows: pending, rowCount: pending.length };
    }

    // --- TESTIMONIALS: INSERT ---
    if (cleanText.toLowerCase().includes('insert into testimonials')) {
        if (!fallbackStore.testimonials) fallbackStore.testimonials = [];
        const newTestimonial = {
            id: fallbackStore.testimonials.length + 1,
            user_id: parseInt(params[0], 10),
            user_name: params[1],
            campus: params[2] || '',
            university: params[3] || '',
            message: params[4],
            rating: parseInt(params[5], 10) || 5,
            status: params[6] || 'pending',
            created_at: new Date().toISOString()
        };
        fallbackStore.testimonials.push(newTestimonial);
        saveFallbackStore();
        return { rows: [newTestimonial], rowCount: 1 };
    }

    // --- TESTIMONIALS: UPDATE status (approve/reject) ---
    if (cleanText.toLowerCase().includes('update testimonials') && cleanText.toLowerCase().includes('status =')) {
        if (!fallbackStore.testimonials) fallbackStore.testimonials = [];
        const id = parseInt(params[0], 10);
        let newStatus = 'approved';
        if (cleanText.toLowerCase().includes("status = 'rejected'")) {
            newStatus = 'rejected';
        }
        const idx = fallbackStore.testimonials.findIndex(t => t.id === id);
        if (idx !== -1) {
            fallbackStore.testimonials[idx].status = newStatus;
            saveFallbackStore();
            return { rows: [fallbackStore.testimonials[idx]], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    console.warn('Unhandled SQL fallback query:', cleanText, params);
    return { rows: [], rowCount: 0 };
}

module.exports = {
    query: async (text, params) => {
        if (useFallback || !pool) {
            return queryFallback(text, params);
        }
        try {
            return await pool.query(text, params);
        } catch (err) {
            console.error('PostgreSQL query execution failed. Attempting Fallback query.', err);
            return queryFallback(text, params);
        }
    },
    isFallback: () => useFallback || !pool
};

