const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, isVendor } = require('../middleware/auth');

// Public or API redirect polling verification
router.get('/verify/:reference', orderController.verifyPayment);

// Authenticated routes
router.post('/initialize', authenticate, orderController.initializeOrder);
router.get('/buyer', authenticate, orderController.getBuyerOrders);
router.get('/vendor', authenticate, isVendor, orderController.getVendorSales);
router.put('/:id/status', authenticate, orderController.updateOrderStatus);

module.exports = router;
