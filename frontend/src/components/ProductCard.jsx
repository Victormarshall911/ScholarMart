import React from 'react';
import { Bookmark, MapPin } from 'lucide-react';

export default function ProductCard({ product, onSelect, isSaved, onToggleSave }) {
  const imageUrl = product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80';

  return (
    <div className="product-card" onClick={() => onSelect(product)}>
      <div className="product-image-container">
        <img src={imageUrl} alt={product.name} className="product-image" loading="lazy" />
        <button 
          className={`cart-icon-btn ${isSaved ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(product);
          }}
        >
          <Bookmark size={18} fill={isSaved ? 'var(--primary-green)' : 'none'} />
        </button>
      </div>
      <div className="product-card-body">
        <div className="product-card-category">{product.category || 'General'}</div>
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-price">₦{Number(product.price).toLocaleString()}</div>
        <div className="product-card-footer">
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-secondary)' }}>
            <MapPin size={12} /> {product.location || 'Campus'}
          </span>
          <span style={{ color: product.condition === 'New' ? 'var(--success)' : 'var(--primary-orange)', fontWeight: 700 }}>
            {product.condition || 'Used'}
          </span>
        </div>
      </div>
    </div>
  );
}
