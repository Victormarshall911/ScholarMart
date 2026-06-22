const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { uploadPortrait } = require('../middleware/upload');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/universities', authController.getUniversities);
router.get('/campuses', authController.getCampuses);

// Authenticated routes
router.post('/send-otp', authenticate, authController.sendOtp);
router.post('/verify-otp', authenticate, authController.verifyOtp);
router.post('/upload-portrait', authenticate, uploadPortrait, authController.uploadPortrait);

module.exports = router;
