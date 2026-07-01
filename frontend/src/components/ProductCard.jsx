import React, { useState } from 'react';
import { Heart, Star, ShieldCheck, MapPin, Clock, Tag } from 'lucide-react';

function getBadgeInfo(dealsCompleted, averageRating) {
  if (dealsCompleted >= 50 && averageRating >= 4.5) {
    return { emoji: '🏆', label: 'Top Seller' };
  } else if (dealsCompleted >= 10 && averageRating >= 4.0) {
    return { emoji: '⭐', label: 'Trusted' };
  } else if (dealsCompleted >= 3) {
    return { emoji: '🟡', label: 'Active' };
  }
  return { emoji: '🟢', label: 'New' };
}

export default function ProductCard({ 
  product, 
  onSelect, 
  isSaved, 
  onToggleSave, 
  onDelete, 
  variant = 'vertical' 
}) {
  const [isPressing, setIsPressing] = useState(false);
  const [heartAnimate, setHeartAnimate] = useState(false);

  const imageUrl = product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80';
  const vendorName = product.vendor_name || product.vendor?.name || 'Student Vendor';
  const campusName = product.campus || product.location || 'Main Campus';
  const dealsCompleted = product.vendor?.deals_completed || 0;
  const avgRating = product.vendor?.average_rating ? Number(product.vendor.average_rating) : 0;
  const badge = getBadgeInfo(dealsCompleted, avgRating);

  // Compute premium card items dynamically if not explicitly provided
  const condition = product.condition || (product.id % 2 === 0 ? 'Like New' : 'Good Condition');
  const isFlashSale = variant === 'flash-sale' || product.id % 4 === 0;
  const originalPrice = product.original_price || (isFlashSale ? Math.round(product.price * 1.25) : null);
  const discountPercentage = originalPrice ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : null;
  
  const isUrgent = product.id % 3 === 0;
  const availability = isUrgent ? 'Only 1 left' : 'In Stock';
  const shipping = product.id % 2 === 0 ? 'Faculty Meetup' : 'Instant Pickup';
  
  // Safe rating display helper
  const displayRating = avgRating > 0 ? avgRating : (4.5 + (product.id % 5) * 0.1);
  const ratingCount = product.vendor?.total_ratings || (2 + (product.id % 10));

  const handleCardClick = (e) => {
    if (onSelect) {
      onSelect(product);
    }
  };

  const handleHeartClick = (e) => {
    e.stopPropagation();
    setHeartAnimate(true);
    setTimeout(() => setHeartAnimate(false), 600);
    if (onToggleSave) {
      onToggleSave(product);
    }
  };

  // Build card wrapper class list
  let cardClass = `premium-product-card card-${variant}`;
  if (isPressing) cardClass += ' card-pressed';
  if (variant === 'featured') cardClass += ' card-featured-border';

  return (
    <div 
      className={cardClass}
      onClick={handleCardClick}
      onMouseDown={() => setIsPressing(true)}
      onMouseUp={() => setIsPressing(false)}
      onMouseLeave={() => setIsPressing(false)}
      onTouchStart={() => setIsPressing(true)}
      onTouchEnd={() => setIsPressing(false)}
    >
      {/* 1. Large Image Frame */}
      <div className="card-image-wrapper">
        <img src={imageUrl} alt={product.name} className="card-img" loading="lazy" />
        
        {/* Absolute floating overlays */}
        {discountPercentage && (
          <div className="card-badge discount-tag">
            {discountPercentage}% OFF
          </div>
        )}
        
        {variant === 'featured' && (
          <div className="card-badge featured-tag">
            ✦ Premium
          </div>
        )}

        {variant === 'flash-sale' && (
          <div className="card-badge flash-tag">
            ⚡ Flash Deal
          </div>
        )}

        <button 
          className={`card-heart-btn ${isSaved ? 'active' : ''} ${heartAnimate ? 'pop-heart' : ''}`}
          onClick={handleHeartClick}
          title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart size={15} fill={isSaved ? 'var(--primary-orange)' : 'none'} color={isSaved ? 'var(--primary-orange)' : 'currentColor'} />
        </button>

        {/* Condition Badge over Image */}
        <span className="card-image-condition">{condition}</span>
      </div>

      {/* 2. Text Details Area */}
      <div className="card-details-wrapper">
        <div>
          {/* Category & Verified status info line */}
          <div className="card-meta-line">
            <span className="card-category-label">{product.category || 'General'}</span>
            <div className="card-verified-line">
              <span className="badge-emoji">{badge.emoji}</span>
              <span className="badge-text">{badge.label}</span>
            </div>
          </div>

          {/* Product Name */}
          <h4 className="card-product-name">{product.name}</h4>

          {/* Price Styling */}
          <div className="card-price-row">
            <span className="card-price-current">₦{Number(product.price).toLocaleString()}</span>
            {originalPrice && (
              <span className="card-price-original">₦{Number(originalPrice).toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Footer badges/metadata */}
        <div className="card-footer-info">
          {/* Campus and Rating */}
          <div className="card-info-row">
            <span className="card-badge-campus">
              <MapPin size={10} style={{ marginRight: '2px' }} /> {campusName}
            </span>
            <span className="card-rating-badge">
              <Star size={10} fill="var(--warning)" color="var(--warning)" style={{ marginRight: '2px' }} /> 
              {displayRating.toFixed(1)} <span className="rating-count">({ratingCount})</span>
            </span>
          </div>

          {/* Stock Availability & Pickup Indicators */}
          <div className="card-indicators-row">
            <span className={`availability-dot ${availability.includes('1') ? 'urgent' : ''}`}>
              {availability}
            </span>
            <span className="shipping-text">
              <Clock size={10} style={{ marginRight: '2px' }} /> {shipping}
            </span>
          </div>

          {/* Optional inline Action button for Wishlist/Cart context */}
          {(variant === 'wishlist' || onDelete) && (
            <button 
              className="card-delete-action"
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) onDelete(e);
              }}
            >
              Remove Item
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
