import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import CategoryFilter from '../components/CategoryFilter';

export default function Marketplace({ onSelectProduct, savedIds, onToggleSave }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      if (res.data && res.data.data) {
        setProducts(res.data.data);
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
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || p.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="view-container active">
      {/* Hero Card */}
      <div className="hero-card">
        <div className="hero-title">Buy & Sell on Campus</div>
        <div className="hero-sub">Secure textbook, gadget, and dorm essentials marketplace.</div>
      </div>

      {/* Search Input */}
      <div className="search-container">
        <Search className="search-icon" size={18} />
        <input 
          type="text"
          className="search-input"
          placeholder="Search textbooks, iPhones, mattresses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Filter */}
      <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

      {/* Products Grid */}
      <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
        {selectedCategory ? `${selectedCategory} Listings` : 'Latest Listings'} ({filteredProducts.length})
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Loading marketplace deals...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>No items found</p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Try searching a different keyword or switching categories.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(p => (
            <ProductCard 
              key={p.id} 
              product={p} 
              onSelect={onSelectProduct}
              isSaved={savedIds.includes(p.id)}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
