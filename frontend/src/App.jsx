import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingView from './pages/LandingView';
import Marketplace from './pages/Marketplace';
import Auth from './pages/Auth';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProductModal from './components/ProductModal';
import ProductCard from './components/ProductCard';
import LegalView from './pages/LegalView';
import { SupportModal, FilterDrawer, CreateListingModal, TestimonialModal, WelcomeModal, OtpVerificationModal } from './components/Modals';
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
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

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
      if (!localStorage.getItem('scholarmart_welcomed')) {
        setShowWelcomeModal(true);
        localStorage.setItem('scholarmart_welcomed', 'true');
      }
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
      if (res.data && (res.data.data || res.data.products)) {
        setFeaturedProducts(res.data.data || res.data.products);
      } else if (Array.isArray(res.data)) {
        setFeaturedProducts(res.data);
      }
    }).catch(err => console.error(err));

    // Listen to URL hash routing
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';
      if (hash === '#/' || hash === '') setActiveTab('home');
      else if (hash === '#/marketplace') setActiveTab('marketplace');
      else if (hash === '#/cart') {
        const token = localStorage.getItem('scholarmart_token');
        if (!token) {
          Toast.show('Please login to view your cart!', 'warning');
          setActiveTab('auth');
          window.location.hash = '#/login';
        } else {
          setActiveTab('cart');
        }
      }
      else if (hash === '#/terms') setActiveTab('terms');
      else if (hash === '#/privacy') setActiveTab('privacy');
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
          user={user}
        />

        <main className="app-content">
          {activeTab === 'home' ? (
            <LandingView 
              user={user}
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
            user?.role === 'admin' ? (
              <AdminDashboard user={user} onLogout={handleLogout} />
            ) : (
              <VendorDashboard 
                user={user} 
                onLogout={handleLogout} 
                onOpenSellModal={handleOpenSellModal}
                onSelectProduct={setSelectedProduct}
              />
            )
          ) : activeTab === 'terms' ? (
            <LegalView page="terms" />
          ) : activeTab === 'privacy' ? (
            <LegalView page="privacy" />
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
                <div className="products-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                  {savedProducts.map(p => {
                    const whatsappNumber = p.vendor_whatsapp || p.vendor?.whatsapp || '2348000000000';
                    const message = encodeURIComponent(`Hi, I'm interested in buying "${p.name}" listed on ScholarMart for ₦${Number(p.price).toLocaleString()}. Is it still available?`);
                    const whatsappLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;

                    return (
                      <div key={p.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <ProductCard 
                          product={p} 
                          onSelect={setSelectedProduct}
                          isSaved={true}
                          onToggleSave={handleToggleSave}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border)' }}>
                          <a 
                            href={whatsappLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn"
                            style={{ width: '100%', backgroundColor: '#25D366', color: '#fff', fontSize: '14px', fontWeight: 800, padding: '12px', borderRadius: '12px', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)' }}
                          >
                            💬 Chat WhatsApp
                          </a>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSave(p);
                            }}
                            className="btn"
                            style={{ width: '100%', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)', padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            title="Remove from cart"
                          >
                            🗑️ Remove Item
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
              if (res.data && (res.data.data || res.data.products)) setFeaturedProducts(res.data.data || res.data.products);
            });
          }}
        />

        {/* Testimonial Modal */}
        <TestimonialModal isOpen={showTestimonialModal} onClose={() => setShowTestimonialModal(false)} onSuccess={() => window.location.reload()} />

        {/* Welcome Modal */}
        <WelcomeModal isOpen={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} />

        {/* Mandatory OTP Verification Modal */}
        <OtpVerificationModal 
          isOpen={Boolean(user && user.email_verified === false)} 
          user={user} 
          onSuccess={(updatedUser) => setUser(updatedUser)} 
          onLogout={handleLogout} 
        />
      </div>
    </>
  );
}
