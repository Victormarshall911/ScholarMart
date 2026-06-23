/**
 * Scholarmart Dashboards Manager (Buyer, Vendor & Admin views)
 */

// 1. Dashboard Tab Switcher (e.g. My listings vs My sales, Saved vs Purchases)
function switchDashboardTab(tabId) {
    // Determine context (buyer, vendor, or admin)
    let containerId = '';
    if (tabId.startsWith('buyer-')) containerId = 'dashboard-buyer-view';
    else if (tabId.startsWith('vendor-')) containerId = 'dashboard-vendor-view';
    else if (tabId.startsWith('admin-')) containerId = 'dashboard-admin-view';

    const container = document.getElementById(containerId);
    if (!container) return;

    // Toggle active tab buttons
    const tabButtons = container.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Toggle active tab panes
    const tabPanes = container.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => {
        if (pane.id === `tab-${tabId}`) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });

    // Trigger loads if necessary
    if (tabId === 'buyer-orders') loadBuyerOrders();
    else if (tabId === 'buyer-cart') loadBuyerCartItems();
    else if (tabId === 'vendor-listings') loadVendorListings();
    else if (tabId === 'vendor-sales') loadVendorSales();
    else if (tabId === 'admin-reports') loadAdminReports();
    else if (tabId === 'admin-moderation') loadAdminModeration();
    else if (tabId === 'admin-users') loadAdminUsers();
    else if (tabId === 'admin-universities') loadAdminUniversities();
    else if (tabId === 'admin-categories') loadAdminCategories();
    else if (tabId === 'admin-orders') loadAdminOrders();
    else if (tabId === 'admin-testimonials') loadAdminTestimonials();
}

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


/* ========================================================
   VENDOR DASHBOARD UTILITIES
   ======================================================== */

// Load vendor listings & sales stats
async function loadVendorDashboard() {
    if (!currentToken) return;

    // Hide/show portrait upload card depending on whether they have a portrait already
    const portraitCard = document.getElementById('vendor-portrait-card');
    if (portraitCard) {
        portraitCard.style.display = currentUser.portrait ? 'none' : 'block';
    }

    // Populate vendor stats
    const dealsCompleted = currentUser.deals_completed || 0;
    const avgRating = parseFloat(currentUser.average_rating) || 0;
    
    const dealsCompletedTag = document.getElementById('stat-deals-completed');
    if (dealsCompletedTag) dealsCompletedTag.textContent = dealsCompleted;
    
    const avgRatingTag = document.getElementById('stat-average-rating');
    if (avgRatingTag) avgRatingTag.textContent = avgRating.toFixed(1);

    // Vendor verification wizard
    loadVendorVerificationWizard();

    // Stats and sales
    loadVendorListings();
    loadVendorSales();
}

