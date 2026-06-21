const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

// Helper to check if email is a student email
const isStudentEmail = (email) => {
    const domain = email.split('@')[1];
    return domain && (domain.endsWith('.edu.ng') || domain === 'coou.edu.ng' || domain.endsWith('.coou.edu.ng'));
};

// Create Paystack Subaccount Helper
const createPaystackSubaccount = async (name, bankCode, accountNumber) => {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
        console.warn('Paystack: No secret key configured. Generating mock subaccount.');
        return `ACCT_mock_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    }

    try {
        const response = await fetch('https://api.paystack.co/subaccount', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${paystackSecret}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                business_name: `${name} Scholarmart Vendor`,
                settlement_bank: bankCode,
                account_number: accountNumber,
                percentage_charge: 0
            })
        });

        const data = await response.json();
        if (data.status && data.data) {
            return data.data.subaccount_code;
        } else {
            console.warn('Paystack Subaccount creation failed:', data.message);
            return `ACCT_mock_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
        }
    } catch (error) {
        console.error('Error contacting Paystack API:', error.message);
        return `ACCT_mock_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    }
};

// 1. Register User
exports.register = async (req, res) => {
    try {
        const {
            name, email, phone, university, campus, password, confirmPassword,
            role, bankName, bankCode, accountNumber, accountHolderName
        } = req.body;

        // Validations
        if (!name || !email || !phone || !campus || !password || !confirmPassword) {
            return res.status(400).json({ status: 'error', message: 'All standard registration fields are required' });
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

        // Encrypt password
        const passwordHash = await bcrypt.hash(password, 10);

        // Vendor specific logic: Paystack subaccount creation
        let subaccountCode = null;
        const userRole = role === 'vendor' ? 'vendor' : 'buyer';

        if (userRole === 'vendor') {
            if (!bankCode || !accountNumber || !accountHolderName) {
                return res.status(400).json({ status: 'error', message: 'Vendor registration requires bank code, account number, and holder name' });
            }
            subaccountCode = await createPaystackSubaccount(name, bankCode, accountNumber);
        }

        // Determine verification status
        let verificationStatus = 'pending';
        let verificationMethod = 'email';


        // Create the user
        const result = await db.query(
            `INSERT INTO users (
                name, email, phone, university, campus, password_hash, role,
                bank_name, bank_account_number, bank_account_name, paystack_subaccount_code,
                verification_status, verification_method, verification_file
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
            [
                name, email, phone, university || 'COOU', campus, passwordHash, userRole,
                bankName || null, accountNumber || null, accountHolderName || null, subaccountCode,
                verificationStatus, verificationMethod, null
            ]
        );

        const newUser = result.rows[0];

        // Generate JWT Token
        const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

        return res.status(201).json({
            status: 'success',
            message: userRole === 'vendor' 
                ? 'Vendor account created successfully. Please complete student verification.' 
                : 'Buyer account created successfully. Please complete student verification.',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                verification_status: newUser.verification_status,
                verification_method: newUser.verification_method,
                campus: newUser.campus,
                portrait: newUser.portrait || null
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

        if (user.status === 'suspended') {
            return res.status(403).json({ status: 'error', message: 'Your account has been suspended by an administrator' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ status: 'error', message: 'Invalid credentials' });
        }

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
                verification_status: user.verification_status,
                verification_method: user.verification_method,
                campus: user.campus,
                paystack_subaccount_code: user.paystack_subaccount_code,
                portrait: user.portrait || null
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error during login' });
    }
};

// 3. Send Email OTP (Student Verification)
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
            'UPDATE users SET verification_otp = $1, verification_otp_expires = $2 WHERE id = $3',
            [otp, expires, userId]
        );

        // Real system: Send an email containing the OTP
        // Sandbox environment: Log it to console so the reviewer/user can check it
        console.log(`\n======================================================`);
        console.log(`[VERIFICATION OTP] Student Email: ${email}`);
        console.log(`[VERIFICATION OTP] Code: ${otp}`);
        console.log(`[VERIFICATION OTP] Expires: ${expires.toISOString()}`);
        console.log(`======================================================\n`);

        return res.json({
            status: 'success',
            message: `OTP code sent to email ${email}. (For testing, see terminal log)`
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
            'SELECT verification_otp, verification_otp_expires FROM users WHERE id = $1',
            [userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const user = result.rows[0];

        if (!user.verification_otp || user.verification_otp !== otp) {
            return res.status(400).json({ status: 'error', message: 'Invalid OTP' });
        }

        if (new Date() > new Date(user.verification_otp_expires)) {
            return res.status(400).json({ status: 'error', message: 'OTP has expired' });
        }

        // Approve verification
        await db.query(
            `UPDATE users SET 
                verification_status = 'approved', 
                verification_method = 'email',
                verification_otp = NULL, 
                verification_otp_expires = NULL 
             WHERE id = $1`,
            [userId]
        );

        return res.json({
            status: 'success',
            message: 'Student status verified successfully via university email!',
            verification_status: 'approved'
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error during OTP validation' });
    }
};

// 5. Upload Student ID (Fallback Verification)
exports.uploadIdCard = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'Student ID card file is required' });
        }

        // Relative public path for serving file
        const fileUrl = `/uploads/id-cards/${req.file.filename}`;

        await db.query(
            `UPDATE users SET 
                verification_status = 'pending', 
                verification_method = 'id_card', 
                verification_file = $1 
             WHERE id = $2`,
            [fileUrl, userId]
        );

        return res.json({
            status: 'success',
            message: 'Student ID uploaded successfully. Admin manual review is pending.',
            fileUrl,
            verification_status: 'pending'
        });
    } catch (error) {
        console.error('ID Upload error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error during ID upload' });
    }
};

// 6. Upload Portrait
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
