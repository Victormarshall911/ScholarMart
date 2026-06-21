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

// In-memory data store for fallback
let fallbackStore = {
    users: [],
    products: [],
    orders: [],
    saved_products: [],
    campuses: [
        { id: 1, university_code: 'COOU', name: 'Igbariam Campus' },
        { id: 2, university_code: 'COOU', name: 'Uli Campus' },
        { id: 3, university_code: 'UNIZIK', name: 'Awka Campus' },
        { id: 4, university_code: 'UNIZIK', name: 'Nnewi Campus' },
        { id: 5, university_code: 'UNN', name: 'Nsukka Campus' },
        { id: 6, university_code: 'UNN', name: 'Enugu Campus' },
        { id: 7, university_code: 'FUTO', name: 'Owerri Campus' },
        { id: 8, university_code: 'UNILAG', name: 'Akoka Campus' },
        { id: 9, university_code: 'UNILAG', name: 'Yaba Campus' },
        { id: 10, university_code: 'LASU', name: 'Ojo Campus' },
        { id: 11, university_code: 'LASU', name: 'Ikeja Campus' },
        { id: 12, university_code: 'OAU', name: 'Ile-Ife Campus' },
        { id: 13, university_code: 'ABSU', name: 'Uturu Campus' },
        { id: 14, university_code: 'ESUT', name: 'Agbani Campus' }
    ]
};

// Seed default Admin in store
const seedAdminInStore = async (store) => {
    // Remove old admin if exists
    store.users = store.users.filter(u => u.email !== 'admin@scholarmart.com');

    const adminEmail = 'admin@scholarmats.com';
    const hasAdmin = store.users.find(u => u.email === adminEmail);
    if (!hasAdmin) {
        const hashedPassword = await bcrypt.hash('AdminPassword098', 10);
        store.users.push({
            id: store.users.length + 1,
            name: 'Scholarmart Admin',
            email: adminEmail,
            phone: '08000000000',
            university: 'COOU',
            campus: 'Igbariam Campus',
            password_hash: hashedPassword,
            role: 'admin',
            verification_status: 'approved',
            verification_method: 'email',
            verification_file: null,
            verification_otp: null,
            bank_name: null,
            bank_account_number: null,
            bank_account_name: null,
            paystack_subaccount_code: null,
            status: 'active',
            created_at: new Date().toISOString()
        });
    }
};

// Load store from file if it exists
if (fs.existsSync(fallbackFilePath)) {
    try {
        const fileContent = fs.readFileSync(fallbackFilePath, 'utf8');
        fallbackStore = JSON.parse(fileContent);
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
        connectionTimeoutMillis: 2000 // Short timeout for fallback checking
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
    } catch (err) {
        console.warn('PostgreSQL Connection Failed. Falling back to local JSON database.');
        useFallback = true;
    }
};

testConnection();

