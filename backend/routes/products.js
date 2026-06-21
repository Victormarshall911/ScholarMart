const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, isVendor } = require('../middleware/auth');
const { uploadProductImages } = require('../middleware/upload');

// Public routes
router.get('/', productController.listProducts);
router.get('/:id(\\d+)', productController.getProductDetails);

// Authenticated bookmarks routes
router.get('/saved', authenticate, productController.getSavedProducts);
router.post('/save', authenticate, productController.saveProduct);
router.delete('/save/:productId', authenticate, productController.unsaveProduct);

// Vendor/Admin routes
router.post('/', authenticate, isVendor, uploadProductImages, productController.createProduct);
router.put('/:id', authenticate, isVendor, uploadProductImages, productController.updateProduct);
router.delete('/:id', authenticate, isVendor, productController.deleteProduct);

module.exports = router;
