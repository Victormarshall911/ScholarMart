import React from 'react';
import { Heart } from 'lucide-react';

function getBadgeInfo(dealsCompleted, averageRating) {
  if (dealsCompleted >= 50 && averageRating >= 4.5) {
    return { emoji: '🏆', label: 'Top Seller' };
  } else if (dealsCompleted >= 10 && averageRating >= 4.0) {
    return { emoji: '⭐', label: 'Trusted by Community' };
  } else if (dealsCompleted >= 3) {
    return { emoji: '🟡', label: 'Active Seller' };
  }
  return { emoji: '🟢', label: 'New on ScholarMart' };
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
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'var(--surface)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isSaved ? 'var(--primary-orange)' : 'var(--text-muted)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart size={16} fill={isSaved ? 'var(--primary-orange)' : 'none'} color={isSaved ? 'var(--primary-orange)' : 'currentColor'} />
        </button>
      </div>
      <div className="product-card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="product-card-category" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-orange)', letterSpacing: '0.05em' }}>{product.category || 'General'}</div>
          <div className="product-card-name" style={{ fontSize: '13px', fontWeight: 700, margin: '4px 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '36px' }}>{product.name}</div>
          <div className="product-card-price" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-green)' }}>₦{Number(product.price).toLocaleString()}</div>
        </div>
        <div style={{ marginTop: '10px' }}>
          <div className="product-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{vendorName}</span>
              <span title={badge.label} style={{ fontSize: '12px' }}>{badge.emoji}</span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>📍 {campusName}</span>
          </div>
          <div style={{ fontSize: '11px', color: avgRating > 0 ? 'var(--primary-orange)' : 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
            {avgRating > 0 ? `★ ${avgRating.toFixed(1)} (${product.vendor?.total_ratings || 1})` : 'No ratings yet'}
          </div>
        </div>
      </div>
    </div>
  );
}
