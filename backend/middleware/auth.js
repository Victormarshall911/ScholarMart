const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'scholarmart-secret-key-12345678';

// General Authenticate Middleware
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ status: 'error', message: 'No authentication token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const result = await db.query('SELECT id, name, email, role, email_verified, status FROM users WHERE id = $1', [decoded.id]);
        if (result.rowCount === 0) {
            return res.status(401).json({ status: 'error', message: 'User no longer exists' });
        }

        const user = result.rows[0];
        if (user.status === 'suspended' || user.status === 'banned') {
            return res.status(403).json({ status: 'error', message: 'Your account has been suspended or banned' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
    }
};

// Admin Guard
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Access denied: Admin role required' });
    }
    next();
};

// Vendor Guard (Admins are also allowed to list items if needed)
const isVendor = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    next();
};

module.exports = {
    authenticate,
    isAdmin,
    isVendor,
    JWT_SECRET
};
