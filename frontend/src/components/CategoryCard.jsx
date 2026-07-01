import React from 'react';
import * as Icons from 'lucide-react';

export default function CategoryCard({ name, label, iconName, colorClass, onSelect }) {
  const IconComponent = Icons[iconName] || Icons.HelpCircle;

  return (
    <div 
      className="category-card" 
      onClick={() => onSelect(name)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(name);
        }
      }}
    >
      <div className={`category-card-icon-box ${colorClass}`}>
        <IconComponent size={22} strokeWidth={2} />
      </div>
      <span className="category-card-label">{label}</span>
    </div>
  );
}
