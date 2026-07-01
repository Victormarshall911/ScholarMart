import React from 'react';
import { Star, ShieldCheck } from 'lucide-react';

export default function SellerCard({ seller, index = 0 }) {
  const name = seller.user_name || seller.name || 'Student';
  const campus = seller.campus ? `COOU ${seller.campus}` : 'COOU Campus';
  const rating = seller.rating || 5;
  const message = seller.message || seller.description || 'Verified transaction completed successfully.';
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="seller-card">
      <div className="seller-card-header">
        <div 
          className="seller-card-avatar"
          style={{ 
            background: index % 2 === 0 ? 'var(--primary-green-light)' : 'var(--primary-orange-light)',
            color: index % 2 === 0 ? 'var(--primary-green)' : 'var(--primary-orange)'
          }}
        >
          {initials}
        </div>
        <div className="seller-card-meta">
          <div className="seller-card-name-wrapper">
            <span className="seller-card-name">{name}</span>
            <ShieldCheck size={14} className="verified-badge-icon" />
          </div>
          <span className="seller-card-campus">{campus}</span>
        </div>
      </div>
      
      <div className="seller-card-stars">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={12} 
            fill={i < rating ? 'var(--warning)' : 'none'} 
            color={i < rating ? 'var(--warning)' : 'var(--text-muted)'} 
            strokeWidth={2}
          />
        ))}
      </div>
      
      <p className="seller-card-quote">"{message}"</p>
    </div>
  );
}
