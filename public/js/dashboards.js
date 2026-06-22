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
async function loadAdminDashboard() {
    if (!currentToken || currentUser.role !== 'admin') return;

    // Load reports & analytics
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

    // Load active tab panel data
    loadAdminReports();
    loadAdminModeration();
    loadAdminUsers();
    loadAdminUniversities();
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

// Load all registered users table
async function loadAdminUsers() {
    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;"><div class="toast-spinner" style="margin:0 auto;"></div></td></tr>';

    try {
        const response = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();

        if (data.status === 'success') {
            const users = data.users;
            
            tbody.innerHTML = users.map(u => {
                const isSuspended = u.status === 'suspended';
                const statusBadge = isSuspended ? '<span class="badge badge-rejected">SUSPENDED</span>' : '<span class="badge badge-approved">ACTIVE</span>';
                
                const actionBtn = isSuspended ? 
                    `<button class="btn btn-primary btn-sm" onclick="suspendUserAccount(${u.id}, 'active')" style="padding:4px 8px; width:auto; font-size:10px;">Activate</button>` :
                    `<button class="btn btn-secondary btn-sm" onclick="suspendUserAccount(${u.id}, 'suspended')" style="padding:4px 8px; width:auto; font-size:10px; background-color:#FEE2E2; color:#DC2626;">Suspend</button>`;

                const resetBtn = `<button class="btn btn-secondary btn-sm" onclick="resetUserPassword(${u.id})" style="padding:4px 8px; width:auto; font-size:10px; margin-left: 4px;">Reset</button>`;

                return `
                    <tr>
                        <td>
                            <div style="font-weight: 700;">${u.name}</div>
                            <div style="font-size: 10px; color: var(--text-secondary);">${u.email}</div>
                        </td>
                        <td style="text-transform: capitalize;">${u.role}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <div style="display:flex;">
                                ${actionBtn}
                                ${resetBtn}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } catch(e) {
        tbody.innerHTML = '<tr><td colspan="4" style="color:var(--danger); text-align:center;">Failed to load users list.</td></tr>';
    }
}

// Suspend/Reactivate user account
async function suspendUserAccount(userId, targetStatus) {
    const loader = Toast.show('Updating account state...', 'loading');

    try {
        const response = await fetch(`/api/admin/users/${userId}/status`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: targetStatus })
        });
        const data = await response.json();

        if (data.status === 'success') {
            Toast.update(loader, `User account state set to: ${targetStatus}`, 'success');
            loadAdminDashboard();
        } else {
            Toast.update(loader, data.message || 'Action failed', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Connection error.', 'error');
    }
}

// Reset password for student
async function resetUserPassword(userId) {
    const newPassword = prompt('Enter a new password for this user (minimum 8 characters):');
    if (!newPassword) return;

    if (newPassword.length < 8) {
        alert('Password is too short (min 8 characters).');
        return;
    }

    const loader = Toast.show('Resetting password...', 'loading');

    try {
        const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newPassword })
        });
        const data = await response.json();

        if (data.status === 'success') {
            Toast.update(loader, data.message, 'success');
        } else {
            Toast.update(loader, data.message || 'Password reset failed', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Connection error.', 'error');
    }
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

// Vendor Trigger Mark as Sold
async function triggerMarkAsSold(productId) {
    const buyerEmail = prompt('Enter the buyer\'s email address to link this deal (optional):') || '';
    let buyerId = null;

    if (buyerEmail) {
        const loader = Toast.show('Locating buyer details...', 'loading');
        try {
            const response = await fetch(`/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            const data = await response.json();
            if (data.status === 'success') {
                const buyer = data.users.find(u => u.email.toLowerCase() === buyerEmail.toLowerCase());
                if (buyer) {
                    buyerId = buyer.id;
                    Toast.dismiss(loader);
                } else {
                    Toast.update(loader, 'Buyer email not found. Trade will be recorded without a linked buyer account.', 'warning', 3000);
                }
            } else {
                Toast.dismiss(loader);
            }
        } catch(e) {
            Toast.dismiss(loader);
        }
    }

    const loader = Toast.show('Marking product as sold...', 'loading');
    try {
        const response = await fetch(`/api/orders/mark-sold`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId, buyerId })
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
