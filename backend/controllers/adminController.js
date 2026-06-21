const db = require('../config/db');
const bcrypt = require('bcryptjs');

// 1. Get Pending Student Verifications
exports.getPendingVerifications = async (req, res) => {
    try {
        const { status } = req.query; // optional filter by status
        const targetStatus = status || 'pending';

        const sql = `
            SELECT id, name, email, phone, university, campus, role, 
                   verification_status, verification_method, verification_file, created_at 
            FROM users 
            WHERE verification_status = $1 AND role != 'admin'
            ORDER BY created_at DESC
        `;

        const result = await db.query(sql, [targetStatus]);
        return res.json({
            status: 'success',
            count: result.rowCount,
            verifications: result.rows
        });
    } catch (error) {
        console.error('Get pending verifications error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error retrieving verification items' });
    }
};

// 2. Update Student Verification Status
exports.updateVerificationStatus = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        const { status, reason } = req.body; // 'approved' or 'rejected'

        if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Valid status is required (approved/rejected)' });
        }

        // Verify user exists and is not admin
        const check = await db.query('SELECT role, verification_status FROM users WHERE id = $1', [userId]);
        if (check.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        if (check.rows[0].role === 'admin') {
            return res.status(400).json({ status: 'error', message: 'Cannot modify admin verification status' });
        }

        const sql = 'UPDATE users SET verification_status = $1 WHERE id = $2 RETURNING id, name, email, verification_status';
        const result = await db.query(sql, [status, userId]);

        // In a real system, we'd email the student about their approval/rejection (using the provided reason)
        console.log(`[STUDENT VERIFICATION UPDATE] User #${userId} status set to ${status}. Reason: ${reason || 'N/A'}`);

        return res.json({
            status: 'success',
            message: `User verification status updated to: ${status}`,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Update verification status error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error updating student verification' });
    }
};

// 3. Report/Flag a Product (Callable by Buyers)
exports.reportProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id, 10);
        
        // Update product status to 'reported'
        const result = await db.query(
            "UPDATE products SET status = 'reported' WHERE id = $1 AND status = 'active' RETURNING id, name",
            [productId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Product not found or not active' });
        }

        return res.json({
            status: 'success',
            message: 'Product reported successfully. Admin review is pending.'
        });
    } catch (error) {
        console.error('Report product error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error reporting product' });
    }
};

// 4. List Flagged/Reported Products for Moderation
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

// 5. Moderate Listing (Approve or Ban)
exports.moderateProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id, 10);
        const { action } = req.body; // 'approve' (resets status to active) or 'reject' (flags status as moderated/deleted)

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

// 6. User Management: View All Users
exports.getAllUsers = async (req, res) => {
    try {
        const sql = `
            SELECT id, name, email, phone, university, campus, role, verification_status, status, created_at
            FROM users
            ORDER BY created_at DESC
        `;
        const result = await db.query(sql);

        return res.json({
            status: 'success',
            count: result.rowCount,
            users: result.rows
        });
    } catch (error) {
        console.error('Get all users error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error fetching users' });
    }
};

// 7. User Management: Update Account Status (Ban/Suspend or Reactivate)
exports.updateUserAccountStatus = async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const { status } = req.body; // 'active' or 'suspended'

        if (!status || !['active', 'suspended'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Status is required (active/suspended)' });
        }

        // Prevent self-suspension
        if (userId === req.user.id) {
            return res.status(400).json({ status: 'error', message: 'You cannot suspend your own admin account' });
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

// 8. User Management: Reset User Password
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

// 9. Reports & Analytics
exports.getReports = async (req, res) => {
    try {
        // Query counts
        const userCountRes = await db.query('SELECT COUNT(*) as count FROM users WHERE role != \'admin\'');
        const listingCountRes = await db.query('SELECT COUNT(*) as count FROM products WHERE status != \'deleted\'');
        
        // Paid orders for revenue calculations
        const ordersRes = await db.query('SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_sales, COALESCE(SUM(service_fee), 0) as total_fees FROM orders WHERE status IN (\'paid\', \'shipped\', \'completed\')');

        const totalUsers = parseInt(userCountRes.rows[0].count, 10);
        const totalListings = parseInt(listingCountRes.rows[0].count, 10);
        const totalTransactions = parseInt(ordersRes.rows[0].count, 10);
        const totalSalesVolume = parseFloat(ordersRes.rows[0].total_sales);
        const revenue = parseFloat(ordersRes.rows[0].total_fees); // ₦500 flat fee sum

        return res.json({
            status: 'success',
            analytics: {
                totalUsers,
                totalListings,
                totalTransactions,
                totalSalesVolume,
                revenue
            }
        });
    } catch (error) {
        console.error('Get reports error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error compiling reports and analytics' });
    }
};
