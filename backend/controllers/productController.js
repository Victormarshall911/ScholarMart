const db = require('../config/db');
const { getBadgeInfo } = require('./authController');
const { processUploadedFile } = require('../middleware/upload');

// 1. Get All Products (With Filters)
exports.listProducts = async (req, res) => {
    try {
        const { search, category, campus, university, minPrice, maxPrice } = req.query;

        // Fetch all active products
        // Note: Joining user to get vendor details
        const sql = `
            SELECT p.id, p.vendor_id, p.name, p.description, p.price, p.category, p.campus,
                   p.university, p.image_url, p.status, p.created_at,
                   u.name as vendor_name, u.role as vendor_role, u.portrait as vendor_portrait,
                   u.deals_completed as vendor_deals_completed, u.average_rating as vendor_average_rating,
                   u.email_verified as vendor_email_verified
            FROM products p
            JOIN users u ON p.vendor_id = u.id
            WHERE p.status = 'active'
        `;
        
        const result = await db.query(sql);
        let products = result.rows;

        // Apply filters in memory to guarantee support on both postgres and JSON fallback database
        if (search) {
            const queryLower = search.toLowerCase();
            products = products.filter(p => 
                p.name.toLowerCase().includes(queryLower) || 
                (p.description && p.description.toLowerCase().includes(queryLower))
            );
        }

        if (category) {
            products = products.filter(p => p.category === category);
        }

        if (campus) {
            products = products.filter(p => p.campus.toLowerCase() === campus.toLowerCase());
        }

        if (university) {
            products = products.filter(p => p.university.toLowerCase() === university.toLowerCase());
        }

        if (minPrice) {
            const min = parseFloat(minPrice);
            products = products.filter(p => p.price >= min);
        }

        if (maxPrice) {
            const max = parseFloat(maxPrice);
            products = products.filter(p => p.price <= max);
        }

        // Add trust signals
        const enrichedProducts = products.map(p => {
            const dealsCompleted = parseInt(p.vendor_deals_completed, 10) || 0;
            const avgRating = parseFloat(p.vendor_average_rating) || 0;
            const badge = getBadgeInfo(dealsCompleted, avgRating);
            // Normalize image_url into an images array for frontend compatibility
            const images = p.image_url ? [p.image_url] : ['/uploads/products/placeholder.webp'];
            return {
                ...p,
                images,
                vendor: {
                    name: p.vendor_name,
                    portrait: p.vendor_portrait || null,
                    email_verified: p.vendor_email_verified || false,
                    deals_completed: dealsCompleted,
                    average_rating: avgRating,
                    badge,
                    responseTime: 'Typically replies in 2 hours'
                }
            };
        });

        return res.json({
            status: 'success',
            count: enrichedProducts.length,
            products: enrichedProducts,
            data: enrichedProducts
        });
    } catch (error) {
        console.error('List products error:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to retrieve products' });
    }
};

