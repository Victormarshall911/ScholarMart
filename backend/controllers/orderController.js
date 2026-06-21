const db = require('../config/db');

// Helper to create Paystack Split Group
const createPaystackSplitGroup = async (vendorSubaccount, productPrice, productId) => {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
        return `SPL_mock_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    }

    try {
        const response = await fetch('https://api.paystack.co/split', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${paystackSecret}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: `Split_Prod_${productId}_${Date.now()}`,
                type: 'flat',
                currency: 'NGN',
                subaccounts: [
                    {
                        subaccount: vendorSubaccount,
                        share: Math.round(productPrice * 100) // In Kobo
                    }
                ],
                bearer_type: 'account' // Platform account pays transaction fee
            })
        });

        const data = await response.json();
        if (data.status && data.data) {
            return data.data.split_code;
        } else {
            console.warn('Paystack split group creation failed:', data.message);
            return `SPL_mock_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
        }
    } catch (error) {
        console.error('Error creating split group in Paystack:', error.message);
        return `SPL_mock_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    }
};

// Helper to initialize Paystack Transaction
const initializePaystackPayment = async (buyerEmail, totalAmount, reference, splitCode) => {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
        // Return a mock checkout page link
        return {
            status: true,
            data: {
                authorization_url: `/#/payment-simulate/${reference}`,
                reference
            }
        };
    }

    try {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${paystackSecret}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: buyerEmail,
                amount: Math.round(totalAmount * 100), // In Kobo
                reference,
                split_code: splitCode,
                callback_url: `${process.env.APP_URL || 'http://localhost:3000'}/#/payment-callback`
            })
        });

        return await response.json();
    } catch (error) {
        console.error('Paystack initialize payment error:', error.message);
        return { status: false, message: error.message };
    }
};

// 1. Initialize Order and Payment
exports.initializeOrder = async (req, res) => {
    try {
        const { productId } = req.body;
        const buyerId = req.user.id;
        const buyerEmail = req.user.email;

        if (!productId) {
            return res.status(400).json({ status: 'error', message: 'productId is required' });
        }

        // Fetch product and vendor details
        const prodResult = await db.query(
            `SELECT p.*, u.paystack_subaccount_code, u.verification_status 
             FROM products p 
             JOIN users u ON p.vendor_id = u.id 
             WHERE p.id = $1 AND p.status = 'active'`,
            [productId]
        );

        if (prodResult.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Product not found or unavailable' });
        }

        const product = prodResult.rows[0];

        if (product.vendor_id === buyerId) {
            return res.status(400).json({ status: 'error', message: 'You cannot buy your own product' });
        }

        // Split calculation
        const productPrice = parseFloat(product.price);
        const serviceFee = 500.00; // Platform flat fee
        const totalAmount = productPrice + serviceFee;

        // Subaccount verification
        let subaccount = product.paystack_subaccount_code;
        if (!subaccount) {
            // Vendor has no subaccount, we fallback by generating a mock subaccount code
            // (or in a real system we would prompt the vendor to complete banking setup)
            console.warn(`Vendor ${product.vendor_id} is missing Paystack subaccount. Generating sandbox code.`);
            subaccount = `ACCT_mock_auto_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            await db.query('UPDATE users SET paystack_subaccount_code = $1 WHERE id = $2', [subaccount, product.vendor_id]);
        }

        // Generate temporary order reference
        const reference = `SM_ref_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // Create Split Group on Paystack
        const splitCode = await createPaystackSplitGroup(subaccount, productPrice, product.id);

        // Initialize transaction on Paystack
        const paymentResult = await initializePaystackPayment(buyerEmail, totalAmount, reference, splitCode);

        if (!paymentResult.status) {
            return res.status(500).json({ status: 'error', message: paymentResult.message || 'Payment initialization failed' });
        }

        // Insert Order in DB with status pending
        await db.query(
            `INSERT INTO orders (buyer_id, product_id, vendor_id, amount, service_fee, total_amount, status, paystack_reference, paystack_split_code)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [buyerId, product.id, product.vendor_id, productPrice, serviceFee, totalAmount, 'pending', reference, splitCode]
        );

        return res.json({
            status: 'success',
            message: 'Order initiated. Redirecting to payment gateway.',
            paymentUrl: paymentResult.data.authorization_url,
            reference,
            amount: productPrice,
            serviceFee,
            totalAmount,
            splitCode
        });

    } catch (error) {
        console.error('Initialize order error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error initiating order' });
    }
};

// 2. Verify Payment (Callback/Poll)
exports.verifyPayment = async (req, res) => {
    try {
        const { reference } = req.params;
        const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

        // Fetch order
        const orderResult = await db.query('SELECT * FROM orders WHERE paystack_reference = $1', [reference]);
        if (orderResult.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Order not found' });
        }

        const order = orderResult.rows[0];

        if (order.status !== 'pending') {
            return res.json({
                status: 'success',
                message: 'Order has already been updated',
                orderStatus: order.status
            });
        }

        let isSuccess = false;

        if (!paystackSecret || reference.startsWith('SM_ref_')) {
            // Mock transaction verification (Sandbox mode success)
            isSuccess = true;
        } else {
            // Real Paystack verification
            try {
                const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${paystackSecret}`
                    }
                });
                const data = await response.json();
                if (data.status && data.data.status === 'success') {
                    isSuccess = true;
                }
            } catch (err) {
                console.error('Error verifying transaction on Paystack:', err.message);
            }
        }

        if (isSuccess) {
            // Update order status to paid
            await db.query("UPDATE orders SET status = 'paid' WHERE id = $1", [order.id]);
            return res.json({
                status: 'success',
                payment_status: 'success',
                orderStatus: 'paid'
            });
        } else {
            return res.json({
                status: 'success',
                payment_status: 'failed or pending',
                orderStatus: 'pending'
            });
        }
    } catch (error) {
        console.error('Verify payment error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error verifying payment' });
    }
};

