import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, ShieldAlert, LogOut, Package } from 'lucide-react';
import api from '../services/api';
import Toast from '../services/toast';

export default function VendorDashboard({ user, onLogout, onOpenSellModal, onSelectProduct }) {
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyProducts();
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
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete listing.');
    }
  };

  if (!user) return null;

  return (
    <div className="view-container active" style={{ padding: '16px' }}>
      {/* Email Verification Card */}
      {user.email_verified === false && (
        <div id="verification-wizard-card" className="card" style={{ padding: '16px', marginBottom: '20px', borderLeft: '4px solid var(--primary-orange)', backgroundColor: 'var(--surface)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
            <ShieldAlert size={18} color="var(--primary-orange)" /> Verify Your Email
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
            A 6-digit verification code was sent to <strong>{user.email}</strong> upon registration. Please verify your email address to enable deal confirmation and badge tracking.
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
              style={{ width: '130px', padding: '8px 12px', fontSize: '13px', marginBottom: 0 }}
            />
            <button 
              className="btn btn-primary" 
              onClick={handleVerifyOtp}
              disabled={verifyingOtp || !otpInput}
              style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
            >
              {verifyingOtp ? 'Verifying...' : 'Verify'}
            </button>
            <button 
              className="btn btn-outline" 
              id="send-otp-btn"
              onClick={handleResendOtp}
              style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
            >
              Resend OTP
            </button>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="card" style={{ padding: '20px', borderRadius: '20px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: user.role === 'vendor' ? 'var(--primary-orange)' : 'var(--primary-green)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {user.role === 'vendor' ? 'Verified Campus Vendor' : 'Student Buyer Profile'}
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0' }}>{user.full_name || user.name || user.email?.split('@')[0]}</h2>
            <p style={{ fontSize: '13px', opacity: 0.8 }}>{user.email}</p>
          </div>
          <button 
            onClick={onLogout}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#EF4444', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {user.role === 'vendor' ? (
            <>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>Reputation Score</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success)' }}>⭐ {user.reputation_score || 100} / 100</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>Active Listings</div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{myProducts.length} Items</div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>Campus Location</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-green)' }}>🎓 {user.campus || 'COOU Campus'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>Account Role</div>
                <div style={{ fontSize: '16px', fontWeight: 800 }}>Student Buyer</div>
              </div>
            </>
          )}
        </div>
      </div>

      {user.role === 'vendor' ? (
        <>
          {/* Post New Item Button */}
          <button 
            className="btn btn-primary" 
            onClick={onOpenSellModal}
            style={{ padding: '16px', borderRadius: '16px', marginBottom: '24px', fontSize: '15px' }}
          >
            <PlusCircle size={20} /> Post New Item for Sale
          </button>

          {/* My Listings */}
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} color="var(--primary-green)" /> My Active Listings
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading your inventory...</div>
          ) : myProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>No active listings</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Click the button above to publish your first product!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myProducts.map(p => (
                <div 
                  key={p.id} 
                  className="card card-clickable" 
                  onClick={() => onSelectProduct(p)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: 0 }}
                >
                  <img 
                    src={p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'} 
                    alt={p.name} 
                    style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-orange)', textTransform: 'uppercase' }}>{p.category}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-green)' }}>₦{Number(p.price).toLocaleString()}</div>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, p.id)}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--danger)', padding: '10px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0 }}
                    title="Delete Listing"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ marginTop: '24px' }}>
          <div className="card" style={{ padding: '28px 20px', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '42px', marginBottom: '12px' }}>🛍️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Ready to explore items?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              Browse verified student listings for textbooks, hostel gadgets, fashion, and more across all COOU campuses.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => { window.location.hash = '#/marketplace'; }}
                style={{ width: 'auto', padding: '12px 24px', borderRadius: '14px', fontSize: '14px' }}
              >
                Explore Marketplace →
              </button>
              <button 
                className="btn btn-outline" 
                onClick={() => { window.location.hash = '#/cart'; }}
                style={{ width: 'auto', padding: '12px 24px', borderRadius: '14px', fontSize: '14px' }}
              >
                🛒 Saved Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