// 2. Get Single Product Details
exports.getProductDetails = async (req, res) => {
    try {
        const productId = parseInt(req.params.id, 10);
        
        const sql = `
            SELECT p.id, p.vendor_id, p.name, p.description, p.price, p.category, p.campus,
                   p.university, p.image_url, p.status, p.created_at,
                   u.name as vendor_name, u.email as vendor_email, u.whatsapp_number as vendor_whatsapp,
                   u.portrait as vendor_portrait, u.deals_completed as vendor_deals_completed,
                   u.average_rating as vendor_average_rating, u.email_verified as vendor_email_verified
            FROM products p
            JOIN users u ON p.vendor_id = u.id
            WHERE p.id = $1 AND p.status != 'deleted'
        `;

        const result = await db.query(sql, [productId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Product not found or has been removed' });
        }

        const product = result.rows[0];

        // Normalize image_url into an images array for frontend compatibility
        const images = product.image_url ? [product.image_url] : ['/uploads/products/placeholder.webp'];

        // WhatsApp Direct Link generation
        const prefilledText = encodeURIComponent(`Hello, I am interested in your product: "${product.name}" from ScholarMart`);
        let formattedPhone = product.vendor_whatsapp || '';
        if (formattedPhone) {
            formattedPhone = formattedPhone.trim();
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '234' + formattedPhone.substring(1);
            } else if (!formattedPhone.startsWith('+') && !formattedPhone.startsWith('234')) {
                formattedPhone = '234' + formattedPhone;
            }
            formattedPhone = formattedPhone.replace(/\+/g, '').replace(/\s/g, '');
        }
        const whatsappLink = formattedPhone ? `https://wa.me/${formattedPhone}?text=${prefilledText}` : null;

        const dealsCompleted = parseInt(product.vendor_deals_completed, 10) || 0;
        const avgRating = parseFloat(product.vendor_average_rating) || 0;
        const badge = getBadgeInfo(dealsCompleted, avgRating);

        return res.json({
            status: 'success',
            product: {
                id: product.id,
                name: product.name,
                description: product.description,
                price: parseFloat(product.price),
                category: product.category,
                university: product.university,
                campus: product.campus,
                images: images || [],
                status: product.status,
                created_at: product.created_at,
                vendor: {
                    id: product.vendor_id,
                    name: product.vendor_name,
                    email: product.vendor_email,
                    whatsapp: product.vendor_whatsapp || null,
                    email_verified: product.vendor_email_verified || false,
                    deals_completed: dealsCompleted,
                    average_rating: avgRating,
                    badge,
                    portrait: product.vendor_portrait || null,
                    responseTime: 'Typically replies in 2 hours',
                    whatsappLink
                }
            }
        });
    } catch (error) {
        console.error('Get product details error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error retrieving product details' });
    }
};

// 2.5 Get Vendor's Own Products
exports.getVendorProducts = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const sql = `
            SELECT p.*, u.name as vendor_name, u.whatsapp_number
            FROM products p
            JOIN users u ON p.vendor_id = u.id
            WHERE p.vendor_id = $1 AND p.status != 'deleted'
            ORDER BY p.created_at DESC
        `;
        const result = await db.query(sql, [vendorId]);
        return res.status(200).json({
            status: 'success',
            data: result.rows
        });
    } catch (error) {
        console.error('Get vendor products error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error fetching vendor inventory' });
    }
};

// 3. Create Product Listing
exports.createProduct = async (req, res) => {
    try {
        const name = req.body.name;
        const description = req.body.description;
        const price = req.body.price;
        const category = req.body.category;
        const condition = req.body.condition || 'Brand New';
        const campus = req.body.campus || req.body.location || 'Igbariam';
        const university = req.body.university || 'COOU';
        const vendorId = req.user.id;

        if (req.body.vendor_whatsapp) {
            try { await db.query('UPDATE users SET whatsapp_number = $1 WHERE id = $2', [req.body.vendor_whatsapp, vendorId]); } catch(e) {}
        }

        // Validations
        if (!name || !price || !category || !campus) {
            return res.status(400).json({ status: 'error', message: 'Product name, price, category, and campus are required' });
        }

        // Check vendor email verification status
        const userCheck = await db.query('SELECT email_verified FROM users WHERE id = $1', [vendorId]);
        const emailVerified = userCheck.rows[0]?.email_verified || false;

        // Process upload: upload to Supabase Storage and get CDN URL
        let imageUrl = null;
        if (req.files && req.files.length > 0) {
            imageUrl = await processUploadedFile(req.files[0], 'products');
        }
        // Use a generic placeholder if no image was uploaded or upload failed
        if (!imageUrl) {
            imageUrl = `https://placehold.co/400x300/1a1a2e/ffffff?text=${encodeURIComponent(name || 'Product')}`;
        }

        const sql = `
            INSERT INTO products (name, description, price, category, condition, university, campus, vendor_id, image_url, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
        `;

        const result = await db.query(sql, [
            name,
            description || '',
            parseFloat(price),
            category,
            condition,
            university || 'COOU',
            campus,
            vendorId,
            imageUrl,
            'active'
        ]);

        return res.status(201).json({
            status: 'success',
            message: 'Product listed successfully!',
            productId: result.rows[0].id,
            product: result.rows[0]
        });
    } catch (error) {
        console.error('Create product error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error listing product' });
    }
};

