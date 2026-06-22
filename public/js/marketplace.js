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
        return { emoji: '⭐', label: 'Trusted', cssClass: 'badge-trusted' };
    } else if (dealsCompleted >= 3) {
        return { emoji: '🟡', label: 'Active', cssClass: 'badge-active' };
    }
    return { emoji: '🟢', label: 'New', cssClass: 'badge-new' };
}

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

                return `
                    <div class="product-card" onclick="openProductDetails(${product.id})">
                        <div class="product-image-container">
                            <img src="${imagePath}" class="product-image" alt="${product.name}" loading="lazy">
                            <button class="cart-icon-btn ${isBookmarked ? 'active' : ''}" 
                                     onclick="handleCartToggle(event, ${product.id}, ${isBookmarked})">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 18px; height: 18px;">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
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
                                    ${badgeHtml}
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

                return `
                    <div class="product-card" onclick="openProductDetails(${product.id})">
                        <div class="product-image-container">
                            <img src="${imagePath}" class="product-image" alt="${product.name}">
                            <button class="cart-icon-btn ${isBookmarked ? 'active' : ''}" 
                                     onclick="handleCartToggle(event, ${product.id}, ${isBookmarked})">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 18px; height: 18px;">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
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
                                    ${badgeHtml}
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
                respTag.innerHTML = `Typically replies in 2 hours • <b>${dealsCompleted}</b> deals completed • <b>${averageRating ? averageRating.toFixed(1) + '★' : 'No ratings yet'}</b>`;
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
