/**
 * Scholarmart Client Authentication & Verification Controller
 */

// Global State refs (will be synced from app.js)
let currentUser = null;
let currentToken = null;

// Dynamic lists of universities and campuses fetched from backend
let ALL_UNIVERSITIES = [];
let ALL_CAMPUSES = [];

// 1. Toggle Auth View panels
function toggleAuthPanel(panelName) {
    const loginPanel = document.getElementById('login-panel');
    const registerPanel = document.getElementById('register-panel');
    
    if (panelName === 'register') {
        loginPanel.classList.remove('active');
        registerPanel.classList.add('active');
    } else {
        registerPanel.classList.remove('active');
        loginPanel.classList.add('active');
    }
}

// 2. Password show/hide helper
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const trigger = input.nextElementSibling;
    if (input.type === 'password') {
        input.type = 'text';
        if (trigger) trigger.textContent = 'Hide';
    } else {
        input.type = 'password';
        if (trigger) trigger.textContent = 'Show';
    }
}

// 3. Toggle Vendor Bank Details
function toggleVendorFields(role) {
    const bankFields = document.getElementById('vendor-bank-fields');
    if (role === 'vendor') {
        bankFields.style.display = 'block';
        document.getElementById('reg-bank').required = true;
        document.getElementById('reg-account-num').required = true;
        document.getElementById('reg-account-name').required = true;
    } else {
        bankFields.style.display = 'none';
        document.getElementById('reg-bank').required = false;
        document.getElementById('reg-account-num').required = false;
        document.getElementById('reg-account-name').required = false;
    }
}

// 4. Shared Autocomplete setup
function setupCampusAutocomplete(inputId, dropdownId) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    if (!input || !dropdown) return;

    // Helper to get campuses to suggest based on input context
    function getCampusesForContext() {
        if (inputId === 'reg-campus') {
            const regUnivSelect = document.getElementById('reg-univ');
            if (regUnivSelect && regUnivSelect.value) {
                return ALL_CAMPUSES.filter(c => c.university_code === regUnivSelect.value);
            }
            return []; // Force user to select university first
        }
        if (inputId === 'prod-campus' && currentUser) {
            const userUniv = currentUser.university;
            const matchedUniv = ALL_UNIVERSITIES.find(u => u.code === userUniv || u.name === userUniv);
            if (matchedUniv) {
                return ALL_CAMPUSES.filter(c => c.university_code === matchedUniv.code);
            }
        }
        return ALL_CAMPUSES;
    }

    // Render dropdown list
    function renderDropdown(campusesList) {
        dropdown.innerHTML = '';
        if (campusesList.length === 0) {
            const noRes = document.createElement('div');
            noRes.className = 'autocomplete-item';
            noRes.style.color = 'var(--text-secondary)';
            noRes.textContent = inputId === 'reg-campus' && !document.getElementById('reg-univ')?.value
                ? 'Please select a University first'
                : 'No campuses found';
            dropdown.appendChild(noRes);
        } else {
            campusesList.forEach(campus => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.textContent = campus.name;
                item.addEventListener('click', () => {
                    input.value = campus.name;
                    dropdown.style.display = 'none';
                });
                dropdown.appendChild(item);
            });
        }
        dropdown.style.display = 'block';
    }

    // Search event
    input.addEventListener('input', () => {
        const query = input.value.toLowerCase().trim();
        if (!query) {
            dropdown.style.display = 'none';
            return;
        }

        const campuses = getCampusesForContext();
        const filtered = campuses.filter(c => c.name.toLowerCase().includes(query));
        renderDropdown(filtered);
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    // Show options on focus if empty
    input.addEventListener('focus', () => {
        if (!input.value) {
            const campuses = getCampusesForContext();
            renderDropdown(campuses);
        }
    });
}

// Initialize autocomplete inputs and fetch dynamic lists
document.addEventListener('DOMContentLoaded', () => {
    fetchRegistrationData();
    setupCampusAutocomplete('reg-campus', 'reg-campus-dropdown');
    setupCampusAutocomplete('filter-campus', 'filter-campus-dropdown');
    setupCampusAutocomplete('prod-campus', 'prod-campus-dropdown');
});

// Fetch universities and campuses dynamically
async function fetchRegistrationData() {
    try {
        const univRes = await fetch('/api/auth/universities');
        const univData = await univRes.json();
        if (univData.status === 'success') {
            ALL_UNIVERSITIES = univData.universities;
        }
        
        const campRes = await fetch('/api/auth/campuses');
        const campData = await campRes.json();
        if (campData.status === 'success') {
            ALL_CAMPUSES = campData.campuses;
        }
        
        populateUniversityDropdown();
    } catch (err) {
        console.error('Error fetching university/campus data:', err);
    }
}

// Populate university dropdown on registration page
function populateUniversityDropdown() {
    const regUnivSelect = document.getElementById('reg-univ');
    if (!regUnivSelect) return;
    
    regUnivSelect.innerHTML = '<option value="" disabled selected>Select your University</option>';
    
    ALL_UNIVERSITIES.forEach(univ => {
        const opt = document.createElement('option');
        opt.value = univ.code;
        opt.textContent = `${univ.name} (${univ.code})`;
        regUnivSelect.appendChild(opt);
    });
    
    // Reset campus choice if university changes
    regUnivSelect.addEventListener('change', () => {
        const campusInput = document.getElementById('reg-campus');
        if (campusInput) {
            campusInput.value = '';
        }
    });
}

// 5. Submit Login Form
async function handleLoginSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('login-remember').checked;

    const loader = Toast.show('Signing you in...', 'loading');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (data.status === 'success') {
            currentToken = data.token;
            currentUser = data.user;
            
            // Save locally
            localStorage.setItem('scholarmart_token', currentToken);
            localStorage.setItem('scholarmart_user', JSON.stringify(currentUser));
            
            Toast.update(loader, `Welcome back, ${currentUser.name}!`, 'success');
            
            // Navigate based on user role
            syncAuthUI();
            
            setTimeout(() => {
                if (currentUser.role === 'admin') {
                    window.location.hash = '#/admin-dashboard';
                } else {
                    window.location.hash = '#/dashboard';
                }
            }, 1000);
        } else {
            Toast.update(loader, data.message || 'Login failed. Verify credentials.', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Network error. Please try again.', 'error');
    }
}

// 6. Submit Registration Form
async function handleRegisterSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const role = document.getElementById('reg-role').value;
    const university = document.getElementById('reg-univ').value;
    const campus = document.getElementById('reg-campus').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm').value;

    // Vendor bank fields
    let bankName = '';
    let bankCode = '';
    let accountNumber = '';
    let accountHolderName = '';

    if (role === 'vendor') {
        const bankSelect = document.getElementById('reg-bank').value;
        if (bankSelect) {
            const parts = bankSelect.split('|');
            bankCode = parts[0];
            bankName = parts[1];
        }
        accountNumber = document.getElementById('reg-account-num').value;
        accountHolderName = document.getElementById('reg-account-name').value;
    }

    // Password client-side checks
    if (password !== confirmPassword) {
        Toast.show('Passwords do not match!', 'error');
        return;
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        Toast.show('Password must be at least 8 characters and contain letters & numbers', 'warning');
        return;
    }

    const loader = Toast.show('Creating account...', 'loading');

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name, email, phone, role, university, campus, password, confirmPassword,
                bankName, bankCode, accountNumber, accountHolderName
            })
        });
        const data = await response.json();

        if (data.status === 'success') {
            currentToken = data.token;
            currentUser = data.user;
            
            // Save credentials
            localStorage.setItem('scholarmart_token', currentToken);
            localStorage.setItem('scholarmart_user', JSON.stringify(currentUser));
            
            Toast.update(loader, data.message || 'Registration successful!', 'success');
            
            syncAuthUI();
            
            setTimeout(() => {
                window.location.hash = '#/dashboard';
            }, 1000);
        } else {
            Toast.update(loader, data.message || 'Registration failed', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Network error. Account creation failed.', 'error');
    }
}

