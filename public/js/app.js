/**
 * Scholarmart Client Router & Orchestrator (PWA shell)
 */

// Sync auth settings with other modules
function syncAuthUI() {
    const authBtn = document.getElementById('header-auth-btn');
    if (!authBtn) return;
    if (currentToken && currentUser) {
        authBtn.onclick = () => { window.location.hash = '#/dashboard'; };
        authBtn.title = `${currentUser.name} (${currentUser.role})`;
        
        // Populate header university badge
        const badge = document.getElementById('header-univ-badge');
        if (badge) badge.textContent = currentUser.university || 'COOU';
    } else {
        authBtn.onclick = () => { window.location.hash = '#/login'; };
        authBtn.title = "Sign In";
    }
}

// Log out user
function logoutUser() {
    localStorage.removeItem('scholarmart_token');
    localStorage.removeItem('scholarmart_user');
    currentToken = null;
    currentUser = null;
    savedProductIds = [];
    
    syncAuthUI();
    Toast.show('Logged out successfully', 'info');
    window.location.hash = '#/';
}

// SPA Router
function routeApp() {
    const hash = window.location.hash || '#/';
    
    // Hide all view panels
    const views = document.querySelectorAll('.view-container');
    views.forEach(v => v.classList.remove('active'));

    // Remove active styles on bottom nav
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(n => n.classList.remove('active'));

    // Close any open modals
    toggleProductModal(false);
    toggleFilterDrawer(false);

    // Route views
    if (hash === '#/' || hash === '') {
        document.getElementById('landing-view').classList.add('active');
        document.querySelector('.app-nav [data-view="landing-view"]').classList.add('active');
        loadHomeFeatured();
    } 
    else if (hash === '#/marketplace') {
        document.getElementById('marketplace-view').classList.add('active');
        document.querySelector('.app-nav [data-view="marketplace-view"]').classList.add('active');
        loadMarketplaceProducts();
    } 
    else if (hash.startsWith('#/products/')) {
        const productId = hash.split('/').pop();
        document.getElementById('details-view').classList.add('active');
        renderProductDetails(productId);
    } 
    else if (hash === '#/login' || hash === '#/register') {
        if (currentToken) {
            window.location.hash = '#/dashboard';
            return;
        }
        document.getElementById('auth-view').classList.add('active');
        toggleAuthPanel(hash === '#/register' ? 'register' : 'login');
    } 
    else if (hash === '#/saved') {
        if (!currentToken) {
            window.location.hash = '#/login';
            return;
        }
        document.getElementById('dashboard-buyer-view').classList.add('active');
        document.getElementById('nav-saved-btn').classList.add('active');
        switchDashboardTab('buyer-saved');
    } 
    else if (hash === '#/dashboard') {
        if (!currentToken) {
            window.location.hash = '#/login';
            return;
        }
        document.getElementById('nav-profile-btn').classList.add('active');
        if (currentUser.role === 'admin') {
            window.location.hash = '#/admin-dashboard';
        } else if (currentUser.role === 'vendor') {
            document.getElementById('dashboard-vendor-view').classList.add('active');
            loadVendorDashboard();
        } else {
            document.getElementById('dashboard-buyer-view').classList.add('active');
            switchDashboardTab('buyer-orders');
            loadBuyerVerificationWizard();
        }
    } 
    else if (hash === '#/admin-dashboard') {
        if (!currentToken || currentUser.role !== 'admin') {
            window.location.hash = '#/';
            return;
        }
        document.getElementById('dashboard-admin-view').classList.add('active');
        loadAdminDashboard();
    } 
    else if (hash.startsWith('#/payment-simulate/')) {
        if (!currentToken) {
            window.location.hash = '#/login';
            return;
        }
        const ref = hash.split('/').pop();
        document.getElementById('payment-simulate-view').classList.add('active');
        loadPaymentSimulation(ref);
    } 
    else {
        // Not Found fallback
        window.location.hash = '#/';
    }
}

// Populate Category horizontal carousels
const BRAND_CATEGORIES = [
    'Electronics',
    'Fashion',
    'Books',
    'Hostel Essentials',
    'Gadgets',
    'Beauty Products',
    'Food & Snacks'
];

function buildCategoryChips() {
    const landingContainer = document.getElementById('landing-categories');
    const marketContainer = document.getElementById('marketplace-categories');
    
    const buildChipsHTML = (activeCat) => {
        let html = `<div class="category-chip ${!activeCat ? 'active' : ''}" onclick="selectCategoryFilter('')">All</div>`;
        html += BRAND_CATEGORIES.map(cat => {
            const isActive = cat === activeCat;
            return `<div class="category-chip ${isActive ? 'active' : ''}" onclick="selectCategoryFilter('${cat}')">${cat}</div>`;
        }).join('');
        return html;
    };

    if (landingContainer) {
        landingContainer.innerHTML = buildChipsHTML(activeFilters.category);
    }
    if (marketContainer) {
        marketContainer.innerHTML = buildChipsHTML(activeFilters.category);
    }
}

function selectCategoryFilter(category) {
    activeFilters.category = category;
    buildCategoryChips();
    
    // Redirect to marketplace if clicked on homepage
    if (window.location.hash !== '#/marketplace') {
        window.location.hash = '#/marketplace';
    } else {
        loadMarketplaceProducts();
    }
}

// Bind search input hooks
function bindSearchInputs() {
    const landingSearch = document.getElementById('landing-search-input');
    const marketSearch = document.getElementById('marketplace-search-input');

    if (landingSearch) {
        landingSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const val = landingSearch.value.trim();
                activeFilters.search = val;
                if (marketSearch) marketSearch.value = val;
                window.location.hash = '#/marketplace';
                loadMarketplaceProducts();
            }
        });
    }

    if (marketSearch) {
        marketSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                activeFilters.search = marketSearch.value.trim();
                loadMarketplaceProducts();
            }
        });
        // Realtime search on clear/input
        marketSearch.addEventListener('input', () => {
            if (!marketSearch.value) {
                activeFilters.search = '';
                loadMarketplaceProducts();
            }
        });
    }
}

// Initialize on document load
document.addEventListener('DOMContentLoaded', () => {
    // 1. Sync authentication token from localStorage
    currentToken = localStorage.getItem('scholarmart_token');
    const userStr = localStorage.getItem('scholarmart_user');
    if (userStr) {
        try {
            currentUser = JSON.parse(userStr);
        } catch(e) {
            localStorage.removeItem('scholarmart_user');
        }
    }

    syncAuthUI();
    loadSavedProductIds();
    buildCategoryChips();
    bindSearchInputs();

    // 2. Initialize Routing
    window.addEventListener('hashchange', routeApp);
    routeApp();

    // 3. Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => {
                    console.log('Scholarmart Service Worker active on scope:', reg.scope);
                })
                .catch(err => {
                    console.error('Service Worker Registration Failed:', err);
                });
        });
    }

    // 4. Online / Offline listeners
    window.addEventListener('online', () => {
        Toast.show('Back online! Reconnected to Scholarmart.', 'success');
        document.body.classList.remove('offline-mode');
        // reload grid
        if (window.location.hash === '#/marketplace') loadMarketplaceProducts();
    });

    window.addEventListener('offline', () => {
        Toast.show('Connection lost. Working in offline cache mode.', 'warning', 6000);
        document.body.classList.add('offline-mode');
    });

    // 5. Fade out splash screen overlay after 2 seconds
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.classList.add('fade-out');
        }, 2000);
    }
});
