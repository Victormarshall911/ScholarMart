/**
 * Scholarmart Marketplace Catalog & Product Detail Controller
 */

// Filter state tracker
let activeFilters = {
    search: '',
    category: '',
    campus: '',
    minPrice: '',
    maxPrice: ''
};

// Bookmarked list of product IDs
let savedProductIds = [];

// 1. Fetch products from API and render cards
async function loadMarketplaceProducts() {
    const grid = document.getElementById('marketplace-products');
    if (!grid) return;

    // Show skeletons/loading
    grid.innerHTML = `
        <div style="grid-column: span 2; text-align: center; padding: 40px 0; color: var(--text-secondary);">
            <div class="toast-spinner" style="margin: 0 auto 12px; width: 28px; height: 28px; border-width: 3px;"></div>
            <p style="font-size: 13px; font-weight: 500;">Searching campus deals...</p>
        </div>
    `;

    // Build query params
    const params = new URLSearchParams();
    if (activeFilters.search) params.append('search', activeFilters.search);
    if (activeFilters.category) params.append('category', activeFilters.category);
    if (activeFilters.campus) params.append('campus', activeFilters.campus);
    if (activeFilters.minPrice) params.append('minPrice', activeFilters.minPrice);
    if (activeFilters.maxPrice) params.append('maxPrice', activeFilters.maxPrice);

    try {
        const response = await fetch(`/api/products?${params.toString()}`);
        const data = await response.json();

        if (data.status === 'success') {
            const products = data.products;
            
            // Update counts
            const countTag = document.getElementById('results-count');
            if (countTag) countTag.textContent = `${products.length} items found`;

            // Toggle active filter tag
            const filterTag = document.getElementById('active-filters-tag');
            const hasActiveFilters = Object.values(activeFilters).some(v => v !== '');
            if (filterTag) {
                filterTag.style.display = hasActiveFilters ? 'inline' : 'none';
            }

            if (products.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: span 2; text-align: center; padding: 48px 16px;">
                        <p style="font-weight: 700; color: var(--text-primary); font-size: 16px; margin-bottom: 4px;">No items match</p>
                        <p style="font-size: 13px; color: var(--text-secondary);">Try resetting filters or searching for something else.</p>
                    </div>
                `;
                return;
            }

            // Render cards
            grid.innerHTML = products.map(product => {
                const isBookmarked = savedProductIds.includes(product.id);
                
                // Get first image
                let imagePath = '/uploads/products/placeholder.webp';
                if (product.images) {
                    try {
                        const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                        if (parsed && parsed.length > 0) imagePath = parsed[0];
                    } catch(e) {}
                }

                // Subaccount / vendor checkmark trust signal
                const isVerified = product.vendor && product.vendor.verified;
                const verifiedIcon = isVerified ? `
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-left: 2px;">
                        <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#22C55E"/>
                    </svg>
                ` : '';

                return `
                    <div class="product-card" onclick="openProductDetails(${product.id})">
                        <div class="product-image-container">
                            <img src="${imagePath}" class="product-image" alt="${product.name}" loading="lazy">
                            <button class="bookmark-icon-btn ${isBookmarked ? 'active' : ''}" 
                                    onclick="handleBookmarkToggle(event, ${product.id}, ${isBookmarked})">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="${isBookmarked ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 18px; height: 18px;">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                                </svg>
                            </button>
                        </div>
                        <div class="product-card-body">
                            <span class="product-card-category">${product.category}</span>
                            <h4 class="product-card-name">${product.name}</h4>
                            <div class="product-card-price">₦${parseFloat(product.price).toLocaleString()}</div>
                            
                            <div class="product-card-footer">
                                <div class="product-vendor-badge">
                                    <span style="max-width: 60px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${product.vendor_name}</span>
                                    ${verifiedIcon}
                                </div>
                                <span class="product-card-campus">${product.campus}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (err) {
        console.error('Marketplace loading error:', err);
        grid.innerHTML = `<p style="text-align: center; color: var(--danger); font-size: 13px; font-weight: 600; padding: 20px;">Could not connect to marketplace.</p>`;
    }
}

// 2. Fetch and populate homepage featured items
async function loadHomeFeatured() {
    const list = document.getElementById('landing-products');
    if (!list) return;

    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (data.status === 'success') {
            const products = data.products.slice(0, 4); // Show only top 4
            
            if (products.length === 0) {
                list.innerHTML = `<div style="grid-column: span 2; text-align: center; color: var(--text-secondary); font-size: 13px; padding: 20px;">No campus deals listed yet.</div>`;
                return;
            }

            list.innerHTML = products.map(product => {
                const isBookmarked = savedProductIds.includes(product.id);
                let imagePath = '/uploads/products/placeholder.webp';
                if (product.images) {
                    try {
                        const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                        if (parsed && parsed.length > 0) imagePath = parsed[0];
                    } catch(e) {}
                }

                const isVerified = product.vendor && product.vendor.verified;
                const verifiedIcon = isVerified ? `
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-left: 2px;">
                        <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#22C55E"/>
                    </svg>
                ` : '';

                return `
                    <div class="product-card" onclick="openProductDetails(${product.id})">
                        <div class="product-image-container">
                            <img src="${imagePath}" class="product-image" alt="${product.name}">
                            <button class="bookmark-icon-btn ${isBookmarked ? 'active' : ''}" 
                                    onclick="handleBookmarkToggle(event, ${product.id}, ${isBookmarked})">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="${isBookmarked ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 18px; height: 18px;">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                                </svg>
                            </button>
                        </div>
                        <div class="product-card-body">
                            <span class="product-card-category">${product.category}</span>
                            <h4 class="product-card-name">${product.name}</h4>
                            <div class="product-card-price">₦${parseFloat(product.price).toLocaleString()}</div>
                            
                            <div class="product-card-footer">
                                <div class="product-vendor-badge">
                                    <span style="max-width: 60px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${product.vendor_name}</span>
                                    ${verifiedIcon}
                                </div>
                                <span class="product-card-campus">${product.campus}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch(e) {
        console.error('Featured listing loading error:', e);
    }
}

// 3. Load Saved listings list from DB
async function loadSavedProductIds() {
    if (!currentToken) {
        savedProductIds = [];
        return;
    }

    try {
        const response = await fetch('/api/products/saved', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();
        if (data.status === 'success') {
            savedProductIds = data.products.map(p => p.id);
        }
    } catch(e) {
        console.warn('Could not retrieve bookmarks list from server.');
    }
}

// 4. Bookmark Clicking Toggles
async function handleBookmarkToggle(event, productId, isCurrentlyBookmarked) {
    event.stopPropagation(); // Avoid card click details transition
    
    if (!currentToken) {
        Toast.show('Please login to save bookmarks!', 'warning');
        window.location.hash = '#/login';
        return;
    }

    const loader = Toast.show(isCurrentlyBookmarked ? 'Removing bookmark...' : 'Saving bookmark...', 'loading', 1500);

    try {
        const url = isCurrentlyBookmarked ? `/api/products/save/${productId}` : `/api/products/save`;
        const method = isCurrentlyBookmarked ? 'DELETE' : 'POST';
        const body = isCurrentlyBookmarked ? null : JSON.stringify({ productId });
        
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body
        });
        const data = await response.json();

        if (data.status === 'success') {
            if (isCurrentlyBookmarked) {
                savedProductIds = savedProductIds.filter(id => id !== productId);
                Toast.update(loader, 'Bookmark removed!', 'success');
            } else {
                savedProductIds.push(productId);
                Toast.update(loader, 'Listing bookmarked!', 'success');
            }
            
            // Refresh active listings grids
            loadMarketplaceProducts();
            loadHomeFeatured();
        } else {
            Toast.update(loader, data.message || 'Bookmark update failed', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Connection error.', 'error');
    }
}

// 5. Open single product details page
function openProductDetails(id) {
    window.location.hash = `#/products/${id}`;
}

async function renderProductDetails(productId) {
    const loader = Toast.show('Loading product details...', 'loading');

    try {
        const response = await fetch(`/api/products/${productId}`);
        const data = await response.json();

        if (data.status === 'success') {
            const p = data.product;
            
            // Populate basic DOM details
            document.getElementById('details-name').textContent = p.name;
            document.getElementById('details-price').textContent = `₦${parseFloat(p.price).toLocaleString()}`;
            document.getElementById('details-category').textContent = p.category;
            document.getElementById('details-campus').textContent = p.campus;
            document.getElementById('details-description').textContent = p.description || 'No description provided by vendor.';
            
            // Populate vendor info card
            const avatar = document.getElementById('details-vendor-avatar');
            if (avatar) {
                if (p.vendor.portrait) {
                    avatar.innerHTML = `<img src="${p.vendor.portrait}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                } else {
                    avatar.textContent = p.vendor.name.substring(0, 2).toUpperCase();
                }
            }
            
            const vNameTag = document.getElementById('details-vendor-name');
            const verifiedIcon = p.vendor.verified ? `
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#22C55E"/>
                </svg>
            ` : '';
            vNameTag.innerHTML = `<span>${p.vendor.name}</span> ${verifiedIcon}`;
            
            // Set WhatsApp link
            document.getElementById('details-whatsapp-btn').href = p.vendor.whatsappLink;

            // Configure Checkout Button Action
            const buyBtn = document.getElementById('details-buy-btn');
            buyBtn.onclick = () => initiateCheckout(p.id);

            // Populate Gallery Slider images
            const gallery = document.getElementById('details-gallery');
            const dots = document.getElementById('details-gallery-dots');
            
            if (gallery && dots) {
                gallery.innerHTML = '';
                dots.innerHTML = '';

                if (p.images.length === 0) {
                    p.images.push('/uploads/products/placeholder.webp');
                }

                p.images.forEach((img, index) => {
                    // Create slide
                    const wrapper = document.createElement('div');
                    wrapper.className = 'gallery-image-wrapper';
                    wrapper.innerHTML = `<img src="${img}" class="gallery-img" alt="${p.name} Image ${index + 1}">`;
                    gallery.appendChild(wrapper);

                    // Create dot indicator
                    const dot = document.createElement('div');
                    dot.className = `gallery-dot ${index === 0 ? 'active' : ''}`;
                    dots.appendChild(dot);
                });

                // Horizontal scroll listener to slide dots
                gallery.onscroll = () => {
                    const slideWidth = gallery.clientWidth;
                    const page = Math.round(gallery.scrollLeft / slideWidth);
                    
                    const dotNodes = dots.querySelectorAll('.gallery-dot');
                    dotNodes.forEach((dn, dIdx) => {
                        if (dIdx === page) {
                            dn.classList.add('active');
                        } else {
                            dn.classList.remove('active');
                        }
                    });
                };
            }

            Toast.dismiss(loader);
        } else {
            Toast.update(loader, data.message || 'Listing details not found', 'error');
            window.location.hash = '#/marketplace';
        }
    } catch(err) {
        Toast.update(loader, 'Error loading listing.', 'error');
        window.history.back();
    }
}

// 6. Initiate Checkout Order
async function initiateCheckout(productId) {
    if (!currentToken) {
        Toast.show('Please log in to purchase listings!', 'warning');
        window.location.hash = '#/login';
        return;
    }

    const loader = Toast.show('Opening checkout...', 'loading');

    try {
        const response = await fetch('/api/orders/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
        });
        const data = await response.json();

        if (data.status === 'success') {
            Toast.dismiss(loader);
            
            // If sandbox mock checkout URL, redirect to simulator
            if (data.paymentUrl.startsWith('/')) {
                window.location.hash = data.paymentUrl;
            } else {
                // Open real Paystack Checkout window
                window.location.href = data.paymentUrl;
            }
        } else {
            Toast.update(loader, data.message || 'Checkout failed', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Checkout request failed.', 'error');
    }
}

// 7. Load Sandbox Payment simulation view
async function loadPaymentSimulation(reference) {
    const simProdPrice = document.getElementById('sim-product-price');
    const simTotalVal = document.getElementById('sim-total-price');
    if (!simProdPrice || !simTotalVal) return;

    // Fetch order details
    const loader = Toast.show('Resolving checkout gateway...', 'loading');

    try {
        // Query database via verification check to find the order amount
        const response = await fetch(`/api/orders/verify/${reference}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            // In our verification endpoint we don't return price by default, but let's query orders from buyer list
            const buyerOrdersRes = await fetch('/api/orders/buyer', {
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            const ordersData = await buyerOrdersRes.json();
            const order = ordersData.orders.find(o => o.paystack_reference === reference);
            
            if (order) {
                simProdPrice.textContent = `₦${parseFloat(order.amount).toLocaleString()}`;
                simTotalVal.textContent = `₦${parseFloat(order.total_amount).toLocaleString()}`;
            } else {
                simProdPrice.textContent = '₦5,000.00';
                simTotalVal.textContent = '₦5,500.00';
            }
            Toast.dismiss(loader);
        } else {
            Toast.update(loader, 'Failed to resolve payment details', 'error');
            window.location.hash = '#/';
        }
    } catch(e) {
        Toast.update(loader, 'Failed to connect to gateway simulator', 'error');
    }
}

// 8. Trigger Sandbox verification callback redirect
async function simulatePaymentStatus(status) {
    const reference = window.location.hash.split('/').pop();
    if (!reference) return;

    const loader = Toast.show('Confirming transaction splits...', 'loading');

    if (status === 'cancel') {
        Toast.update(loader, 'Transaction cancelled by buyer.', 'info');
        setTimeout(() => {
            window.location.hash = '#/marketplace';
        }, 1200);
        return;
    }

    try {
        const response = await fetch(`/api/orders/verify/${reference}`);
        const data = await response.json();

        if (data.status === 'success' && data.payment_status === 'success') {
            Toast.update(loader, 'Payment completed! Payout shares split successfully.', 'success');
            
            setTimeout(() => {
                window.location.hash = '#/dashboard';
                // Switch buyer dashboard tab to orders
                setTimeout(() => {
                    switchDashboardTab('buyer-orders');
                }, 100);
            }, 1200);
        } else {
            Toast.update(loader, 'Simulated payment processing failed.', 'error');
        }
    } catch(e) {
        Toast.update(loader, 'Simulation request failure.', 'error');
    }
}

// 9. Apply Filter drawer selections
function toggleFilterDrawer(show) {
    const drawer = document.getElementById('filter-drawer-overlay');
    if (!drawer) return;
    
    if (show) {
        drawer.classList.add('active');
        drawer.querySelector('.filter-drawer').classList.add('active');
    } else {
        drawer.classList.remove('active');
        drawer.querySelector('.filter-drawer').classList.remove('active');
    }
}

function applyMarketplaceFilters() {
    activeFilters.campus = document.getElementById('filter-campus').value;
    activeFilters.category = document.getElementById('filter-category').value;
    activeFilters.minPrice = document.getElementById('filter-min-price').value;
    activeFilters.maxPrice = document.getElementById('filter-max-price').value;
    
    toggleFilterDrawer(false);
    loadMarketplaceProducts();
}

function resetMarketplaceFilters() {
    document.getElementById('filter-campus').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-min-price').value = '';
    document.getElementById('filter-max-price').value = '';
    
    activeFilters = { search: '', category: '', campus: '', minPrice: '', maxPrice: '' };
    
    toggleFilterDrawer(false);
    loadMarketplaceProducts();
}

// Bind Filter toggles
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('filter-toggle-btn');
    if (toggleBtn) {
        toggleBtn.onclick = () => toggleFilterDrawer(true);
    }
    
    const clearTag = document.getElementById('active-filters-tag');
    if (clearTag) {
        clearTag.onclick = () => resetMarketplaceFilters();
    }
});
