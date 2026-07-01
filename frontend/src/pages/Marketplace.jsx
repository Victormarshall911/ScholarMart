import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import CategoryFilter from '../components/CategoryFilter';

export default function Marketplace({ onSelectProduct, savedIds, onToggleSave, searchQuery, selectedCategory, setSelectedCategory, filters, setFilters }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    const handleUpload = () => fetchProducts();
    window.addEventListener('productUploaded', handleUpload);
    return () => window.removeEventListener('productUploaded', handleUpload);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products?_cb=' + Date.now());
      if (res.data && (res.data.data || res.data.products)) {
        setProducts(res.data.data || res.data.products);
      } else if (Array.isArray(res.data)) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = !q || p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    
    const cat = selectedCategory || filters?.category || '';
    const matchesCategory = !cat || p.category?.toLowerCase() === cat.toLowerCase();

    const min = parseFloat(filters?.minPrice || 0);
    const max = parseFloat(filters?.maxPrice || Infinity);
    const price = parseFloat(p.price || 0);
    const matchesPrice = (isNaN(min) || price >= min) && (isNaN(max) || price <= max);

    const camp = filters?.campus?.toLowerCase() || '';
    const matchesCampus = !camp || p.location?.toLowerCase().includes(camp) || p.campus?.toLowerCase().includes(camp);

    return matchesSearch && matchesCategory && matchesPrice && matchesCampus;
  });

  const hasActiveFilters = Boolean(selectedCategory || searchQuery || filters?.category || filters?.campus || filters?.minPrice || filters?.maxPrice);

  const clearAllFilters = () => {
    if (setSelectedCategory) setSelectedCategory('');
    if (setFilters) setFilters({});
  };

  return (
    <section id="marketplace-view" className="view-container active">
      <h1 className="view-title">Marketplace</h1>
      <p className="view-subtitle">Browse campus deals near you.</p>

      <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
        <span id="results-count">{filteredProducts.length} items found</span>
        <span 
          id="active-filters-tag" 
          style={{ fontWeight: 700, color: 'var(--primary-green)', cursor: 'pointer', display: hasActiveFilters ? 'inline' : 'none', padding: '3px 10px', background: 'var(--primary-green-light)', borderRadius: '999px' }}
          onClick={clearAllFilters}
        >
          ✕ Clear filters
        </span>
      </div>

      {loading ? (
        <div className="products-grid" id="marketplace-products-skeleton">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="premium-product-card card-vertical" style={{ pointerEvents: 'none', border: '1px solid var(--border)' }}>
              <div className="card-image-wrapper shimmer" style={{ aspectRatio: '4 / 3.4' }}></div>
              <div className="card-details-wrapper" style={{ padding: '10px 12px 12px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div className="shimmer" style={{ height: '10px', width: '35%', borderRadius: '4px' }}></div>
                  <div className="shimmer" style={{ height: '12px', width: '25%', borderRadius: '4px' }}></div>
                </div>
                <div className="shimmer" style={{ height: '14px', width: '85%', borderRadius: '4px', marginBottom: '8px' }}></div>
                <div className="shimmer" style={{ height: '16px', width: '45%', borderRadius: '4px', marginBottom: '12px' }}></div>
                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '8px', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div className="shimmer" style={{ height: '10px', width: '40%', borderRadius: '4px' }}></div>
                    <div className="shimmer" style={{ height: '10px', width: '30%', borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="shimmer" style={{ height: '8px', width: '35%', borderRadius: '4px' }}></div>
                    <div className="shimmer" style={{ height: '8px', width: '45%', borderRadius: '4px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>No items found</p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="products-grid" id="marketplace-products">
          {filteredProducts.map(p => (
            <ProductCard 
              key={p.id} 
              product={p} 
              onSelect={onSelectProduct}
              isSaved={savedIds?.includes(p.id)}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      )}
    </section>
  );
}