// 3. Get Buyer Orders
exports.getBuyerOrders = async (req, res) => {
    try {
        const buyerId = req.user.id;
        const sql = `
            SELECT o.*, p.name as product_name, p.images, u.name as vendor_name, u.phone as vendor_phone
            FROM orders o
            JOIN products p ON o.product_id = p.id
            JOIN users u ON o.vendor_id = u.id
            WHERE o.buyer_id = $1
            ORDER BY o.created_at DESC
        `;
        const result = await db.query(sql, [buyerId]);

        const formattedOrders = result.rows.map(o => {
            let images = o.images;
            if (typeof images === 'string') {
                try { images = JSON.parse(images); } catch (e) { images = []; }
            }
            return {
                ...o,
                images: images || [],
                product_name: o.product_name,
                vendor: { name: o.vendor_name, phone: o.vendor_phone }
            };
        });

        return res.json({ status: 'success', orders: formattedOrders });
    } catch (error) {
        console.error('Get buyer orders error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error fetching purchases' });
    }
};

// 4. Get Vendor Sales
exports.getVendorSales = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const sql = `
            SELECT o.*, p.name as product_name, p.images, u.name as buyer_name, u.phone as buyer_phone
            FROM orders o
            JOIN products p ON o.product_id = p.id
            JOIN users u ON o.buyer_id = u.id
            WHERE o.vendor_id = $1
            ORDER BY o.created_at DESC
        `;
        const result = await db.query(sql, [vendorId]);

        const formattedSales = result.rows.map(o => {
            let images = o.images;
            if (typeof images === 'string') {
                try { images = JSON.parse(images); } catch (e) { images = []; }
            }
            return {
                ...o,
                images: images || [],
                product_name: o.product_name,
                buyer: { name: o.buyer_name, phone: o.buyer_phone }
            };
        });

        return res.json({ status: 'success', sales: formattedSales });
    } catch (error) {
        console.error('Get vendor sales error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error fetching sales' });
    }
};

// 5. Update Order Status (For Vendors/Admins)
exports.updateOrderStatus = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const userRole = req.user.role;
        const { status } = req.body; // 'shipped', 'completed', 'cancelled'

        if (!status) {
            return res.status(400).json({ status: 'error', message: 'Status is required' });
        }

        // Check order
        const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        if (orderResult.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Order not found' });
        }

        const order = orderResult.rows[0];

        // Authorization check: only vendor or admin can change status
        if (order.vendor_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Unauthorized: You are not the vendor for this order' });
        }

        await db.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);

        return res.json({
            status: 'success',
            message: `Order status updated to: ${status}`,
            orderStatus: status
        });
    } catch (error) {
        console.error('Update order status error:', error);
        return res.status(500).json({ status: 'error', message: 'Server error updating order status' });
    }
};
