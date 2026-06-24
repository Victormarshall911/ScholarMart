require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Fixes undici ConnectTimeoutError with Cloudflare

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create public directories if they do not exist
const publicDir = path.join(__dirname, '..', 'public');
const uploadsDir = process.env.VERCEL
    ? path.join('/tmp', 'uploads')
    : path.join(publicDir, 'uploads');
const productsDir = path.join(uploadsDir, 'products');

[publicDir, uploadsDir, productsDir].forEach(dir => {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    } catch (e) {
        console.warn(`Could not create directory ${dir}: ${e.message}`);
    }
});

// Seed a default placeholder product image if it doesn't exist
const placeholderPath = path.join(productsDir, 'placeholder.webp');
if (!fs.existsSync(placeholderPath)) {
    // Write an empty 1x1 transparent GIF/WebP if missing just to prevent 404s
    const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    try {
        fs.writeFileSync(placeholderPath, transparentGif);
    } catch (e) {
        console.warn('Failed to write placeholder.webp:', e.message);
    }
}

// Serve entire public directory as static folder (serves frontend SPA & uploads)
app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));

// Register routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const categoryRoutes = require('./routes/categories');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/vendors', require('./routes/vendors'));

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.message);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`========================================================`);
    console.log(` Scholarmart MVP Server started on port ${PORT}`);
    console.log(` Running in Dual-Mode (PG DB / JSON Fallback active)`);
    console.log(` Frontend URL: http://localhost:${PORT}`);
    console.log(`========================================================`);
});

// Capture uncaught process exceptions
process.on('uncaughtException', (err) => {
    console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL UNHANDLED REJECTION AT:', promise, 'REASON:', reason);
});

module.exports = app;
