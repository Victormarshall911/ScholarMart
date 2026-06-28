const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Target directory paths in the public static folder
const uploadBaseDir = process.env.VERCEL
    ? path.join('/tmp', 'uploads')
    : path.join(__dirname, '..', '..', 'public', 'uploads');
const productsDir = path.join(uploadBaseDir, 'products');
const portraitsDir = path.join(uploadBaseDir, 'portraits');

// Create upload folders if they don't exist
[uploadBaseDir, productsDir, portraitsDir].forEach(dir => {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    } catch (e) {
        console.warn(`Could not create directory ${dir}: ${e.message}`);
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
}).any(); // Allow any image field names (image, images, file)

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

// Upload file to Supabase Storage — returns a permanent public CDN URL
const processUploadedFile = async (file, bucketName = 'products') => {
    if (!file) return null;

    try {
        const { supabaseAdmin } = require('../config/db');

        if (!supabaseAdmin) {
            console.error('supabaseAdmin not initialized — check SUPABASE_SERVICE_KEY in .env');
            return null;
        }

        // Read file buffer (works for multer disk storage)
        let fileBuffer;
        if (file.path && fs.existsSync(file.path)) {
            fileBuffer = fs.readFileSync(file.path);
        } else if (file.buffer) {
            fileBuffer = file.buffer; // memoryStorage fallback
        } else {
            console.error('File has no readable path or buffer');
            return null;
        }

        const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        const cleanName = (file.originalname || 'image').replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${cleanName}`;

        const { data, error } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(fileName, fileBuffer, {
                contentType: file.mimetype || 'image/jpeg',
                upsert: false
            });

        // Clean up temp file regardless
        if (file.path) {
            try { fs.unlinkSync(file.path); } catch (e) {}
        }

        if (error) {
            console.error(`Supabase Storage upload error (${bucketName}):`, error.message);
            return null;
        }

        const { data: publicData } = supabaseAdmin.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return publicData?.publicUrl || null;

    } catch (err) {
        console.error('processUploadedFile error:', err.message);
        // Clean up temp file on error
        if (file.path) {
            try { fs.unlinkSync(file.path); } catch (e) {}
        }
        return null;
    }
};

module.exports = {
    uploadProductImages,
    uploadPortrait,
    processUploadedFile
};
