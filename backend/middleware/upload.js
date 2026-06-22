const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Target directory paths in the public static folder
const uploadBaseDir = path.join(__dirname, '..', '..', 'public', 'uploads');
const productsDir = path.join(uploadBaseDir, 'products');
const portraitsDir = path.join(uploadBaseDir, 'portraits');

// Create upload folders if they don't exist
[uploadBaseDir, productsDir, portraitsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// File type filter helper
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (JPEG, JPG, PNG, WEBP) are allowed'));
    }
};

// Storage for Product Images
const productStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, productsDir);
    },
    filename: (req, file, cb) => {
        const userId = req.user ? req.user.id : 'anon';
        const uniqueSuffix = Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `product-${userId}-${Date.now()}-${uniqueSuffix}${ext}`);
    }
});

const uploadProductImages = multer({
    storage: productStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per image
    fileFilter: fileFilter
}).array('images', 5); // Allow up to 5 images

// Storage for profile portraits
const portraitStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, portraitsDir);
    },
    filename: (req, file, cb) => {
        const userId = req.user ? req.user.id : 'anon';
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `portrait-${userId}-${Date.now()}${ext}`);
    }
});

const uploadPortrait = multer({
    storage: portraitStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
}).single('portrait');

module.exports = {
    uploadProductImages,
    uploadPortrait
};
