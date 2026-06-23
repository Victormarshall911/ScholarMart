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

    const campusTag = document.getElementById('vendor-profile-campus');
    if (campusTag) campusTag.textContent = `${currentUser.university || 'COOU'} - ${currentUser.campus || 'Main Campus'}`;

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

