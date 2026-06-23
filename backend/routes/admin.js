const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Flag/Report product - Authenticated (Buyer role is sufficient)
router.post('/products/:id/report', authenticate, adminController.reportProduct);

// Report seller - Authenticated (Buyer role is sufficient)
router.post('/users/:id/report', authenticate, adminController.reportSeller);

// Admin Specific Routes - Enforces JWT + Admin role
router.use(authenticate, isAdmin);

// Product Moderation
router.get('/moderation', adminController.getReportedProducts);
router.post('/moderation/:id', adminController.moderateProduct);

// User Management
router.get('/users', adminController.getAllUsers);
router.post('/users/:id/status', adminController.updateUserAccountStatus);
router.post('/users/:id/reset-password', adminController.resetUserPassword);
router.delete('/users/:id', adminController.deleteUser);

// Reports & Analytics
router.get('/reports', adminController.getReports);
router.get('/all-reports', adminController.getAllReports);
router.get('/deals', adminController.getAllDeals);

// University & Campus Management
router.post('/universities', adminController.addUniversity);
router.post('/campuses', adminController.addCampus);

module.exports = router;