// 7. Verification OTP Trigger
async function sendVerificationOtp() {
    if (!currentToken) return;
    const loader = Toast.show('Sending verification OTP...', 'loading');

    try {
        const response = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();

        if (data.status === 'success') {
            Toast.update(loader, data.message, 'success');
            
            // Display OTP input fields
            const otpContainer = document.getElementById('otp-input-container');
            const vOtpContainer = document.getElementById('vendor-otp-input-container');
            if (otpContainer) otpContainer.style.display = 'flex';
            if (vOtpContainer) vOtpContainer.style.display = 'flex';
        } else {
            Toast.update(loader, data.message || 'Failed to send OTP', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Connection error.', 'error');
    }
}

// 8. Confirm OTP
async function verifyStudentOtp() {
    if (!currentToken) return;
    
    // Check which input carries value (buyer vs vendor)
    const buyerOtp = document.getElementById('otp-code-input')?.value;
    const vendorOtp = document.getElementById('vendor-otp-code-input')?.value;
    const otp = buyerOtp || vendorOtp;

    if (!otp) {
        Toast.show('Please enter the 6-digit OTP code', 'warning');
        return;
    }

    const loader = Toast.show('Validating code...', 'loading');

    try {
        const response = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ otp })
        });
        const data = await response.json();

        if (data.status === 'success') {
            currentUser.verification_status = 'approved';
            localStorage.setItem('scholarmart_user', JSON.stringify(currentUser));
            
            Toast.update(loader, 'Student identity verified!', 'success');
            
            // Refresh dashboard views
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            Toast.update(loader, data.message || 'Invalid verification OTP', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Connection error.', 'error');
    }
}

// 9. Manual Student ID upload
async function uploadStudentIDCard() {
    if (!currentToken) return;

    // Check files input
    const buyerFile = document.getElementById('id-card-upload-input')?.files[0];
    const vendorFile = document.getElementById('vendor-id-card-upload-input')?.files[0];
    const file = buyerFile || vendorFile;

    if (!file) {
        Toast.show('Please select an ID card image file to upload', 'warning');
        return;
    }

    const loader = Toast.show('Uploading document...', 'loading');
    const formData = new FormData();
    formData.append('id_card', file);

    try {
        const response = await fetch('/api/auth/upload-id', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${currentToken}` },
            body: formData
        });
        const data = await response.json();

        if (data.status === 'success') {
            currentUser.verification_status = 'pending';
            localStorage.setItem('scholarmart_user', JSON.stringify(currentUser));
            
            Toast.update(loader, 'Document uploaded. manual review pending.', 'success');
            
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            Toast.update(loader, data.message || 'Failed to upload document', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Server error during upload.', 'error');
    }
}

// Initialize Form Bindings
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);

    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);
});
