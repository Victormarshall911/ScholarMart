/**
 * Scholarmart Client Router & Orchestrator (PWA shell)
 */

// Sync auth settings with other modules
function syncAuthUI() {
    // Update Support button label when logged in
    const supportBtn = document.getElementById('header-support-btn');
    if (supportBtn && currentToken && currentUser) {
        supportBtn.title = `${currentUser.name} (${currentUser.role})`;
    }
}

// Log out user
function logoutUser() {
    localStorage.removeItem('scholarmart_token');
    localStorage.removeItem('scholarmart_user');
    currentToken = null;
    currentUser = null;
    cartProductIds = [];
    document.body.classList.remove('admin-mode');
    
    syncAuthUI();
    Toast.show('Logged out successfully', 'info');
    window.location.hash = '#/';
}

// SPA Router
function routeApp() {
    const hash = window.location.hash || '#/';
    
    if (hash !== '#/admin-dashboard') {
        document.body.classList.remove('admin-mode');
    }
    
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
        fetchCategories();
        loadHomeFeatured();
    } 
    else if (hash === '#/marketplace') {
        document.getElementById('marketplace-view').classList.add('active');
        document.querySelector('.app-nav [data-view="marketplace-view"]').classList.add('active');
        fetchCategories();
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
    else if (hash === '#/cart') {
        if (!currentToken) {
            window.location.hash = '#/login';
            return;
        }
        document.getElementById('dashboard-buyer-view').classList.add('active');
        document.getElementById('nav-cart-btn').classList.add('active');
        switchDashboardTab('buyer-cart');
    } 
    else if (hash === '#/saved') {
        window.location.hash = '#/cart';
        return;
    }    else if (hash === '#/dashboard') {
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
    else if (hash === '#/terms') {
        document.getElementById('terms-view').classList.add('active');
        // Scroll to top of the content area
        const appContent = document.querySelector('.app-content');
        if (appContent) appContent.scrollTop = 0;
    }
    else if (hash === '#/privacy') {
        document.getElementById('privacy-view').classList.add('active');
        // Scroll to top of the content area
        const appContent = document.querySelector('.app-content');
        if (appContent) appContent.scrollTop = 0;
    }
    else {
        // Not Found fallback
        window.location.hash = '#/';
    }
}

// Populate Category horizontal carousels
let BRAND_CATEGORIES = [];

async function fetchCategories() {
    try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.status === 'success') {
            BRAND_CATEGORIES = data.categories.map(c => c.name);
            buildCategoryChips();
            populateCategoryDropdowns();
        }
    } catch (err) {
        console.error('Failed to fetch categories:', err);
    }
}

function populateCategoryDropdowns() {
    const filterSelect = document.getElementById('filter-category');
    const prodSelect = document.getElementById('prod-category');
    
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">All Categories</option>';
        BRAND_CATEGORIES.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            filterSelect.appendChild(opt);
        });
    }
    
    if (prodSelect) {
        prodSelect.innerHTML = '<option value="">Select Category</option>';
        BRAND_CATEGORIES.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            prodSelect.appendChild(opt);
        });
    }
}

function buildCategoryChips() {
    const landingContainer = document.getElementById('landing-categories');
    const marketContainer = document.getElementById('marketplace-categories');
    
    const buildChipsHTML = (activeCat) => {
        let html = `<button type="button" class="category-chip ${!activeCat ? 'active' : ''}" onclick="selectCategoryFilter('')">All</button>`;
        html += BRAND_CATEGORIES.map(cat => {
            const isActive = cat === activeCat;
            return `<button type="button" class="category-chip ${isActive ? 'active' : ''}" onclick="selectCategoryFilter('${cat}')">${cat}</button>`;
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
    loadCartProductIds();
    buildCategoryChips();
    bindSearchInputs();
    fetchCategories();

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

    // 5. Fade out splash screen overlay after 1.8 seconds
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.classList.add('fade-out');
        }, 1800);
    }
});

