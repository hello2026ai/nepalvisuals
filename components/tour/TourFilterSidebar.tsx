import React from 'react';
import { TourFilterOptions } from '../../lib/services/tourService';
import RegionSelect from '../common/RegionSelect';

interface TourFilterSidebarProps {
  filters: TourFilterOptions;
  onFilterChange: (newFilters: TourFilterOptions) => void;
  className?: string;
}

const DIFFICULTIES = ['Easy', 'Moderate', 'Difficult', 'Strenuous'];

export const TourFilterSidebar: React.FC<TourFilterSidebarProps> = ({
  filters,
  onFilterChange,
  className = '',
}) => {
  const handleChange = (key: keyof TourFilterOptions, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const handleRangeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'minPrice' | 'maxPrice' | 'minDuration' | 'maxDuration'
  ) => {
    const val = e.target.value ? Number(e.target.value) : undefined;
    handleChange(field, val);
  };

  return (
    <aside className={`space-y-6 p-4 bg-admin-surface border border-admin-border rounded-xl ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-admin-text-primary mb-4">Filters</h3>
        
        {/* Search */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-admin-text-secondary mb-1">Search</label>
          <input
            type="text"
            placeholder="Search tours..."
            className="w-full px-3 py-2 bg-white border border-admin-border rounded-lg text-sm text-admin-text-primary focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400"
            value={filters.searchTerm || ''}
            onChange={(e) => handleChange('searchTerm', e.target.value)}
          />
        </div>

        {/* Sort By */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-admin-text-secondary mb-1">Sort By</label>
          <select
            className="w-full px-3 py-2 bg-white border border-admin-border rounded-lg text-sm text-admin-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
            value={filters.sortBy || 'newest'}
            onChange={(e) => handleChange('sortBy', e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="duration_asc">Duration: Short to Long</option>
            <option value="duration_desc">Duration: Long to Short</option>
          </select>
        </div>

        {/* Region */}
        <div className="mb-4">
          <RegionSelect
            value={filters.region}
            onChange={(val) => handleChange('region', val)}
            label="Region"
          />
        </div>

        {/* Price Range */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-admin-text-secondary mb-1">Price ($)</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              className="w-1/2 px-3 py-2 bg-white border border-admin-border rounded-lg text-sm text-admin-text-primary placeholder-gray-400"
              value={filters.minPrice || ''}
              onChange={(e) => handleRangeChange(e, 'minPrice')}
            />
            <input
              type="number"
              placeholder="Max"
              className="w-1/2 px-3 py-2 bg-white border border-admin-border rounded-lg text-sm text-admin-text-primary placeholder-gray-400"
              value={filters.maxPrice || ''}
              onChange={(e) => handleRangeChange(e, 'maxPrice')}
            />
          </div>
        </div>

        {/* Duration Range */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-admin-text-secondary mb-1">Duration (Days)</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              className="w-1/2 px-3 py-2 bg-white border border-admin-border rounded-lg text-sm text-admin-text-primary placeholder-gray-400"
              value={filters.minDuration || ''}
              onChange={(e) => handleRangeChange(e, 'minDuration')}
            />
            <input
              type="number"
              placeholder="Max"
              className="w-1/2 px-3 py-2 bg-white border border-admin-border rounded-lg text-sm text-admin-text-primary placeholder-gray-400"
              value={filters.maxDuration || ''}
              onChange={(e) => handleRangeChange(e, 'maxDuration')}
            />
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-admin-text-secondary mb-1">Difficulty</label>
          <select
            className="w-full px-3 py-2 bg-white border border-admin-border rounded-lg text-sm text-admin-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
            value={filters.difficulty || ''}
            onChange={(e) => handleChange('difficulty', e.target.value || undefined)}
          >
            <option value="">Any Difficulty</option>
            {DIFFICULTIES.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => onFilterChange({})}
          className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          Reset Filters
        </button>
      </div>
    </aside>
  );
};
