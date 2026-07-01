import React from 'react';
import { ShoppingCart } from 'lucide-react';

function getBadgeInfo(dealsCompleted, averageRating) {
  if (dealsCompleted >= 50 && averageRating >= 4.5) {
    return { emoji: '🏆', label: 'Top Seller' };
  } else if (dealsCompleted >= 10 && averageRating >= 4.0) {
    return { emoji: '⭐', label: 'Trusted by Community' };
  } else if (dealsCompleted >= 3) {
    return { emoji: '🟡', label: 'Active Seller' };
  }
  return { emoji: '🟢', label: 'New on Scholarmart' };
}

export default function ProductCard({ product, onSelect, isSaved, onToggleSave }) {
  const imageUrl = product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80';
  const vendorName = product.vendor_name || product.vendor?.name || 'Student Vendor';
  const campusName = product.campus || product.location || 'Main Campus';
  const dealsCompleted = product.vendor?.deals_completed || 0;
  const avgRating = product.vendor?.average_rating ? Number(product.vendor.average_rating) : 0;
  const badge = getBadgeInfo(dealsCompleted, avgRating);

  return (
    <div className="product-card" onClick={() => onSelect(product)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
      <div className="product-image-container">
        <img src={imageUrl} alt={product.name} className="product-image" loading="lazy" />
        <button 
          className={`cart-icon-btn ${isSaved ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(product);
          }}
          title={isSaved ? 'Remove from Cart' : 'Add to Cart'}
        >
          <ShoppingCart size={14} fill={isSaved ? 'var(--primary-green)' : 'none'} color={isSaved ? 'var(--primary-green)' : 'currentColor'} />
        </button>
      </div>
      <div className="product-card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="product-card-category">{product.category || 'General'}</div>
          <div className="product-card-name">{product.name}</div>
          <div className="product-card-price">₦{Number(product.price).toLocaleString()}</div>
        </div>
        <div style={{ marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{vendorName}</span>
              <span title={badge.label} style={{ fontSize: '10px' }}>{badge.emoji}</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 600, color: avgRating > 0 ? 'var(--primary-orange)' : 'var(--text-muted)' }}>
              {avgRating > 0 ? `★ ${avgRating.toFixed(1)}` : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
