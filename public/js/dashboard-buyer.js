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

            // Use list-style layout for cart items with action buttons
            list.style.display = 'flex';
            list.style.flexDirection = 'column';
            list.style.gap = '10px';

            list.innerHTML = products.map(product => {
                let img = '/uploads/products/placeholder.webp';
                if (product.images) {
                    try {
                        const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                        if (parsed && parsed.length > 0) img = parsed[0];
                    } catch(e) {}
                }

                // Build WhatsApp link
                let whatsappHtml = '';
                if (product.whatsapp_number) {
                    const waNum = product.whatsapp_number.replace(/^0/, '234');
                    const waLink = `https://wa.me/${waNum}?text=${encodeURIComponent(`Hi, I'm interested in your "${product.name}" listed on ScholarMart for ₦${parseFloat(product.price).toLocaleString()}.`)}`;
                    whatsappHtml = `
                        <a href="${waLink}" target="_blank" class="btn btn-primary cart-action-btn" onclick="event.stopPropagation();">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" style="width: 15px; height: 15px; flex-shrink: 0;">
                                <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.333 4.982L2 22l5.202-1.362a9.92 9.92 0 004.81 1.233h.005c5.505 0 9.99-4.477 9.99-9.982A9.97 9.97 0 0012.012 2z"/>
                            </svg>
                            WhatsApp
                        </a>
                    `;
                }

                return `
                    <div class="cart-item-card" onclick="openProductDetails(${product.id})">
                        <img src="${img}" class="cart-item-img" alt="${product.name}">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${product.name}</div>
                            <div class="cart-item-price">₦${parseFloat(product.price).toLocaleString()}</div>
                            <div class="cart-item-meta">${product.vendor_name} • ${product.campus}</div>
                        </div>
                        <div class="cart-item-actions" onclick="event.stopPropagation();">
                            ${whatsappHtml}
                            <button class="btn btn-outline cart-action-btn cart-action-delete" onclick="event.stopPropagation(); removeCartItem(${product.id});">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 15px; height: 15px; flex-shrink: 0;">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                                Remove
                            </button>
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

// Remove a single item from cart and refresh the list
async function removeCartItem(productId) {
    const loader = Toast.show('Removing from cart...', 'loading', 1500);
    try {
        const response = await fetch(`/api/products/cart/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.status === 'success') {
            cartProductIds = cartProductIds.filter(id => id !== productId);
            Toast.update(loader, 'Removed from cart!', 'success');
            loadBuyerCartItems();
        } else {
            Toast.update(loader, data.message || 'Failed to remove', 'error');
        }
    } catch(err) {
        Toast.update(loader, 'Connection error.', 'error');
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

