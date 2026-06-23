/* ========================================================
   BUYER DASHBOARD UTILITIES
   ======================================================== */

// Load buyer purchases (Deals)
async function loadBuyerOrders() {
    const list = document.getElementById('buyer-orders-list');
    if (!list) return;

    list.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="toast-spinner" style="margin: 0 auto;"></div></div>';

    try {
        const response = await fetch('/api/orders/buyer', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();

        if (data.status === 'success') {
            const deals = data.deals || [];
            if (deals.length === 0) {
                list.innerHTML = `
                    <div style="text-align: center; padding: 24px; color: var(--text-secondary);">
                        <p style="font-weight: 700; margin-bottom: 2px;">No deals yet</p>
                        <p style="font-size: 12px;">Deals you make via WhatsApp will appear here after marking as sold.</p>
                    </div>
                `;
                return;
            }

            list.innerHTML = deals.map(deal => {
                let img = '/uploads/products/placeholder.webp';
                if (deal.images && deal.images.length > 0) img = deal.images[0];
                
                let badgeClass = 'badge-pending';
                if (deal.status === 'completed') badgeClass = 'badge-approved';
                else if (deal.status === 'cancelled') badgeClass = 'badge-rejected';

                const formattedDate = new Date(deal.created_at).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'short', year: 'numeric'
                });

                // Rating section or confirm button
                let actionsHtml = '';
                if (deal.status === 'pending_confirmation') {
                    actionsHtml = `
                        <div style="margin-top: 8px; display: flex; gap: 8px;">
                            <button class="btn btn-primary btn-sm" onclick="confirmDealCompletion(${deal.id})" style="padding: 4px 8px; font-size: 11px; width: auto;">Confirm Received</button>
                        </div>
                    `;
                } else if (deal.status === 'completed' && !deal.rating) {
                    actionsHtml = `
                        <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center;">
                            <span style="font-size: 11px; font-weight: 600;">Rate Seller:</span>
                            <div class="stars-input" style="display: flex; gap: 4px;">
                                ${[1, 2, 3, 4, 5].map(star => `
                                    <span style="cursor: pointer; font-size: 16px;" onclick="submitDealRating(${deal.id}, ${star})">⭐</span>
                                `).join('')}
                            </div>
                        </div>
                    `;
                } else if (deal.rating) {
                    actionsHtml = `
                        <div style="margin-top: 4px; font-size: 11px; color: var(--text-secondary);">
                            Your rating: ${'⭐'.repeat(deal.rating)}
                        </div>
                    `;
                }

                return `
                    <div class="list-item" style="flex-direction: column; align-items: stretch; padding: 12px; margin-bottom: 8px;">
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <img src="${img}" class="list-item-img" alt="${deal.product_name}" style="width: 50px; height: 50px;">
                            <div class="list-item-content" style="flex-grow: 1;">
                                <div class="list-item-title" style="font-weight: 700;">${deal.product_name}</div>
                                <div class="list-item-price">₦${parseFloat(deal.amount).toLocaleString()}</div>
                                <div class="list-item-sub">Seller: ${deal.vendor.name} • ${formattedDate}</div>
                            </div>
                            <div style="text-align: right; flex-shrink: 0;">
                                <span class="badge ${badgeClass}" style="text-transform: capitalize;">${deal.status.replace('_', ' ')}</span>
                            </div>
                        </div>
                        ${actionsHtml}
                    </div>
                `;
            }).join('');
        } else {
            list.innerHTML = `
                <div style="text-align: center; padding: 24px; color: var(--text-secondary);">
                    <p style="font-weight: 700; margin-bottom: 2px;">No deals yet</p>
                    <p style="font-size: 12px;">Deals you make via WhatsApp will appear here after marking as sold.</p>
                </div>
            `;
        }
    } catch(e) {
        list.innerHTML = '<p style="color: var(--danger); font-size: 13px; text-align: center;">Failed to load deal history.</p>';
    }
}

// Load buyer cart items grid
async function loadBuyerCartItems() {
    const list = document.getElementById('buyer-cart-list');
    if (!list) return;

    list.innerHTML = '<div style="grid-column: span 2; text-align: center; padding: 20px;"><div class="toast-spinner" style="margin: 0 auto;"></div></div>';

    try {
        const response = await fetch('/api/products/cart', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();

        if (data.status === 'success') {
            const products = data.products;
            if (products.length === 0) {
                list.innerHTML = `
                    <div style="grid-column: span 2; text-align: center; padding: 24px; color: var(--text-secondary);">
                        <p style="font-weight: 700; margin-bottom: 2px;">No products in cart</p>
                        <p style="font-size: 12px;">Add products in the marketplace to view them here.</p>
                    </div>
                `;
                return;
            }

            list.innerHTML = products.map(product => {
                let img = '/uploads/products/placeholder.webp';
                if (product.images) {
                    try {
                        const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                        if (parsed && parsed.length > 0) img = parsed[0];
                    } catch(e) {}
                }

                return `
                    <div class="product-card" onclick="openProductDetails(${product.id})">
                        <div class="product-image-container">
                            <img src="${img}" class="product-image" alt="${product.name}">
                            <button class="cart-icon-btn active" 
                                    onclick="handleCartToggle(event, ${product.id}, true); setTimeout(loadBuyerCartItems, 800);">
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
                                <span style="font-weight: 700;">${product.vendor_name}</span>
                                <span class="product-card-campus">${product.campus}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            list.innerHTML = `
                <div style="grid-column: span 2; text-align: center; padding: 24px; color: var(--text-secondary);">
                    <p style="font-weight: 700; margin-bottom: 2px;">No products in cart</p>
                    <p style="font-size: 12px;">Add products in the marketplace to view them here.</p>
                </div>
            `;
        }
    } catch(e) {
        list.innerHTML = '<p style="color: var(--danger); font-size: 13px; text-align: center; grid-column: span 2;">Failed to load cart items.</p>';
    }
}

// Buyer Profile Wizard Loading
function loadBuyerVerificationWizard() {
    const card = document.getElementById('verification-wizard-card');
    const badge = document.getElementById('buyer-verification-badge');
    if (!card || !badge) return;

    // Set badge based on email verification state
    const isVerified = currentUser.email_verified || false;
    let badgeClass = isVerified ? 'badge-approved' : 'badge-pending';
    badge.innerHTML = `<span class="badge ${badgeClass}">Email: ${isVerified ? 'VERIFIED' : 'UNVERIFIED'}</span>`;

    // Set buyer avatar if portrait exists
    const avatar = document.getElementById('buyer-profile-avatar');
    if (avatar) {
        if (currentUser.portrait) {
            avatar.innerHTML = `<img src="${currentUser.portrait}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            avatar.textContent = currentUser.name.substring(0, 2).toUpperCase();
        }
    }

    const nameTag = document.getElementById('buyer-profile-name');
    if (nameTag) nameTag.textContent = currentUser.name;
    
    const campusTag = document.getElementById('buyer-profile-campus');
    if (campusTag) campusTag.textContent = `${currentUser.university || 'COOU'} - ${currentUser.campus || 'Main Campus'}`;

    // Show/hide email verification box
    if (isVerified) {
        card.style.display = 'none';
    } else {
        card.style.display = 'block';
        const emailVerifyBtn = document.getElementById('verify-email-option');
        if (emailVerifyBtn) {
            emailVerifyBtn.style.display = 'block';
        }
    }
}

