const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

// Helper: Compute badge label from deals_completed & average_rating
function getBadgeInfo(dealsCompleted, averageRating) {
    if (dealsCompleted >= 50 && averageRating >= 4.5) {
        return { emoji: '🏆', label: 'Top Seller', level: 4 };
    } else if (dealsCompleted >= 10 && averageRating >= 4.0) {
        return { emoji: '⭐', label: 'Trusted by Community', level: 3 };
    } else if (dealsCompleted >= 3) {
        return { emoji: '🟡', label: 'Active Seller', level: 2 };
    }
    return { emoji: '🟢', label: 'New on Scholarmart', level: 1 };
}

// 1. Register User
exports.register = async (req, res) => {
    try {
        const {
            name, email, university, campus, password, confirmPassword,
            role, whatsappNumber
        } = req.body;

        // Validations
        if (!name || !email || !campus || !password || !confirmPassword) {
            return res.status(400).json({ status: 'error', message: 'All registration fields are required' });
        }

        if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
            return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters long and contain both letters and numbers' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ status: 'error', message: 'Passwords do not match' });
        }

        // Check if user already exists
        const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rowCount > 0) {
            return res.status(400).json({ status: 'error', message: 'Email already registered' });
        }

        const userRole = role === 'vendor' ? 'vendor' : 'buyer';

        // Vendor must provide WhatsApp number
        if (userRole === 'vendor' && !whatsappNumber) {
            return res.status(400).json({ status: 'error', message: 'Vendors must provide a WhatsApp number for buyers to contact you' });
        }

        // Encrypt password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create the user
        const result = await db.query(
            `INSERT INTO users (
                name, email, whatsapp_number, university, campus, password_hash, role
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                name, email, whatsappNumber || null, university || 'COOU', campus, passwordHash, userRole
            ]
        );

        const newUser = result.rows[0];
        const badge = getBadgeInfo(0, 0);

        // Generate JWT Token
        const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

        return res.status(201).json({
            status: 'success',
            message: `Welcome to ScholarMart! Your ${userRole} account is ready.`,
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                email_verified: newUser.email_verified || false,
                campus: newUser.campus,
                university: newUser.university,
                whatsapp_number: newUser.whatsapp_number,
                portrait: newUser.portrait || null,
                deals_completed: 0,
                average_rating: 0,
                total_ratings: 0,
                badge
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error during registration' });
    }
};

// 2. Login User
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required' });
        }

        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rowCount === 0) {
            return res.status(400).json({ status: 'error', message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        if (user.status === 'suspended' || user.status === 'banned') {
            return res.status(403).json({ status: 'error', message: 'Your account has been suspended by an administrator' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ status: 'error', message: 'Invalid credentials' });
        }

        // Update last login timestamp
        await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        const badge = getBadgeInfo(user.deals_completed || 0, parseFloat(user.average_rating) || 0);

        // Generate JWT Token
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        return res.json({
            status: 'success',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                email_verified: user.email_verified || false,
                campus: user.campus,
                university: user.university,
                whatsapp_number: user.whatsapp_number,
                portrait: user.portrait || null,
                deals_completed: user.deals_completed || 0,
                average_rating: parseFloat(user.average_rating) || 0,
                total_ratings: user.total_ratings || 0,
                badge
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error during login' });
    }
};

// 3. Send Email OTP (Email Verification)
exports.sendOtp = async (req, res) => {
    try {
        const userId = req.user.id;
        const userResult = await db.query('SELECT email FROM users WHERE id = $1', [userId]);
        if (userResult.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const email = userResult.rows[0].email;

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await db.query(
            'UPDATE users SET email_otp = $1, email_otp_expires = $2 WHERE id = $3',
            [otp, expires, userId]
        );

        // In production: Send email with OTP
        // In development: Log to console
        console.log(`\n======================================================`);
        console.log(`[EMAIL OTP] Email: ${email}`);
        console.log(`[EMAIL OTP] Code: ${otp}`);
        console.log(`[EMAIL OTP] Expires: ${expires.toISOString()}`);
        console.log(`======================================================\n`);

        return res.json({
            status: 'success',
            message: `OTP code sent to ${email}. (For testing, see terminal log)`
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to send OTP' });
    }
};

// 4. Verify Email OTP
exports.verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const userId = req.user.id;

        if (!otp) {
            return res.status(400).json({ status: 'error', message: 'OTP is required' });
        }

        const result = await db.query(
            'SELECT email_otp, email_otp_expires FROM users WHERE id = $1',
            [userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const user = result.rows[0];

        if (!user.email_otp || user.email_otp !== otp) {
            return res.status(400).json({ status: 'error', message: 'Invalid OTP' });
        }

        if (new Date() > new Date(user.email_otp_expires)) {
            return res.status(400).json({ status: 'error', message: 'OTP has expired' });
        }

        // Mark email as verified
        await db.query(
            `UPDATE users SET 
                email_verified = true, 
                email_otp = NULL, 
                email_otp_expires = NULL 
             WHERE id = $1`,
            [userId]
        );

        return res.json({
            status: 'success',
            message: 'Email verified successfully! ✅',
            email_verified: true
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error during OTP validation' });
    }
};

// 5. Upload Portrait
exports.uploadPortrait = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'Portrait file is required' });
        }

        // Relative public path for serving file
        const fileUrl = `/uploads/portraits/${req.file.filename}`;

        await db.query(
            `UPDATE users SET portrait = $1 WHERE id = $2`,
            [fileUrl, userId]
        );

        return res.json({
            status: 'success',
            message: 'Portrait uploaded successfully.',
            portrait: fileUrl
        });
    } catch (error) {
        console.error('Portrait Upload error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error during portrait upload' });
    }
};

// Get all universities
exports.getUniversities = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM universities ORDER BY name ASC');
        return res.json({
            status: 'success',
            count: result.rowCount,
            universities: result.rows
        });
    } catch (error) {
        console.error('Get universities error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error retrieving universities' });
    }
};

// Get campuses (optionally filtered by university_code)
exports.getCampuses = async (req, res) => {
    try {
        const { university_code } = req.query;
        let sql = 'SELECT * FROM campuses';
        let params = [];
        
        if (university_code) {
            sql += ' WHERE university_code = $1';
            params.push(university_code);
        }
        
        sql += ' ORDER BY name ASC';
        const result = await db.query(sql, params);
        return res.json({
            status: 'success',
            count: result.rowCount,
            campuses: result.rows
        });
    } catch (error) {
        console.error('Get campuses error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error retrieving campuses' });
    }
};

// Export badge helper for use in other controllers
exports.getBadgeInfo = getBadgeInfo;
