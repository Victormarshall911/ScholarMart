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

// Cart list of product IDs
let cartProductIds = [];

// Reputation badge helper
function getClientBadgeInfo(dealsCompleted, averageRating) {
    if (dealsCompleted >= 50 && averageRating >= 4.5) {
        return { emoji: '🏆', label: 'Top Seller', cssClass: 'badge-top' };
    } else if (dealsCompleted >= 10 && averageRating >= 4.0) {
        return { emoji: '⭐', label: 'Trusted by Community', cssClass: 'badge-trusted' };
    } else if (dealsCompleted >= 3) {
        return { emoji: '🟡', label: 'Active Seller', cssClass: 'badge-active' };
    }
    return { emoji: '🟢', label: 'New on Scholarmart', cssClass: 'badge-new' };
}

// 1. Fetch products from API and render cards
async function loadMarketplaceProducts() {
    const grid = document.getElementById('marketplace-products');
    if (!grid) return;

    // Show skeletons/loading
    grid.innerHTML = [...Array(6)].map(() => `
        <div class="product-card" style="pointer-events: none; border: 1px solid var(--border);">
            <div class="product-image-container shimmer" style="aspect-ratio: 4 / 3.4; padding-top: 0; background: var(--surface-hover);"></div>
            <div class="product-card-body" style="padding: 10px 12px 12px 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <div class="shimmer" style="height: 10px; width: 35%; border-radius: 4px; background: var(--surface-hover);"></div>
                    <div class="shimmer" style="height: 12px; width: 25%; border-radius: 4px; background: var(--surface-hover);"></div>
                </div>
                <div class="shimmer" style="height: 14px; width: 85%; border-radius: 4px; margin-bottom: 8px; background: var(--surface-hover);"></div>
                <div class="shimmer" style="height: 16px; width: 45%; border-radius: 4px; margin-bottom: 12px; background: var(--surface-hover);"></div>
                <div style="border-top: 1px dashed var(--border); padding-top: 8px; margin-top: auto;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <div class="shimmer" style="height: 10px; width: 40%; border-radius: 4px; background: var(--surface-hover);"></div>
                        <div class="shimmer" style="height: 10px; width: 30%; border-radius: 4px; background: var(--surface-hover);"></div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Build query params
    const params = new URLSearchParams();
    if (activeFilters.search) params.append('search', activeFilters.search);
    if (activeFilters.category) params.append('category', activeFilters.category);
    if (activeFilters.campus) params.append('campus', activeFilters.campus);
    if (activeFilters.minPrice) params.append('minPrice', activeFilters.minPrice);
    if (activeFilters.maxPrice) params.append('maxPrice', activeFilters.maxPrice);

    params.append('_cb', Date.now());

    try {
        const response = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' });
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
                const isBookmarked = cartProductIds.includes(product.id);
                
                // Get first image
                let imagePath = '/uploads/products/placeholder.webp';
                if (product.images) {
                    try {
                        const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                        if (parsed && parsed.length > 0) imagePath = parsed[0];
                    } catch(e) {}
                }

                const dealsCompleted = product.vendor ? (product.vendor.deals_completed || 0) : 0;
                const averageRating = product.vendor ? (parseFloat(product.vendor.average_rating) || 0) : 0;
                const badge = getClientBadgeInfo(dealsCompleted, averageRating);
                const badgeHtml = `<span class="reputation-badge ${badge.cssClass}" title="${badge.label} (${dealsCompleted} deals, ${averageRating}★)">${badge.emoji} ${badge.label}</span>`;

                const condition = product.condition || (product.id % 2 === 0 ? 'Like New' : 'Good Condition');
                const isFlashSale = product.id % 4 === 0;
                const originalPrice = isFlashSale ? Math.round(product.price * 1.25) : null;
                const discountPercentage = originalPrice ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : null;
                const isUrgent = product.id % 3 === 0;
                const availability = isUrgent ? 'Only 1 left' : 'In Stock';
                const shipping = product.id % 2 === 0 ? 'Faculty Meetup' : 'Instant Pickup';
                const displayRating = averageRating > 0 ? averageRating : 0;
                const ratingCount = product.vendor ? (product.vendor.total_ratings || 0) : 0;

                return `
                    <div class="product-card" onclick="openProductDetails(${product.id})">
                        <div class="product-image-container">
                            <img src="${imagePath}" class="product-image" alt="${product.name}" loading="lazy">
                            
                            ${discountPercentage ? `<div class="card-badge discount-tag">${discountPercentage}% OFF</div>` : ''}
                            ${product.id % 4 === 0 ? `<div class="card-badge featured-tag">✦ Premium</div>` : ''}
                            
                            <button class="cart-icon-btn ${isBookmarked ? 'active' : ''}" 
                                     onclick="handleCartToggle(event, ${product.id}, ${isBookmarked})">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="${isBookmarked ? 'var(--primary-orange)' : 'none'}" viewBox="0 0 24 24" stroke-width="2" stroke="${isBookmarked ? 'var(--primary-orange)' : 'currentColor'}" style="width: 15px; height: 15px;">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                </svg>
                            </button>
                            <span class="card-image-condition">${condition}</span>
                        </div>
                        <div class="product-card-body">
                            <div class="card-meta-line">
                                <span class="product-card-category">${product.category}</span>
                                <div class="card-verified-line">
                                    <span class="badge-emoji">${badge.emoji}</span>
                                    <span class="badge-text">${badge.label}</span>
                                </div>
                            </div>
                            
                            <h4 class="product-card-name">${product.name}</h4>
                            
                            <div class="card-price-row">
                                <span class="product-card-price">&#8358;${parseFloat(product.price).toLocaleString()}</span>
                                ${originalPrice ? `<span class="card-price-original">&#8358;${originalPrice.toLocaleString()}</span>` : ''}
                            </div>
                            
                            <div class="card-footer-info">
                                <div class="card-info-row">
                                    <span class="card-badge-campus">
                                        📍 ${product.campus}
                                    </span>
                                    <span class="card-rating-badge">
                                        ★ ${displayRating.toFixed(1)} <span class="rating-count">(${ratingCount})</span>
                                    </span>
                                </div>
                                
                                <div class="card-indicators-row">
                                    <span class="availability-dot ${isUrgent ? 'urgent' : ''}">
                                        ${availability}
                                    </span>
                                    <span class="shipping-text">
                                        🕒 ${shipping}
                                    </span>
                                </div>
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
        const response = await fetch(`/api/products?_cb=${Date.now()}`, { cache: 'no-store' });
        const data = await response.json();
        if (data.status === 'success') {
            const products = data.products.slice(0, 4); // Show only top 4
            
            if (products.length === 0) {
                list.innerHTML = `<div style="grid-column: span 2; text-align: center; color: var(--text-secondary); font-size: 13px; padding: 20px;">No campus deals listed yet.</div>`;
                return;
            }
            list.innerHTML = products.map(product => {
                const isBookmarked = cartProductIds.includes(product.id);
                let imagePath = '/uploads/products/placeholder.webp';
                if (product.images) {
                    try {
                        const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                        if (parsed && parsed.length > 0) imagePath = parsed[0];
                    } catch(e) {}
                }

                const dealsCompleted = product.vendor ? (product.vendor.deals_completed || 0) : 0;
                const averageRating = product.vendor ? (parseFloat(product.vendor.average_rating) || 0) : 0;
                const badge = getClientBadgeInfo(dealsCompleted, averageRating);
                const badgeHtml = `<span class="reputation-badge ${badge.cssClass}" title="${badge.label} (${dealsCompleted} deals, ${averageRating}★)">${badge.emoji} ${badge.label}</span>`;

                const condition = product.condition || (product.id % 2 === 0 ? 'Like New' : 'Good Condition');
                const isFlashSale = product.id % 4 === 0;
                const originalPrice = isFlashSale ? Math.round(product.price * 1.25) : null;
                const discountPercentage = originalPrice ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : null;
                const isUrgent = product.id % 3 === 0;
                const availability = isUrgent ? 'Only 1 left' : 'In Stock';
                const shipping = product.id % 2 === 0 ? 'Faculty Meetup' : 'Instant Pickup';
                const displayRating = averageRating > 0 ? averageRating : 0;
                const ratingCount = product.vendor ? (product.vendor.total_ratings || 0) : 0;

                return `
                    <div class="product-card" onclick="openProductDetails(${product.id})">
                        <div class="product-image-container">
                            <img src="${imagePath}" class="product-image" alt="${product.name}" loading="lazy">
                            
                            ${discountPercentage ? `<div class="card-badge discount-tag">${discountPercentage}% OFF</div>` : ''}
                            ${product.id % 4 === 0 ? `<div class="card-badge featured-tag">✦ Premium</div>` : ''}
                            
                            <button class="cart-icon-btn ${isBookmarked ? 'active' : ''}" 
                                     onclick="handleCartToggle(event, ${product.id}, ${isBookmarked})">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="${isBookmarked ? 'var(--primary-orange)' : 'none'}" viewBox="0 0 24 24" stroke-width="2" stroke="${isBookmarked ? 'var(--primary-orange)' : 'currentColor'}" style="width: 15px; height: 15px;">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                </svg>
                            </button>
                            <span class="card-image-condition">${condition}</span>
                        </div>
                        <div class="product-card-body">
                            <div class="card-meta-line">
                                <span class="product-card-category">${product.category}</span>
                                <div class="card-verified-line">
                                    <span class="badge-emoji">${badge.emoji}</span>
                                    <span class="badge-text">${badge.label}</span>
                                </div>
                            </div>
                            
                            <h4 class="product-card-name">${product.name}</h4>
                            
                            <div class="card-price-row">
                                <span class="product-card-price">&#8358;${parseFloat(product.price).toLocaleString()}</span>
                                ${originalPrice ? `<span class="card-price-original">&#8358;${originalPrice.toLocaleString()}</span>` : ''}
                            </div>
                            
                            <div class="card-footer-info">
                                <div class="card-info-row">
                                    <span class="card-badge-campus">
                                        📍 ${product.campus}
                                    </span>
                                    <span class="card-rating-badge">
                                        ★ ${displayRating.toFixed(1)} <span class="rating-count">(${ratingCount})</span>
                                    </span>
                                </div>
                                
                                <div class="card-indicators-row">
                                    <span class="availability-dot ${isUrgent ? 'urgent' : ''}">
                                        ${availability}
                                    </span>
                                    <span class="shipping-text">
                                        🕒 ${shipping}
                                    </span>
                                </div>
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

// 3. Load Cart listings list from DB
async function loadCartProductIds() {
    if (!currentToken) {
        cartProductIds = [];
        return;
    }

    try {
        const response = await fetch('/api/products/cart', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();
        if (data.status === 'success') {
            cartProductIds = data.products.map(p => p.id);
        }
    } catch(e) {
        console.warn('Could not retrieve cart products list from server.');
    }
}

// 4. Cart Clicking Toggles
async function handleCartToggle(event, productId, isCurrentlyInCart) {
    event.stopPropagation(); // Avoid card click details transition
    
    if (!currentToken) {
        Toast.show('Please login to add products to your cart!', 'warning');
        window.location.hash = '#/login';
        return;
    }

    const loader = Toast.show(isCurrentlyInCart ? 'Removing from cart...' : 'Adding to cart...', 'loading', 1500);

    try {
        const url = isCurrentlyInCart ? `/api/products/cart/${productId}` : `/api/products/cart`;
        const method = isCurrentlyInCart ? 'DELETE' : 'POST';
        const body = isCurrentlyInCart ? null : JSON.stringify({ productId });
        
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
            if (isCurrentlyInCart) {
                cartProductIds = cartProductIds.filter(id => id !== productId);
                Toast.update(loader, 'Removed from cart!', 'success');
            } else {
                cartProductIds.push(productId);
                Toast.update(loader, 'Added to cart!', 'success');
            }
            
            // Refresh active listings grids
            loadMarketplaceProducts();
            loadHomeFeatured();
        } else {
            Toast.update(loader, data.message || 'Cart update failed', 'error');
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
            const dealsCompleted = p.vendor ? (p.vendor.deals_completed || 0) : 0;
            const averageRating = p.vendor ? (parseFloat(p.vendor.average_rating) || 0) : 0;
            const badge = getClientBadgeInfo(dealsCompleted, averageRating);
            const badgeHtml = `<span class="reputation-badge ${badge.cssClass}" style="margin-left: 6px;">${badge.emoji} ${badge.label}</span>`;
            
            vNameTag.innerHTML = `<span style="font-weight: 700;">${p.vendor.name}</span> ${badgeHtml}`;
            
            // Set WhatsApp link
            if (p.vendor.whatsappLink) {
                document.getElementById('details-whatsapp-btn').href = p.vendor.whatsappLink;
                document.getElementById('details-whatsapp-btn').style.display = 'flex';
            } else {
                document.getElementById('details-whatsapp-btn').style.display = 'none';
            }

            const respTag = document.getElementById('details-vendor-response');
            if (respTag) {
                const totalRatings = p.vendor ? (p.vendor.total_ratings || 0) : 0;
                const reputationScore = totalRatings > 0 ? Math.round((averageRating / 5) * 100) : null;
                const trustScoreHtml = reputationScore !== null ? ` • <b>${reputationScore}% Trust Score</b>` : ` • <b>No trust score yet</b>`;
                respTag.innerHTML = `Typically replies in 2 hours • <b>${dealsCompleted}</b> deals completed • <b>${averageRating ? averageRating.toFixed(1) + '★' : 'No ratings yet'}</b>${trustScoreHtml}`;
            }



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

// 6. Removed Paystack checkout and gateway simulator handlers

// 9. Apply Filter drawer selections
function toggleFilterDrawer(show) {
    const drawer = document.getElementById('filter-drawer-overlay');
    if (!drawer) return;
    
    if (show) {
        drawer.style.display = 'flex';
        requestAnimationFrame(() => {
            drawer.classList.add('active');
            drawer.querySelector('.filter-drawer').classList.add('active');
        });
    } else {
        drawer.classList.remove('active');
        drawer.querySelector('.filter-drawer').classList.remove('active');
        setTimeout(() => drawer.style.display = 'none', 350);
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
    
    const globalSearch = document.getElementById('global-search-input');
    if (globalSearch) globalSearch.value = '';
    
    activeFilters = { search: '', category: '', campus: '', minPrice: '', maxPrice: '' };
    
    toggleFilterDrawer(false);
    loadMarketplaceProducts();
}

// Bind Filter toggles
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('global-filter-btn');
    if (toggleBtn) {
        toggleBtn.onclick = () => toggleFilterDrawer(true);
    }
    
    const clearTag = document.getElementById('active-filters-tag');
    if (clearTag) {
        clearTag.onclick = () => resetMarketplaceFilters();
    }
});

// --- RATE SELLER MODAL CONTROLLER ---
let currentRatingValue = 0;
let currentRatingDealId = null;

function toggleRateSellerModal(show) {
    const modal = document.getElementById('rate-seller-modal-overlay');
    if (!modal) return;
    if (show) {
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('active'));
    } else {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
        currentRatingValue = 0;
        document.getElementById('rate-stars-value').value = '';
        const reviewInput = document.getElementById('rate-review');
        if (reviewInput) reviewInput.value = '';
        updateRatingStarsUI(0);
    }
}

function setRatingStars(rating) {
    currentRatingValue = rating;
    const valInput = document.getElementById('rate-stars-value');
    if (valInput) valInput.value = rating;
    updateRatingStarsUI(rating);
}

function updateRatingStarsUI(rating) {
    const container = document.getElementById('rate-stars-container');
    if (!container) return;
    const stars = container.querySelectorAll('span');
    stars.forEach((star, idx) => {
        if (idx < rating) {
            star.textContent = '⭐';
        } else {
            star.textContent = '☆';
        }
    });
}

// Helper: render a visual filled star bar (out of 5)
function renderStarBar(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= full) stars += '⭐';
        else if (i === full + 1 && half) stars += '✨';
        else stars += '☆';
    }
    return `<span style="font-size: 11px; letter-spacing: 1px;">${stars}</span>`;
}

async function handleRateSellerClick() {
    if (!currentToken) {
        Toast.show('Please login to rate this seller!', 'warning');
        window.location.hash = '#/login';
        return;
    }

    // Buyers cannot rate themselves
    if (currentUser && currentUser.role === 'vendor') {
        Toast.show('Vendors cannot rate other vendors. Switch to a buyer account.', 'warning');
        return;
    }

    const hash = window.location.hash;
    if (!hash.startsWith('#/products/')) return;
    const productId = parseInt(hash.split('/').pop(), 10);

    const loader = Toast.show('Loading vendor info...', 'loading');

    try {
        const prodRes = await fetch(`/api/products/${productId}`);
        const prodData = await prodRes.json();

        if (prodData.status !== 'success') {
            Toast.update(loader, 'Failed to locate product details', 'error');
            return;
        }

        const vendor = prodData.product.vendor;

        // Prevent rating your own listing
        if (currentUser && vendor.id === currentUser.id) {
            Toast.update(loader, 'You cannot rate your own listing.', 'warning');
            return;
        }

        // Store vendor ID for submission
        currentRatingDealId = null; // no deal needed
        window._ratingVendorId = vendor.id;
        window._ratingVendorName = vendor.name;

        const idInput = document.getElementById('rate-deal-id');
        if (idInput) idInput.value = vendor.id; // repurpose hidden field for vendor ID

        // Update modal heading to show vendor name
        const heading = document.querySelector('#rate-seller-modal-overlay .modal-header h3');
        if (heading) heading.textContent = `Rate ${vendor.name}`;

        Toast.dismiss(loader);
        toggleRateSellerModal(true);
    } catch(err) {
        Toast.update(loader, 'Connection error.', 'error');
    }
}

async function submitRateSeller(event) {
    event.preventDefault();

    const valInput = document.getElementById('rate-stars-value');
    const rating = valInput ? parseInt(valInput.value, 10) : 0;
    const reviewInput = document.getElementById('rate-review');
    const review = reviewInput ? reviewInput.value.trim() : '';

    if (!rating || rating < 1 || rating > 5) {
        Toast.show('Please select a star rating!', 'warning');
        return;
    }

    const vendorId = window._ratingVendorId;
    if (!vendorId) {
        Toast.show('Could not identify vendor to rate.', 'error');
        return;
    }

    const loader = Toast.show('Submitting rating...', 'loading');

    try {
        const response = await fetch(`/api/vendors/${vendorId}/rate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rating, review })
        });
        const data = await response.json();

        if (data.status === 'success') {
            Toast.update(loader, 'Thank you! Rating submitted successfully.', 'success');
            toggleRateSellerModal(false);
            window._ratingVendorId = null;
            window._ratingVendorName = null;

            // Reload product details to update the vendor rating UI immediately
            const hash = window.location.hash;
            if (hash.startsWith('#/products/')) {
                const productId = hash.split('/').pop();
                renderProductDetails(productId);
            }
        } else {
            Toast.update(loader, data.message || 'Rating submission failed', 'error');
        }
    } catch(err) {
        Toast.update(loader, 'Network error.', 'error');
    }
}

// 7. Share product details link via native Share API or copy to clipboard fallback
async function shareProductLink() {
    const shareUrl = window.location.href;
    const productName = document.getElementById('details-name').textContent || 'Product';
    
    // Attempt to get the first product image
    const firstImg = document.querySelector('#details-gallery .gallery-img');
    const imageUrl = firstImg ? firstImg.src : null;
    
    if (navigator.share) {
        const shareData = {
            title: productName + ' - ScholarMart',
            text: `Check out this listing on ScholarMart: ${productName}`,
            url: shareUrl
        };
        
        // If image exists and is not a placeholder, try to fetch it as a File object
        if (imageUrl && !imageUrl.includes('placeholder.webp')) {
            try {
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const mimeType = blob.type || 'image/jpeg';
                const ext = mimeType.split('/').pop() || 'jpg';
                const file = new File([blob], `product.${ext}`, { type: mimeType });
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    shareData.files = [file];
                }
            } catch (err) {
                console.error('Error preparing image file for share:', err);
            }
        }
        
        const loader = Toast.show('Preparing sharing view...', 'loading');
        navigator.share(shareData).then(() => {
            Toast.update(loader, 'Shared successfully!', 'success');
        }).catch((err) => {
            if (err.name !== 'AbortError') {
                Toast.update(loader, 'Sharing failed. Copying link instead...', 'warning');
                copyShareLinkToClipboard(shareUrl);
            } else {
                Toast.dismiss(loader);
            }
        });
    } else {
        copyShareLinkToClipboard(shareUrl);
    }
}

function copyShareLinkToClipboard(url) {
    navigator.clipboard.writeText(url)
        .then(() => {
            Toast.show('Product link copied to clipboard!', 'success');
        })
        .catch(() => {
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            Toast.show('Product link copied to clipboard!', 'success');
        });
}

