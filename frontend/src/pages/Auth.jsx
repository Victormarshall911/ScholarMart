import React, { useState } from 'react';
import api from '../services/api';

export default function Auth({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('Chukwuemeka Odumegwu Ojukwu University (COOU)');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.post('/auth/register', {
          full_name: name,
          email,
          password,
          phone,
          university,
          role: 'vendor' // default vendor capability
        });
        if (res.data.token) {
          localStorage.setItem('scholarmart_token', res.data.token);
          localStorage.setItem('scholarmart_user', JSON.stringify(res.data.user || { name, email }));
          onLoginSuccess(res.data.user || { name, email });
        }
      } else {
        const res = await api.post('/auth/login', { email, password });
        if (res.data.token) {
          localStorage.setItem('scholarmart_token', res.data.token);
          localStorage.setItem('scholarmart_user', JSON.stringify(res.data.user || { email }));
          onLoginSuccess(res.data.user || { email });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-container active" style={{ padding: '24px 16px' }}>
      <div className="card" style={{ padding: '28px 20px', borderRadius: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, textAlign: 'center', marginBottom: '6px', color: 'var(--primary-green)' }}>
          {isRegister ? 'Create Vendor Account' : 'Welcome Back'}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px' }}>
          {isRegister ? 'Join campus verified buyers and sellers' : 'Sign in to access your dashboard and saved items'}
        </p>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '12px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" required placeholder="Victor Marshall" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp Number</label>
                <input type="tel" className="form-input" required placeholder="08012345678" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Campus Email</label>
            <input type="email" className="form-input" required placeholder="student@coou.edu.ng" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '12px', padding: '16px' }} disabled={loading}>
            {loading ? 'Processing...' : isRegister ? 'Create Account & Start Selling' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', fontWeight: 600 }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          </span>
          <a href="#" onClick={(e) => { e.preventDefault(); setIsRegister(!isRegister); setError(''); }} style={{ color: 'var(--primary-green)', textDecoration: 'none' }}>
            {isRegister ? 'Sign In' : 'Register Now'}
          </a>
        </div>
      </div>
    </div>
  );
}
