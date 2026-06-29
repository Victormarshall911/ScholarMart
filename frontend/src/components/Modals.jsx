import React, { useState } from 'react';
import api from '../services/api';
import Toast from '../services/toast';

export function WelcomeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div id="welcome-modal-overlay" className="modal-overlay active" onClick={onClose}>
      <div className="modal-card welcome-card" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: '36px 26px 32px', borderRadius: '28px', maxWidth: '400px' }}>
        <div style={{ fontSize: '52px', marginBottom: '14px', lineHeight: '1' }}>🎓</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.4px' }}>
          Welcome to Scholar<span style={{ color: 'var(--primary-orange)' }}>Mart</span>
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.65', marginBottom: '26px' }}>
          The trust-based campus marketplace. Connect directly with student buyers and sellers on WhatsApp, check community trust badges, and trade safely.
        </p>
        <button className="btn btn-primary" onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: '16px', fontSize: '15px', fontWeight: 700 }}>
          🚀 Start Exploring
        </button>
      </div>
    </div>
  );
}

export function SupportModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div id="support-modal-overlay" className="modal-overlay active" onClick={onClose} style={{ display: 'flex' }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Campus Support</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '24px', height: '24px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Need help with verification, splits, payouts, or listings? Contact our campus helpdesk.
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a href="https://wa.me/2347014109517?text=Hi%20Scholarmart%20Support%2C%20I%20need%20help%20with..." target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px', marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
              <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.333 4.982L2 22l5.202-1.362a9.92 9.92 0 004.81 1.233h.005c5.505 0 9.99-4.477 9.99-9.982A9.97 9.97 0 0012.012 2zm5.726 14.153c-.25.705-1.464 1.34-2.006 1.425-.49.076-1.126.136-3.277-.75-2.753-1.135-4.506-3.929-4.643-4.113-.136-.183-1.11-1.472-1.11-2.81 0-1.337.697-1.996.947-2.262.25-.267.542-.333.722-.333.18 0 .36 0 .518.008.163.008.38-.063.593.45.22.533.753 1.838.818 1.97.065.13.109.283.022.458-.088.175-.132.283-.263.437-.132.155-.276.346-.395.464-.132.13-.27.272-.116.537.155.263.687 1.132 1.472 1.83.1.089.183.136.27.136.142 0 .237-.066.333-.166.19-.203.498-.58.627-.777.13-.197.26-.164.444-.097.183.066 1.166.55 1.368.653.203.1.337.15.387.234.05.084.05.485-.2.12z"/>
            </svg>
            WhatsApp Support Chat
          </a>
          
          <a href="mailto:support@scholarmart.com" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '18px', height: '18px', marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Email Helpdesk
          </a>
        </div>
      </div>
    </div>
  );
}

