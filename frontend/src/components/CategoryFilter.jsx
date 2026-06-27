import React from 'react';

const CATEGORIES = [
  'All',
  'Textbooks',
  'Electronics',
  'Furniture',
  'Fashion',
  'Appliances',
  'Stationery',
  'Other'
];

export default function CategoryFilter({ selectedCategory, onSelectCategory }) {
  return (
    <div className="categories-wrapper" style={{ padding: '8px 16px', marginBottom: '12px' }}>
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          className={`category-chip ${selectedCategory === (cat === 'All' ? '' : cat) ? 'active' : ''}`}
          onClick={() => onSelectCategory(cat === 'All' ? '' : cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
