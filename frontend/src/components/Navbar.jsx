import React from 'react';

export default function Navbar({ activeTab, setActiveTab, searchQuery, setSearchQuery, onOpenSupportModal, onOpenFilterDrawer, onOpenSellModal }) {
  const showGlobalSearch = activeTab === 'marketplace';

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
        <button 
          className="btn btn-outline btn-sm" 
          id="header-support-btn" 
          style={{ width: 'auto', padding: '7px 14px', fontSize: '12px' }}
          onClick={onOpenSupportModal}
        >
          💬 Support
        </button>
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
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          />
          <span className="search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
            </svg>
          </span>
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

      {/* Sticky Bottom Navigation */}
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
          onClick={(e) => { e.preventDefault(); setActiveTab('cart'); window.location.hash = '#/cart'; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
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
          Profile
        </a>
      </nav>
    </>
  );
}
