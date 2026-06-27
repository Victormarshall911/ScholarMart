import React, { useState } from 'react';
import { X, Upload, CheckCircle } from 'lucide-react';
import api from '../services/api';

const CATEGORIES = [
  'Textbooks', 'Electronics', 'Furniture', 'Fashion', 'Appliances', 'Stationery', 'Other'
];

export default function SellModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Textbooks');
  const [condition, setCondition] = useState('Used');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Igbariam Campus');
  const [whatsapp, setWhatsapp] = useState('08012345678');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      formData.append('description', description);
      formData.append('location', location);
      formData.append('vendor_whatsapp', whatsapp);
      if (file) {
        formData.append('image', file);
      }

      await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload product. Make sure you are signed in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', borderRadius: '24px', padding: '24px' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          <X size={24} />
        </button>

        <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-green)', marginBottom: '16px' }}>
          Post a New Item for Sale
        </h3>

        {error && <div style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '12px', fontWeight: 600 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Item Title</label>
            <input type="text" className="form-input" required placeholder="e.g., Engineering Engineering Textbook 3rd Ed" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Price (₦)</label>
              <input type="number" className="form-input" required placeholder="5000" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Condition</label>
              <select className="form-select" value={condition} onChange={e => setCondition(e.target.value)}>
                <option value="Used">Used</option>
                <option value="New">Brand New</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Location / Campus</label>
            <input type="text" className="form-input" required value={location} onChange={e => setLocation(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">WhatsApp Number for Buyers</label>
            <input type="tel" className="form-input" required value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="State any flaws, pick-up location details..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Product Photo</label>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center',
              padding: '24px', border: '2px dashed var(--border)', borderRadius: '16px', cursor: 'pointer',
              backgroundColor: 'var(--background)', color: 'var(--text-secondary)'
            }}>
              <Upload size={28} color="var(--primary-green)" style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{file ? file.name : 'Tap to select picture'}</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '16px', fontSize: '15px' }} disabled={loading}>
            {loading ? 'Uploading Listing...' : 'Publish Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
