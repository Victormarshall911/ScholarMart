import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Marketplace from './pages/Marketplace';
import Auth from './pages/Auth';
import VendorDashboard from './pages/VendorDashboard';
import ProductModal from './components/ProductModal';
import SellModal from './components/SellModal';
import ProductCard from './components/ProductCard';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [savedProducts, setSavedProducts] = useState([]);

  useEffect(() => {
    // Check saved token/user
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
  };

  return (
    <div className="app-shell">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onOpenSellModal={() => setShowSellModal(true)} 
      />

      <main className="app-content">
        {activeTab === 'home' || activeTab === 'explore' ? (
          <Marketplace 
            onSelectProduct={setSelectedProduct} 
            savedIds={savedProducts.map(p => p.id)} 
            onToggleSave={handleToggleSave} 
          />
        ) : activeTab === 'auth' ? (
          <Auth onLoginSuccess={(u) => { setUser(u); setActiveTab('profile'); }} />
        ) : activeTab === 'profile' ? (
          <VendorDashboard 
            user={user} 
            onLogout={handleLogout} 
            onOpenSellModal={() => setShowSellModal(true)}
            onSelectProduct={setSelectedProduct}
          />
        ) : activeTab === 'saved' ? (
          <div className="view-container active">
            <h2 className="view-title">Saved Deals ({savedProducts.length})</h2>
            <p className="view-subtitle">Your bookmarked campus items for quick comparison.</p>
            {savedProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>No saved items yet</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tap the bookmark icon on any product to save it here.</p>
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
          </div>
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

      {/* Vendor Listing Modal */}
      {showSellModal && (
        <SellModal 
          onClose={() => setShowSellModal(false)} 
          onSuccess={() => {
            if (activeTab === 'profile' || activeTab === 'home') {
              window.location.reload(); // Quick refresh to pull latest list
            }
          }} 
        />
      )}
    </div>
  );
}
