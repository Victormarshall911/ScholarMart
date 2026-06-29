import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Toast from '../services/toast';

export default function Auth({ onLoginSuccess }) {
  const [mode, setMode] = useState(() => {
    return window.location.hash === '#/register' ? 'register' : 'login';
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dynamic university and campus state from backend
  const [universities, setUniversities] = useState([
    { code: 'COOU', name: 'Chukwuemeka Odumegwu Ojukwu University' }
  ]);
  const [campuses, setCampuses] = useState([
    { university_code: 'COOU', name: 'Uli' },
    { university_code: 'COOU', name: 'Igbariam' },
    { university_code: 'COOU', name: 'Awka' }
  ]);
  const [showCampusDropdown, setShowCampusDropdown] = useState(false);

  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('buyer');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regUniv, setRegUniv] = useState('COOU');
  const [regCampus, setRegCampus] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#/register') setMode('register');
      else if (window.location.hash === '#/login') setMode('login');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    const fetchRegistrationData = async () => {
      try {
        const uRes = await api.get('/auth/universities');
        if (uRes.data && uRes.data.universities && uRes.data.universities.length > 0) {
          setUniversities(uRes.data.universities);
        }
      } catch (err) {
        // Fallback to COOU
      }

      try {
        const cRes = await api.get('/auth/campuses');
        if (cRes.data && cRes.data.campuses && cRes.data.campuses.length > 0) {
          setCampuses(cRes.data.campuses);
        }
      } catch (err) {
        // Fallback to Uli, Igbariam, Awka
      }
    };
    fetchRegistrationData();
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
      if (res.data.token) {
        localStorage.setItem('scholarmart_token', res.data.token);
        localStorage.setItem('scholarmart_user', JSON.stringify(res.data.user || { email: loginEmail }));
        Toast.show('Logged in successfully', 'success');
        onLoginSuccess(res.data.user || { email: loginEmail });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Invalid login credentials';
      setError(msg);
      Toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double-submit
    setError('');

    if (regPassword !== regConfirm) {
      setError('Passwords do not match');
      Toast.show('Passwords do not match', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: regName,
        full_name: regName,
        email: regEmail,
        password: regPassword,
        confirmPassword: regConfirm,
        phone: regPhone,
        role: regRole,
        whatsappNumber: regRole === 'vendor' ? regWhatsapp : regPhone,
        whatsapp_number: regRole === 'vendor' ? regWhatsapp : regPhone,
        university: regUniv,
        campus: regCampus || 'Igbariam'
      });
      if (res.data.token) {
        const newUser = res.data.user || { name: regName, email: regEmail, role: regRole, email_verified: false };
        localStorage.setItem('scholarmart_token', res.data.token);
        localStorage.setItem('scholarmart_user', JSON.stringify(newUser));
        Toast.show(res.data.message || 'Verification pin sent to your email!', 'success');
        onLoginSuccess(newUser);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Registration failed. Email might already exist.';
      setError(msg);
      Toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    Toast.show('Reset pin sent to ' + forgotEmail, 'success');
    setForgotStep(2);
  };

  const handleForgotReset = (e) => {
    e.preventDefault();
    Toast.show('Password reset successfully! Please log in.', 'success');
    setMode('login');
    window.location.hash = '#/login';
  };

  const availableCampuses = campuses.filter(c => c.university_code === regUniv || !regUniv);

  return (
    <section id="auth-view" className="view-container active">
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '12px', fontSize: '13px', fontWeight: 600, marginBottom: '20px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Login Panel */}
      <div id="login-panel" className={`auth-panel ${mode === 'login' ? 'active' : ''}`}>
        <h1 className="view-title">Welcome Back</h1>
        <p className="view-subtitle">Sign in to buy and sell on your campus.</p>

        <form id="login-form" onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Personal Email Address</label>
            <input 
              type="email" 
              id="login-email" 
              className="form-input" 
              placeholder="e.g. student@gmail.com" 
              required 
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="password-wrapper">
              <input 
                type={showLoginPass ? 'text' : 'password'} 
                id="login-password" 
                className="form-input" 
                placeholder="Min. 8 characters" 
                required 
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
              />
              <button type="button" className="password-toggle" onClick={() => setShowLoginPass(!showLoginPass)}>
                {showLoginPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', fontSize: '13px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, cursor: 'pointer' }}>
              <input type="checkbox" id="login-remember" style={{ accentColor: 'var(--primary-green)' }} checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} /> Remember Me
            </label>
            <a href="#/forgot" onClick={(e) => { e.preventDefault(); setMode('forgot'); setError(''); }} style={{ color: 'var(--primary-green)', fontWeight: 700, textDecoration: 'none' }}>
              Forgot Password?
            </a>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          New to Scholarmart? <span style={{ color: 'var(--primary-green)', fontWeight: 700, cursor: 'pointer' }} onClick={() => { setMode('register'); window.location.hash = '#/register'; setError(''); }}>Register Now</span>
        </p>
      </div>

      {/* Register Panel */}
      <div id="register-panel" className={`auth-panel ${mode === 'register' ? 'active' : ''}`}>
        <h1 className="view-title">Join Scholarmart</h1>
        <p className="view-subtitle">Create a student profile to get started.</p>

        <form id="register-form" onSubmit={handleRegisterSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input 
              type="text" 
              id="reg-name" 
              className="form-input" 
              placeholder="e.g., John Doe" 
              required 
              value={regName}
              onChange={e => setRegName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Personal Email Address</label>
            <input 
              type="email" 
              id="reg-email" 
              className="form-input" 
              placeholder="e.g., yourname@gmail.com" 
              required 
              value={regEmail}
              onChange={e => setRegEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-phone">Phone Number</label>
            <input 
              type="tel" 
              id="reg-phone" 
              className="form-input" 
              placeholder="08012345678" 
              required 
              value={regPhone}
              onChange={e => setRegPhone(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-role">I want to:</label>
            <select id="reg-role" className="form-select" value={regRole} onChange={(e) => setRegRole(e.target.value)}>
              <option value="buyer">Buy Products only</option>
              <option value="vendor">Sell Products on Campus</option>
            </select>
          </div>

          {/* Vendor WhatsApp Field */}
          {regRole === 'vendor' && (
            <div id="vendor-whatsapp-fields" style={{ backgroundColor: '#F1F5F9', padding: '14px', borderRadius: '16px', marginBottom: '16px', border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>WHATSAPP INFO</h4>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="reg-whatsapp">WhatsApp Number</label>
                <input 
                  type="tel" 
                  id="reg-whatsapp" 
                  className="form-input" 
                  placeholder="e.g. 08012345678" 
                  value={regWhatsapp}
                  onChange={e => setRegWhatsapp(e.target.value)}
                />
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>This number is required so buyers can contact you on WhatsApp to request your listings.</small>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="reg-univ">University</label>
            <select id="reg-univ" className="form-select" required value={regUniv} onChange={e => { setRegUniv(e.target.value); setRegCampus(''); }}>
              <option value="" disabled>Select your University</option>
              {universities.map(u => (
                <option key={u.code} value={u.code}>{u.name} ({u.code})</option>
              ))}
            </select>
          </div>

          {/* Searchable Autocomplete Campus Input */}
          <div className="form-group autocomplete-container" style={{ position: 'relative' }}>
            <label className="form-label" htmlFor="reg-campus">Campus Name</label>
            <input 
              type="text" 
              id="reg-campus" 
              className="form-input" 
              placeholder="Type to search campus... (e.g. Igbariam)" 
              autoComplete="off" 
              required 
              value={regCampus}
              onFocus={() => setShowCampusDropdown(true)}
              onBlur={() => setTimeout(() => setShowCampusDropdown(false), 200)}
              onChange={e => { setRegCampus(e.target.value); setShowCampusDropdown(true); }}
            />
            {showCampusDropdown && (
              <div id="reg-campus-dropdown" className="autocomplete-dropdown" style={{ display: 'block' }}>
                {(() => {
                  const filtered = availableCampuses.filter(c => c.name.toLowerCase().includes(regCampus.toLowerCase().trim()));
                  if (filtered.length === 0) {
                    return <div className="autocomplete-item" style={{ color: 'var(--text-secondary)' }}>No campuses found</div>;
                  }
                  return filtered.map((c, idx) => (
                    <div 
                      key={idx} 
                      className="autocomplete-item" 
                      onClick={() => { setRegCampus(c.name); setShowCampusDropdown(false); }}
                    >
                      {c.name}
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="password-wrapper">
              <input 
                type={showRegPass ? 'text' : 'password'} 
                id="reg-password" 
                className="form-input" 
                placeholder="Min. 8 characters (letters+numbers)" 
                required 
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
              />
              <button type="button" className="password-toggle" onClick={() => setShowRegPass(!showRegPass)}>
                {showRegPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <div className="password-wrapper">
              <input 
                type={showConfirmPass ? 'text' : 'password'} 
                id="reg-confirm" 
                className="form-input" 
                placeholder="Re-enter password" 
                required 
                value={regConfirm}
                onChange={e => setRegConfirm(e.target.value)}
              />
              <button type="button" className="password-toggle" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                {showConfirmPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="terms-agreement-box">
            <label className="terms-agreement-label" htmlFor="reg-terms-agree">
              <input type="checkbox" id="reg-terms-agree" required />
              <span>I have read and agree to ScholarMart's <a href="#/terms">Terms &amp; Conditions</a> and <a href="#/privacy">Privacy Policy</a>.</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          Already have an account? <span style={{ color: 'var(--primary-green)', fontWeight: 700, cursor: 'pointer' }} onClick={() => { setMode('login'); window.location.hash = '#/login'; setError(''); }}>Sign In</span>
        </p>
      </div>

      {/* Forgot Password Panel */}
      <div id="forgot-panel" className={`auth-panel ${mode === 'forgot' ? 'active' : ''}`}>
        <h1 className="view-title">Reset Password</h1>
        <p className="view-subtitle">Enter your email to receive a 6-digit reset pin.</p>

        {forgotStep === 1 ? (
          <form id="forgot-request-form" onSubmit={handleForgotRequest}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">Personal Email Address</label>
              <input 
                type="email" 
                id="forgot-email" 
                className="form-input" 
                placeholder="e.g. student@gmail.com" 
                required 
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" id="forgot-request-btn">Send Reset Pin</button>
          </form>
        ) : (
          <form id="forgot-reset-form" onSubmit={handleForgotReset} style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-otp">6-Digit Pin</label>
              <input 
                type="text" 
                id="forgot-otp" 
                className="form-input" 
                placeholder="e.g. 123456" 
                maxLength="6" 
                required 
                value={forgotOtp}
                onChange={e => setForgotOtp(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-new-password">New Password</label>
              <div className="password-wrapper">
                <input 
                  type={showForgotPass ? 'text' : 'password'} 
                  id="forgot-new-password" 
                  className="form-input" 
                  placeholder="Min. 8 characters" 
                  required 
                  value={forgotNewPass}
                  onChange={e => setForgotNewPass(e.target.value)}
                />
                <button type="button" className="password-toggle" onClick={() => setShowForgotPass(!showForgotPass)}>
                  {showForgotPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" id="forgot-reset-btn">Reset Password</button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          Remember your password? <span style={{ color: 'var(--primary-green)', fontWeight: 700, cursor: 'pointer' }} onClick={() => { setMode('login'); window.location.hash = '#/login'; setError(''); }}>Sign In</span>
        </p>
      </div>
    </section>
  );
}
