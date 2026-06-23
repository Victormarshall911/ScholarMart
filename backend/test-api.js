/**
 * Scholarmart Automated API Integration Test Suite
 * Programmatically starts the server on port 3001, runs end-to-end integration tests,
 * and asserts responses. Asserts dual-mode JSON fallback correctness.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess = null;
let testToken = null;
let testUserId = null;
let adminToken = null;
let testProductId = null;
let testDealId = null;

// Helper to delay execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Start the Test Server
function startServer() {
    return new Promise((resolve, reject) => {
        // Clear previous local JSON store to avoid duplicate user registration conflicts
        const dbStorePath = path.join(__dirname, 'data', 'db_store.json');
        if (fs.existsSync(dbStorePath)) {
            try {
                fs.unlinkSync(dbStorePath);
                console.log('Cleared previous JSON database store.');
            } catch (err) {
                console.warn('Failed to delete previous database store:', err.message);
            }
        }

        console.log('Starting test server on port 3001...');
        
        serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
            env: { ...process.env, PORT: PORT.toString(), JWT_SECRET: 'test-secret' },
            shell: true
        });

        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(output.trim());
            // Resolve once server outputs startup confirm
            if (output.includes('Scholarmart MVP Server started')) {
                resolve();
            }
        });

        serverProcess.stderr.on('data', (data) => {
            console.error('[Server Error]:', data.toString());
        });

        serverProcess.on('error', (err) => {
            reject(err);
        });
        
        // Timeout backup
        setTimeout(() => resolve(), 3000);
    });
}

// Assert Helper
function assertEqual(actual, expected, message) {
    if (actual === expected) {
        console.log(`✅ [PASS] ${message}`);
    } else {
        console.error(`❌ [FAIL] ${message} (Expected "${expected}", but got "${actual}")`);
        throw new Error(`Test assertion failed: ${message}`);
    }
}

// Run the integration test pipeline
async function runTests() {
    try {
        await startServer();
        console.log('Test server active. Beginning API tests...\n');

        // Test 1: User Registration (Vendor with WhatsApp Number)
        console.log('Test 1: User Registration...');
        const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Student Vendor',
                email: 'vendor@coou.edu.ng',
                whatsappNumber: '08099887766',
                university: 'COOU',
                campus: 'Uli Campus',
                password: 'Password123',
                confirmPassword: 'Password123',
                role: 'vendor'
            })
        });
        const regData = await regRes.json();
        assertEqual(regRes.status, 201, 'Registration returns status 201 Created');
        assertEqual(regData.status, 'success', 'Registration response body returns status: success');
        assertEqual(regData.user.role, 'vendor', 'Registered user has correct vendor role');
        assertEqual(regData.user.whatsapp_number, '08099887766', 'WhatsApp number registered successfully');
        assertEqual(regData.user.email_verified, false, 'User starts with unverified email');
        
        testToken = regData.token;
        testUserId = regData.user.id;

        // Test 2: User Login
        console.log('\nTest 2: User Login...');
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'vendor@coou.edu.ng', password: 'Password123' })
        });
        const loginData = await loginRes.json();
        assertEqual(loginRes.status, 200, 'Login returns status 200 OK');
        assertEqual(loginData.status, 'success', 'Login returns status: success');
        assertEqual(!!loginData.token, true, 'Login response contains JWT token');
        assertEqual(loginData.user.whatsapp_number, '08099887766', 'Login returns whatsapp number');

        // Test 3: Request Email Verification OTP
        console.log('\nTest 3: Send Verification OTP...');
        const otpReqRes = await fetch(`${BASE_URL}/api/auth/send-otp`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${testToken}` }
        });
        const otpReqData = await otpReqRes.json();
        assertEqual(otpReqRes.status, 200, 'Send OTP returns status 200 OK');
        assertEqual(otpReqData.status, 'success', 'OTP successfully requested');

        // Read OTP from JSON Store (simulate receiving the email)
        const dbStorePath = path.join(__dirname, 'data', 'db_store.json');
        let otpCode = '123456'; // Default mock guess
        if (fs.existsSync(dbStorePath)) {
            const dbData = JSON.parse(fs.readFileSync(dbStorePath, 'utf8'));
            const userInDb = dbData.users.find(u => u.id === testUserId);
            if (userInDb && userInDb.email_otp) {
                otpCode = userInDb.email_otp;
                console.log(`   (Successfully extracted verification OTP code: "${otpCode}")`);
            }
        }

        // Test 4: Submit & Verify Email OTP
        console.log('\nTest 4: Verify OTP...');
        const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${testToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ otp: otpCode })
        });
        const verifyData = await verifyRes.json();
        assertEqual(verifyRes.status, 200, 'OTP verify returns status 200 OK');
        assertEqual(verifyData.status, 'success', 'Email verification status successfully approved');
        assertEqual(verifyData.email_verified, true, 'Email verified is set to true');

        // Test 5: Add Product Listing
        console.log('\nTest 5: Create Product Listing...');
        const prodRes = await fetch(`${BASE_URL}/api/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${testToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'COOU Hostel Mattress',
                price: 15000,
                category: 'Hostel Essentials',
                campus: 'Uli Campus',
                description: 'Super comfy 6ft mattress. Moving out.'
            })
        });
        const prodData = await prodRes.json();
        assertEqual(prodRes.status, 201, 'Create product returns status 201 Created');
        assertEqual(prodData.status, 'success', 'Product listed successfully');
        
        testProductId = prodData.productId;

        // Test 6: Search & Catalog Filter
        console.log('\nTest 6: Retrieve & Filter Products...');
        const catRes = await fetch(`${BASE_URL}/api/products?category=Hostel+Essentials&campus=Uli+Campus`);
        const catData = await catRes.json();
        assertEqual(catRes.status, 200, 'Retrieve products returns status 200 OK');
        assertEqual(catData.products.length > 0, true, 'Mattress is visible in filtered listings');
        assertEqual(catData.products[0].vendor.name, 'Test Student Vendor', 'Vendor is associated with product');

        // Login as admin to perform deal confirmation / ratings and admin reports
        const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@scholarmats.com', password: 'AdminPassword098' })
        });
        const adminLoginData = await adminLoginRes.json();
        adminToken = adminLoginData.token;

        // Test 7: Vendor marks product as sold (Creates Deal)
        console.log('\nTest 7: Mark Product as Sold (Create Deal)...');
        const markSoldRes = await fetch(`${BASE_URL}/api/orders/mark-sold`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${testToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: testProductId,
                buyerId: adminLoginData.user.id
            })
        });
        const markSoldData = await markSoldRes.json();
        assertEqual(markSoldRes.status, 201, 'Mark sold returns status 201 Created');
        assertEqual(markSoldData.status, 'success', 'Deal successfully created');
        
        testDealId = markSoldData.dealId;

        // Test 8: Buyer confirms Deal Completion
        console.log('\nTest 8: Confirm Deal...');
        const confirmRes = await fetch(`${BASE_URL}/api/orders/${testDealId}/confirm`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        const confirmData = await confirmRes.json();
        assertEqual(confirmRes.status, 200, 'Confirm deal returns status 200 OK');
        assertEqual(confirmData.status, 'success', 'Deal successfully confirmed');

        // Test 9: Buyer Rates Seller after Deal Completion
        console.log('\nTest 9: Rate Seller...');
        const rateRes = await fetch(`${BASE_URL}/api/orders/${testDealId}/rate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rating: 5,
                review: 'Excellent seller, very prompt!'
            })
        });
        const rateData = await rateRes.json();
        assertEqual(rateRes.status, 200, 'Rate seller returns status 200 OK');
        assertEqual(rateData.status, 'success', 'Seller rated successfully');

        // Test 10: Report Seller
        console.log('\nTest 10: Report Seller...');
        const reportRes = await fetch(`${BASE_URL}/api/admin/users/${testUserId}/report`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason: 'Offline demand: Demanded extra delivery fee outside WhatsApp deal'
            })
        });
        const reportData = await reportRes.json();
        assertEqual(reportRes.status, 200, 'Report seller returns status 200 OK');
        assertEqual(reportData.status, 'success', 'Report submitted successfully');

        // Test 11: Admin Analytics reports
        console.log('\nTest 11: Admin Analytics reports...');
        const adminRepRes = await fetch(`${BASE_URL}/api/admin/reports`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const adminRepData = await adminRepRes.json();
        assertEqual(adminRepRes.status, 200, 'Admin reports return status 200 OK');
        assertEqual(adminRepData.analytics.totalDeals, 1, 'Total completed/active deals count matches');
        assertEqual(adminRepData.analytics.totalUsers >= 1, true, 'User count includes vendor');

        // Test 12: Admin View All Reports
        console.log('\nTest 12: Admin View All Reports...');
        const allRepRes = await fetch(`${BASE_URL}/api/admin/all-reports`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const allRepData = await allRepRes.json();
        assertEqual(allRepRes.status, 200, 'Admin retrieve all-reports returns status 200 OK');
        assertEqual(allRepData.reports.length > 0, true, 'Report queue contains our test report');
        assertEqual(allRepData.reports[0].reason.includes('Offline demand'), true, 'Report reason matches input');

        // Test 13: Admin View All Deals
        console.log('\nTest 13: Admin View All Deals...');
        const getDealsRes = await fetch(`${BASE_URL}/api/admin/deals`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const getDealsData = await getDealsRes.json();
        assertEqual(getDealsRes.status, 200, 'Admin retrieve deals returns status 200 OK');
        assertEqual(getDealsData.deals.length > 0, true, 'Deals are returned');
        assertEqual(getDealsData.deals[0].id, testDealId, 'Returned deal matches created deal ID');

        // Test 14: Category Management (Read-Only)
        console.log('\nTest 14: Category Management (Read-Only)...');
        const catListRes = await fetch(`${BASE_URL}/api/categories`);
        const catListData = await catListRes.json();
        assertEqual(catListRes.status, 200, 'Retrieve categories returns status 200 OK');
        assertEqual(catListData.categories.length, 9, 'All 9 default categories are pre-populated');

        // Test category addition is disabled
        const addCatRes = await fetch(`${BASE_URL}/api/categories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: 'Should Fail Category' })
        });
        assertEqual(addCatRes.status, 403, 'Create category returns 403 Forbidden');

        // Test 15: Shopping Cart System
        console.log('\nTest 15: Shopping Cart System...');
        
        // Create an active product for cart testing
        const cartProdRes = await fetch(`${BASE_URL}/api/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${testToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Cart Test Lamp',
                price: 3000,
                category: 'Gadgets',
                campus: 'Uli Campus',
                description: 'Rechargeable LED reading lamp.'
            })
        });
        const cartProdData = await cartProdRes.json();
        assertEqual(cartProdRes.status, 201, 'Create cart test product returns 201');
        const cartProductId = cartProdData.productId;

        const cartEmptyRes = await fetch(`${BASE_URL}/api/products/cart`, {
            headers: { 'Authorization': `Bearer ${testToken}` }
        });
        const cartEmptyData = await cartEmptyRes.json();
        assertEqual(cartEmptyData.products.length, 0, 'Cart is empty initially');

        const cartAddRes = await fetch(`${BASE_URL}/api/products/cart`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${testToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId: cartProductId })
        });
        const cartAddData = await cartAddRes.json();
        assertEqual(cartAddData.status, 'success', 'Product added to cart');

        const cartFilledRes = await fetch(`${BASE_URL}/api/products/cart`, {
            headers: { 'Authorization': `Bearer ${testToken}` }
        });
        const cartFilledData = await cartFilledRes.json();
        assertEqual(cartFilledData.products.length, 1, 'Cart has 1 item');

        // Test 16: Testimonials E2E Flow
        console.log('\nTest 16: Testimonials E2E Flow...');
        
        // 1. Get public testimonials (should be empty/have existing seeds)
        const tPublicRes1 = await fetch(`${BASE_URL}/api/testimonials`);
        const tPublicData1 = await tPublicRes1.json();
        assertEqual(tPublicRes1.status, 200, 'Public testimonials fetch returns 200');
        assertEqual(tPublicData1.status, 'success', 'Public testimonials body returns success');

        // 2. Submit a testimonial as student user (vendor)
        const tSubmitRes = await fetch(`${BASE_URL}/api/testimonials`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${testToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Test testimonial message from vendor student.',
                rating: 5
            })
        });
        const tSubmitData = await tSubmitRes.json();
        assertEqual(tSubmitRes.status, 201, 'Submit testimonial returns 201 Created');
        assertEqual(tSubmitData.status, 'success', 'Submit testimonial returns success');
        const submittedTestimonialId = tSubmitData.testimonial.id;

        // 3. Admin: Get pending testimonials (should contain our testimonial)
        const tPendingRes = await fetch(`${BASE_URL}/api/testimonials/pending`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const tPendingData = await tPendingRes.json();
        assertEqual(tPendingRes.status, 200, 'Admin pending testimonials returns 200');
        assertEqual(tPendingData.status, 'success', 'Admin pending testimonials returns success');
        const hasPending = tPendingData.testimonials.some(t => t.id === submittedTestimonialId);
        assertEqual(hasPending, true, 'Pending testimonials queue contains the newly submitted testimonial');

        // 4. Admin: Approve the testimonial
        const tApproveRes = await fetch(`${BASE_URL}/api/testimonials/${submittedTestimonialId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const tApproveData = await tApproveRes.json();
        assertEqual(tApproveRes.status, 200, 'Approve testimonial returns 200');
        assertEqual(tApproveData.status, 'success', 'Approve testimonial returns success');

        // 5. Public: Get public testimonials again (should now include our approved testimonial)
        const tPublicRes2 = await fetch(`${BASE_URL}/api/testimonials`);
        const tPublicData2 = await tPublicRes2.json();
        assertEqual(tPublicRes2.status, 200, 'Public testimonials fetch 2 returns 200');
        const containsApproved = tPublicData2.testimonials.some(t => t.id === submittedTestimonialId);
        assertEqual(containsApproved, true, 'Approved testimonial is now visible in the public testimonials feed');

        console.log('\n✨ ALL E2E API VERIFICATION TESTS PASSED SUCCESSFULLY! ✨');
    } catch(err) {
        console.error('\n🛑 Verification pipeline failed:', err.message);
        process.exitCode = 1;
    } finally {
        if (serverProcess) {
            console.log('Shutting down test server...');
            serverProcess.kill('SIGTERM');
        }
    }
}

// Modify status checks to allow standard HTTP codes
assertEqual = (actual, expected, message) => {
    if (actual === expected) {
        console.log(`✅ [PASS] ${message}`);
    } else {
        console.error(`❌ [FAIL] ${message} (Expected "${expected}", but got "${actual}")`);
        throw new Error(`Test assertion failed: ${message}`);
    }
};

runTests();
