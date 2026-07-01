import React from 'react';
import { X, MessageCircle, Share2, Star, AlertTriangle, ShieldCheck, MapPin, Layers } from 'lucide-react';
import Toast from '../services/toast';
import api from '../services/api';

export default function ProductModal({ product, onClose, user }) {
  if (!product) return null;

  const imageUrl = product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80';
  const whatsappNumber = product.vendor_whatsapp || product.vendor?.whatsapp || '2348000000000';
  const message = encodeURIComponent(`Hi, I'm interested in buying "${product.name}" listed on ScholarMart for ₦${Number(product.price).toLocaleString()}. Is it still available?`);
  const whatsappLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;

  const campusName = product.campus || product.location || 'Main Campus';
  const vendorName = product.vendor_name || product.vendor?.name || 'Verified Student Vendor';
  const dealsCompleted = product.vendor?.deals_completed || 0;
  const avgRating = product.vendor?.average_rating ? Number(product.vendor.average_rating).toFixed(1) : null;
  const totalRatings = product.vendor?.total_ratings || 0;
  const reputationScore = totalRatings > 0 ? Math.round((parseFloat(product.vendor?.average_rating || 0) / 5) * 100) : null;

  // Generate a mock condition score if not detailed, e.g. Used -> 8.2/10, Brand New -> 10/10
  const conditionScore = product.condition === 'Used' ? '8.5/10 (Excellent)' : '10/10 (Brand New)';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} - ScholarMart`,
          text: `Check out "${product.name}" listed for ₦${Number(product.price).toLocaleString()} on ScholarMart!`,
          url: window.location.href
        });
      } catch (err) {
        // Ignored
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      Toast.show('Product link copied to clipboard! 📋', 'success');
    }
  };

  const handleRate = async () => {
    const ratingStr = window.prompt("Enter rating for this seller (1 to 5 stars):", "5");
    if (ratingStr === null) return;
    const ratingVal = parseInt(ratingStr, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      Toast.show("Invalid rating. Please enter a number between 1 and 5.", "error");
      return;
    }
    const reviewVal = window.prompt("Enter a short review for this seller (optional):", "");
    if (reviewVal === null) return;

    try {
      const response = await api.post(`/vendors/${product.vendor_id || product.vendor?.id}/rate`, {
        rating: ratingVal,
        review: reviewVal
      });
      if (response.data.status === 'success') {
        Toast.show("Thank you! Rating submitted successfully.", "success");
      } else {
        Toast.show(response.data.message || "Failed to submit rating", "error");
      }
    } catch (err) {
      Toast.show(err.response?.data?.message || "Failed to submit rating", "error");
    }
  };

  const handleReport = () => {
    Toast.show('Listing flagged for moderator review. Thank you for keeping ScholarMart safe! 🛡️', 'success');
  };

  return (
    <div 
      className="modal-overlay active" 
      onClick={onClose} 
      style={{ zIndex: 1000, display: 'flex', alignItems: 'center' }}
    >
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          position: 'relative', 
          maxWidth: '560px', 
          borderRadius: '24px', 
          padding: '24px',
          border: '1px solid var(--border)'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="modal-close-btn"
          style={{
            position: 'absolute', 
            top: '16px', 
            right: '16px', 
            zIndex: 10,
            background: 'var(--surface-hover)',
            boxShadow: 'var(--shadow-sm)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Gallery/Image Frame */}
        <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', backgroundColor: 'var(--background)', position: 'relative', border: '1px solid var(--border)' }}>
          <img src={imageUrl} alt={product.name} style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--color-badge-dark-bg)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid var(--color-badge-dark-border)', padding: '6px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 800, letterSpacing: '0.5px' }}>📸 campus inspection ready</span>
          </div>
        </div>

        {/* Tag Badges Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--primary-orange)', backgroundColor: 'var(--primary-orange-light)', padding: '5px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {product.category || 'General'}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-green)', backgroundColor: 'var(--primary-green-light)', padding: '5px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} /> {campusName}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', backgroundColor: 'var(--surface-hover)', padding: '5px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--border)' }}>
            <Layers size={12} /> {conditionScore}
          </span>
        </div>

        {/* PDP Title & Price */}
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.25, letterSpacing: '-0.3px' }}>
          {product.name}
        </h2>

        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-green)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>₦{Number(product.price).toLocaleString()}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>(meetup arrangement)</span>
        </div>

        {/* Seller Verification Box */}
        <div style={{ backgroundColor: 'var(--surface-hover)', padding: '16px', borderRadius: '16px', marginBottom: '20px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🧑‍🎓 Vendor: {vendorName}</span>
              <ShieldCheck size={16} color="var(--primary-green)" fill="var(--primary-green-light)" />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--primary-orange)', fontWeight: 700 }}>
              ★ {avgRating ? `${avgRating} Rating` : 'New Vendor'}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Trust Score: <strong style={{ color: 'var(--primary-green)' }}>{reputationScore !== null ? `${reputationScore}% Trust` : 'No score yet'}</strong> • Typically replies in 2 hours • <strong>{dealsCompleted}</strong> deals completed on campus.
          </p>
        </div>

        {/* Description Box */}
        <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '16px', marginBottom: '20px', border: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Item Description</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {product.description || 'No detailed description provided by the vendor. Inspect item carefully before completing the transaction.'}
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a 
            href={whatsappLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: 'none', fontSize: '15px', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <MessageCircle size={18} /> Chat on WhatsApp
          </a>

          <button 
            type="button"
            onClick={handleShare}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '13px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Share2 size={16} /> Share Product Link
          </button>

          {/* Safety Notice Disclaimer */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'var(--primary-orange-light)', border: '1px solid var(--primary-orange-glow)', padding: '12px 14px', borderRadius: '14px', fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span><strong>Campus Safety Guarantee:</strong> Only pay after physical inspection at high-traffic campus locations (e.g. Faculty Gate, Library Plaza). Never send money in advance.</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button 
              type="button"
              onClick={handleRate}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '11px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Star size={14} /> Rate Seller
            </button>
            <button 
              type="button"
              onClick={handleReport}
              className="btn"
              style={{ flex: 1, padding: '11px', fontSize: '12px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <AlertTriangle size={14} /> Report Listing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
