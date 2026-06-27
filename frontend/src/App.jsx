import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingView from './pages/LandingView';
import Marketplace from './pages/Marketplace';
import Auth from './pages/Auth';
import VendorDashboard from './pages/VendorDashboard';
import ProductModal from './components/ProductModal';
import ProductCard from './components/ProductCard';
import { SupportModal, FilterDrawer, CreateListingModal, TestimonialModal } from './components/Modals';
import api from './services/api';
import Toast from './services/toast';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [savedProducts, setSavedProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  // Modals state
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filters, setFilters] = useState({});

  // Splash screen fade
  const [hideSplash, setHideSplash] = useState(false);

  useEffect(() => {
    // Fade out splash after 1.8s
    const timer = setTimeout(() => {
      setHideSplash(true);
    }, 1800);

    // Load auth
    const savedToken = localStorage.getItem('scholarmart_token');
    const savedUserData = localStorage.getItem('scholarmart_user');
    if (savedToken && savedUserData) {
      try {
        setUser(JSON.parse(savedUserData));
      } catch (e) {
        console.error(e);
      }
    }

    // Load bookmarked items
    const savedItemsData = localStorage.getItem('scholarmart_saved_items');
    if (savedItemsData) {
      try {
        setSavedProducts(JSON.parse(savedItemsData));
      } catch (e) {
        console.error(e);
      }
    }

    // Fetch featured products for landing view
    api.get('/products').then(res => {
      if (res.data && res.data.data) {
        setFeaturedProducts(res.data.data);
      } else if (Array.isArray(res.data)) {
        setFeaturedProducts(res.data);
      }
    }).catch(err => console.error(err));

    // Listen to URL hash routing
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';
      if (hash === '#/' || hash === '') setActiveTab('home');
      else if (hash === '#/marketplace') setActiveTab('marketplace');
      else if (hash === '#/cart') setActiveTab('cart');
      else if (hash === '#/dashboard' || hash === '#/profile') {
        const token = localStorage.getItem('scholarmart_token');
        setActiveTab(token ? 'profile' : 'auth');
      }
      else if (hash === '#/login' || hash === '#/register') setActiveTab('auth');
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleToggleSave = (product) => {
    let updated;
    if (savedProducts.some(p => p.id === product.id)) {
      updated = savedProducts.filter(p => p.id !== product.id);
    } else {
      updated = [...savedProducts, product];
    }
    setSavedProducts(updated);
    localStorage.setItem('scholarmart_saved_items', JSON.stringify(updated));
  };

  const handleLogout = () => {
    localStorage.removeItem('scholarmart_token');
    localStorage.removeItem('scholarmart_user');
    setUser(null);
    setActiveTab('home');
    window.location.hash = '#/';
  };

  const handleSelectCategoryFilter = (cat) => {
    setSelectedCategory(cat);
    setActiveTab('marketplace');
    window.location.hash = '#/marketplace';
  };

  const handleOpenSellModal = () => {
    const token = localStorage.getItem('scholarmart_token');
    if (!token) {
      Toast.show('Please login to list products!', 'warning');
      window.location.hash = '#/login';
    } else if (user && user.role !== 'vendor' && user.role !== 'admin') {
      Toast.show('Only vendor profiles can create listings.', 'warning');
    } else {
      setShowSellModal(true);
    }
  };

  return (
    <>
      {/* Splash Screen Overlay */}
      <div id="splash-screen" className={hideSplash ? 'fade-out' : ''}>
        <img src="/logo.png" alt="ScholarMart" className="splash-logo" />
        <div className="splash-spinner"></div>
      </div>

      <div className="app-shell">
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenSupportModal={() => setShowSupportModal(true)}
          onOpenFilterDrawer={() => setShowFilterDrawer(true)}
          onOpenSellModal={handleOpenSellModal}
        />

        <main className="app-content">
          {activeTab === 'home' ? (
            <LandingView 
              featuredProducts={featuredProducts}
              onSelectProduct={setSelectedProduct}
              savedIds={savedProducts.map(p => p.id)}
              onToggleSave={handleToggleSave}
              onSelectCategoryFilter={handleSelectCategoryFilter}
              onOpenTestimonialModal={() => setShowTestimonialModal(true)}
              onOpenSupportModal={() => setShowSupportModal(true)}
            />
          ) : activeTab === 'marketplace' ? (
            <Marketplace 
              onSelectProduct={setSelectedProduct} 
              savedIds={savedProducts.map(p => p.id)} 
              onToggleSave={handleToggleSave}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              filters={filters}
              setFilters={setFilters}
            />
          ) : activeTab === 'auth' ? (
            <Auth onLoginSuccess={(u) => { setUser(u); setActiveTab('profile'); window.location.hash = '#/dashboard'; }} />
          ) : activeTab === 'profile' ? (
            <VendorDashboard 
              user={user} 
              onLogout={handleLogout} 
              onOpenSellModal={handleOpenSellModal}
              onSelectProduct={setSelectedProduct}
            />
          ) : activeTab === 'cart' ? (
            <section className="view-container active">
              <h1 className="view-title">My Cart ({savedProducts.length})</h1>
              <p className="view-subtitle">Your bookmarked items ready for meetup & deal arrangement.</p>
              {savedProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Your cart is empty</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tap the bookmark icon on any product in the marketplace to save it here.</p>
                </div>
              ) : (
                <div className="products-grid">
                  {savedProducts.map(p => (
                    <ProductCard 
                      key={p.id} 
                      product={p} 
                      onSelect={setSelectedProduct}
                      isSaved={true}
                      onToggleSave={handleToggleSave}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </main>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            user={user} 
          />
        )}

        {/* Support Modal */}
        <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />

        {/* Filter Drawer */}
        <FilterDrawer 
          isOpen={showFilterDrawer} 
          onClose={() => setShowFilterDrawer(false)}
          filters={filters}
          setFilters={setFilters}
        />

        {/* Create Listing Modal */}
        <CreateListingModal 
          isOpen={showSellModal} 
          onClose={() => setShowSellModal(false)}
          onSuccess={() => {
            api.get('/products').then(res => {
              if (res.data && res.data.data) setFeaturedProducts(res.data.data);
            });
          }}
        />

        {/* Testimonial Modal */}
        <TestimonialModal isOpen={showTestimonialModal} onClose={() => setShowTestimonialModal(false)} />
      </div>
    </>
  );
}