// Fallback Query Engine Simulation
// This maps specific SQL strings used by the controllers to local JSON array manipulations
function queryFallback(text, params = []) {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // 1. SELECT * FROM campuses
    if (cleanText.toLowerCase().startsWith('select * from campuses')) {
        return { rows: fallbackStore.campuses, rowCount: fallbackStore.campuses.length };
    }

    // 2. SELECT * FROM users WHERE email = $1
    if (cleanText.includes('FROM users') && cleanText.includes('email = $1')) {
        const email = params[0]?.toLowerCase();
        const user = fallbackStore.users.find(u => u.email?.toLowerCase() === email);
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    // 3. SELECT * FROM users WHERE id = $1
    if (cleanText.includes('FROM users') && cleanText.includes('id = $1')) {
        const id = parseInt(params[0], 10);
        const user = fallbackStore.users.find(u => u.id === id);
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    // 4. INSERT INTO users ... RETURNING id/RETURNING *
    if (cleanText.toLowerCase().startsWith('insert into users')) {
        // [name, email, phone, university, campus, password_hash, role, bank_name, bank_account_number, bank_account_name, paystack_subaccount_code, verification_status, verification_method, verification_file]
        const newUser = {
            id: fallbackStore.users.length + 1,
            name: params[0],
            email: params[1],
            phone: params[2],
            university: params[3] || 'COOU',
            campus: params[4],
            password_hash: params[5],
            role: params[6] || 'buyer',
            bank_name: params[7] || null,
            bank_account_number: params[8] || null,
            bank_account_name: params[9] || null,
            paystack_subaccount_code: params[10] || null,
            verification_status: params[11] || 'pending',
            verification_method: params[12] || null,
            verification_file: params[13] || null,
            verification_otp: null,
            verification_otp_expires: null,
            portrait: null,
            status: 'active',
            created_at: new Date().toISOString()
        };
        fallbackStore.users.push(newUser);
        saveFallbackStore();
        return { rows: [newUser], rowCount: 1 };
    }

    // 5. UPDATE users SET verification_otp = $1, verification_otp_expires = $2 WHERE id = $3
    if (cleanText.includes('UPDATE users') && cleanText.includes('verification_otp = $1')) {
        const otp = params[0];
        const expires = params[1];
        const id = parseInt(params[2], 10);
        const userIdx = fallbackStore.users.findIndex(u => u.id === id);
        if (userIdx !== -1) {
            fallbackStore.users[userIdx].verification_otp = otp;
            fallbackStore.users[userIdx].verification_otp_expires = expires;
            saveFallbackStore();
            return { rows: [fallbackStore.users[userIdx]], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // 6. UPDATE users
    if (cleanText.toLowerCase().startsWith('update users')) {
        const idIdx = params.length - 1;
        const id = parseInt(params[idIdx], 10);
        const userIdx = fallbackStore.users.findIndex(u => u.id === id);
        if (userIdx !== -1) {
            if (cleanText.includes('verification_status = $1') && params.length === 2) {
                fallbackStore.users[userIdx].verification_status = params[0];
            } else if (cleanText.includes('verification_status = $1') && cleanText.includes('verification_method = $2')) {
                fallbackStore.users[userIdx].verification_status = params[0];
                fallbackStore.users[userIdx].verification_method = params[1];
            } else if (cleanText.includes('paystack_subaccount_code = $1') || cleanText.includes('paystack_subaccount_code =')) {
                fallbackStore.users[userIdx].paystack_subaccount_code = params[0];
            } else if (cleanText.includes('status = $1')) {
                fallbackStore.users[userIdx].status = params[0];
            } else if (cleanText.includes('portrait = $1')) {
                fallbackStore.users[userIdx].portrait = params[0];
            }
            saveFallbackStore();
            return { rows: [fallbackStore.users[userIdx]], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // 7. SELECT * FROM users (For Admin View)
    if (cleanText.toLowerCase().startsWith('select * from users') && !cleanText.includes('where')) {
        return { rows: fallbackStore.users, rowCount: fallbackStore.users.length };
    }

    // 8. SELECT * FROM products
    if (cleanText.toLowerCase().startsWith('select p.*, u.name as vendor_name')) {
        // Includes joins
        // Filter options are resolved at the controller level or here
        // We will return all active products joined with vendor name
        const productsWithVendors = fallbackStore.products
            .filter(p => p.status !== 'deleted')
            .map(p => {
                const vendor = fallbackStore.users.find(u => u.id === p.vendor_id);
                return {
                    ...p,
                    vendor_name: vendor ? vendor.name : 'Unknown Vendor',
                    vendor_verification: vendor ? vendor.verification_status : 'pending',
                    vendor_role: vendor ? vendor.role : 'vendor',
                    vendor_portrait: vendor ? (vendor.portrait || null) : null
                };
            });
        return { rows: productsWithVendors, rowCount: productsWithVendors.length };
    }

    // 9. SELECT * FROM products WHERE id = $1
    if (cleanText.includes('FROM products') && cleanText.includes('id = $1')) {
        const id = parseInt(params[0], 10);
        const product = fallbackStore.products.find(p => p.id === id);
        if (product) {
            const vendor = fallbackStore.users.find(u => u.id === product.vendor_id);
            const joinedProduct = {
                ...product,
                vendor_name: vendor ? vendor.name : 'Unknown Vendor',
                vendor_email: vendor ? vendor.email : '',
                vendor_phone: vendor ? vendor.phone : '',
                vendor_verification: vendor ? vendor.verification_status : 'pending',
                vendor_portrait: vendor ? (vendor.portrait || null) : null,
                subaccount: vendor ? vendor.paystack_subaccount_code : null
            };
            return { rows: [joinedProduct], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // 10. INSERT INTO products
    if (cleanText.toLowerCase().startsWith('insert into products')) {
        // [name, description, price, category, university, campus, vendor_id, images]
        const newProduct = {
            id: fallbackStore.products.length + 1,
            name: params[0],
            description: params[1],
            price: parseFloat(params[2]),
            category: params[3],
            university: params[4] || 'COOU',
            campus: params[5],
            vendor_id: parseInt(params[6], 10),
            images: typeof params[7] === 'string' ? JSON.parse(params[7]) : params[7],
            status: 'active',
            created_at: new Date().toISOString()
        };
        fallbackStore.products.push(newProduct);
        saveFallbackStore();
        return { rows: [newProduct], rowCount: 1 };
    }

    // 11. UPDATE products SET status = $1 WHERE id = $2
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

    // 12. DELETE FROM products WHERE id = $1
    if (cleanText.includes('DELETE FROM products') && cleanText.includes('id = $1')) {
        const id = parseInt(params[0], 10);
        const idx = fallbackStore.products.findIndex(p => p.id === id);
        if (idx !== -1) {
            // Logical or physical delete, let's do physical delete or status = deleted
            fallbackStore.products[idx].status = 'deleted';
            saveFallbackStore();
            return { rows: [], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // 13. SELECT * FROM orders
    if (cleanText.toLowerCase().startsWith('select o.*, p.name as product_name')) {
        // Joins orders, buyers, products, vendors
        const ordersWithJoins = fallbackStore.orders.map(o => {
            const product = fallbackStore.products.find(p => p.id === o.product_id);
            const buyer = fallbackStore.users.find(u => u.id === o.buyer_id);
            const vendor = fallbackStore.users.find(u => u.id === o.vendor_id);
            return {
                ...o,
                product_name: product ? product.name : 'Unknown Product',
                product_image: product && product.images ? product.images[0] : null,
                buyer_name: buyer ? buyer.name : 'Unknown Buyer',
                vendor_name: vendor ? vendor.name : 'Unknown Vendor'
            };
        });
        return { rows: ordersWithJoins, rowCount: ordersWithJoins.length };
    }

    // 14. INSERT INTO orders
    if (cleanText.toLowerCase().startsWith('insert into orders')) {
        // [buyer_id, product_id, vendor_id, amount, service_fee, total_amount, status, paystack_reference, paystack_split_code]
        const newOrder = {
            id: fallbackStore.orders.length + 1,
            buyer_id: parseInt(params[0], 10),
            product_id: parseInt(params[1], 10),
            vendor_id: parseInt(params[2], 10),
            amount: parseFloat(params[3]),
            service_fee: parseFloat(params[4]),
            total_amount: parseFloat(params[5]),
            status: params[6] || 'pending',
            paystack_reference: params[7],
            paystack_split_code: params[8],
            created_at: new Date().toISOString()
        };
        fallbackStore.orders.push(newOrder);
        saveFallbackStore();
        return { rows: [newOrder], rowCount: 1 };
    }

    // 15. SELECT * FROM orders WHERE paystack_reference = $1
    if (cleanText.includes('FROM orders') && cleanText.includes('paystack_reference = $1')) {
        const ref = params[0];
        const order = fallbackStore.orders.find(o => o.paystack_reference === ref);
        return { rows: order ? [order] : [], rowCount: order ? 1 : 0 };
    }

    // 16. UPDATE orders
    if (cleanText.toLowerCase().startsWith('update orders')) {
        let id, statusVal;
        if (cleanText.includes("status = 'paid'") && cleanText.includes("id = $1")) {
            id = parseInt(params[0], 10);
            statusVal = 'paid';
        } else {
            statusVal = params[0];
            id = parseInt(params[1], 10);
        }

        const idx = fallbackStore.orders.findIndex(o => o.id === id);
        if (idx !== -1) {
            fallbackStore.orders[idx].status = statusVal;
            saveFallbackStore();
            return { rows: [fallbackStore.orders[idx]], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // 17. Saved products queries
    if (cleanText.includes('FROM saved_products WHERE user_id = $1')) {
        const userId = parseInt(params[0], 10);
        const saved = fallbackStore.saved_products
            .filter(sp => sp.user_id === userId)
            .map(sp => {
                const product = fallbackStore.products.find(p => p.id === sp.product_id);
                if (product) {
                    const vendor = fallbackStore.users.find(u => u.id === product.vendor_id);
                    return {
                        ...product,
                        vendor_name: vendor ? vendor.name : 'Unknown Vendor',
                        vendor_verification: vendor ? vendor.verification_status : 'pending',
                        vendor_portrait: vendor ? (vendor.portrait || null) : null
                    };
                }
                return null;
            })
            .filter(p => p !== null);
        return { rows: saved, rowCount: saved.length };
    }

    if (cleanText.toLowerCase().startsWith('insert into saved_products')) {
        const userId = parseInt(params[0], 10);
        const productId = parseInt(params[1], 10);
        const exists = fallbackStore.saved_products.find(sp => sp.user_id === userId && sp.product_id === productId);
        if (!exists) {
            fallbackStore.saved_products.push({ user_id: userId, product_id: productId, created_at: new Date().toISOString() });
            saveFallbackStore();
        }
        return { rows: [], rowCount: 1 };
    }

    if (cleanText.toLowerCase().includes("from saved_products where user_id = $1 and product_id = $2")) {
        const userId = parseInt(params[0], 10);
        const productId = parseInt(params[1], 10);
        fallbackStore.saved_products = fallbackStore.saved_products.filter(sp => !(sp.user_id === userId && sp.product_id === productId));
        saveFallbackStore();
        return { rows: [], rowCount: 1 };
    }

    // 18. Admin Reports: Count non-admin users
    if (cleanText.toLowerCase().includes("select count(*) as count from users where role != 'admin'")) {
        const nonAdmin = fallbackStore.users.filter(u => u.role !== 'admin');
        return { rows: [{ count: nonAdmin.length }], rowCount: 1 };
    }

    // 19. Admin Reports: Count listings
    if (cleanText.toLowerCase().includes("select count(*) as count from products where status != 'deleted'")) {
        const activeListings = fallbackStore.products.filter(p => p.status !== 'deleted');
        return { rows: [{ count: activeListings.length }], rowCount: 1 };
    }

    // 20. Admin Reports: Transactions revenue sum flat split fee
    if (cleanText.toLowerCase().includes("from orders where status in ('paid', 'shipped', 'completed')")) {
        const paidOrders = fallbackStore.orders.filter(o => ['paid', 'shipped', 'completed'].includes(o.status));
        const totalSales = paidOrders.reduce((sum, o) => sum + parseFloat(o.amount), 0);
        const totalFees = paidOrders.reduce((sum, o) => sum + parseFloat(o.service_fee), 0);
        return {
            rows: [{
                count: paidOrders.length.toString(),
                total_sales: totalSales.toString(),
                total_fees: totalFees.toString()
            }],
            rowCount: 1
        };
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
