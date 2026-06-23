const express = require('express');
const router = express.Router();
const { rateVendorDirectly } = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

// POST /api/vendors/:id/rate — any authenticated buyer can rate a vendor
router.post('/:id/rate', authenticate, rateVendorDirectly);

module.exports = router;
