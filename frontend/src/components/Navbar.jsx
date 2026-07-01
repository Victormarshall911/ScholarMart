import React, { useState, useEffect } from 'react';
import { Bell, User, Mic, Camera } from 'lucide-react';
import Toast from '../services/toast';

export default function Navbar({ activeTab, setActiveTab, searchQuery, setSearchQuery, onOpenSupportModal, onOpenFilterDrawer, onOpenSellModal, user, theme, setTheme }) {
  const showGlobalSearch = activeTab === 'marketplace';
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  
  // Recent searches state
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('scholarmart_recents') || '["Textbooks", "Hostel essentials", "Laptops"]');
    } catch (e) {
      return ["Textbooks", "Hostel essentials", "Laptops"];
    }
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Update cart count locally
  useEffect(() => {
    const updateCount = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('scholarmart_saved_items') || '[]');
        setCartCount(saved.length);
      } catch (e) {
        setCartCount(0);
      }
    };
    updateCount();
    
    // Listen to storage event (works across tabs)
    window.addEventListener('storage', updateCount);
    // Poll to keep it in sync within the same tab in real-time
    const interval = setInterval(updateCount, 1000);
    
    return () => {
      window.removeEventListener('storage', updateCount);
      clearInterval(interval);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      Toast.show('ScholarMart app installed successfully!', 'success');
      setInstallPrompt(null);
    }
  };

  const handleSearchSubmit = (val) => {
    if (!val || val.trim() === '') return;
    const term = val.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== term.toLowerCase());
      const updated = [term, ...filtered].slice(0, 5);
      localStorage.setItem('scholarmart_recents', JSON.stringify(updated));
      return updated;
    });
    if (setSearchQuery) setSearchQuery(term);
  };

  const handleClearRecents = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('scholarmart_recents');
  };

  return (
    <>
      {/* Sticky Header */}
      <header className="app-header">
        <a 
          href="#/" 
          className="brand-logo" 
          onClick={(e) => { e.preventDefault(); setActiveTab('home'); window.location.hash = '#/'; }}
        >
          Scholar<span>Mart</span>
        </a>
        
        {/* Action Icons & Avatar */}
        <div className="header-actions">
          {installPrompt && (
            <button 
              className="btn btn-sm" 
              style={{ 
                width: 'auto', 
                padding: '8px 16px', 
                fontSize: '12px', 
                fontWeight: 700, 
                borderRadius: '24px', 
                background: 'var(--gradient-success)', 
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                border: 'none', 
                boxShadow: '0 4px 14px var(--shadow-success-glow)',
                letterSpacing: '0.01em',
                whiteSpace: 'nowrap'
              }}
              onClick={handleInstallClick}
              title="Install ScholarMart to your home screen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px', flexShrink: 0 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Install App
            </button>
          )}

          {/* Theme Toggle Button */}
          <button 
            className="btn btn-outline btn-sm theme-toggle-btn"
            style={{ 
              width: '32px', 
              height: '32px', 
              padding: 0, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              border: '1px solid var(--border)', 
              color: 'var(--text-secondary)',
              background: 'var(--surface)',
              cursor: 'pointer' 
            }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '15px', height: '15px', color: 'var(--color-sun)' }}>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '15px', height: '15px', color: 'var(--text-secondary)' }}>
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" />
              </svg>
            )}
          </button>

          {/* Premium Notification Bell Icon */}
          <div 
            className="notification-bell-container" 
            title="Notifications" 
            onClick={() => Toast.show("You have no new notifications.", "info")}
          >
            <Bell size={18} />
            <span className="notification-badge"></span>
          </div>

          {/* Premium Profile Avatar */}
          <div 
            className="profile-avatar-container" 
            title="My Profile" 
            onClick={() => { setActiveTab('profile'); window.location.hash = '#/dashboard'; }}
          >
            {user ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-green-light)', color: 'var(--primary-green)', fontWeight: 800, fontSize: '13px' }}>
                {(user.full_name || user.name || user.email || 'SM').slice(0, 2).toUpperCase()}
              </div>
            ) : (
              <User size={18} />
            )}
          </div>

          {/* Support Button */}
          <button 
            className="btn btn-outline btn-sm support-trigger-btn" 
            id="header-support-btn" 
            style={{ width: 'auto', padding: '7px 14px', fontSize: '12px', fontWeight: 700, borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px', borderColor: 'var(--primary-green)', color: 'var(--primary-green)' }}
            onClick={onOpenSupportModal}
          >
            💬 Support
          </button>
        </div>
      </header>

      {/* Global Search Bar */}
      <div 
        id="global-search-bar" 
        className="global-search-bar" 
        style={{ display: showGlobalSearch ? 'flex' : 'none' }}
      >
        <div className="search-container" style={{ flexGrow: 1, marginBottom: 0 }}>
          <input 
            type="text" 
            id="global-search-input" 
            className="search-input" 
            placeholder="Search textbooks, hostel items..."
            value={searchQuery || ''}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 250)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit(e.target.value);
              }
            }}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          />
          <span className="search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
            </svg>
          </span>

          {/* Voice & Image Search Placeholders */}
          <div className="search-placeholders">
            <button className="search-placeholder-icon" title="Voice Search" onClick={() => Toast.show("Voice search feature coming soon! 🎙️", "info")}>
              <Mic size={15} />
            </button>
            <button className="search-placeholder-icon" title="Image Search" onClick={() => Toast.show("Image search feature coming soon! 📸", "info")}>
              <Camera size={15} />
            </button>
          </div>

          {/* Search Dropdown Panel */}
          {isFocused && (
            <div className="search-dropdown" onMouseDown={(e) => e.preventDefault()}>
              {recentSearches.length > 0 && (
                <>
                  <div className="recent-searches-header">
                    <span>Recent Searches</span>
                    <button className="recent-search-clear-btn" onClick={handleClearRecents}>Clear All</button>
                  </div>
                  {recentSearches.map((term, idx) => (
                    <div 
                      key={idx} 
                      className="recent-search-item"
                      onClick={() => {
                        if (setSearchQuery) setSearchQuery(term);
                        setIsFocused(false);
                      }}
                    >
                      <span>🔍 {term}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>recent</span>
                    </div>
                  ))}
                </>
              )}
              
              <div className="recent-searches-header" style={{ marginTop: recentSearches.length > 0 ? '8px' : 0 }}>
                <span>Quick Suggestions</span>
              </div>
              {['Textbooks', 'Calculators', 'Gadgets', 'Hostels'].map((term, idx) => (
                <div 
                  key={idx} 
                  className="recent-search-item"
                  onClick={() => {
                    if (setSearchQuery) setSearchQuery(term);
                    setIsFocused(false);
                  }}
                >
                  <span>✨ {term}</span>
                  <span style={{ fontSize: '11px', color: 'var(--primary-orange)', fontWeight: 600 }}>popular</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button 
          id="global-filter-btn" 
          className="btn btn-secondary global-filter-btn" 
          style={{ width: '48px', height: '48px', padding: 0, borderRadius: '14px', flexShrink: 0 }}
          onClick={onOpenFilterDrawer}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '20px', height: '20px', verticalAlign: 'middle' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
        </button>
      </div>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <div className="fab-container">
        <button id="fab-create-listing" className="fab-btn" title="Sell Item" onClick={onOpenSellModal}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {/* Sticky Bottom Navigation (Airbnb / Apple style) */}
      <nav className="app-nav">
        <a 
          href="#/" 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setActiveTab('home'); window.location.hash = '#/'; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Home
        </a>
        <a 
          href="#/marketplace" 
          className={`nav-item ${activeTab === 'marketplace' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setActiveTab('marketplace'); window.location.hash = '#/marketplace'; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
          </svg>
          Market
        </a>

        {/* FAB spacer */}
        <div style={{ width: '64px', flexShrink: 0 }}></div>

        <a 
          href="#/cart" 
          className={`nav-item ${activeTab === 'cart' ? 'active' : ''}`}
          id="nav-cart-btn"
          onClick={(e) => { 
            e.preventDefault(); 
            const token = localStorage.getItem('scholarmart_token');
            if (!token) {
              Toast.show('Please login to view your cart!', 'warning');
              setActiveTab('auth');
              window.location.hash = '#/login';
            } else {
              setActiveTab('cart'); 
              window.location.hash = '#/cart'; 
            }
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            {cartCount > 0 && (
              <span style={{ 
                position: 'absolute', 
                top: '-4px', 
                right: '-4px', 
                backgroundColor: 'var(--primary-orange)', 
                color: '#fff', 
                fontSize: '9px', 
                fontWeight: 800, 
                borderRadius: '50%', 
                width: '15px', 
                height: '15px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: 'var(--shadow-orange)',
                border: '1px solid var(--surface)'
              }}>
                {cartCount}
              </span>
            )}
          </div>
          Cart
        </a>
        <a 
          href="#/dashboard" 
          className={`nav-item ${activeTab === 'profile' || activeTab === 'auth' ? 'active' : ''}`}
          id="nav-profile-btn"
          onClick={(e) => { e.preventDefault(); setActiveTab('profile'); window.location.hash = '#/dashboard'; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          {user?.role === 'admin' ? '🛡️ Admin' : 'Profile'}
        </a>
      </nav>
    </>
  );
}
