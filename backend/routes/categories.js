const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM categories');
        res.json({ status: 'success', categories: result.rows });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Add a category (DISABLED: predefined categories only)
router.post('/', authenticate, isAdmin, async (req, res) => {
    return res.status(403).json({ status: 'error', message: 'Category addition is disabled. Predefined categories are fixed.' });
});

module.exports = router;
