const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const { supabase } = require('../config/db');
const { processUploadedFile } = require('../middleware/upload');

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
        const name = req.body.name || req.body.full_name;
        const email = req.body.email;
        const university = req.body.university || 'COOU';
        const campus = req.body.campus || 'Igbariam';
        const password = req.body.password;
        const confirmPassword = req.body.confirmPassword || req.body.confirm_password || req.body.password;
        const role = req.body.role || 'buyer';
        const whatsappNumber = req.body.whatsappNumber || req.body.whatsapp_number || req.body.phone;

        // Validations
        if (!name || !email || !campus || !password) {
            return res.status(400).json({ status: 'error', message: 'All registration fields are required' });
        }

        if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
            return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters long and contain both letters and numbers' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ status: 'error', message: 'Passwords do not match' });
        }

        // Check if user already exists
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rowCount > 0) {
            const existingUser = userCheck.rows[0];
            if (existingUser.email_verified === false) {
                // Auto-resume verification: resend OTP and return token so frontend opens OTP modal
                if (supabase) {
                    await supabase.auth.resend({ type: 'signup', email }).catch(() => {});
                }
                const token = jwt.sign({ id: existingUser.id, role: existingUser.role }, JWT_SECRET, { expiresIn: '7d' });
                return res.status(200).json({
                    status: 'success',
                    message: 'Verification pin resent! Please enter the 6-digit code sent to your email.',
                    token,
                    user: existingUser
                });
            }
            return res.status(400).json({ status: 'error', message: 'Email already registered' });
        }

        const userRole = role === 'vendor' ? 'vendor' : 'buyer';

        if (userRole === 'vendor' && !whatsappNumber) {
            return res.status(400).json({ status: 'error', message: 'Vendors must provide a WhatsApp number for buyers to contact you' });
        }

        if (!supabase) {
            return res.status(500).json({ status: 'error', message: 'Supabase is not configured on the server.' });
        }

        // Supabase Auth Signup
        // This will send an OTP to their email if Supabase Auth is configured to require email confirmation
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role: userRole
                }
            }
        });

        if (authError) {
            console.error('Supabase signup error (full):', JSON.stringify(authError));
            if (authError.message && (authError.message.toLowerCase().includes('already registered') || authError.message.toLowerCase().includes('already exists'))) {
                const checkAgain = await db.query('SELECT * FROM users WHERE email = $1', [email]);
                if (checkAgain.rowCount > 0 && checkAgain.rows[0].email_verified === false) {
                    const exUser = checkAgain.rows[0];
                    await supabase.auth.resend({ type: 'signup', email }).catch(() => {});
                    const token = jwt.sign({ id: exUser.id, role: exUser.role }, JWT_SECRET, { expiresIn: '7d' });
                    return res.status(200).json({
                        status: 'success',
                        message: 'Verification pin resent! Please enter the 6-digit code sent to your email.',
                        token,
                        user: exUser
                    });
                }
                return res.status(400).json({ status: 'error', message: 'Email already registered' });
            }
            return res.status(400).json({ status: 'error', message: authError.message || 'Failed to register via Supabase.' });
        }

        // Encrypt password for our local fallback check if needed (or just store a dummy since supabase handles auth)
        // We will keep it for backwards compatibility with the manual login route
        const passwordHash = await bcrypt.hash(password, 10);

        // Create the user in our custom public.users table
        const result = await db.query(
            `INSERT INTO users (
                name, email, whatsapp_number, university, campus, password_hash, role, email_verified
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, false) RETURNING *`,
            [
                name, email, whatsappNumber || null, university || 'COOU', campus, passwordHash, userRole
            ]
        );

        const newUser = result.rows[0];
        const badge = getBadgeInfo(0, 0);

        // Generate JWT Token (our custom one for local routes)
        const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

        return res.status(201).json({
            status: 'success',
            message: `Welcome! A verification code has been sent to ${email}. Please check your inbox to verify your account.`,
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                email_verified: false,
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

        const cleanEmail = email.trim().toLowerCase();

        // Auto-seed admin fallback if admin logs in and doesn't exist yet
        if (cleanEmail === 'admin@scholarmart.com' && password === 'AdminPassword098') {
            const checkAdmin = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
            if (checkAdmin.rowCount === 0) {
                const passwordHash = await bcrypt.hash('AdminPassword098', 10);
                await db.query(
                    `INSERT INTO users (
                        name, email, whatsapp_number, university, campus, password_hash, role, email_verified, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'active')`,
                    ['Scholarmart Admin', cleanEmail, '08000000000', 'COOU', 'Awka', passwordHash, 'admin']
                );
            }
        }

        // Attempt login via Supabase first
        let supabaseSuccess = false;
        if (supabase) {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password
            });
            if (!authError) {
                supabaseSuccess = true;
            }
        }

        // Fetch custom user data
        const result = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
        if (result.rowCount === 0) {
            return res.status(400).json({ status: 'error', message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        if (user.status === 'suspended' || user.status === 'banned') {
            return res.status(403).json({ status: 'error', message: 'Your account has been suspended by an administrator' });
        }

        // If Supabase login did not succeed, verify password hash against database
        if (!supabaseSuccess) {
            const isMatch = await bcrypt.compare(password, user.password_hash || '');
            if (!isMatch) {
                return res.status(400).json({ status: 'error', message: 'Invalid credentials' });
            }
        }

        // Update last login timestamp
        await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        const badge = getBadgeInfo(user.deals_completed || 0, parseFloat(user.average_rating) || 0);

        // Generate our JWT Token
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

// 3. Send Email OTP (Resend Signup OTP or Login OTP)
exports.sendOtp = async (req, res) => {
    try {
        let email = req.body?.email;
        if (!email && req.user?.id) {
            const userResult = await db.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
            if (userResult.rowCount > 0) email = userResult.rows[0].email;
        }
        if (!email) {
            return res.status(400).json({ status: 'error', message: 'Email address is required to resend OTP' });
        }

        if (!supabase) {
             return res.status(500).json({ status: 'error', message: 'Supabase is not configured' });
        }

        // Attempt to resend signup verification OTP first
        let { error } = await supabase.auth.resend({
            type: 'signup',
            email: email
        });

        if (error) {
            // Fallback to signInWithOtp if resend fails
            const fallback = await supabase.auth.signInWithOtp({
                email: email,
                options: { shouldCreateUser: false }
            });
            if (fallback.error) {
                console.error('Send OTP error (Supabase):', JSON.stringify(fallback.error));
                return res.status(400).json({ status: 'error', message: fallback.error.message || error.message });
            }
        }

        return res.json({
            status: 'success',
            message: `A new verification code has been sent to ${email}.`
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to send OTP' });
    }
};

// 4. Verify Email OTP
exports.verifyOtp = async (req, res) => {
    try {
        const { otp, email: providedEmail } = req.body;
        
        // We might be verifying from a logged-in state (has req.user) or logged-out state (needs email in body)
        let emailToVerify = providedEmail;
        let userId = null;

        if (req.user) {
            userId = req.user.id;
            const result = await db.query('SELECT email FROM users WHERE id = $1', [userId]);
            if (result.rowCount > 0) emailToVerify = result.rows[0].email;
        } else if (providedEmail) {
            const result = await db.query('SELECT id FROM users WHERE email = $1', [providedEmail]);
            if (result.rowCount > 0) userId = result.rows[0].id;
        }

        if (!otp || !emailToVerify) {
            return res.status(400).json({ status: 'error', message: 'OTP and email are required' });
        }

        if (!supabase) {
             return res.status(500).json({ status: 'error', message: 'Supabase is not configured' });
        }

        // Try 'signup' type first (for initial registration OTPs)
        // If that fails, try 'email' type (for resent OTPs via signInWithOtp)
        let verifyResult = await supabase.auth.verifyOtp({
            email: emailToVerify,
            token: otp,
            type: 'signup'
        });

        if (verifyResult.error) {
            // Retry with 'email' type (used by signInWithOtp resend)
            verifyResult = await supabase.auth.verifyOtp({
                email: emailToVerify,
                token: otp,
                type: 'email'
            });
        }

        if (verifyResult.error) {
            return res.status(400).json({ status: 'error', message: verifyResult.error.message || 'Invalid or expired verification code' });
        }

        if (userId) {
            // Mark email as verified
            await db.query(`UPDATE users SET email_verified = true WHERE id = $1`, [userId]);
        } else {
            await db.query(`UPDATE users SET email_verified = true WHERE email = $1`, [emailToVerify]);
        }

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

// 5. Forgot Password (Request OTP)
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ status: 'error', message: 'Email is required' });

        if (!supabase) {
             return res.status(500).json({ status: 'error', message: 'Supabase is not configured' });
        }

        // Supabase sends an OTP pin if configured, or a magic link.
        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            return res.status(400).json({ status: 'error', message: error.message });
        }

        return res.json({
            status: 'success',
            message: 'A password reset pin has been sent to your email.'
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        return res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// 6. Reset Password (Verify OTP & Set New Password)
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ status: 'error', message: 'Email, OTP, and new password are required' });
        }

        if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
            return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters long and contain both letters and numbers' });
        }

        if (!supabase) {
             return res.status(500).json({ status: 'error', message: 'Supabase is not configured' });
        }

        // Verify the recovery OTP
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'recovery'
        });

        if (error) {
            return res.status(400).json({ status: 'error', message: error.message || 'Invalid or expired reset pin' });
        }

        // Now that session is established via verifyOtp, update the user's password
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            return res.status(400).json({ status: 'error', message: updateError.message });
        }

        // Also update local custom table password_hash just in case
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);

        return res.json({
            status: 'success',
            message: 'Password has been reset successfully! You can now log in.'
        });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// 7. Upload Portrait
exports.uploadPortrait = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'Portrait file is required' });
        }

        // Process file into Supabase Storage public CDN link or permanent Data URI
        const fileUrl = await processUploadedFile(req.file, 'portraits') || `/uploads/portraits/${req.file.filename}`;

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
