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
    else if (tabId === 'buyer-saved') loadBuyerSavedItems();
    else if (tabId === 'vendor-listings') loadVendorListings();
    else if (tabId === 'vendor-sales') loadVendorSales();
    else if (tabId === 'admin-verifications') loadAdminVerifications();
    else if (tabId === 'admin-moderation') loadAdminModeration();
    else if (tabId === 'admin-users') loadAdminUsers();
}

/* ========================================================
   BUYER DASHBOARD UTILITIES
   ======================================================== */

// Load buyer purchases
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
            const orders = data.orders;
            if (orders.length === 0) {
                list.innerHTML = `
                    <div style="text-align: center; padding: 24px; color: var(--text-secondary);">
                        <p style="font-weight: 700; margin-bottom: 2px;">No purchases yet</p>
                        <p style="font-size: 12px;">Items you check out will appear here.</p>
                    </div>
                `;
                return;
            }

            list.innerHTML = orders.map(order => {
                let img = '/uploads/products/placeholder.webp';
                if (order.images && order.images.length > 0) img = order.images[0];
                
                let badgeClass = 'badge-pending';
                if (order.status === 'paid') badgeClass = 'badge-approved';
                else if (order.status === 'shipped') badgeClass = 'badge-approved';
                else if (order.status === 'completed') badgeClass = 'badge-approved';
                else if (order.status === 'cancelled') badgeClass = 'badge-rejected';

                const formattedDate = new Date(order.created_at).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'short', year: 'numeric'
                });

                return `
                    <div class="list-item">
                        <img src="${img}" class="list-item-img" alt="${order.product_name}">
                        <div class="list-item-content">
                            <div class="list-item-title">${order.product_name}</div>
                            <div class="list-item-price">₦${parseFloat(order.total_amount).toLocaleString()} <span style="font-size: 10px; color: var(--text-secondary); font-weight: normal;">(incl. ₦500 fee)</span></div>
                            <div class="list-item-sub">Vendor: ${order.vendor.name} • ${formattedDate}</div>
                        </div>
                        <div style="text-align: right; flex-shrink: 0;">
                            <span class="badge ${badgeClass}" style="text-transform: capitalize;">${order.status}</span>
                            <div style="font-size: 9px; color: var(--text-muted); margin-top: 4px;">Ref: ${order.paystack_reference.substring(0, 10)}...</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch(e) {
        list.innerHTML = '<p style="color: var(--danger); font-size: 13px; text-align: center;">Failed to load order history.</p>';
    }
}

// Load buyer saved bookmarks grid
async function loadBuyerSavedItems() {
    const list = document.getElementById('buyer-saved-list');
    if (!list) return;

    list.innerHTML = '<div style="grid-column: span 2; text-align: center; padding: 20px;"><div class="toast-spinner" style="margin: 0 auto;"></div></div>';

    try {
        const response = await fetch('/api/products/saved', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();

        if (data.status === 'success') {
            const products = data.products;
            if (products.length === 0) {
                list.innerHTML = `
                    <div style="grid-column: span 2; text-align: center; padding: 24px; color: var(--text-secondary);">
                        <p style="font-weight: 700; margin-bottom: 2px;">No saved products</p>
                        <p style="font-size: 12px;">Bookmark products in the marketplace to view them here.</p>
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
                            <button class="bookmark-icon-btn active" 
                                    onclick="handleBookmarkToggle(event, ${product.id}, true); setTimeout(loadBuyerSavedItems, 800);">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 18px; height: 18px;">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
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
        list.innerHTML = '<p style="color: var(--danger); font-size: 13px; text-align: center; grid-column: span 2;">Failed to load saved items.</p>';
    }
}

