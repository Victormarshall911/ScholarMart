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

// Add a category (Admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).json({ status: 'error', message: 'Category name is required' });
    }
    try {
        const result = await db.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name.trim()]);
        res.status(201).json({ status: 'success', category: result.rows[0] });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