function loadVendorVerificationWizard() {
    const card = document.getElementById('vendor-verification-wizard-card');
    const badge = document.getElementById('vendor-verification-badge');
    if (!card || !badge) return;

    const isVerified = currentUser.email_verified || false;
    let badgeClass = isVerified ? 'badge-approved' : 'badge-pending';
    
    // Set reputation badge / badge label
    const dealsCompleted = currentUser.deals_completed || 0;
    const avgRating = parseFloat(currentUser.average_rating) || 0;
    const repBadge = getClientBadgeInfo(dealsCompleted, avgRating);
    
    badge.innerHTML = `
        <span class="badge ${badgeClass}" style="margin-right: 6px;">Email: ${isVerified ? 'VERIFIED' : 'UNVERIFIED'}</span>
        <span class="reputation-badge ${repBadge.cssClass}">${repBadge.emoji} ${repBadge.label}</span>
    `;

    // Set vendor avatar if portrait exists
    const avatar = document.getElementById('vendor-profile-avatar');
    if (avatar) {
        if (currentUser.portrait) {
            avatar.innerHTML = `<img src="${currentUser.portrait}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            avatar.textContent = currentUser.name.substring(0, 2).toUpperCase();
        }
    }

    // Append badge next to vendor name
    const nameTag = document.getElementById('vendor-profile-name');
    if (nameTag) {
        nameTag.innerHTML = `<span>${currentUser.name}</span> <span class="reputation-badge ${repBadge.cssClass}" style="font-size: 11px; padding: 2px 8px; font-weight: normal;">${repBadge.emoji} ${repBadge.label}</span>`;
    }

    if (isVerified) {
        card.style.display = 'none';
    } else {
        card.style.display = 'block';
        const emailVerifyBtn = document.getElementById('vendor-verify-email-option');
        if (emailVerifyBtn) {
            emailVerifyBtn.style.display = 'block';
        }
    }
}

// Load listings list
async function loadVendorListings() {
    const list = document.getElementById('vendor-listings-list');
    if (!list) return;

    list.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="toast-spinner" style="margin: 0 auto;"></div></div>';

    try {
        const response = await fetch('/api/products');
        const data = await response.json();

        if (data.status === 'success') {
            // Filter products belonging to current vendor
            const myListings = data.products.filter(p => p.vendor_id === currentUser.id && p.status !== 'deleted');
            
            // Set stats number
            document.getElementById('stat-total-listings').textContent = myListings.length;

            if (myListings.length === 0) {
                list.innerHTML = `
                    <div style="text-align: center; padding: 24px; color: var(--text-secondary);">
                        <p style="font-weight: 700; margin-bottom: 2px;">No products listed</p>
                        <p style="font-size: 12px; margin-bottom: 12px;">Start selling on campus by adding a listing.</p>
                        <button class="btn btn-outline btn-sm" onclick="openProductCreate()">Create Listing</button>
                    </div>
                `;
                return;
            }

            list.innerHTML = myListings.map(p => {
                let img = '/uploads/products/placeholder.webp';
                if (p.images && p.images.length > 0) {
                    try {
                        const parsed = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                        if (parsed && parsed.length > 0) img = parsed[0];
                    } catch(e) {}
                }

                let badgeClass = 'badge-approved';
                if (p.status === 'reported') badgeClass = 'badge-pending';
                else if (p.status === 'moderated') badgeClass = 'badge-rejected';
                else if (p.status === 'sold') badgeClass = 'badge-rejected';

                let actionsHtml = '';
                if (p.status === 'active') {
                    actionsHtml = `<button class="btn btn-primary btn-sm" onclick="triggerMarkAsSold(${p.id})" style="padding: 4px 8px; width: auto; font-size: 11px; background-color: var(--primary-green); border-color: var(--primary-green); margin-bottom: 4px;">Mark as Sold</button>`;
                }

                return `
                    <div class="list-item" style="align-items: stretch; margin-bottom: 8px;">
                        <img src="${img}" class="list-item-img" alt="${p.name}" style="width: 60px; height: 60px;">
                        <div class="list-item-content" style="display: flex; flex-direction: column; justify-content: center; flex-grow: 1;">
                            <div class="list-item-title" style="font-size: 14px; font-weight: 700;">${p.name}</div>
                            <div class="list-item-price">₦${parseFloat(p.price).toLocaleString()}</div>
                            <div style="margin-top: 4px; display: flex; gap: 6px; align-items: center;">
                                <span class="badge ${badgeClass}" style="font-size: 9px; padding: 1px 6px;">${p.status.toUpperCase()}</span>
                                <span style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">${p.category}</span>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; gap: 4px; flex-shrink: 0;">
                            ${actionsHtml}
                            <div style="display: flex; gap: 4px;">
                                <button class="btn btn-outline btn-sm" onclick="openProductEdit(${p.id})" style="padding: 4px 8px; width: auto; font-size: 11px;">Edit</button>
                                <button class="btn btn-secondary btn-sm" onclick="deleteProductListing(${p.id})" style="padding: 4px 8px; width: auto; font-size: 11px; background-color: #FEE2E2; color: #DC2626;">Delete</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch(e) {
        list.innerHTML = '<p style="color: var(--danger); font-size: 13px; text-align: center;">Failed to load listings.</p>';
    }
}

// Load vendor deals (replaces sales)
async function loadVendorSales() {
    const list = document.getElementById('vendor-sales-list');
    if (!list) return;

    list.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="toast-spinner" style="margin: 0 auto;"></div></div>';

    try {
        const response = await fetch('/api/orders/vendor', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();

        if (data.status === 'success') {
            const deals = data.deals || [];

            if (deals.length === 0) {
                list.innerHTML = `
                    <div style="text-align: center; padding: 24px; color: var(--text-secondary);">
                        <p style="font-weight: 700; margin-bottom: 2px;">No deals recorded yet</p>
                        <p style="font-size: 12px;">Mark listed items as sold to track your deals.</p>
                    </div>
                `;
                return;
            }

            list.innerHTML = deals.map(deal => {
                let img = '/uploads/products/placeholder.webp';
                if (deal.images && deal.images.length > 0) img = deal.images[0];

                const formattedDate = new Date(deal.created_at).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'short'
                });

                const selectId = `status_select_${deal.id}`;

                return `
                    <div class="list-item" style="flex-direction: column; align-items: stretch; gap: 8px; padding: 12px; margin-bottom: 8px;">
                        <div style="display: flex; gap: 10px;">
                            <img src="${img}" class="list-item-img" alt="${deal.product_name}" style="width: 50px; height: 50px;">
                            <div class="list-item-content" style="flex-grow: 1;">
                                <div class="list-item-title" style="font-weight: 700;">${deal.product_name}</div>
                                <div class="list-item-price">₦${parseFloat(deal.amount).toLocaleString()}</div>
                                <div class="list-item-sub">Buyer: ${deal.buyer.name || 'Walk-in'} (${deal.buyer.whatsapp || 'N/A'}) • ${formattedDate}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 8px; margin-top: 4px;">
                            <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">DEAL STATUS:</span>
                            <div style="display: flex; gap: 6px; align-items: center;">
                                <select id="${selectId}" class="form-select" style="font-size: 12px; padding: 4px 8px; width: 160px; height: auto;" onchange="updateSalesOrderStatus(${deal.id}, this.value)">
                                    <option value="pending_confirmation" ${deal.status === 'pending_confirmation' ? 'selected' : ''}>Pending Confirmation</option>
                                    <option value="completed" ${deal.status === 'completed' ? 'selected' : ''}>Completed</option>
                                    <option value="cancelled" ${deal.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch(e) {
        list.innerHTML = '<p style="color: var(--danger); font-size: 13px; text-align: center;">Failed to load deals history.</p>';
    }
}

// Update Deal Status
async function updateSalesOrderStatus(dealId, status) {
    const loader = Toast.show('Updating deal status...', 'loading');

    try {
        const response = await fetch(`/api/orders/${dealId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        const data = await response.json();

        if (data.status === 'success') {
            Toast.update(loader, data.message, 'success');
            loadVendorSales();
        } else {
            Toast.update(loader, data.message || 'Status update failed', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Connection error.', 'error');
    }
}

// 2. Open Product Create/Edit forms
function toggleProductModal(show) {
    const modal = document.getElementById('product-modal-overlay');
    if (!modal) return;
    if (show) {
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('active'));
    } else {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

function openProductCreate() {
    document.getElementById('product-modal-title').textContent = 'Create Listing';
    document.getElementById('edit-product-id').value = '';
    document.getElementById('product-listing-form').reset();
    document.getElementById('prod-image-upload-wrapper').style.display = 'block';
    
    // Set campus defaults to seller's campus
    document.getElementById('prod-campus').value = currentUser.campus;
    
    toggleProductModal(true);
}

async function openProductEdit(productId) {
    const loader = Toast.show('Retrieving listing details...', 'loading');

    try {
        const response = await fetch(`/api/products/${productId}`);
        const data = await response.json();

        if (data.status === 'success') {
            const p = data.product;
            
            document.getElementById('product-modal-title').textContent = 'Edit Listing';
            document.getElementById('edit-product-id').value = p.id;
            document.getElementById('prod-name').value = p.name;
            document.getElementById('prod-price').value = p.price;
            document.getElementById('prod-category').value = p.category;
            document.getElementById('prod-campus').value = p.campus;
            document.getElementById('prod-description').value = p.description || '';
            
            // Hide image uploads during edit for simplicity (keep current images, unless they edit photos via desktop)
            document.getElementById('prod-image-upload-wrapper').style.display = 'none';

            Toast.dismiss(loader);
            toggleProductModal(true);
        } else {
            Toast.update(loader, 'Listing not found', 'error');
        }
    } catch(e) {
        Toast.update(loader, 'Connection error.', 'error');
    }
}

// 3. Handle product form submission
async function handleProductFormSubmit(event) {
    event.preventDefault();
    const editId = document.getElementById('edit-product-id').value;
    const name = document.getElementById('prod-name').value;
    const price = document.getElementById('prod-price').value;
    const category = document.getElementById('prod-category').value;
    const campus = document.getElementById('prod-campus').value;
    const description = document.getElementById('prod-description').value;

    const filesInput = document.getElementById('prod-images');
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('campus', campus);
    formData.append('description', description);
    
    // Append photos if creating
    if (!editId && filesInput && filesInput.files.length > 0) {
        for (let i = 0; i < filesInput.files.length; i++) {
            formData.append('images', filesInput.files[i]);
        }
    }

    const loader = Toast.show(editId ? 'Updating listing...' : 'Creating listing...', 'loading');

    try {
        const url = editId ? `/api/products/${editId}` : `/api/products`;
        const method = editId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${currentToken}` },
            body: formData
        });
        const data = await response.json();

        if (data.status === 'success') {
            Toast.update(loader, data.message || 'Product listed successfully!', 'success');
            toggleProductModal(false);
            loadVendorListings();
        } else {
            Toast.update(loader, data.message || 'Listing request failed', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Connection error. Save failed.', 'error');
    }
}

// 4. Delete product
async function deleteProductListing(productId) {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    const loader = Toast.show('Deleting listing...', 'loading');

    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();

        if (data.status === 'success') {
            Toast.update(loader, 'Listing deleted successfully!', 'success');
            loadVendorListings();
        } else {
            Toast.update(loader, data.message || 'Failed to delete listing', 'error');
        }
    } catch(e) {
        Toast.update(loader, 'Network error.', 'error');
    }
}

// Bind product form submit
document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('product-listing-form');
    if (productForm) {
        productForm.addEventListener('submit', handleProductFormSubmit);
    }
    
    const fabBtn = document.getElementById('fab-create-listing');
    if (fabBtn) {
        fabBtn.onclick = () => {
            if (!currentToken) {
                Toast.show('Please login to list products!', 'warning');
                window.location.hash = '#/login';
            } else if (currentUser.role !== 'vendor' && currentUser.role !== 'admin') {
                Toast.show('Only vendor profiles can create listings.', 'warning');
            } else {
                openProductCreate();
            }
        };
    }

    // Avatar portrait upload clicks and auto-uploads
    const vendorAvatar = document.getElementById('vendor-profile-avatar');
    if (vendorAvatar) {
        vendorAvatar.onclick = () => {
            document.getElementById('vendor-portrait-input')?.click();
        };
    }

    const buyerAvatar = document.getElementById('buyer-profile-avatar');
    if (buyerAvatar) {
        buyerAvatar.onclick = () => {
            document.getElementById('buyer-portrait-input')?.click();
        };
    }

    const vendorPortraitInput = document.getElementById('vendor-portrait-input');
    if (vendorPortraitInput) {
        vendorPortraitInput.onchange = () => {
            uploadPortraitFile('vendor-portrait-input');
        };
    }

    const buyerPortraitInput = document.getElementById('buyer-portrait-input');
    if (buyerPortraitInput) {
        buyerPortraitInput.onchange = () => {
            uploadPortraitFile('buyer-portrait-input');
        };
    }
});


/* ========================================================
   ADMIN DASHBOARD UTILITIES
   ======================================================== */

// Load Admin report stats and active tables
// Load Admin report stats and active tables
async function loadAdminDashboard() {
    if (!currentToken || currentUser.role !== 'admin') return;

    document.body.classList.add('admin-mode');
    switchAdminNav('dashboard');
}

// Switch Admin panes (Dashboard, Users, Listings, Reports, Settings)
function switchAdminNav(paneId) {
    // 1. Update active states on sidebar
    document.querySelectorAll('.admin-sidebar-nav .admin-side-item').forEach(item => {
        if (item.id === `admin-side-${paneId}`) item.classList.add('active');
        else item.classList.remove('active');
    });
    
    // 2. Update active states on mobile bottom nav
    document.querySelectorAll('.admin-only-nav .nav-item').forEach(item => {
        if (item.id === `admin-nav-${paneId}`) item.classList.add('active');
        else item.classList.remove('active');
    });

    // 3. Update active pane
    document.querySelectorAll('.admin-main-area .admin-pane').forEach(pane => {
        if (pane.id === `admin-pane-${paneId}`) pane.classList.add('active');
        else pane.classList.remove('active');
    });

    // Update Mobile header title
    const titleEl = document.getElementById('admin-mobile-title');
    if (titleEl) {
        const titleMap = {
            'dashboard': 'Admin Dashboard',
            'users': 'Users Management',
            'listings': 'Listings Moderation',
            'reports': 'Community Reports',
            'settings': 'Settings & Campuses'
        };
        titleEl.textContent = titleMap[paneId] || 'Admin Console';
    }

    // 4. Trigger appropriate loads
    if (paneId === 'dashboard') {
        loadAdminOrders();
        loadAdminReportStats();
    } else if (paneId === 'users') {
        loadAdminUsers();
    } else if (paneId === 'listings') {
        loadAdminModeration();
    } else if (paneId === 'reports') {
        loadAdminReports();
    } else if (paneId === 'settings') {
        loadAdminUniversities();
        loadAdminCategories();
        loadAdminTestimonials();
    }
}

// Load stats for dashboard top cards
async function loadAdminReportStats() {
    try {
        const response = await fetch('/api/admin/reports', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            const an = data.analytics;
            document.getElementById('admin-stat-users').textContent = an.totalUsers;
            document.getElementById('admin-stat-listings').textContent = an.totalListings;
            document.getElementById('admin-stat-deals').textContent = an.totalDeals;
        }
    } catch(e) {
        console.warn('Failed to load admin analytics reports.');
    }
}

// Load community reports
async function loadAdminReports() {
    const list = document.getElementById('admin-reports-list');
    if (!list) return;

    list.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="toast-spinner" style="margin: 0 auto;"></div></div>';

    try {
        const response = await fetch('/api/admin/all-reports', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();

        if (data.status === 'success') {
            const reports = data.reports;
            if (reports.length === 0) {
                list.innerHTML = `
                    <div style="text-align: center; padding: 24px; color: var(--text-secondary); font-size: 13px;">
                        No pending community reports.
                    </div>
                `;
                return;
            }

            list.innerHTML = reports.map(r => {
                const targetText = r.reported_product_id 
                    ? `Product: <b>${r.reported_product_name}</b> (ID: ${r.reported_product_id})` 
                    : `Seller: <b>${r.reported_user_name}</b> (ID: ${r.reported_user_id})`;
                return `
                    <div class="card" style="padding: 12px; font-size:13px; margin-bottom: 10px; border-left: 4px solid #EF4444;">
                        <strong>Reporter:</strong> ${r.reporter_name} (${r.reporter_email})<br>
                        <strong>Target:</strong> ${targetText}<br>
                        <strong>Reason:</strong> <span style="color:var(--text-secondary);">${r.reason}</span><br>
                        <small style="color: var(--text-muted);">Date: ${new Date(r.created_at).toLocaleString()}</small>
                    </div>
                `;
            }).join('');
        }
    } catch(e) {
        list.innerHTML = '<p style="color: var(--danger); font-size:13px; text-align:center;">Failed to retrieve reports queue.</p>';
    }
}

// Load reported products queue
async function loadAdminModeration() {
    const list = document.getElementById('admin-moderation-list');
    if (!list) return;

    list.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="toast-spinner" style="margin: 0 auto;"></div></div>';

    try {
        const response = await fetch('/api/admin/moderation', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();

        if (data.status === 'success') {
            const reported = data.reportedProducts;
            if (reported.length === 0) {
                list.innerHTML = `
                    <div style="text-align: center; padding: 24px; color: var(--text-secondary); font-size: 13px;">
                        No active reported or flagged product listings.
                    </div>
                `;
                return;
            }

            list.innerHTML = reported.map(p => {
                return `
                    <div class="card" style="padding: 12px; font-size:13px; margin-bottom: 10px;">
                        <strong>Product:</strong> ${p.name} (ID: ${p.id})<br>
                        <strong>Price:</strong> ₦${parseFloat(p.price).toLocaleString()}<br>
                        <strong>Vendor:</strong> ${p.vendor.name} (${p.vendor.email})<br>
                        <strong>Description:</strong> <span style="color:var(--text-secondary);">${p.description || 'None'}</span>
                        <div style="display: flex; gap: 8px; margin-top: 10px;">
                            <button class="btn btn-primary btn-sm" onclick="moderateProductListing(${p.id}, 'approve')" style="padding: 6px 12px; width:auto;">Clear Flags (Approve)</button>
                            <button class="btn btn-secondary btn-sm" onclick="moderateProductListing(${p.id}, 'reject')" style="padding: 6px 12px; width:auto; background-color: #FEE2E2; color:#DC2626;">Ban/Remove Listing</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch(e) {
        list.innerHTML = '<p style="color: var(--danger); font-size:13px; text-align:center;">Failed to retrieve flagged listings.</p>';
    }
}

// Moderate listing
async function moderateProductListing(productId, action) {
    const loader = Toast.show('Processing moderation...', 'loading');

    try {
        const response = await fetch(`/api/admin/moderation/${productId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action })
        });
        const data = await response.json();

        if (data.status === 'success') {
            Toast.update(loader, `Listing successfully moderated. Action: ${action}`, 'success');
            loadAdminDashboard();
        } else {
            Toast.update(loader, data.message || 'Action failed', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Connection error.', 'error');
    }
}

/* =========================================================
   ADMIN USER MANAGEMENT — FULL FEATURED
   ========================================================= */

let allAdminUsers = [];          // master list from server
let filteredAdminUsers = [];     // after search/filter/sort

function getWhatsAppLink(phone) {
    if (!phone) return '#';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 11) {
        cleaned = '234' + cleaned.substring(1);
    } else if (cleaned.length === 10 && !cleaned.startsWith('234')) {
        cleaned = '234' + cleaned;
    }
    return `https://wa.me/${cleaned}`;
}
let adminUserSort = { field: 'created_at', dir: 'desc' };
let adminUserPage = 1;
let adminUserPerPage = 10;
let selectedUserIds = new Set();
let activeModalUserId = null;

// Load all users from server → populate UI
async function loadAdminUsers() {
    const container = document.getElementById('admin-users-container');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center;padding:30px;"><div class="toast-spinner" style="margin:0 auto;"></div></div>';

    try {
        const response = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();

        if (data.status === 'success') {
            allAdminUsers = data.users;
            selectedUserIds.clear();

            // Populate campus filter dropdown with unique values
            const campusSelect = document.getElementById('admin-filter-campus');
            if (campusSelect) {
                const campuses = [...new Set(allAdminUsers.map(u => u.campus).filter(Boolean))].sort();
                campusSelect.innerHTML = '<option value="">All Campuses</option>' +
                    campuses.map(c => `<option value="${c}">${c}</option>`).join('');
            }

            updateAdminUserStats();
            filterAdminUsers();
        } else {
            container.innerHTML = '<p style="color:var(--danger);text-align:center;padding:20px;">Failed to load users.</p>';
        }
    } catch(e) {
        container.innerHTML = '<p style="color:var(--danger);text-align:center;padding:20px;">Connection error loading users.</p>';
    }
}

// Update stats cards from master list
function updateAdminUserStats() {
    const users = allAdminUsers;
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('aus-total',     users.length);
    setEl('aus-active',    users.filter(u => u.status === 'active').length);
    setEl('aus-suspended', users.filter(u => u.status === 'suspended' || u.status === 'banned').length);
    setEl('aus-vendors',   users.filter(u => u.role === 'vendor').length);
}

// Apply search + role/status/campus filters + sort → re-render
function filterAdminUsers() {
    const query  = (document.getElementById('admin-user-search')?.value  || '').toLowerCase().trim();
    const role   = document.getElementById('admin-filter-role')?.value   || '';
    const status = document.getElementById('admin-filter-status')?.value || '';
    const campus = document.getElementById('admin-filter-campus')?.value || '';

    filteredAdminUsers = allAdminUsers.filter(u => {
        if (query  && !u.name.toLowerCase().includes(query) && !u.email.toLowerCase().includes(query)) return false;
        if (role   && u.role   !== role)   return false;
        if (status && u.status !== status) return false;
        if (campus && u.campus !== campus) return false;
        return true;
    });

    // Sort
    filteredAdminUsers.sort((a, b) => {
        let av = a[adminUserSort.field], bv = b[adminUserSort.field];
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
        if (av < bv) return adminUserSort.dir === 'asc' ? -1 : 1;
        if (av > bv) return adminUserSort.dir === 'asc' ? 1 : -1;
        return 0;
    });

    adminUserPage = 1;
    document.getElementById('admin-select-all').checked = false;
    renderAdminUsersPage();
}

// Sort when column header clicked
function adminSortUsers(field) {
    if (adminUserSort.field === field) {
        adminUserSort.dir = adminUserSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
        adminUserSort.field = field;
        adminUserSort.dir = 'asc';
    }
    // Update header arrows
    document.querySelectorAll('.admin-users-table th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === field) th.classList.add(adminUserSort.dir === 'asc' ? 'sort-asc' : 'sort-desc');
    });
    filterAdminUsers();
}

// Render current page slice
function renderAdminUsersPage() {
    const container = document.getElementById('admin-users-container');
    const isMobile  = window.innerWidth < 640;
    const start = (adminUserPage - 1) * adminUserPerPage;
    const pageUsers = filteredAdminUsers.slice(start, start + adminUserPerPage);

    if (filteredAdminUsers.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-secondary);font-size:13px;">No users match your filters.</div>';
        renderAdminPagination();
        return;
    }

    if (isMobile) {
        renderAdminUserCards(container, pageUsers);
    } else {
        renderAdminUserTable(container, pageUsers);
    }

    renderAdminPagination();
    updateSelectedCount();
}

// Desktop table renderer
function renderAdminUserTable(container, users) {
    const trustBadgeHtml = (badge) => {
        if (!badge) return '—';
        const map = {
            'Top Seller': 'badge-top',
            'Trusted by Community': 'badge-trusted',
            'Active Seller': 'badge-active',
            'New on Scholarmart': 'badge-new'
        };
        const cls = map[badge.label] || 'badge-new';
        return `<span class="au-trust-badge ${cls}">${badge.emoji} ${badge.label}</span>`;
    };

    const statusLabelMap = {
        'active': '🟢 Active',
        'suspended': '🔴 Suspended',
        'pending': '🟡 Pending',
        'banned': '🔴 Banned'
    };

    const rows = users.map(u => {
        const initials = u.name.substring(0, 2).toUpperCase();
        const avatarInner = u.portrait
            ? `<img src="${u.portrait}" alt="${u.name}">`
            : initials;
        const statusCls = `status-${u.status || 'active'}`;
        const roleCls   = `role-${u.role}`;
        const isSuspended = u.status === 'suspended' || u.status === 'banned';
        const suspendBtn = isSuspended
            ? `<button class="au-action-btn activate" onclick="adminQuickStatusUpdate(${u.id},'active')">✓ Activate</button>`
            : `<button class="au-action-btn suspend"  onclick="adminQuickStatusUpdate(${u.id},'suspended')">🚫 Suspend</button>`;
        const joinedDate = u.created_at
            ? new Date(u.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'2-digit' })
            : '—';
        const lastLoginDate = u.last_login
            ? new Date(u.last_login).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'2-digit' })
            : joinedDate;

        const isSelected = selectedUserIds.has(u.id);
        const statusLabel = statusLabelMap[u.status] || '🟢 Active';

        return `
            <tr class="${isSelected ? 'selected-row' : ''}" id="user-row-${u.id}">
                <td><input type="checkbox" class="au-row-check" ${isSelected ? 'checked' : ''} onchange="adminToggleUserSelect(${u.id}, this.checked)"></td>
                <td>
                    <div class="au-user-cell">
                        <div class="au-avatar">${avatarInner}</div>
                        <div class="au-name" style="font-weight: 700;">${u.name}</div>
                    </div>
                </td>
                <td>${u.email}</td>
                <td>
                    ${u.whatsapp_number 
                        ? `<a href="${getWhatsAppLink(u.whatsapp_number)}" target="_blank" rel="noopener noreferrer" style="color:var(--primary-green);text-decoration:none;font-weight:700;display:inline-flex;align-items:center;gap:3px;" title="Message on WhatsApp">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color:#25D366;"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.407.003 9.806-4.388 9.809-9.799.001-2.621-1.02-5.085-2.876-6.944C16.35 1.997 13.89 1.016 11.272 1.015c-5.41 0-9.813 4.394-9.816 9.806-.001 1.716.452 3.39 1.31 4.87L1.75 20.366l4.897-1.212zM17.51 14.3c-.307-.154-1.82-.9-2.1-.998-.28-.1-.482-.15-.68.15-.2.3-.77.962-.94 1.157-.17.195-.34.22-.647.066-.307-.153-1.3-.48-2.478-1.533-.915-.817-1.534-1.826-1.713-2.133-.18-.307-.02-.473.136-.626.14-.137.31-.35.46-.525.15-.176.2-.3.3-.5.1-.2.05-.375-.025-.53-.075-.153-.68-1.63-.93-2.24-.244-.587-.49-.508-.68-.517-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.07 2.9 1.225 3.1c.15.2 2.1 3.2 5.082 4.5.71.31 1.265.495 1.7.633.71.226 1.356.194 1.867.118.57-.085 1.82-.743 2.076-1.46.257-.718.257-1.333.18-1.46-.078-.127-.278-.205-.586-.358z"/></svg>
                            <span>${u.whatsapp_number}</span>
                         </a>` 
                        : '—'
                    }
                </td>
                <td><span class="au-badge ${roleCls}">${u.role}</span></td>
                <td><span class="au-badge ${statusCls}">${statusLabel}</span></td>
                <td>${u.university || 'COOU'}</td>
                <td>${u.campus || '—'}</td>
                <td style="font-weight:700;color:var(--primary-green);">${u.deals_completed || 0}</td>
                <td>${trustBadgeHtml(u.badge)}</td>
                <td style="color:var(--text-secondary);">${joinedDate}</td>
                <td style="color:var(--text-secondary);">${lastLoginDate}</td>
                <td>
                    <div style="display:flex;gap:4px;flex-wrap:wrap;max-width:220px;">
                        <button class="au-action-btn view" onclick="openUserDetailModal(${u.id})">👁️ View Details</button>
                        ${suspendBtn}
                        <button class="au-action-btn reset" onclick="adminResetPasswordById(${u.id},'${u.name}')">🔄 Reset PW</button>
                    </div>
                </td>
            </tr>`;
    }).join('');

    container.innerHTML = `
        <div class="admin-users-table-wrap">
            <table class="admin-users-table">
                <thead>
                    <tr>
                        <th style="width:32px;"></th>
                        <th data-sort="name" onclick="adminSortUsers('name')">Name</th>
                        <th data-sort="email" onclick="adminSortUsers('email')">Email</th>
                        <th>WhatsApp</th>
                        <th data-sort="role" onclick="adminSortUsers('role')">Role</th>
                        <th data-sort="status" onclick="adminSortUsers('status')">Status</th>
                        <th data-sort="university" onclick="adminSortUsers('university')">University</th>
                        <th data-sort="campus" onclick="adminSortUsers('campus')">Campus</th>
                        <th data-sort="deals_completed" onclick="adminSortUsers('deals_completed')">Deals</th>
                        <th>Badge</th>
                        <th data-sort="created_at" onclick="adminSortUsers('created_at')">Joined</th>
                        <th data-sort="last_login" onclick="adminSortUsers('last_login')">Last Active</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;

    // Mark current sort column
    document.querySelectorAll('.admin-users-table th[data-sort]').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === adminUserSort.field) {
            th.classList.add(adminUserSort.dir === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
}

// Mobile card renderer
function renderAdminUserCards(container, users) {
    const statusLabelMap = {
        'active': '🟢 Active',
        'suspended': '🔴 Suspended',
        'pending': '🟡 Pending',
        'banned': '🔴 Banned'
    };

    const cards = users.map(u => {
        const initials = u.name.substring(0, 2).toUpperCase();
        const avatarInner = u.portrait ? `<img src="${u.portrait}" alt="${u.name}">` : initials;
        const statusCls = `status-${u.status || 'active'}`;
        const roleCls   = `role-${u.role}`;
        const isSuspended = u.status === 'suspended' || u.status === 'banned';
        const suspendBtnMobile = isSuspended
            ? `<button class="au-action-btn activate" onclick="adminQuickStatusUpdate(${u.id},'active')" style="flex:1; font-size: 11px; padding: 6px;">✓ Activate</button>`
            : `<button class="au-action-btn suspend"  onclick="adminQuickStatusUpdate(${u.id},'suspended')" style="flex:1; font-size: 11px; padding: 6px;">🚫 Suspend</button>`;
        const isSelected = selectedUserIds.has(u.id);

        const map = {
            'Top Seller': 'badge-top',
            'Trusted by Community': 'badge-trusted',
            'Active Seller': 'badge-active',
            'New on Scholarmart': 'badge-new'
        };
        const badgeCls = u.badge ? (map[u.badge.label] || 'badge-new') : 'badge-new';
        const badgeHtml = u.badge
            ? `<span class="au-trust-badge ${badgeCls}">${u.badge.emoji} ${u.badge.label}</span>`
            : '<span class="au-trust-badge badge-new">🟢 New on Scholarmart</span>';

        const statusLabel = statusLabelMap[u.status] || '🟢 Active';

        return `
            <div class="admin-user-card ${isSelected ? 'selected-row' : ''}" id="user-card-${u.id}">
                <input type="checkbox" class="au-card-check" ${isSelected ? 'checked' : ''} onchange="adminToggleUserSelect(${u.id}, this.checked)" style="position: absolute; top: 12px; right: 12px; z-index: 10;">
                <div class="au-card-header">
                    <div class="au-avatar" style="width:38px;height:38px;font-size:13px;">${avatarInner}</div>
                    <div>
                        <div class="au-name" style="font-weight: 800; font-size: 15px;">${u.name}</div>
                        <div class="au-email" style="font-size: 12px; color: var(--text-secondary);">📧 ${u.email}</div>
                    </div>
                </div>
                <div class="au-card-meta" style="margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap;">
                    <span class="au-badge ${roleCls}">🏷️ ${u.role}</span>
                    <span class="au-badge ${statusCls}">${statusLabel}</span>
                    ${badgeHtml}
                    <span class="deals-badge" style="font-size: 11px; font-weight: 700; color: var(--primary-green);">📊 ${u.deals_completed || 0} deals</span>
                </div>
                <div class="au-card-info-row" style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
                    📱 WhatsApp: 
                    ${u.whatsapp_number 
                        ? `<a href="${getWhatsAppLink(u.whatsapp_number)}" target="_blank" rel="noopener noreferrer" style="color:var(--primary-green);text-decoration:none;font-weight:700;display:inline-flex;align-items:center;gap:3px;" title="Message on WhatsApp">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="color:#25D366;"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.407.003 9.806-4.388 9.809-9.799.001-2.621-1.02-5.085-2.876-6.944C16.35 1.997 13.89 1.016 11.272 1.015c-5.41 0-9.813 4.394-9.816 9.806-.001 1.716.452 3.39 1.31 4.87L1.75 20.366l4.897-1.212zM17.51 14.3c-.307-.154-1.82-.9-2.1-.998-.28-.1-.482-.15-.68.15-.2.3-.77.962-.94 1.157-.17.195-.34.22-.647.066-.307-.153-1.3-.48-2.478-1.533-.915-.817-1.534-1.826-1.713-2.133-.18-.307-.02-.473.136-.626.14-.137.31-.35.46-.525.15-.176.2-.3.3-.5.1-.2.05-.375-.025-.53-.075-.153-.68-1.63-.93-2.24-.244-.587-.49-.508-.68-.517-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.07 2.9 1.225 3.1c.15.2 2.1 3.2 5.082 4.5.71.31 1.265.495 1.7.633.71.226 1.356.194 1.867.118.57-.085 1.82-.743 2.076-1.46.257-.718.257-1.333.18-1.46-.078-.127-.278-.205-.586-.358z"/></svg>
                            <span>${u.whatsapp_number}</span>
                         </a>` 
                        : 'Not set'
                    }
                </div>
                <div class="au-card-actions" style="margin-top: 12px; border-top: 1px solid var(--border); padding-top: 8px; display: flex; gap: 4px; flex-wrap: wrap;">
                    <button class="au-action-btn view" onclick="openUserDetailModal(${u.id})" style="flex:1; font-size: 11px; padding: 6px;">👁️ View Details</button>
                    ${suspendBtnMobile}
                    <button class="au-action-btn reset" onclick="adminResetPasswordById(${u.id},'${u.name}')" style="flex:1; font-size: 11px; padding: 6px;">🔄 Reset PW</button>
                </div>
            </div>`;
    }).join('');

    container.innerHTML = `<div class="admin-user-cards">${cards}</div>`;
}

// Pagination renderer
function renderAdminPagination() {
    const total   = filteredAdminUsers.length;
    const pages   = Math.ceil(total / adminUserPerPage) || 1;
    const start   = Math.min((adminUserPage - 1) * adminUserPerPage + 1, total);
    const end     = Math.min(adminUserPage * adminUserPerPage, total);

    const infoEl  = document.getElementById('admin-page-info');
    const numsEl  = document.getElementById('admin-page-nums');
    const prevBtn = document.getElementById('admin-prev-btn');
    const nextBtn = document.getElementById('admin-next-btn');

    if (infoEl) infoEl.textContent = total > 0 ? `Showing ${start}–${end} of ${total} users` : 'No results';
    if (prevBtn) prevBtn.disabled = adminUserPage <= 1;
    if (nextBtn) nextBtn.disabled = adminUserPage >= pages;

    if (numsEl) {
        // Show up to 5 page numbers centred on current page
        const half = 2;
        let pStart = Math.max(1, adminUserPage - half);
        let pEnd   = Math.min(pages, pStart + 4);
        pStart = Math.max(1, pEnd - 4);

        let html = '';
        if (pStart > 1) html += `<button class="admin-page-num" onclick="adminGoToPage(1)">1</button>${pStart > 2 ? '<span style="align-self:center;font-size:11px;color:var(--text-muted);">…</span>' : ''}`;
        for (let p = pStart; p <= pEnd; p++) {
            html += `<button class="admin-page-num ${p === adminUserPage ? 'active-page' : ''}" onclick="adminGoToPage(${p})">${p}</button>`;
        }
        if (pEnd < pages) html += `${pEnd < pages - 1 ? '<span style="align-self:center;font-size:11px;color:var(--text-muted);">…</span>' : ''}<button class="admin-page-num" onclick="adminGoToPage(${pages})">${pages}</button>`;
        numsEl.innerHTML = html;
    }
}

function adminGoToPage(page) {
    adminUserPage = page;
    renderAdminUsersPage();
}

function adminChangePage(delta) {
    const pages = Math.ceil(filteredAdminUsers.length / adminUserPerPage) || 1;
    adminUserPage = Math.max(1, Math.min(pages, adminUserPage + delta));
    renderAdminUsersPage();
}

function adminSetPerPage(val) {
    adminUserPerPage = parseInt(val, 10) || 10;
    adminUserPage = 1;
    renderAdminUsersPage();
}

// Select all / individual toggles
function adminToggleSelectAll(checked) {
    const start = (adminUserPage - 1) * adminUserPerPage;
    const pageUsers = filteredAdminUsers.slice(start, start + adminUserPerPage);
    pageUsers.forEach(u => {
        if (checked) selectedUserIds.add(u.id);
        else selectedUserIds.delete(u.id);
    });
    renderAdminUsersPage();
}

function adminToggleUserSelect(userId, checked) {
    if (checked) selectedUserIds.add(userId);
    else selectedUserIds.delete(userId);
    const row = document.getElementById(`user-row-${userId}`) || document.getElementById(`user-card-${userId}`);
    if (row) row.classList.toggle('selected-row', checked);
    updateSelectedCount();
}

function updateSelectedCount() {
    const el = document.getElementById('admin-selected-count');
    if (el) el.textContent = selectedUserIds.size > 0 ? `${selectedUserIds.size} selected` : '';
}

// Bulk actions
async function adminBulkAction() {
    const action = document.getElementById('admin-bulk-action-select')?.value;
    if (!action) { Toast.show('Please select a bulk action', 'warning'); return; }

    if (action === 'export') { exportAdminUsersCSV(); return; }

    if (selectedUserIds.size === 0) { Toast.show('No users selected', 'warning'); return; }

    if (action === 'delete') {
        if (!confirm(`Are you sure you want to permanently delete these ${selectedUserIds.size} user(s) and all their listings/deals? This action cannot be undone.`)) return;
        const loader = Toast.show(`Deleting ${selectedUserIds.size} user(s)...`, 'loading');
        let success = 0;
        for (const uid of selectedUserIds) {
            try {
                const res = await fetch(`/api/admin/users/${uid}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${currentToken}` }
                });
                const d = await res.json();
                if (d.status === 'success') success++;
            } catch(e) {}
        }
        Toast.update(loader, `Done! ${success} of ${selectedUserIds.size} users deleted.`, 'success');
        selectedUserIds.clear();
        loadAdminUsers();
        return;
    }

    const targetStatus = action === 'suspend' ? 'suspended' : 'active';
    const label = action === 'suspend' ? 'Suspending' : 'Activating';
    const loader = Toast.show(`${label} ${selectedUserIds.size} user(s)...`, 'loading');

    let success = 0;
    for (const uid of selectedUserIds) {
        try {
            const res = await fetch(`/api/admin/users/${uid}/status`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: targetStatus })
            });
            const d = await res.json();
            if (d.status === 'success') success++;
        } catch(e) {}
    }

    Toast.update(loader, `Done! ${success} of ${selectedUserIds.size} users updated.`, 'success');
    selectedUserIds.clear();
    loadAdminUsers();
}

// Export visible filtered users to CSV
function exportAdminUsersCSV() {
    const headers = ['ID','Name','Email','WhatsApp','Role','Status','University','Campus','Deals','Avg Rating','Joined'];
    const rows = filteredAdminUsers.map(u => [
        u.id, u.name, u.email, u.whatsapp_number || '',
        u.role, u.status, u.university || '', u.campus || '',
        u.deals_completed || 0, u.average_rating || 0,
        u.created_at ? new Date(u.created_at).toLocaleDateString('en-NG') : ''
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `scholarmart_users_${Date.now()}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    Toast.show(`Exported ${filteredAdminUsers.length} users as CSV`, 'success');
}

// Quick status update from row button (no modal)
async function adminQuickStatusUpdate(userId, status) {
    const loader = Toast.show('Updating status...', 'loading');
    try {
        const res = await fetch(`/api/admin/users/${userId}/status`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const d = await res.json();
        if (d.status === 'success') {
            Toast.update(loader, d.message, 'success');
            // Update local cache & re-render without full reload
            const u = allAdminUsers.find(x => x.id === userId);
            if (u) u.status = status;
            updateAdminUserStats();
            renderAdminUsersPage();
        } else {
            Toast.update(loader, d.message || 'Update failed', 'error');
        }
    } catch(e) {
        Toast.update(loader, 'Connection error', 'error');
    }
}

// Password reset from row button
async function adminResetPasswordById(userId, userName) {
    const newPassword = prompt(`Reset password for ${userName}:\nEnter new password (min 8 characters):`);
    if (!newPassword) return;
    if (newPassword.length < 8) { Toast.show('Password must be at least 8 characters', 'warning'); return; }
    const loader = Toast.show('Resetting password...', 'loading');
    try {
        const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword })
        });
        const d = await res.json();
        if (d.status === 'success') Toast.update(loader, d.message, 'success');
        else Toast.update(loader, d.message || 'Reset failed', 'error');
    } catch(e) { Toast.update(loader, 'Connection error', 'error'); }
}

// --- User Detail Modal ---
function timeAgo(dateInput) {
    if (!dateInput) return 'Never';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Never';
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 0) return 'just now';
    
    if (seconds < 60) {
        return 'just now';
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(hours / 24);
    if (days < 30) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    const months = Math.floor(days / 30);
    if (months < 12) {
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
}

function openUserDetailModal(userId) {
    const u = allAdminUsers.find(x => x.id === userId);
    if (!u) return;
    activeModalUserId = userId;

    const initials = u.name.substring(0, 2).toUpperCase();
    const avatarInner = u.portrait ? `<img src="${u.portrait}" alt="${u.name}">` : initials;
    const isSuspended = u.status === 'suspended' || u.status === 'banned';
    const statusCls = `status-${u.status || 'active'}`;
    const roleCls   = `role-${u.role}`;

    const map = {
        'Top Seller': 'badge-top',
        'Trusted by Community': 'badge-trusted',
        'Active Seller': 'badge-active',
        'New on Scholarmart': 'badge-new'
    };
    const badgeCls = u.badge ? (map[u.badge.label] || 'badge-new') : 'badge-new';
    const badgeHtml = u.badge
        ? `<span class="au-trust-badge ${badgeCls}">${u.badge.emoji} ${u.badge.label}</span>`
        : '<span class="au-trust-badge badge-new">🟢 New on Scholarmart</span>';

    // Status text (Capitalized)
    const statusText = u.status ? (u.status.charAt(0).toUpperCase() + u.status.slice(1)) : 'Active';
    
    // Role text (Capitalized)
    const roleText = u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : 'Buyer';

    // Formatted Joined Date: MMM DD, YYYY e.g. "Jan 15, 2026"
    let joinedStr = '—';
    if (u.created_at) {
        const d = new Date(u.created_at);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        joinedStr = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }

    const activeListings = u.active_listings || 0;
    const lastLoginFormatted = timeAgo(u.last_login || u.created_at);

    const body = document.getElementById('user-detail-modal-body');
    body.innerHTML = `
        <div class="udm-profile-header">
            <div class="udm-avatar">${avatarInner}</div>
            <div>
                <div class="udm-name">${u.name}</div>
                <div class="udm-role-line">
                    <span class="au-badge ${roleCls}">${roleText}</span>
                    <span class="au-badge ${statusCls}">${statusText}</span>
                    ${badgeHtml}
                </div>
            </div>
        </div>
        <div class="udm-info-grid">
            <div class="udm-info-item">
                <div class="udm-info-label">👤 User</div>
                <div class="udm-info-value">${u.name}</div>
            </div>
            <div class="udm-info-item">
                <div class="udm-info-label">📧 Email</div>
                <div class="udm-info-value" style="font-size:11px;font-weight:600;">${u.email}</div>
            </div>
            <div class="udm-info-item">
                <div class="udm-info-label">📱 WhatsApp</div>
                <div class="udm-info-value">
                    ${u.whatsapp_number 
                        ? `<a href="${getWhatsAppLink(u.whatsapp_number)}" target="_blank" rel="noopener noreferrer" style="color:var(--primary-green);text-decoration:none;font-weight:700;display:inline-flex;align-items:center;gap:3px;" title="Message on WhatsApp">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color:#25D366;"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.407.003 9.806-4.388 9.809-9.799.001-2.621-1.02-5.085-2.876-6.944C16.35 1.997 13.89 1.016 11.272 1.015c-5.41 0-9.813 4.394-9.816 9.806-.001 1.716.452 3.39 1.31 4.87L1.75 20.366l4.897-1.212zM17.51 14.3c-.307-.154-1.82-.9-2.1-.998-.28-.1-.482-.15-.68.15-.2.3-.77.962-.94 1.157-.17.195-.34.22-.647.066-.307-.153-1.3-.48-2.478-1.533-.915-.817-1.534-1.826-1.713-2.133-.18-.307-.02-.473.136-.626.14-.137.31-.35.46-.525.15-.176.2-.3.3-.5.1-.2.05-.375-.025-.53-.075-.153-.68-1.63-.93-2.24-.244-.587-.49-.508-.68-.517-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.07 2.9 1.225 3.1c.15.2 2.1 3.2 5.082 4.5.71.31 1.265.495 1.7.633.71.226 1.356.194 1.867.118.57-.085 1.82-.743 2.076-1.46.257-.718.257-1.333.18-1.46-.078-.127-.278-.205-.586-.358z"/></svg>
                            <span>${u.whatsapp_number}</span>
                         </a>`
                        : '—'
                    }
                </div>
            </div>
            <div class="udm-info-item">
                <div class="udm-info-label">🏛 University</div>
                <div class="udm-info-value">${u.university || 'COOU'}</div>
            </div>
            <div class="udm-info-item">
                <div class="udm-info-label">🏫 Campus</div>
                <div class="udm-info-value">${u.campus || '—'}</div>
            </div>
            <div class="udm-info-item">
                <div class="udm-info-label">🏷️ Role</div>
                <div class="udm-info-value">${roleText}</div>
            </div>
            <div class="udm-info-item">
                <div class="udm-info-label">🟢 Status</div>
                <div class="udm-info-value">${statusText}</div>
            </div>
            <div class="udm-info-item">
                <div class="udm-info-label">🎖️ Badge</div>
                <div class="udm-info-value">${u.badge ? `${u.badge.emoji} ${u.badge.label}` : 'New on Scholarmart'}</div>
            </div>
            <div class="udm-info-item">
                <div class="udm-info-label">📊 Deals Completed</div>
                <div class="udm-info-value" style="color:var(--primary-green); font-weight:700;">${u.deals_completed || 0}</div>
            </div>
            <div class="udm-info-item">
                <div class="udm-info-label">📦 Active Listings</div>
                <div class="udm-info-value" style="font-weight:700;">${activeListings}</div>
            </div>
            <div class="udm-info-item">
                <div class="udm-info-label">📅 Joined</div>
                <div class="udm-info-value">${joinedStr}</div>
            </div>
            <div class="udm-info-item">
                <div class="udm-info-label">🕒 Last Login</div>
                <div class="udm-info-value">${lastLoginFormatted}</div>
            </div>
        </div>
    `;

    // Update footer buttons
    const suspendBtn = document.getElementById('udm-suspend-btn');
    if (suspendBtn) {
        if (isSuspended) {
            suspendBtn.textContent = '✓ Activate Account';
            suspendBtn.style.backgroundColor = '#22C55E';
            suspendBtn.style.color = '#fff';
            suspendBtn.style.borderColor = '#22C55E';
        } else {
            suspendBtn.textContent = '⊘ Suspend Account';
            suspendBtn.style.backgroundColor = '';
            suspendBtn.style.color = '';
            suspendBtn.style.borderColor = '';
        }
    }

    const overlay = document.getElementById('user-detail-modal-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        requestAnimationFrame(() => overlay.classList.add('active'));
    }
}

function closeUserDetailModal() {
    const overlay = document.getElementById('user-detail-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.style.display = 'none', 300);
    }
    activeModalUserId = null;
}

async function adminToggleUserStatusFromModal() {
    if (!activeModalUserId) return;
    const u = allAdminUsers.find(x => x.id === activeModalUserId);
    if (!u) return;
    const isSuspended = u.status === 'suspended' || u.status === 'banned';
    const newStatus = isSuspended ? 'active' : 'suspended';
    closeUserDetailModal();
    await adminQuickStatusUpdate(activeModalUserId, newStatus);
}

async function adminResetPasswordFromModal() {
    if (!activeModalUserId) return;
    const u = allAdminUsers.find(x => x.id === activeModalUserId);
    if (!u) return;
    closeUserDetailModal();
    await adminResetPasswordById(activeModalUserId, u.name);
}

function adminViewUserListingsFromModal() {
    if (!activeModalUserId) return;
    const u = allAdminUsers.find(x => x.id === activeModalUserId);
    if (!u) return;
    
    closeUserDetailModal();
    
    // Set search filter to vendor's name
    if (typeof activeFilters !== 'undefined') {
        activeFilters.search = u.name;
    }
    const globalSearch = document.getElementById('global-search-input');
    if (globalSearch) globalSearch.value = u.name;
    
    // Transition to the catalog page (#/marketplace)
    window.location.hash = '#/marketplace';
    if (typeof loadMarketplaceProducts === 'function') {
        loadMarketplaceProducts();
    }
}

// Old compat wrappers (used by older buttons still in the DOM elsewhere)
async function suspendUserAccount(userId, targetStatus) {
    await adminQuickStatusUpdate(userId, targetStatus);
}

async function resetUserPassword(userId) {
    const u = allAdminUsers.find(x => x.id === userId) || { name: 'User' };
    await adminResetPasswordById(userId, u.name);
}



// Generic upload portrait function
async function uploadPortraitFile(fileInputId) {
    if (!currentToken) return;

    const fileInput = document.getElementById(fileInputId);
    const file = fileInput?.files[0];

    if (!file) {
        Toast.show('Please select a portrait image file to upload', 'warning');
        return;
    }

    const loader = Toast.show('Uploading portrait...', 'loading');
    const formData = new FormData();
    formData.append('portrait', file);

    try {
        const response = await fetch('/api/auth/upload-portrait', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${currentToken}` },
            body: formData
        });
        const data = await response.json();

        if (data.status === 'success') {
            currentUser.portrait = data.portrait;
            localStorage.setItem('scholarmart_user', JSON.stringify(currentUser));
            
            Toast.update(loader, 'Portrait uploaded successfully!', 'success');
            
            // Refresh dashboards based on role
            if (currentUser.role === 'vendor') {
                loadVendorDashboard();
            } else {
                loadBuyerVerificationWizard();
            }
            // Clear input
            fileInput.value = '';
        } else {
            Toast.update(loader, data.message || 'Failed to upload portrait', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Server error during upload.', 'error');
    }
}

// Upload vendor profile portrait
async function uploadVendorPortrait() {
    await uploadPortraitFile('vendor-portrait-input');
}

// Load universities and campuses in Admin console
async function loadAdminUniversities() {
    const listDiv = document.getElementById('admin-universities-list');
    const selectUniv = document.getElementById('admin-campus-univ-select');
    if (!listDiv) return;

    listDiv.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="toast-spinner" style="margin: 0 auto;"></div></div>';

    try {
        const univRes = await fetch('/api/auth/universities');
        const univData = await univRes.json();
        
        const campRes = await fetch('/api/auth/campuses');
        const campData = await campRes.json();

        if (univData.status !== 'success' || campData.status !== 'success') {
            listDiv.innerHTML = '<div style="color: var(--danger);">Failed to load universities and campuses.</div>';
            return;
        }

        const universities = univData.universities;
        const campuses = campData.campuses;

        // Populate admin campus select dropdown
        if (selectUniv) {
            selectUniv.innerHTML = '<option value="" disabled selected>Select a University</option>';
            universities.forEach(univ => {
                const opt = document.createElement('option');
                opt.value = univ.code;
                opt.textContent = `${univ.name} (${univ.code})`;
                selectUniv.appendChild(opt);
            });
        }

        // Render universities with their campuses list
        if (universities.length === 0) {
            listDiv.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">No universities registered yet.</div>';
            return;
        }

        let html = '';
        universities.forEach(univ => {
            const univCampuses = campuses.filter(c => c.university_code === univ.code);
            
            html += `
                <div class="card" style="padding: 12px; margin-bottom: 10px; border-color: var(--border); background-color: var(--surface);">
                    <div style="font-weight: 700; color: var(--text-primary); display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 13px;">${univ.name}</span>
                        <span class="badge" style="background-color: var(--border); color: var(--text-secondary); font-size: 10px;">${univ.code}</span>
                    </div>
                    <div style="margin-top: 8px; padding-left: 8px; border-left: 2.5px solid var(--primary-green); font-size: 12px; display: flex; flex-wrap: wrap; gap: 4px;">
                        ${univCampuses.length > 0 
                            ? univCampuses.map(c => `<span style="background-color:#ECFDF5; color:#065F46; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${c.name}</span>`).join('')
                            : '<em style="color:var(--text-muted);">No campuses added yet</em>'
                        }
                    </div>
                </div>
            `;
        });
        listDiv.innerHTML = html;
    } catch (err) {
        console.error(err);
        listDiv.innerHTML = '<div style="color: var(--danger);">Connection error loading list.</div>';
    }
}

// Admin Add University action
async function adminAddUniversity() {
    const codeInput = document.getElementById('admin-univ-code');
    const nameInput = document.getElementById('admin-univ-name');
    const code = codeInput?.value.trim();
    const name = nameInput?.value.trim();

    if (!code || !name) {
        Toast.show('University code and name are required', 'warning');
        return;
    }

    const loader = Toast.show('Adding university...', 'loading');

    try {
        const response = await fetch('/api/admin/universities', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, name })
        });
        const data = await response.json();

        if (data.status === 'success') {
            Toast.update(loader, 'University added successfully!', 'success');
            if (codeInput) codeInput.value = '';
            if (nameInput) nameInput.value = '';
            
            loadAdminUniversities();
            
            // Refresh dynamic registration details
            if (typeof fetchRegistrationData === 'function') {
                fetchRegistrationData();
            }
        } else {
            Toast.update(loader, data.message || 'Failed to add university', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Connection error.', 'error');
    }
}

// Admin Add Campus action
async function adminAddCampus() {
    const univSelect = document.getElementById('admin-campus-univ-select');
    const nameInput = document.getElementById('admin-campus-name');
    const university_code = univSelect?.value;
    const name = nameInput?.value.trim();

    if (!university_code || !name) {
        Toast.show('Please select a university and enter campus name', 'warning');
        return;
    }

    const loader = Toast.show('Adding campus...', 'loading');

    try {
        const response = await fetch('/api/admin/campuses', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ university_code, name })
        });
        const data = await response.json();

        if (data.status === 'success') {
            Toast.update(loader, 'Campus added successfully!', 'success');
            if (nameInput) nameInput.value = '';
            
            loadAdminUniversities();
            
            // Refresh dynamic registration details
            if (typeof fetchRegistrationData === 'function') {
                fetchRegistrationData();
            }
        } else {
            Toast.update(loader, data.message || 'Failed to add campus', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Connection error.', 'error');
    }
}

// Admin Categories load action
async function loadAdminCategories() {
    const listDiv = document.getElementById('admin-categories-list');
    if (!listDiv) return;

    listDiv.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="toast-spinner" style="margin: 0 auto;"></div></div>';

    try {
        const response = await fetch('/api/categories');
        const data = await response.json();

        if (data.status === 'success') {
            const categories = data.categories;
            if (categories.length === 0) {
                listDiv.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">No categories registered.</div>';
                return;
            }

            listDiv.innerHTML = categories.map(cat => {
                const formattedDate = new Date(cat.created_at || new Date()).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'short', year: 'numeric'
                });
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; background-color: var(--surface); padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 8px;">
                        <span style="font-weight: 700; color: var(--text-primary); font-size: 14px;">${cat.name}</span>
                        <span style="font-size: 11px; color: var(--text-secondary);">Added: ${formattedDate}</span>
                    </div>
                `;
            }).join('');
        } else {
            listDiv.innerHTML = '<div style="color: var(--danger);">Failed to retrieve categories.</div>';
        }
    } catch (err) {
        listDiv.innerHTML = '<div style="color: var(--danger);">Connection error loading categories.</div>';
    }
}

// Admin Add Category action
async function adminAddCategory() {
    const nameInput = document.getElementById('admin-category-name');
    const name = nameInput?.value.trim();

    if (!name) {
        Toast.show('Category name is required', 'warning');
        return;
    }

    const loader = Toast.show('Adding product category...', 'loading');

    try {
        const response = await fetch('/api/categories', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        const data = await response.json();

        if (data.status === 'success') {
            Toast.update(loader, 'Category added successfully!', 'success');
            if (nameInput) nameInput.value = '';
            
            // Reload list
            loadAdminCategories();

            // Refresh dynamic dropdowns globally on frontend
            if (typeof fetchCategories === 'function') {
                fetchCategories();
            }
        } else {
            Toast.update(loader, data.message || 'Failed to add category', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Connection error.', 'error');
    }
}

// Admin Load Student Deals action (replaces orders)
async function loadAdminOrders() {
    const list = document.getElementById('admin-orders-list');
    if (!list) return;

    list.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="toast-spinner" style="margin: 0 auto;"></div></div>';

    try {
        const response = await fetch('/api/admin/deals', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();

        if (data.status === 'success') {
            const deals = data.deals;
            if (deals.length === 0) {
                list.innerHTML = `
                    <div style="text-align: center; padding: 24px; color: var(--text-secondary); font-size: 13px;">
                        No student deals placed on campus yet.
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

                return `
                    <div class="card" style="padding: 14px; font-size: 13px; margin-bottom: 12px; border-color: var(--border);">
                        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                            <img src="${img}" class="list-item-img" alt="${deal.product_name}" style="width: 50px; height: 50px;">
                            <div class="list-item-content">
                                <div class="list-item-title" style="font-size: 14px; font-weight: 800;">${deal.product_name}</div>
                                <div class="list-item-price" style="font-weight: 700; color: var(--primary-green);">Amount: ₦${parseFloat(deal.amount).toLocaleString()}</div>
                            </div>
                        </div>
                        <div style="border-top: 1px solid var(--border); padding-top: 8px; margin-top: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; line-height: 1.4;">
                            <div>
                                <strong style="color:var(--primary-green);">Buyer Details:</strong><br>
                                Name: ${deal.buyer.name || 'Walk-in'}<br>
                                Email: ${deal.buyer.email || 'N/A'}<br>
                                WhatsApp: ${deal.buyer.whatsapp || 'N/A'}
                            </div>
                            <div>
                                <strong style="color:var(--primary-orange);">Vendor Details:</strong><br>
                                Name: ${deal.vendor.name}<br>
                                Email: ${deal.vendor.email}<br>
                                WhatsApp: ${deal.vendor.whatsapp || 'N/A'}
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 8px; margin-top: 8px;">
                            <span style="font-size: 11px; color: var(--text-secondary);">Date: ${formattedDate} • Deal ID: <strong>#${deal.id}</strong></span>
                            <span class="badge ${badgeClass}" style="text-transform: uppercase; font-size: 9px; padding: 2px 8px;">Status: ${deal.status.replace('_', ' ')}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            list.innerHTML = '<p style="color: var(--danger); font-size:13px; text-align:center;">Failed to compile deals.</p>';
        }
    } catch (e) {
        list.innerHTML = '<p style="color: var(--danger); font-size:13px; text-align:center;">Connection error loading deals.</p>';
    }
}

// Support Modal triggers
function toggleSupportModal(show) {
    const modal = document.getElementById('support-modal-overlay');
    if (!modal) return;
    if (show) {
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('active'));
    } else {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

function openSupportModal() {
    toggleSupportModal(true);
}

// Welcome Modal logic
function checkWelcomeModal() {
    const visited = localStorage.getItem('scholarmart_visited');
    const modal = document.getElementById('welcome-modal-overlay');
    if (!visited && modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 2300);
    }
}

function closeWelcomeModal() {
    const modal = document.getElementById('welcome-modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 450);
    }
    localStorage.setItem('scholarmart_visited', 'true');
}

// Reputation badge helper for client dashboards
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

// Report Modal logic
let activeReportProductId = null;
let activeReportSellerId = null;

function openReportModal() {
    const hash = window.location.hash;
    if (hash.startsWith('#/products/')) {
        const prodId = parseInt(hash.split('/').pop(), 10);
        activeReportProductId = prodId;
        activeReportSellerId = null;
    }
    toggleReportModal(true);
}

function toggleReportModal(show) {
    const modal = document.getElementById('report-modal-overlay');
    if (!modal) return;
    if (show) {
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('active'));
    } else {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

async function submitReport(event) {
    event.preventDefault();
    if (!currentToken) {
        Toast.show('Please login to file a report!', 'warning');
        return;
    }
    const reason = document.getElementById('report-reason-select').value;
    const details = document.getElementById('report-details').value;
    if (!reason || !details) {
        Toast.show('Reason and details are required', 'warning');
        return;
    }

    const loader = Toast.show('Submitting report...', 'loading');
    try {
        let url = '';
        let body = {};
        if (activeReportProductId) {
            url = `/api/admin/products/${activeReportProductId}/report`;
            body = { reason: `${reason}: ${details}` };
        } else if (activeReportSellerId) {
            url = `/api/admin/users/${activeReportSellerId}/report`;
            body = { reason: `${reason}: ${details}` };
        } else {
            Toast.update(loader, 'Invalid report context', 'error');
            return;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();

        if (data.status === 'success') {
            Toast.update(loader, 'Thank you! Your report has been submitted for review.', 'success');
            toggleReportModal(false);
            document.getElementById('report-form').reset();
        } else {
            Toast.update(loader, data.message || 'Failed to submit report', 'error');
        }
    } catch(e) {
        Toast.update(loader, 'Network error.', 'error');
    }
}

// Vendor Trigger Mark as Sold — no buyer email needed
async function triggerMarkAsSold(productId) {
    if (!confirm('Mark this product as sold? It will be removed from the active marketplace.')) return;

    const loader = Toast.show('Marking product as sold...', 'loading');
    try {
        const response = await fetch(`/api/orders/mark-sold`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId, buyerId: null })
        });
        const data = await response.json();
        if (data.status === 'success') {
            Toast.update(loader, 'Listing marked as sold!', 'success');
            loadVendorDashboard();
        } else {
            Toast.update(loader, data.message || 'Failed to update listing', 'error');
        }
    } catch(e) {
        Toast.update(loader, 'Connection error.', 'error');
    }
}

// Buyer confirms deal
async function confirmDealCompletion(dealId) {
    const loader = Toast.show('Confirming receipt...', 'loading');
    try {
        const response = await fetch(`/api/orders/${dealId}/confirm`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.status === 'success') {
            Toast.update(loader, 'Deal confirmed! Please rate the seller.', 'success');
            loadBuyerOrders();
        } else {
            Toast.update(loader, data.message || 'Confirmation failed', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Connection error.', 'error');
    }
}

// Buyer rates seller
async function submitDealRating(dealId, rating) {
    const review = prompt('Enter a short review for the seller (optional):') || '';
    const loader = Toast.show('Submitting rating...', 'loading');
    try {
        const response = await fetch(`/api/orders/${dealId}/rate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rating, review })
        });
        const data = await response.json();
        if (data.status === 'success') {
            Toast.update(loader, 'Thank you! Rating recorded.', 'success');
            loadBuyerOrders();
        } else {
            Toast.update(loader, data.message || 'Rating failed', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Connection error.', 'error');
    }
}

// Trigger welcome modal check on load
document.addEventListener('DOMContentLoaded', () => {
    checkWelcomeModal();
});
