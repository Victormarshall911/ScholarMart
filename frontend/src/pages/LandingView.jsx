import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import SellerCard from '../components/SellerCard';
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
        <CategoryCard name="Electronics" label="Electronics" iconName="Tv" colorClass="electronics" onSelect={onSelectCategoryFilter} />
        <CategoryCard name="Fashion & Clothing" label="Fashion" iconName="Shirt" colorClass="fashion" onSelect={onSelectCategoryFilter} />
        <CategoryCard name="Books & Academic Materials" label="Books" iconName="BookOpen" colorClass="books" onSelect={onSelectCategoryFilter} />
        <CategoryCard name="Hostel Essentials" label="Hostels" iconName="Home" colorClass="hostels" onSelect={onSelectCategoryFilter} />
        <CategoryCard name="Gadgets" label="Gadgets" iconName="Smartphone" colorClass="gadgets" onSelect={onSelectCategoryFilter} />
        <CategoryCard name="Creative & Handmade" label="Creative" iconName="Palette" colorClass="creative" onSelect={onSelectCategoryFilter} />
        <CategoryCard name="Beauty & Personal Care" label="Beauty" iconName="Sparkles" colorClass="beauty" onSelect={onSelectCategoryFilter} />
        <CategoryCard name="Sports & Fitness" label="Sports" iconName="Dumbbell" colorClass="sports" onSelect={onSelectCategoryFilter} />
        <CategoryCard name="Others" label="Others" iconName="MoreHorizontal" colorClass="others" onSelect={onSelectCategoryFilter} />
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
              <SellerCard key={t.id || idx} seller={t} index={idx} />
            ))
          ) : (
            <>
              <SellerCard 
                seller={{
                  user_name: 'Chinedu O.',
                  campus: 'Igbariam',
                  rating: 5,
                  message: 'Got my engineering textbooks for half the bookstore price. Safe meetup at the faculty gate!'
                }} 
                index={0} 
              />
              <SellerCard 
                seller={{
                  user_name: 'Amaka M.',
                  campus: 'Uli',
                  rating: 5,
                  message: 'Sold my old mattress in 3 hours after posting. WhatsApp link makes connecting so smooth.'
                }} 
                index={1} 
              />
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
