import React from 'react';
import { Home, Compass, PlusCircle, Bookmark, User, Search } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onOpenSellModal }) {
  return (
    <>
      {/* Sticky Header */}
      <header className="app-header">
        <a href="#" className="brand-logo" onClick={(e) => { e.preventDefault(); setActiveTab('home'); }}>
          Scholar<span>Mart</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-green)', background: 'var(--primary-green-light)', padding: '4px 10px', borderRadius: '999px' }}>
              Vendor ⭐ {user.reputation_score || 100}
            </span>
          )}
          <button className="user-status-btn" onClick={() => setActiveTab(user ? 'profile' : 'auth')}>
            <User size={20} color="var(--text-primary)" />
          </button>
        </div>
      </header>

      {/* Bottom Navigation */}
      <nav className="app-nav">
        <a 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} 
          onClick={() => setActiveTab('home')}
        >
          <Home />
          <span>Home</span>
        </a>
        <a 
          className={`nav-item ${activeTab === 'explore' ? 'active' : ''}`} 
          onClick={() => setActiveTab('explore')}
        >
          <Compass />
          <span>Explore</span>
        </a>
        <a 
          className="nav-item" 
          onClick={() => {
            if (!user) {
              setActiveTab('auth');
            } else {
              onOpenSellModal();
            }
          }}
          style={{ color: 'var(--primary-green)' }}
        >
          <PlusCircle size={28} />
          <span>Sell</span>
        </a>
        <a 
          className={`nav-item ${activeTab === 'saved' ? 'active' : ''}`} 
          onClick={() => setActiveTab('saved')}
        >
          <Bookmark />
          <span>Saved</span>
        </a>
        <a 
          className={`nav-item ${activeTab === 'profile' || activeTab === 'auth' ? 'active' : ''}`} 
          onClick={() => setActiveTab(user ? 'profile' : 'auth')}
        >
          <User />
          <span>{user ? 'Profile' : 'Sign In'}</span>
        </a>
      </nav>
    </>
  );
}
