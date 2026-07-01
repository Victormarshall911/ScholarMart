import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, ShieldAlert, LogOut, Package, Award, Activity, TrendingUp } from 'lucide-react';
import api from '../services/api';
import Toast from '../services/toast';
import ProductCard from '../components/ProductCard';

export default function VendorDashboard({ user, onLogout, onOpenSellModal, onSelectProduct }) {
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyProducts();
      const handleUpload = () => fetchMyProducts();
      window.addEventListener('productUploaded', handleUpload);
      return () => window.removeEventListener('productUploaded', handleUpload);
    }
  }, [user]);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/vendor/me?_cb=' + Date.now());
      if (res.data && res.data.data) {
        setMyProducts(res.data.data);
      } else if (Array.isArray(res.data)) {
        setMyProducts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch vendor products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    Toast.show('Sending verification code...', 'info');
    try {
      const res = await api.post('/auth/send-otp');
      Toast.show(res.data?.message || 'Verification code resent to your email.', 'success');
    } catch (err) {
      Toast.show(err.response?.data?.message || 'Failed to resend OTP.', 'error');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput || otpInput.trim().length === 0) {
      Toast.show('Please enter a valid 6-digit pin.', 'warning');
      return;
    }
    setVerifyingOtp(true);
    try {
      const res = await api.post('/auth/verify-otp', { otp: otpInput.trim(), email: user.email });
      if (res.data?.status === 'success' || res.data?.email_verified) {
        Toast.show('Email verified successfully! ✅', 'success');
        const updatedUser = { ...user, email_verified: true };
        localStorage.setItem('scholarmart_user', JSON.stringify(updatedUser));
        window.location.reload();
      }
    } catch (err) {
      Toast.show(err.response?.data?.message || 'Invalid or expired OTP.', 'error');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleDelete = async (e, productId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      await api.delete(`/products/${productId}`);
      setMyProducts(myProducts.filter(p => p.id !== productId));
      Toast.show('Listing deleted successfully', 'success');
    } catch (err) {
      Toast.show(err.response?.data?.message || 'Failed to delete listing.', 'error');
    }
  };

  if (!user) return null;

  // Calculate Vendor Trust Metrics
  const dealsCount = user.deals_completed || 0;
  const ratingScore = (user.total_ratings || 0) > 0 ? Math.round((parseFloat(user.average_rating || 0) / 5) * 100) : 0;
  
  let sellerLevel = "New Seller 🟢";
  let ratingLabel = "Active Profile";
  if (dealsCount >= 50 && ratingScore >= 90) {
    sellerLevel = "Top Seller 🏆";
    ratingLabel = "Elite Campus Merchant";
  } else if (dealsCount >= 10 && ratingScore >= 80) {
    sellerLevel = "Trusted Seller ⭐";
    ratingLabel = "Highly Rated";
  } else if (dealsCount >= 3) {
    sellerLevel = "Active Seller 🟡";
    ratingLabel = "Verified Trades";
  }

  return (
    <div className="view-container active" style={{ padding: '20px' }}>
      {/* Email Verification Card */}
      {user.email_verified === false && (
        <div 
          id="verification-wizard-card" 
          className="card" 
          style={{ 
            padding: '20px', 
            marginBottom: '24px', 
            borderLeft: '4px solid var(--primary-orange)', 
            backgroundColor: 'var(--surface)',
            boxShadow: 'var(--shadow-md)',
            borderRadius: '16px'
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <ShieldAlert size={18} color="var(--primary-orange)" /> Verify Your Student Email
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
            A 6-digit verification code was sent to <strong>{user.email}</strong>. Please enter the OTP to enable deal verification, reviews, and rise in seller ranks.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input 
              type="text" 
              id="otp-code-input"
              placeholder="6-digit OTP" 
              maxLength="6"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              className="form-input"
              style={{ width: '130px', padding: '10px 14px', fontSize: '13px', marginBottom: 0 }}
            />
            <button 
              className="btn btn-primary" 
              onClick={handleVerifyOtp}
              disabled={verifyingOtp || !otpInput}
              style={{ width: 'auto', padding: '10px 20px', fontSize: '13px', borderRadius: '12px' }}
            >
              {verifyingOtp ? 'Verifying...' : 'Verify'}
            </button>
            <button 
              className="btn btn-secondary" 
              id="send-otp-btn"
              onClick={handleResendOtp}
              style={{ width: 'auto', padding: '10px 20px', fontSize: '13px', borderRadius: '12px' }}
            >
              Resend OTP
            </button>
          </div>
        </div>
      )}

      <div 
        className="card" 
        style={{ 
          padding: '24px', 
          borderRadius: '24px', 
          background: 'var(--gradient-dark-header)', 
          color: 'white',
          border: '1px solid var(--border-white-light)',
          boxShadow: 'var(--shadow-lg)',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--primary-orange)', textTransform: 'uppercase', letterSpacing: '1.5px', background: 'var(--primary-orange-light)', padding: '4px 10px', borderRadius: '20px' }}>
              {user.role === 'vendor' ? 'Verified Campus Seller' : 'Student Buyer'}
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '12px 0 4px', letterSpacing: '-0.5px' }}>
              {user.full_name || user.name || user.email?.split('@')[0]}
            </h2>
            <p style={{ fontSize: '13px', opacity: 0.72 }}>🎓 {user.campus || 'COOU Campus'} ({user.email})</p>
          </div>
          <button 
            onClick={onLogout}
            style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)', padding: '10px', borderRadius: '14px', cursor: 'pointer', transition: 'all var(--transition-fast)' }}
            title="Sign Out"
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Reputation Analytics Rows */}
        {user.role === 'vendor' && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-white-medium)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-white-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Award size={12} /> Level</div>
                <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '4px', color: 'var(--primary-orange)' }}>{sellerLevel}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-white-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={12} /> Trust Score</div>
                <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '4px', color: 'var(--primary-green)' }}>{ratingScore}%</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-white-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={12} /> Deals Done</div>
                <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '4px' }}>{dealsCount} trades</div>
              </div>
            </div>

            {/* Custom linear trust meter */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-white-muted)', marginBottom: '6px' }}>
                <span>Reputation Track</span>
                <span>{ratingScore} / 100 XP</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-white-light)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${ratingScore}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary-orange) 0%, var(--primary-green) 100%)', borderRadius: '3px' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {user.role === 'vendor' ? (
        <>
          {/* Post New Item Button */}
          <button 
            className="btn btn-primary" 
            onClick={onOpenSellModal}
            style={{ 
              padding: '16px', 
              borderRadius: '16px', 
              marginBottom: '32px', 
              fontSize: '15px',
              boxShadow: 'var(--shadow-green)'
            }}
          >
            <PlusCircle size={20} /> Publish New Listing
          </button>

          {/* My Listings header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={20} color="var(--primary-green)" /> Campus Inventory
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--surface-hover)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border)' }}>
              {myProducts.length} active
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
              <div className="toast-spinner" style={{ margin: '0 auto 12px', borderTopColor: 'var(--primary-green)' }}></div>
              Fetching active listings...
            </div>
          ) : myProducts.length === 0 ? (
            <div 
              style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                backgroundColor: 'var(--surface)', 
                borderRadius: '20px', 
                border: '1px dashed var(--border)'
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📦</div>
              <p style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '15px' }}>No items listed yet</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>List your textbooks, mattress, or gadgets to reach students nearby.</p>
              <button className="btn btn-secondary btn-sm" style={{ width: 'auto' }} onClick={onOpenSellModal}>Create First Listing</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myProducts.map(p => (
                <ProductCard 
                  key={p.id}
                  product={p}
                  variant="horizontal"
                  onSelect={onSelectProduct}
                  onDelete={(e) => handleDelete(e, p.id)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ marginTop: '24px' }}>
          <div className="card" style={{ padding: '32px 24px', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>🛍️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.3px' }}>Explore student listings</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 24px', lineHeight: 1.55 }}>
              Browse verified student items for sale including textbooks, laptops, hostel mattress, and fashion gears.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => { window.location.hash = '#/marketplace'; }}
                style={{ width: 'auto', padding: '12px 24px', borderRadius: '14px', fontSize: '14px' }}
              >
                Open Marketplace →
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => { window.location.hash = '#/cart'; }}
                style={{ width: 'auto', padding: '12px 24px', borderRadius: '14px', fontSize: '14px' }}
              >
                Saved Wishlist 🤍
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