// 4. Update Product Listing
exports.updateProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const userRole = req.user.role;
        const { name, description, price, category, campus } = req.body;

        // Check ownership
        const prodCheck = await db.query('SELECT vendor_id FROM products WHERE id = $1 AND status != \'deleted\'', [productId]);
        if (prodCheck.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        }

        const product = prodCheck.rows[0];
        if (product.vendor_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Unauthorized: You do not own this listing' });
        }

        // Process new image if provided
        let newImageUrl;
        if (req.files && req.files.length > 0) {
            newImageUrl = await processUploadedFile(req.files[0], 'products') || `/uploads/products/${req.files[0].filename}`;
        }

        // Update fields
        const currentCheck = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
        const current = currentCheck.rows[0];

        const updatedName = name || current.name;
        const updatedDescription = description !== undefined ? description : current.description;
        const updatedPrice = price !== undefined ? parseFloat(price) : current.price;
        const updatedCategory = category || current.category;
        const updatedCampus = campus || current.campus;
        const updatedImageUrl = newImageUrl || current.image_url;

        const updateSql = `
            UPDATE products 
            SET name = $1, description = $2, price = $3, category = $4, campus = $5, image_url = $6
            WHERE id = $7 RETURNING *
        `;

        const result = await db.query(updateSql, [
            updatedName, updatedDescription, updatedPrice, updatedCategory, updatedCampus,
            updatedImageUrl,
            productId
        ]);

        return res.json({
            status: 'success',
            message: 'Product listing updated successfully',
            product: result.rows[0]
        });
    } catch (error) {
        console.error('Update product error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error updating product' });
    }
};

// 5. Delete Product Listing (Logical delete via status)
exports.deleteProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const userRole = req.user.role;

        const prodCheck = await db.query('SELECT vendor_id FROM products WHERE id = $1 AND status != \'deleted\'', [productId]);
        if (prodCheck.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        }

        const product = prodCheck.rows[0];
        if (product.vendor_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Unauthorized: You do not own this listing' });
        }

        await db.query('UPDATE products SET status = \'deleted\' WHERE id = $1', [productId]);

        return res.json({
            status: 'success',
            message: 'Listing deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error deleting product' });
    }
};

// 6. Add Product to Cart
exports.saveProduct = async (req, res) => {
    try {
        const productId = parseInt(req.body.productId, 10);
        const userId = req.user.id;

        if (!productId) {
            return res.status(400).json({ status: 'error', message: 'productId is required' });
        }

        // Insert into cart_items
        await db.query(
            'INSERT INTO cart_items (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, productId]
        );

        return res.json({ status: 'success', message: 'Product added to cart' });
    } catch (error) {
        console.error('Add cart product error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error adding product to cart' });
    }
};

// 7. Remove Product from Cart
exports.unsaveProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        const userId = req.user.id;

        await db.query(
            'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        return res.json({ status: 'success', message: 'Product removed from cart' });
    } catch (error) {
        console.error('Remove cart product error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error removing product from cart' });
    }
};

// 8. Get Cart Products
exports.getSavedProducts = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            `SELECT p.id, p.vendor_id, p.name, p.description, p.price, p.category, p.campus,
                    p.image_url, p.status, p.created_at,
                    u.name as vendor_name, u.email_verified as vendor_email_verified, u.portrait as vendor_portrait, u.whatsapp_number
             FROM cart_items sp
             JOIN products p ON sp.product_id = p.id
             JOIN users u ON p.vendor_id = u.id
             WHERE sp.user_id = $1 AND p.status = 'active'`,
            [userId]
        );

        return res.json({
            status: 'success',
            products: result.rows.map(p => ({
                ...p,
                images: p.image_url ? [p.image_url] : ['/uploads/products/placeholder.webp'],
                vendor: {
                    name: p.vendor_name,
                    verified: p.vendor_email_verified || false,
                    portrait: p.vendor_portrait || null
                }
            }))
        });
    } catch (error) {
        console.error('Get cart products error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error retrieving cart products' });
    }
};
