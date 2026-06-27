import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, ShieldAlert, LogOut, Package } from 'lucide-react';
import api from '../services/api';

export default function VendorDashboard({ user, onLogout, onOpenSellModal, onSelectProduct }) {
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
      {/* Profile Header */}
      <div className="card" style={{ padding: '20px', borderRadius: '20px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-orange)', textTransform: 'uppercase', letterSpacing: '1px' }}>Verified Campus Vendor</span>
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
          <div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Reputation Score</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success)' }}>⭐ {user.reputation_score || 100} / 100</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Active Listings</div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>{myProducts.length} Items</div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