// Buyer Profile Wizard Loading
function loadBuyerVerificationWizard() {
    const card = document.getElementById('verification-wizard-card');
    const badge = document.getElementById('buyer-verification-badge');
    if (!card || !badge) return;

    // Set badge based on user state
    let badgeClass = 'badge-pending';
    if (currentUser.verification_status === 'approved') badgeClass = 'badge-approved';
    else if (currentUser.verification_status === 'rejected') badgeClass = 'badge-rejected';
    
    badge.innerHTML = `<span class="badge ${badgeClass}">Identity: ${currentUser.verification_status.toUpperCase()}</span>`;

    // Set buyer avatar if portrait exists
    const avatar = document.getElementById('buyer-profile-avatar');
    if (avatar) {
        if (currentUser.portrait) {
            avatar.innerHTML = `<img src="${currentUser.portrait}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            avatar.textContent = currentUser.name.substring(0, 2).toUpperCase();
        }
    }

    // Show/hide upload wizard
    if (currentUser.verification_status === 'approved') {
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

    // Load subaccount code in text
    const subaccountLabel = document.getElementById('vendor-subaccount-code');
    if (subaccountLabel) {
        subaccountLabel.textContent = currentUser.paystack_subaccount_code || 'Account Unlinked (Mock fallback active)';
    }

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

    let badgeClass = 'badge-pending';
    let verifiedCheck = '';
    if (currentUser.verification_status === 'approved') {
        badgeClass = 'badge-approved';
        verifiedCheck = `
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline; vertical-align: middle;">
                <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#22C55E"/>
            </svg>
        `;
    } else if (currentUser.verification_status === 'rejected') {
        badgeClass = 'badge-rejected';
    }
    
    badge.innerHTML = `<span class="badge ${badgeClass}">Vendor: ${currentUser.verification_status.toUpperCase()}</span>`;

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
        nameTag.innerHTML = `<span>${currentUser.name}</span> ${verifiedCheck}`;
    }

    if (currentUser.verification_status === 'approved') {
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

                return `
                    <div class="list-item" style="align-items: stretch;">
                        <img src="${img}" class="list-item-img" alt="${p.name}" style="width: 60px; height: 60px;">
                        <div class="list-item-content" style="display: flex; flex-direction: column; justify-content: center;">
                            <div class="list-item-title" style="font-size: 14px;">${p.name}</div>
                            <div class="list-item-price">₦${parseFloat(p.price).toLocaleString()}</div>
                            <div style="margin-top: 4px; display: flex; gap: 6px; align-items: center;">
                                <span class="badge ${badgeClass}" style="font-size: 9px; padding: 1px 6px;">${p.status.toUpperCase()}</span>
                                <span style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">${p.category}</span>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; gap: 4px;">
                            <button class="btn btn-outline btn-sm" onclick="openProductEdit(${p.id})" style="padding: 4px 8px; width: auto; font-size: 11px;">Edit</button>
                            <button class="btn btn-secondary btn-sm" onclick="deleteProductListing(${p.id})" style="padding: 4px 8px; width: auto; font-size: 11px; background-color: #FEE2E2; color: #DC2626;">Delete</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch(e) {
        list.innerHTML = '<p style="color: var(--danger); font-size: 13px; text-align: center;">Failed to load listings.</p>';
    }
}

// Load sales orders
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
            const sales = data.sales;

            // Calculate total volume (paid sales)
            const paidSales = sales.filter(s => ['paid', 'shipped', 'completed'].includes(s.status));
            const volume = paidSales.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
            
            document.getElementById('stat-sales-made').textContent = `₦${volume.toLocaleString()}`;

            if (sales.length === 0) {
                list.innerHTML = `
                    <div style="text-align: center; padding: 24px; color: var(--text-secondary);">
                        <p style="font-weight: 700; margin-bottom: 2px;">No sales orders yet</p>
                        <p style="font-size: 12px;">Purchased orders of your items will show here.</p>
                    </div>
                `;
                return;
            }

            list.innerHTML = sales.map(sale => {
                let img = '/uploads/products/placeholder.webp';
                if (sale.images && sale.images.length > 0) img = sale.images[0];

                const formattedDate = new Date(sale.created_at).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'short'
                });

                // Dropdown status options
                const selectId = `status_select_${sale.id}`;

                return `
                    <div class="list-item" style="flex-direction: column; align-items: stretch; gap: 8px; padding: 12px;">
                        <div style="display: flex; gap: 10px;">
                            <img src="${img}" class="list-item-img" alt="${sale.product_name}">
                            <div class="list-item-content">
                                <div class="list-item-title">${sale.product_name}</div>
                                <div class="list-item-price">₦${parseFloat(sale.amount).toLocaleString()} <span style="font-size: 10px; color: var(--text-secondary); font-weight: normal;">(your payout)</span></div>
                                <div class="list-item-sub">Buyer: ${sale.buyer.name} (${sale.buyer_phone}) • ${formattedDate}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 8px; margin-top: 4px;">
                            <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">ORDER STATUS:</span>
                            <div style="display: flex; gap: 6px; align-items: center;">
                                <select id="${selectId}" class="form-select" style="font-size: 12px; padding: 4px 8px; width: 120px; height: auto;" onchange="updateSalesOrderStatus(${sale.id}, this.value)">
                                    <option value="pending" ${sale.status === 'pending' ? 'selected' : ''}>Pending</option>
                                    <option value="paid" ${sale.status === 'paid' ? 'selected' : ''}>Paid</option>
                                    <option value="shipped" ${sale.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                    <option value="completed" ${sale.status === 'completed' ? 'selected' : ''}>Completed</option>
                                    <option value="cancelled" ${sale.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch(e) {
        list.innerHTML = '<p style="color: var(--danger); font-size: 13px; text-align: center;">Failed to load sales orders.</p>';
    }
}

// Update Sales Shipping Status
async function updateSalesOrderStatus(orderId, status) {
    const loader = Toast.show('Updating order status...', 'loading');

    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
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
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
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
});


/* ========================================================
   ADMIN DASHBOARD UTILITIES
   ======================================================== */

// Load Admin report stats and active tables
async function loadAdminDashboard() {
    if (!currentToken || currentUser.role !== 'admin') return;

    // Load reports
    try {
        const response = await fetch('/api/admin/reports', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            const an = data.analytics;
            document.getElementById('admin-stat-users').textContent = an.totalUsers;
            document.getElementById('admin-stat-listings').textContent = an.totalListings;
            document.getElementById('admin-stat-revenue').textContent = `₦${an.revenue.toLocaleString()}`;
        }
    } catch(e) {
        console.warn('Failed to load admin analytics reports.');
    }

    // Load active tab panel data
    loadAdminVerifications();
    loadAdminModeration();
    loadAdminUsers();
}

// Load verification queue (student ID uploads)
async function loadAdminVerifications() {
    const list = document.getElementById('admin-verifications-list');
    if (!list) return;

    list.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="toast-spinner" style="margin: 0 auto;"></div></div>';

    try {
        const response = await fetch('/api/admin/verifications', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();

        if (data.status === 'success') {
            const verifications = data.verifications;
            if (verifications.length === 0) {
                list.innerHTML = `
                    <div style="text-align: center; padding: 24px; color: var(--text-secondary); font-size: 13px;">
                        No pending student ID card manual verifications.
                    </div>
                `;
                return;
            }

            list.innerHTML = verifications.map(v => {
                const docLink = v.verification_file ? `<a href="${v.verification_file}" target="_blank" style="color: var(--primary-green); font-weight:700; text-decoration:none; display:block; margin: 4px 0;">View uploaded ID file</a>` : 'No document uploaded';
                
                return `
                    <div class="card" style="padding: 12px; font-size:13px; margin-bottom: 10px;">
                        <strong>Name:</strong> ${v.name} (${v.role})<br>
                        <strong>Email:</strong> ${v.email}<br>
                        <strong>Campus:</strong> ${v.university} - ${v.campus}<br>
                        <strong>Document:</strong> ${docLink}
                        <div style="display: flex; gap: 8px; margin-top: 10px;">
                            <button class="btn btn-primary btn-sm" onclick="verifyStudentId(${v.id}, 'approved')" style="padding: 6px 12px; width:auto;">Approve</button>
                            <button class="btn btn-secondary btn-sm" onclick="verifyStudentId(${v.id}, 'rejected')" style="padding: 6px 12px; width:auto; background-color: #FEE2E2; color:#DC2626;">Reject</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch(e) {
        list.innerHTML = '<p style="color: var(--danger); font-size:13px; text-align:center;">Failed to retrieve verification items.</p>';
    }
}

// Approve or reject user ID card upload
async function verifyStudentId(userId, status) {
    let reason = '';
    if (status === 'rejected') {
        reason = prompt('Enter the rejection reason (e.g. Expired ID, Blurry Image):');
        if (reason === null) return; // cancel
    }

    const loader = Toast.show('Processing verification...', 'loading');

    try {
        const response = await fetch(`/api/admin/verifications/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, reason })
        });
        const data = await response.json();

        if (data.status === 'success') {
            Toast.update(loader, `Student verification set to: ${status}`, 'success');
            loadAdminDashboard();
        } else {
            Toast.update(loader, data.message || 'Action failed', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Connection error.', 'error');
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

// Upload vendor profile portrait
async function uploadVendorPortrait() {
    if (!currentToken) return;

    const fileInput = document.getElementById('vendor-portrait-input');
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
            
            // Reload/refresh vendor dashboard avatar
            loadVendorVerificationWizard();
            // Clear input
            fileInput.value = '';
        } else {
            Toast.update(loader, data.message || 'Failed to upload portrait', 'error');
        }
    } catch (err) {
        Toast.update(loader, 'Server error during upload.', 'error');
    }
}
