const db = require('../config/db');
const { getBadgeInfo } = require('./authController');

// 1. Mark Product as Sold (Vendor marks an item as sold after WhatsApp deal)
exports.markAsSold = async (req, res) => {
    try {
        const { productId, buyerId } = req.body;
        const vendorId = req.user.id;

        if (!productId) {
            return res.status(400).json({ status: 'error', message: 'productId is required' });
        }

        // Fetch product
        const prodResult = await db.query(
            `SELECT * FROM products WHERE id = $1 AND status = 'active'`,
            [productId]
        );

        if (prodResult.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Product not found or already sold' });
        }

        const product = prodResult.rows[0];

        if (product.vendor_id !== vendorId) {
            return res.status(403).json({ status: 'error', message: 'Only the product vendor can mark items as sold' });
        }

        const productPrice = parseFloat(product.price);

        // Create deal record
        const dealResult = await db.query(
            `INSERT INTO deals (buyer_id, product_id, vendor_id, amount, status)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [buyerId || null, productId, vendorId, productPrice, 'pending_confirmation']
        );

        const dealId = dealResult.rows[0].id;

        // Mark product status as sold
        await db.query(`UPDATE products SET status = 'sold' WHERE id = $1`, [productId]);

        return res.status(201).json({
            status: 'success',
            message: 'Product marked as sold! Waiting for buyer confirmation.',
            dealId
        });

    } catch (error) {
        console.error('Mark as sold error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error marking product as sold' });
    }
};

// 2. Confirm Deal (Buyer confirms they received the product)
exports.confirmDeal = async (req, res) => {
    try {
        const dealId = parseInt(req.params.id, 10);
        const buyerId = req.user.id;

        // Fetch deal
        const dealResult = await db.query('SELECT * FROM deals WHERE id = $1', [dealId]);
        if (dealResult.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Deal not found' });
        }

        const deal = dealResult.rows[0];

        // Buyer can confirm (or vendor if buyer_id is null — cash deals)
        if (deal.buyer_id && deal.buyer_id !== buyerId && req.user.role !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Only the buyer can confirm this deal' });
        }

        // Mark deal as completed
        await db.query(
            `UPDATE deals SET confirmed_by_buyer = true, status = 'completed' WHERE id = $1`,
            [dealId]
        );

        // Increment vendor's deals_completed count
        const vendorResult = await db.query('SELECT deals_completed FROM users WHERE id = $1', [deal.vendor_id]);
        if (vendorResult.rowCount > 0) {
            const newCount = (vendorResult.rows[0].deals_completed || 0) + 1;
            await db.query('UPDATE users SET deals_completed = $1 WHERE id = $2', [newCount, deal.vendor_id]);
        }

        return res.json({
            status: 'success',
            message: 'Deal confirmed! Thank you for using ScholarMart. 🎉'
        });

    } catch (error) {
        console.error('Confirm deal error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error confirming deal' });
    }
};

// 3. Rate Seller (After deal confirmation)
exports.rateDeal = async (req, res) => {
    try {
        const dealId = parseInt(req.params.id, 10);
        const { rating, review } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ status: 'error', message: 'Rating must be between 1 and 5' });
        }

        // Fetch deal
        const dealResult = await db.query('SELECT * FROM deals WHERE id = $1', [dealId]);
        if (dealResult.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Deal not found' });
        }

        const deal = dealResult.rows[0];

        if (deal.status !== 'completed') {
            return res.status(400).json({ status: 'error', message: 'Deal must be completed before rating' });
        }

        if (deal.rating) {
            return res.status(400).json({ status: 'error', message: 'This deal has already been rated' });
        }

        // Save rating on deal
        await db.query(
            `UPDATE deals SET rating = $1, review = $2 WHERE id = $3`,
            [rating, review || null, dealId]
        );

        // Recalculate vendor's average rating
        const vendorResult = await db.query('SELECT average_rating, total_ratings FROM users WHERE id = $1', [deal.vendor_id]);
        if (vendorResult.rowCount > 0) {
            const vendor = vendorResult.rows[0];
            const oldTotal = vendor.total_ratings || 0;
            const oldAvg = parseFloat(vendor.average_rating) || 0;
            const newTotal = oldTotal + 1;
            const newAvg = ((oldAvg * oldTotal) + rating) / newTotal;

            await db.query(
                `UPDATE users SET average_rating = $1, total_ratings = $2 WHERE id = $3`,
                [Math.round(newAvg * 100) / 100, newTotal, deal.vendor_id]
            );
        }

        return res.json({
            status: 'success',
            message: 'Thank you for rating this seller! ⭐'
        });

    } catch (error) {
        console.error('Rate deal error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error rating deal' });
    }
};

// 4. Get Buyer Deals
exports.getBuyerDeals = async (req, res) => {
    try {
        const buyerId = req.user.id;
        const result = await db.query(
            `SELECT d.*, p.name as product_name, p.images, u.name as vendor_name, u.whatsapp_number as vendor_whatsapp
             FROM deals d
             JOIN products p ON d.product_id = p.id
             JOIN users u ON d.vendor_id = u.id
             WHERE d.buyer_id = $1
             ORDER BY d.created_at DESC`,
            [buyerId]
        );

        const formattedDeals = result.rows.map(d => {
            let images = d.images;
            if (typeof images === 'string') {
                try { images = JSON.parse(images); } catch (e) { images = []; }
            }
            const vendorBadge = getBadgeInfo(d.vendor_deals_completed || 0, parseFloat(d.vendor_average_rating) || 0);
            return {
                ...d,
                images: images || [],
                product_name: d.product_name,
                vendor: {
                    name: d.vendor_name,
                    whatsapp: d.vendor_whatsapp,
                    badge: vendorBadge
                }
            };
        });

        return res.json({ status: 'success', deals: formattedDeals });
    } catch (error) {
        console.error('Get buyer deals error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error fetching deals' });
    }
};

// 5. Get Vendor Deals
exports.getVendorDeals = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const result = await db.query(
            `SELECT d.*, p.name as product_name, p.images, u.name as buyer_name, u.whatsapp_number as buyer_whatsapp
             FROM deals d
             JOIN products p ON d.product_id = p.id
             LEFT JOIN users u ON d.buyer_id = u.id
             WHERE d.vendor_id = $1
             ORDER BY d.created_at DESC`,
            [vendorId]
        );

        const formattedDeals = result.rows.map(d => {
            let images = d.images;
            if (typeof images === 'string') {
                try { images = JSON.parse(images); } catch (e) { images = []; }
            }
            return {
                ...d,
                images: images || [],
                product_name: d.product_name,
                buyer: {
                    name: d.buyer_name || 'Walk-in Buyer',
                    whatsapp: d.buyer_whatsapp || ''
                }
            };
        });

        return res.json({ status: 'success', deals: formattedDeals });
    } catch (error) {
        console.error('Get vendor deals error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error fetching deals' });
    }
};

// 6. Update Deal Status (Vendor or Admin)
exports.updateDealStatus = async (req, res) => {
    try {
        const dealId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const userRole = req.user.role;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ status: 'error', message: 'Status is required' });
        }

        const dealResult = await db.query('SELECT * FROM deals WHERE id = $1', [dealId]);
        if (dealResult.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Deal not found' });
        }

        const deal = dealResult.rows[0];

        if (deal.vendor_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Unauthorized' });
        }

        await db.query('UPDATE deals SET status = $1 WHERE id = $2', [status, dealId]);

        return res.json({
            status: 'success',
            message: `Deal status updated to: ${status}`
        });
    } catch (error) {
        console.error('Update deal status error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error updating deal status' });
    }
};
