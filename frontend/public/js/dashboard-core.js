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
