const express = require('express');
const router = express.Router();
const dealController = require('../controllers/orderController');
const { authenticate, isVendor } = require('../middleware/auth');

// Deal tracking routes (WhatsApp Commerce)
router.post('/mark-sold', authenticate, isVendor, dealController.markAsSold);
router.post('/:id/confirm', authenticate, dealController.confirmDeal);
router.post('/:id/rate', authenticate, dealController.rateDeal);
router.get('/buyer', authenticate, dealController.getBuyerDeals);
router.get('/vendor', authenticate, isVendor, dealController.getVendorDeals);
router.put('/:id/status', authenticate, dealController.updateDealStatus);

module.exports = router;
