const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { getBadgeInfo } = require('./authController');

// 1. Report/Flag a Product (Callable by Buyers)
exports.reportProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id, 10);
        const reporterId = req.user.id;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ status: 'error', message: 'A reason is required when reporting a product' });
        }

        // Create report record
        await db.query(
            'INSERT INTO reports (reporter_id, reported_product_id, reason) VALUES ($1, $2, $3)',
            [reporterId, productId, reason]
        );

        // Update product status to 'reported'
        await db.query(
            "UPDATE products SET status = 'reported' WHERE id = $1 AND status = 'active'",
            [productId]
        );

        return res.json({
            status: 'success',
            message: 'Product reported successfully. Admin review is pending.'
        });
    } catch (error) {
        console.error('Report product error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error reporting product' });
    }
};

// 2. Report a Seller (Community-based reporting)
exports.reportSeller = async (req, res) => {
    try {
        const sellerId = parseInt(req.params.id, 10);
        const reporterId = req.user.id;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ status: 'error', message: 'A reason is required when reporting a seller' });
        }

        if (sellerId === reporterId) {
            return res.status(400).json({ status: 'error', message: 'You cannot report yourself' });
        }

        // Create report record
        await db.query(
            'INSERT INTO reports (reporter_id, reported_user_id, reason) VALUES ($1, $2, $3)',
            [reporterId, sellerId, reason]
        );

        // Increment user's report count
        const userResult = await db.query('SELECT report_count FROM users WHERE id = $1', [sellerId]);
        if (userResult.rowCount > 0) {
            const newCount = (userResult.rows[0].report_count || 0) + 1;
            await db.query('UPDATE users SET report_count = $1 WHERE id = $2', [newCount, sellerId]);

            // Auto-ban if report_count exceeds threshold (3+)
            if (newCount >= 3) {
                await db.query("UPDATE users SET status = 'banned' WHERE id = $1", [sellerId]);
                console.log(`[AUTO-BAN] User #${sellerId} has been auto-banned after ${newCount} reports.`);
            }
        }

        return res.json({
            status: 'success',
            message: 'Seller reported. Admin will review the report.'
        });
    } catch (error) {
        console.error('Report seller error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error reporting seller' });
    }
};

// 3. List Flagged/Reported Products for Moderation
exports.getReportedProducts = async (req, res) => {
    try {
        const sql = `
            SELECT p.*, u.name as vendor_name, u.email as vendor_email
            FROM products p
            JOIN users u ON p.vendor_id = u.id
            WHERE p.status = 'reported'
            ORDER BY p.created_at DESC
        `;

        const result = await db.query(sql);

        const products = result.rows.map(p => {
            let images = p.images;
            if (typeof images === 'string') {
                try { images = JSON.parse(images); } catch (e) { images = []; }
            }
            return {
                ...p,
                images: images || [],
                vendor: { name: p.vendor_name, email: p.vendor_email }
            };
        });

        return res.json({
            status: 'success',
            count: products.length,
            reportedProducts: products
        });
    } catch (error) {
        console.error('Get reported products error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error retrieving flagged products' });
    }
};

// 4. Moderate Listing (Approve or Ban)
exports.moderateProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id, 10);
        const { action } = req.body;

        if (!action || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ status: 'error', message: 'Action is required (approve/reject)' });
        }

        const newStatus = action === 'approve' ? 'active' : 'moderated';

        const result = await db.query(
            'UPDATE products SET status = $1 WHERE id = $2 RETURNING id, name, status',
            [newStatus, productId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        }

        return res.json({
            status: 'success',
            message: `Product Listing #${productId} moderated. Action: ${action}`,
            product: result.rows[0]
        });
    } catch (error) {
        console.error('Moderate product error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error moderating listing' });
    }
};

