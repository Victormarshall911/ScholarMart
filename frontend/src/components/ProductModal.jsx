import React from 'react';
import { X, MessageCircle, ShieldCheck, MapPin, Tag } from 'lucide-react';

export default function ProductModal({ product, onClose, user }) {
  if (!product) return null;

  const imageUrl = product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80';
  const whatsappNumber = product.vendor_whatsapp || product.vendor?.whatsapp || '2348000000000';
  const message = encodeURIComponent(`Hi, I'm interested in buying "${product.name}" listed on ScholarMart for ₦${Number(product.price).toLocaleString()}. Is it still available?`);
  const whatsappLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'var(--surface)', width: '100%', maxWidth: '480px',
        maxHeight: '90vh', borderTopLeftRadius: '28px', borderTopRightRadius: '28px',
        overflowY: 'auto', padding: '24px', position: 'relative',
        animation: 'slideUpFade 0.3s ease-out'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px', zIndex: 10,
            background: 'var(--background)', border: 'none', borderRadius: '50%',
            width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-primary)'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', backgroundColor: 'var(--background)' }}>
          <img src={imageUrl} alt={product.name} style={{ width: '100%', maxHeight: '320px', objectFit: 'cover' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-orange)', textTransform: 'uppercase' }}>
            {product.category || 'General'}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>
            {product.condition || 'Used'}
          </span>
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.2 }}>
          {product.name}
        </h2>

        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-green)', marginBottom: '16px' }}>
          ₦{Number(product.price).toLocaleString()}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={16} /> {product.location || 'Campus Wide'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Tag size={16} /> Vendor ID: #{product.vendor_id || 'Verified'}
          </span>
        </div>

        <div style={{ backgroundColor: 'var(--background)', padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Description</h4>
          <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {product.description || 'No detailed description provided by the vendor.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--primary-green-light)', padding: '12px 16px', borderRadius: '16px', marginBottom: '24px' }}>
          <ShieldCheck color="var(--primary-green)" size={24} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-green)' }}>
            ScholarMart Safety: Meet on campus in well-lit public areas before inspecting or transferring payment.
          </span>
        </div>

        <a 
          href={whatsappLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ textDecoration: 'none', fontSize: '16px', padding: '16px' }}
        >
          <MessageCircle size={20} /> Chat Vendor on WhatsApp
        </a>
      </div>
    </div>
  );
}