export function FilterDrawer({ isOpen, onClose, filters, setFilters, onApply, onReset }) {
  const [showCampusDropdown, setShowCampusDropdown] = useState(false);
  if (!isOpen) return null;

  return (
    <div id="filter-drawer-overlay" className="modal-overlay active" onClick={onClose} style={{ display: 'flex' }}>
      <div className="filter-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="filter-drawer-header">
          <h3 className="filter-drawer-title">Filters</h3>
          <button className="filter-drawer-close" onClick={onClose}>Close</button>
        </div>
        
        <div className="form-group autocomplete-container" style={{ position: 'relative' }}>
          <label className="form-label" htmlFor="filter-campus">Campus Location</label>
          <input 
            type="text" 
            id="filter-campus" 
            className="form-input" 
            placeholder="Type to search campus..." 
            autoComplete="off"
            value={filters?.campus || ''}
            onFocus={() => setShowCampusDropdown(true)}
            onBlur={() => setTimeout(() => setShowCampusDropdown(false), 200)}
            onChange={(e) => { setFilters && setFilters({ ...filters, campus: e.target.value }); setShowCampusDropdown(true); }}
          />
          {showCampusDropdown && (
            <div id="filter-campus-dropdown" className="autocomplete-dropdown" style={{ display: 'block' }}>
              {['Uli', 'Igbariam', 'Awka'].filter(c => c.toLowerCase().includes((filters?.campus || '').toLowerCase().trim())).map((c, idx) => (
                <div key={idx} className="autocomplete-item" onClick={() => { setFilters && setFilters({ ...filters, campus: c }); setShowCampusDropdown(false); }}>{c}</div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="filter-category">Category</label>
          <select 
            id="filter-category" 
            className="form-select"
            value={filters?.category || ''}
            onChange={(e) => setFilters && setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All Categories</option>
            <option value="Textbooks">Textbooks</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion & Clothing">Fashion & Clothing</option>
            <option value="Hostel Essentials">Hostel Essentials</option>
            <option value="Gadgets">Gadgets</option>
            <option value="Creative & Handmade">Creative & Handmade</option>
            <option value="Beauty & Personal Care">Beauty & Personal Care</option>
            <option value="Sports & Fitness">Sports & Fitness</option>
            <option value="Others">Others</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label" htmlFor="filter-min-price">Min Price (₦)</label>
            <input 
              type="number" 
              id="filter-min-price" 
              className="form-input" 
              placeholder="0"
              value={filters?.minPrice || ''}
              onChange={(e) => setFilters && setFilters({ ...filters, minPrice: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label" htmlFor="filter-max-price">Max Price (₦)</label>
            <input 
              type="number" 
              id="filter-max-price" 
              className="form-input" 
              placeholder="Any"
              value={filters?.maxPrice || ''}
              onChange={(e) => setFilters && setFilters({ ...filters, maxPrice: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={() => { onApply && onApply(); onClose(); }}>Apply Filters</button>
          <button className="btn btn-secondary" onClick={() => { onReset && onReset(); onClose(); }}>Reset All</button>
        </div>
      </div>
    </div>
  );
}

export function CreateListingModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('Brand New');
  const [campus, setCampus] = useState('Igbariam');
  const [showCampusDropdown, setShowCampusDropdown] = useState(false);
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('scholarmart_user') || '{}');
        if (storedUser.campus) setCampus(storedUser.campus);
        if (storedUser.whatsapp_number || storedUser.phone) setWhatsapp(storedUser.whatsapp_number || storedUser.phone);
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('price', price);
      formData.append('category', category);
      formData.append('condition', condition);
      formData.append('location', campus);
      formData.append('description', description);
      formData.append('vendor_whatsapp', whatsapp || '08012345678');
      if (file) formData.append('image', file);

      await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      window.dispatchEvent(new Event('productUploaded'));
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish listing. Please make sure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="product-modal-overlay" className="modal-overlay active" onClick={onClose} style={{ display: 'flex' }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="product-modal-title" style={{ fontSize: '18px', fontWeight: 800 }}>Create Listing</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '24px', height: '24px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && <div style={{ color: '#EF4444', fontSize: '13px', marginBottom: '10px', fontWeight: 600 }}>{error}</div>}

        <form id="product-listing-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="prod-name">Product Name</label>
            <input type="text" id="prod-name" className="form-input" placeholder="e.g., Study Desk, Rechargeable Lamp" required value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="prod-price">Price (₦)</label>
            <input type="number" id="prod-price" className="form-input" placeholder="Amount in Naira" required value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="prod-category">Category</label>
            <select id="prod-category" className="form-select" required value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select Category</option>
              <option value="Textbooks">Textbooks</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion & Clothing">Fashion & Clothing</option>
              <option value="Hostel Essentials">Hostel Essentials</option>
              <option value="Gadgets">Gadgets</option>
              <option value="Creative & Handmade">Creative & Handmade</option>
              <option value="Beauty & Personal Care">Beauty & Personal Care</option>
              <option value="Sports & Fitness">Sports & Fitness</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="prod-condition">Condition</label>
            <select id="prod-condition" className="form-select" value={condition} onChange={e => setCondition(e.target.value)}>
              <option value="Brand New">Brand New</option>
              <option value="Used">Used</option>
            </select>
          </div>

          <div className="form-group autocomplete-container" style={{ position: 'relative' }}>
            <label className="form-label" htmlFor="prod-campus">Campus Location</label>
            <input 
              type="text" 
              id="prod-campus" 
              className="form-input" 
              placeholder="Type campus..." 
              autoComplete="off"
              required 
              value={campus} 
              onFocus={() => setShowCampusDropdown(true)}
              onBlur={() => setTimeout(() => setShowCampusDropdown(false), 200)}
              onChange={e => { setCampus(e.target.value); setShowCampusDropdown(true); }} 
            />
            {showCampusDropdown && (
              <div id="prod-campus-dropdown" className="autocomplete-dropdown" style={{ display: 'block' }}>
                {['Uli', 'Igbariam', 'Awka'].filter(c => c.toLowerCase().includes(campus.toLowerCase().trim())).map((c, idx) => (
                  <div key={idx} className="autocomplete-item" onClick={() => { setCampus(c); setShowCampusDropdown(false); }}>{c}</div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prod-whatsapp">WhatsApp Phone Number</label>
            <input type="tel" id="prod-whatsapp" className="form-input" placeholder="e.g. 08012345678" required value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prod-description">Description</label>
            <textarea id="prod-description" className="form-textarea" placeholder="Detail condition, size, power rating, contact details..." value={description} onChange={e => setDescription(e.target.value)}></textarea>
          </div>

          <div className="form-group" id="prod-image-upload-wrapper">
            <label className="form-label" htmlFor="prod-images">Upload Product Photo</label>
            <input type="file" id="prod-images" accept="image/*" style={{ fontSize: '12px', marginTop: '4px' }} onChange={e => setFile(e.target.files[0])} />
            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>Upload crisp images of the actual product.</small>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }} disabled={loading}>
            {loading ? 'Publishing...' : 'Publish Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function TestimonialModal({ isOpen, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/testimonials', { rating, message });
      setMessage('');
      setRating(5);
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Please log in to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="testimonial-modal-overlay" className="modal-overlay active" onClick={onClose} style={{ display: 'flex' }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>Share Your Story 💬</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Your feedback helps students trust ScholarMart</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '24px', height: '24px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && <div style={{ color: '#EF4444', fontSize: '13px', marginBottom: '10px', fontWeight: 600 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Your Rating</label>
            <div id="testimonial-stars" style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <span 
                  key={star} 
                  onClick={() => setRating(star)} 
                  style={{ fontSize: '28px', cursor: 'pointer', color: star <= rating ? '#F59E0B' : '#CBD5E1' }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="testimonial-message">Your Experience</label>
            <textarea 
              id="testimonial-message" 
              className="form-textarea" 
              rows="4"
              placeholder="Tell other students about your ScholarMart experience — what you bought or sold, how the process felt, what made it special..."
              maxLength="500" 
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <span id="testimonial-char-count" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{message.length} / 500</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" id="testimonial-submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Feedback ✨'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function OtpVerificationModal({ isOpen, user, onSuccess, onLogout }) {
  const [otpInput, setOtpInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  if (!isOpen || !user) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length === 0) {
      Toast.show('Please enter a valid 6-digit pin.', 'warning');
      return;
    }
    setVerifying(true);
    try {
      const res = await api.post('/auth/verify-otp', { otp: otpInput.trim(), email: user.email });
      if (res.data?.status === 'success' || res.data?.email_verified) {
        Toast.show('Email verified successfully! ✅', 'success');
        const updatedUser = { ...user, email_verified: true };
        localStorage.setItem('scholarmart_user', JSON.stringify(updatedUser));
        if (onSuccess) onSuccess(updatedUser);
      }
    } catch (err) {
      Toast.show(err.response?.data?.message || 'Invalid or expired OTP.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    Toast.show('Sending verification code...', 'info');
    try {
      const res = await api.post('/auth/send-otp', { email: user?.email });
      Toast.show(res.data?.message || 'Verification code resent to your email.', 'success');
    } catch (err) {
      Toast.show(err.response?.data?.message || 'Failed to resend OTP.', 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, backgroundColor: 'var(--bg-main, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
      <div style={{ backgroundColor: 'var(--surface, #1e293b)', width: '100%', maxWidth: '440px', padding: '40px 32px', textAlign: 'center', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', border: '1px solid var(--border, rgba(255,255,255,0.1))' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>🛡️</div>
        <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>Verify Your Email</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
          We sent a 6-digit verification code to <strong>{user.email}</strong>. Please enter the pin below to activate your ScholarMart account.
        </p>

        <form onSubmit={handleVerify}>
          <input 
            type="text" 
            placeholder="Enter 6-digit pin" 
            maxLength="6"
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value)}
            className="form-input"
            style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '8px', fontWeight: 800, padding: '14px', borderRadius: '12px', marginBottom: '24px', width: '100%' }}
            autoFocus
          />

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 700, borderRadius: '12px', marginBottom: '16px' }} disabled={verifying || !otpInput}>
            {verifying ? 'Verifying...' : 'Verify & Continue 🚀'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <button 
            type="button"
            onClick={handleResend} 
            disabled={resending}
            style={{ background: 'none', border: 'none', color: 'var(--primary-green)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', padding: '4px' }}
          >
            {resending ? 'Resending...' : 'Resend Pin 🔄'}
          </button>

          <button 
            type="button"
            onClick={onLogout} 
            style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', padding: '4px' }}
          >
            Log Out / Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}
