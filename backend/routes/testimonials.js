const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/testimonials — Public: fetch approved testimonials
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM testimonials WHERE status = 'approved' ORDER BY created_at DESC LIMIT 20`
        );
        res.json({ status: 'success', testimonials: result.rows });
    } catch (err) {
        console.error('Testimonials fetch error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch testimonials' });
    }
});

// POST /api/testimonials — Authenticated: submit a new testimonial (pending approval)
router.post('/', authenticate, async (req, res) => {
    const { message, rating } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;
    const campus = req.user.campus || '';
    const university = req.user.university || '';

    if (!message || message.trim().length < 10) {
        return res.status(400).json({ status: 'error', message: 'Feedback must be at least 10 characters.' });
    }
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ status: 'error', message: 'Please select a star rating (1–5).' });
    }

    try {
        const result = await db.query(
            `INSERT INTO testimonials (user_id, user_name, campus, university, message, rating, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [userId, userName, campus, university, message.trim(), parseInt(rating, 10), 'pending']
        );
        res.status(201).json({
            status: 'success',
            message: 'Thank you! Your feedback has been submitted and will appear once approved.',
            testimonial: result.rows[0]
        });
    } catch (err) {
        console.error('Testimonial submit error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to submit feedback.' });
    }
});

// GET /api/testimonials/pending — Admin: get all pending testimonials
router.get('/pending', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Admin access required.' });
    }
    try {
        const result = await db.query(
            `SELECT * FROM testimonials WHERE status = 'pending' ORDER BY created_at DESC`
        );
        res.json({ status: 'success', testimonials: result.rows });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch pending testimonials.' });
    }
});

// POST /api/testimonials/:id/approve — Admin: approve a testimonial
router.post('/:id/approve', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Admin access required.' });
    }
    try {
        const result = await db.query(
            `UPDATE testimonials SET status = 'approved' WHERE id = $1 RETURNING *`,
            [req.params.id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Testimonial not found.' });
        }
        res.json({ status: 'success', message: 'Testimonial approved and published.' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Failed to approve testimonial.' });
    }
});

// POST /api/testimonials/:id/reject — Admin: reject a testimonial
router.post('/:id/reject', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Admin access required.' });
    }
    try {
        const result = await db.query(
            `UPDATE testimonials SET status = 'rejected' WHERE id = $1 RETURNING *`,
            [req.params.id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Testimonial not found.' });
        }
        res.json({ status: 'success', message: 'Testimonial rejected.' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Failed to reject testimonial.' });
    }
});

module.exports = router;
