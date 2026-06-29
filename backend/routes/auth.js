const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { uploadPortrait } = require('../middleware/upload');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/universities', authController.getUniversities);
router.get('/campuses', authController.getCampuses);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);

// Authenticated routes
router.post('/upload-portrait', authenticate, uploadPortrait, authController.uploadPortrait);

module.exports = router;
