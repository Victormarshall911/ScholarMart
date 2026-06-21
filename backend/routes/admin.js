const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Flag/Report product - Authenticated (Buyer role is sufficient)
router.post('/products/:id/report', authenticate, adminController.reportProduct);

// Admin Specific Routes - Enforces JWT + Admin role
router.use(authenticate, isAdmin);

// Student Verifications
router.get('/verifications', adminController.getPendingVerifications);
router.post('/verifications/:userId', adminController.updateVerificationStatus);

// Product Moderation
router.get('/moderation', adminController.getReportedProducts);
router.post('/moderation/:id', adminController.moderateProduct);

// User Management
router.get('/users', adminController.getAllUsers);
router.post('/users/:id/status', adminController.updateUserAccountStatus);
router.post('/users/:id/reset-password', adminController.resetUserPassword);

// Reports & Revenue Analytics
router.get('/reports', adminController.getReports);

module.exports = router;