// 5. User Management: View All Users
exports.getAllUsers = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.*,
                   (SELECT COUNT(*) FROM products p WHERE p.vendor_id = u.id AND p.status = 'active') as active_listings
            FROM users u
            ORDER BY u.created_at DESC
        `);
        const users = result.rows.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            whatsapp_number: u.whatsapp_number,
            university: u.university,
            campus: u.campus,
            role: u.role,
            email_verified: u.email_verified || false,
            deals_completed: u.deals_completed || 0,
            average_rating: parseFloat(u.average_rating) || 0,
            total_ratings: u.total_ratings || 0,
            report_count: u.report_count || 0,
            status: u.status,
            portrait: u.portrait || null,
            badge: getBadgeInfo(u.deals_completed || 0, parseFloat(u.average_rating) || 0),
            created_at: u.created_at,
            last_login: u.last_login || u.created_at,
            active_listings: parseInt(u.active_listings, 10) || 0
        }));

        return res.json({
            status: 'success',
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get all users error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error fetching users' });
    }
};

// 6. User Management: Update Account Status (Suspend/Ban or Reactivate)
exports.updateUserAccountStatus = async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const { status } = req.body;

        if (!status || !['active', 'suspended', 'banned'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Status is required (active/suspended/banned)' });
        }

        if (userId === req.user.id) {
            return res.status(400).json({ status: 'error', message: 'You cannot modify your own admin account' });
        }

        const result = await db.query(
            'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, name, email, status',
            [status, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        return res.json({
            status: 'success',
            message: `User status changed to ${status}`,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Update user account status error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error changing user status' });
    }
};

// 7. User Management: Reset User Password
exports.resetUserPassword = async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ status: 'error', message: 'New password must be at least 8 characters long' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const result = await db.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, name, email',
            [hashedPassword, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        return res.json({
            status: 'success',
            message: `Password reset successfully for user: ${result.rows[0].name}`
        });
    } catch (error) {
        console.error('Reset user password error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error resetting password' });
    }
};

// 8. Reports & Analytics (Community-based, no revenue)
exports.getReports = async (req, res) => {
    try {
        const userCountRes = await db.query("SELECT COUNT(*) as count FROM users WHERE role != 'admin'");
        const listingCountRes = await db.query("SELECT COUNT(*) as count FROM products WHERE status != 'deleted'");

        // Deals analytics (completed deals)
        let totalDeals = 0;
        let totalVolume = 0;
        try {
            const dealsRes = await db.query("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_volume FROM deals WHERE status = 'completed'");
            totalDeals = parseInt(dealsRes.rows[0].count, 10) || 0;
            totalVolume = parseFloat(dealsRes.rows[0].total_volume) || 0;
        } catch(e) {
            // deals table might not exist yet
        }

        // Reports count
        let totalReports = 0;
        try {
            const reportsRes = await db.query("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'");
            totalReports = parseInt(reportsRes.rows[0].count, 10) || 0;
        } catch(e) {}

        const totalUsers = parseInt(userCountRes.rows[0].count, 10);
        const totalListings = parseInt(listingCountRes.rows[0].count, 10);

        return res.json({
            status: 'success',
            analytics: {
                totalUsers,
                totalListings,
                totalDeals,
                totalVolume,
                totalReports
            }
        });
    } catch (error) {
        console.error('Get reports error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error compiling reports and analytics' });
    }
};

// 9. Get All Community Reports
exports.getAllReports = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM reports ORDER BY created_at DESC');
        return res.json({
            status: 'success',
            count: result.rowCount,
            reports: result.rows
        });
    } catch (error) {
        console.error('Get all reports error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error fetching reports' });
    }
};

// 10. Get All Deals (Admin view)
exports.getAllDeals = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT d.*, p.name as product_name, p.images, 
                   b.name as buyer_name, b.email as buyer_email, b.whatsapp_number as buyer_whatsapp,
                   v.name as vendor_name, v.email as vendor_email, v.whatsapp_number as vendor_whatsapp
             FROM deals d
             JOIN products p ON d.product_id = p.id
             LEFT JOIN users b ON d.buyer_id = b.id
             JOIN users v ON d.vendor_id = v.id
             ORDER BY d.created_at DESC`
        );

        const formattedDeals = result.rows.map(d => {
            let images = d.images;
            if (typeof images === 'string') {
                try { images = JSON.parse(images); } catch (e) { images = [images]; }
            }
            return {
                ...d,
                images: images || [],
                buyer: { name: d.buyer_name || 'Walk-in', email: d.buyer_email || '', whatsapp: d.buyer_whatsapp || '' },
                vendor: { name: d.vendor_name, email: d.vendor_email, whatsapp: d.vendor_whatsapp || '' }
            };
        });

        return res.json({
            status: 'success',
            count: formattedDeals.length,
            deals: formattedDeals
        });
    } catch (error) {
        console.error('Get all deals admin error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error fetching deals' });
    }
};

// Add University
exports.addUniversity = async (req, res) => {
    try {
        const { code, name } = req.body;
        if (!code || !name) {
            return res.status(400).json({ status: 'error', message: 'University code and name are required' });
        }
        
        const cleanCode = code.trim().toUpperCase();
        const cleanName = name.trim();

        const checkRes = await db.query('SELECT id FROM universities WHERE code = $1', [cleanCode]);
        if (checkRes.rowCount > 0) {
            return res.status(400).json({ status: 'error', message: `University with code ${cleanCode} already exists` });
        }

        const result = await db.query('INSERT INTO universities (code, name) VALUES ($1, $2) RETURNING *', [cleanCode, cleanName]);
        
        return res.status(201).json({
            status: 'success',
            message: 'University added successfully',
            university: result.rows[0]
        });
    } catch (error) {
        console.error('Add university error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error adding university' });
    }
};

// Add Campus
exports.addCampus = async (req, res) => {
    try {
        const { university_code, name } = req.body;
        if (!university_code || !name) {
            return res.status(400).json({ status: 'error', message: 'University code and campus name are required' });
        }

        const cleanUnivCode = university_code.trim().toUpperCase();
        const cleanName = name.trim();

        const checkUniv = await db.query('SELECT id FROM universities WHERE code = $1', [cleanUnivCode]);
        if (checkUniv.rowCount === 0) {
            return res.status(400).json({ status: 'error', message: `University code ${cleanUnivCode} does not exist. Add the university first.` });
        }

        const result = await db.query('INSERT INTO campuses (university_code, name) VALUES ($1, $2) RETURNING *', [cleanUnivCode, cleanName]);

        return res.status(201).json({
            status: 'success',
            message: 'Campus added successfully',
            campus: result.rows[0]
        });
    } catch (error) {
        console.error('Add campus error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error adding campus' });
    }
};

// 7. Delete User (Cascading delete of deals, products, cart items, reports, testimonials first)
exports.deleteUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);

        // Delete from all tables to prevent constraint conflicts
        await db.query('DELETE FROM deals WHERE vendor_id = $1 OR buyer_id = $1', [userId]);
        await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
        await db.query('DELETE FROM reports WHERE reporter_id = $1 OR reported_user_id = $1', [userId]);
        await db.query('DELETE FROM testimonials WHERE user_id = $1', [userId]);
        await db.query('DELETE FROM products WHERE vendor_id = $1', [userId]);
        await db.query('DELETE FROM users WHERE id = $1', [userId]);

        return res.json({
            status: 'success',
            message: 'User and all associated data deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error deleting user' });
    }
};
