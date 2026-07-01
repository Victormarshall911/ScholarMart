import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import api from '../services/api';

export default function LandingView({ user, featuredProducts, onSelectProduct, savedIds, onToggleSave, onSelectCategoryFilter, onOpenTestimonialModal, onOpenSupportModal }) {
  const isLoggedIn = Boolean(user || localStorage.getItem('scholarmart_token'));
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    api.get('/testimonials').then(res => {
      if (res.data?.testimonials) setTestimonials(res.data.testimonials);
    }).catch(() => {});
  }, []);

  return (
    <section id="landing-view" className="view-container active">
      {/* Hero Card */}
      <div className="hero-card">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="hero-title">Buy. Sell. Connect on Campus.</h2>
          <p className="hero-sub">A trusted marketplace built for Nigeria students. 🎓</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
            <button 
              className="btn btn-orange" 
              style={{ flex: 1, minWidth: '140px' }} 
              onClick={() => { window.location.hash = '#/marketplace'; }}
            >
              Explore Listings
            </button>
            {!isLoggedIn && (
              <button 
                className="btn" 
                style={{ flex: 1, minWidth: '140px', background: 'var(--color-hero-btn-bg)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', color: 'white', border: '1.5px solid var(--color-hero-btn-border)', fontWeight: 700 }} 
                onClick={() => { window.location.hash = '#/register'; }}
              >
                Join Free →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Popular Categories */}
      <div className="section-header">
        <h3 className="section-title">Popular Categories</h3>
      </div>
      <div className="categories-grid">
        <div className="category-grid-item" onClick={() => onSelectCategoryFilter('Electronics')}>
          <div className="category-icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '22px', height: '22px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
            </svg>
          </div>
          <span className="category-grid-label">Electronics</span>
        </div>
        <div className="category-grid-item" onClick={() => onSelectCategoryFilter('Fashion & Clothing')}>
          <div className="category-icon-box" style={{ color: 'var(--color-fashion)', backgroundColor: 'var(--bg-fashion)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '22px', height: '22px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 2L3 5v4h3v11h12V9h3V5l-3-3H6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 2l3 3m6-3l-3 3" />
            </svg>
          </div>
          <span className="category-grid-label">Fashion</span>
        </div>
        <div className="category-grid-item" onClick={() => onSelectCategoryFilter('Books & Academic Materials')}>
          <div className="category-icon-box" style={{ color: 'var(--color-books)', backgroundColor: 'var(--bg-books)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '22px', height: '22px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span className="category-grid-label">Books</span>
        </div>
        <div className="category-grid-item" onClick={() => onSelectCategoryFilter('Hostel Essentials')}>
          <div className="category-icon-box" style={{ color: 'var(--color-hostels)', backgroundColor: 'var(--bg-hostels)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '22px', height: '22px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3.75-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.75A1.5 1.5 0 0110.5 15.75h3a1.5 1.5 0 011.5 1.5V21" />
            </svg>
          </div>
          <span className="category-grid-label">Hostels</span>
        </div>
        <div className="category-grid-item" onClick={() => onSelectCategoryFilter('Gadgets')}>
          <div className="category-icon-box" style={{ color: 'var(--color-gadgets)', backgroundColor: 'var(--bg-gadgets)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '22px', height: '22px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.5 1.5H13.5M10.5 22.5H13.5M12 5.25a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM12 9v3l1.5 1.5" />
            </svg>
          </div>
          <span className="category-grid-label">Gadgets</span>
        </div>
        <div className="category-grid-item" onClick={() => onSelectCategoryFilter('Creative & Handmade')}>
          <div className="category-icon-box" style={{ color: 'var(--color-creative)', backgroundColor: 'var(--bg-creative)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '22px', height: '22px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3a9 9 0 000 18h1.168a1.5 1.5 0 001.272-.705l.394-.63a1.5 1.5 0 011.272-.705h2.144A1.5 1.5 0 0019.5 18a9 9 0 00-7.5-15z" />
              <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
              <circle cx="11.5" cy="7.5" r="1" fill="currentColor" />
              <circle cx="15.5" cy="10.5" r="1" fill="currentColor" />
            </svg>
          </div>
          <span className="category-grid-label">Creative</span>
        </div>
        <div className="category-grid-item" onClick={() => onSelectCategoryFilter('Beauty & Personal Care')}>
          <div className="category-icon-box" style={{ color: 'var(--color-beauty)', backgroundColor: 'var(--bg-beauty)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '22px', height: '22px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3h6v3H9V3zm-2.25 6h10.5a1.5 1.5 0 011.5 1.5v9A2.25 2.25 0 0116.5 21.75H7.5A2.25 2.25 0 015.25 19.5v-9A1.5 1.5 0 016.75 9z" />
            </svg>
          </div>
          <span className="category-grid-label">Beauty</span>
        </div>
        <div className="category-grid-item" onClick={() => onSelectCategoryFilter('Sports & Fitness')}>
          <div className="category-icon-box" style={{ color: 'var(--color-sports)', backgroundColor: 'var(--bg-sports)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '22px', height: '22px' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M6 12A6 6 0 0 1 18 12" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6A6 6 0 0 0 12 18" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <span className="category-grid-label">Sports</span>
        </div>
        <div className="category-grid-item" onClick={() => onSelectCategoryFilter('Others')}>
          <div className="category-icon-box" style={{ color: 'var(--color-others)', backgroundColor: 'var(--bg-others)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '22px', height: '22px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <span className="category-grid-label">Others</span>
        </div>
      </div>

      {/* Featured Listings */}
      <div className="section-header" style={{ marginTop: '8px' }}>
        <h3 className="section-title">Featured Listings</h3>
        <a href="#/marketplace" className="section-link" onClick={(e) => { e.preventDefault(); window.location.hash = '#/marketplace'; }}>View All</a>
      </div>
      <div className="products-grid" id="landing-products">
        {featuredProducts && featuredProducts.slice(0, 4).map(p => (
          <ProductCard 
            key={p.id} 
            product={p} 
            onSelect={onSelectProduct}
            isSaved={savedIds?.includes(p.id)}
            onToggleSave={onToggleSave}
          />
        ))}
      </div>

      {/* How It Works */}
      <div style={{ marginTop: '32px', marginBottom: '8px' }}>
        <div className="section-header">
          <h3 className="section-title">How It Works</h3>
        </div>
        <div className="how-step-card">
          <div className="how-step-number">1</div>
          <div>
            <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '3px' }}>Register &amp; Verify</strong>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Create your student profile and verify your email address</p>
          </div>
        </div>
        <div className="how-step-card">
          <div className="how-step-number">2</div>
          <div>
            <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '3px' }}>Connect on WhatsApp</strong>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Chat directly with campus sellers to arrange inspection &amp; deal</p>
          </div>
        </div>
        <div className="how-step-card">
          <div className="how-step-number">3</div>
          <div>
            <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '3px' }}>Earn Reputation Badges</strong>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Confirm deals, get reviews, and rise from New to Top Seller</p>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div style={{ marginTop: '28px', marginBottom: '8px' }}>
        <div className="section-header">
          <h3 className="section-title">What Students Say</h3>
          <button className="section-link" id="share-story-btn" onClick={onOpenTestimonialModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--primary-green)', padding: 0 }}>
            ✍️ Share Yours
          </button>
        </div>

        <div id="testimonials-feed" className="testimonials-scroll">
          {testimonials.length > 0 ? (
            testimonials.map((t, idx) => (
              <div key={t.id || idx} className="card" style={{ minWidth: '260px', flexShrink: 0, padding: '14px', borderRadius: '16px', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: idx % 2 === 0 ? 'var(--primary-green-light)' : 'var(--primary-orange-light)', color: idx % 2 === 0 ? 'var(--primary-green)' : 'var(--primary-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {(t.user_name || 'Student').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{t.user_name || 'Student'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t.campus ? `COOU ${t.campus}` : 'COOU Campus'} • {'⭐'.repeat(t.rating || 5)}</div>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5 }}>"{t.message}"</p>
              </div>
            ))
          ) : (
            <>
              <div className="card" style={{ minWidth: '260px', flexShrink: 0, padding: '14px', borderRadius: '16px', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-green-light)', color: 'var(--primary-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>CO</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>Chinedu O.</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>COOU Igbariam • ⭐⭐⭐⭐⭐</div>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5 }}>"Got my engineering textbooks for half the bookstore price. Safe meetup at the faculty gate!"</p>
              </div>
              <div className="card" style={{ minWidth: '260px', flexShrink: 0, padding: '14px', borderRadius: '16px', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-orange-light)', color: 'var(--primary-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>AM</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>Amaka M.</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>COOU Uli • ⭐⭐⭐⭐⭐</div>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5 }}>"Sold my old mattress in 3 hours after posting. WhatsApp link makes connecting so smooth."</p>
              </div>
            </>
          )}
        </div>

        {/* Prominent share story CTA */}
        <button className="share-story-cta" onClick={onOpenTestimonialModal}>
          <span className="share-story-icon">💬</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>Had a good experience?</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Share your ScholarMart story — help other students trust the platform.</div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="var(--primary-green)" style={{ width: '18px', height: '18px', flexShrink: 0, marginLeft: 'auto' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Registration CTA Banner */}
      <div className="cta-banner">
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h3 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.3px' }}>Ready to start trading?</h3>
          <p style={{ fontSize: '13px', opacity: 0.92, marginBottom: '18px', lineHeight: 1.5 }}>Join thousands of students buying and selling safely on campus today.</p>
          <button 
            className="btn" 
            style={{ backgroundColor: '#ffffff', color: 'var(--primary-orange)', width: 'auto', padding: '11px 26px', fontSize: '14px', fontWeight: 800, borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }} 
            onClick={() => { window.location.hash = isLoggedIn ? '#/cart' : '#/register'; }}
          >
            {isLoggedIn ? 'View Cart 🛒' : 'Create Free Account →'}
          </button>
        </div>
      </div>

      {/* App Footer */}
      <footer className="app-footer">
        <span className="app-footer-logo">Scholar<span>Mart</span></span>
        <p className="app-footer-tagline">The trusted campus marketplace for Nigeria students 🎓</p>
        <div className="app-footer-links">
          <button className="app-footer-link" onClick={() => { window.location.hash = '#/terms'; }}>Terms &amp; Conditions</button>
          <span className="app-footer-sep">•</span>
          <button className="app-footer-link" onClick={() => { window.location.hash = '#/privacy'; }}>Privacy Policy</button>
          <span className="app-footer-sep">•</span>
          <button className="app-footer-link" onClick={onOpenSupportModal}>Contact Us</button>
        </div>
        <p className="app-footer-copy">© 2026 ScholarMart. All rights reserved.</p>
      </footer>
    </section>
  );
}
