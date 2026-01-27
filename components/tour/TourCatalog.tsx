import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TourService, Tour, TourFilterOptions } from '../../lib/services/tourService';
import { TourFilterSidebar } from './TourFilterSidebar';
import { TourCardSkeleton } from '../skeletons/TourCardSkeleton';
import { sanitizeHtml } from '../../lib/utils/htmlUtils';

// Helper to group tours by region
function groupByRegion(tours: Tour[]) {
  const map = new Map<string, Tour[]>();
  tours.forEach(t => {
    const key = (t.region || 'Unspecified').trim();
    const arr = map.get(key) || [];
    arr.push(t);
    map.set(key, arr);
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }));
}

export const TourCatalog: React.FC = () => {
  const [filters, setFilters] = useState<TourFilterOptions>({
    limit: 100, // Fetch more to allow client-side grouping if needed
    sortBy: 'newest'
  });
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // View mode: 'grid' (flat list) or 'grouped' (by region)
  // Default to grouped if no specific sort/filter is active, or user preference
  const [viewMode, setViewMode] = useState<'grid' | 'grouped'>('grouped');

  // When filters change (specifically sortBy), we might want to switch view mode
  useEffect(() => {
    if (filters.sortBy && filters.sortBy !== 'newest') {
      setViewMode('grid');
    }
  }, [filters.sortBy]);

  const fetchTours = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Debounce search could be handled here or in the Sidebar wrapper
      const { data } = await TourService.getAllTours(filters);
      setTours(data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load tours');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // Simple debounce for text search
    const timer = setTimeout(() => {
      fetchTours();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchTours]);

  // Render content based on viewMode
  const renderContent = () => {
    if (tours.length === 0) {
      return (
        <div className="text-center py-12 bg-admin-surface border border-admin-border rounded-xl">
          <p className="text-admin-text-secondary text-lg">No tours found matching your criteria.</p>
          <button 
            onClick={() => setFilters({ limit: 100, sortBy: 'newest' })}
            className="mt-4 text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      );
    }

    if (viewMode === 'grouped') {
      const grouped = groupByRegion(tours);
      return (
        <div className="space-y-8">
          {grouped.map(([regionName, list]) => (
            <div key={regionName} className="space-y-4">
              <h3 className="text-2xl font-bold text-admin-text-primary border-b border-admin-border pb-2">
                {regionName}
                <span className="ml-2 text-sm font-normal text-admin-text-secondary">({list.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {list.map(tour => <TourCard key={tour.id} tour={tour} />)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Grid View
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tours.map(tour => <TourCard key={tour.id} tour={tour} />)}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <TourFilterSidebar 
          filters={filters} 
          onFilterChange={setFilters} 
          className="sticky top-24"
        />
      </div>

      {/* Mobile Filter Toggle (Simplified) */}
      <div className="lg:hidden mb-4">
        <details className="bg-admin-surface border border-admin-border rounded-xl">
          <summary className="p-4 font-semibold cursor-pointer list-none flex justify-between items-center text-admin-text-primary">
            <span>Filters & Search</span>
            <span className="material-symbols-outlined">filter_list</span>
          </summary>
          <div className="border-t border-admin-border">
            <TourFilterSidebar 
              filters={filters} 
              onFilterChange={setFilters} 
              className="border-0 shadow-none bg-transparent"
            />
          </div>
        </details>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header / View Toggle */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-admin-text-primary">
            Results <span className="text-admin-text-secondary text-sm font-normal">({tours.length} tours)</span>
          </h2>
          
          <div className="flex items-center gap-2 bg-admin-surface border border-admin-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-xl">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`p-2 rounded ${viewMode === 'grouped' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Group by Region"
            >
              <span className="material-symbols-outlined text-xl">table_rows</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <TourCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
            {error}
            <button onClick={fetchTours} className="ml-4 underline">Retry</button>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

// Extracted Card Component
const TourCard: React.FC<{ tour: Tour }> = ({ tour }) => {
  const availability = tour.status === 'Published' ? 'Available' : 'Unavailable';
  
  return (
    <article className="group flex flex-col h-full bg-admin-surface border border-admin-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <a href={`#/trip/${tour.url_slug}`} className="relative h-48 overflow-hidden block">
        {tour.featured_image ? (
          <img
            src={tour.featured_image}
            alt={tour.featured_image_alt || tour.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
            <span className="material-symbols-outlined text-4xl">image</span>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-admin-text-primary shadow-sm">
          {tour.duration ? `${tour.duration} Days` : 'Flexible'}
        </div>
      </a>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="mb-2">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {tour.region || 'Nepal'}
          </span>
        </div>
        
        <h3 className="text-lg font-bold text-admin-text-primary mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          <a href={`#/trip/${tour.url_slug}`}>{tour.name}</a>
        </h3>
        
        <div 
          className="text-sm text-admin-text-secondary line-clamp-2 mb-4 flex-1"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(tour.description || '') }} 
        />

        {/* Footer Info */}
        <div className="pt-4 border-t border-admin-border grid grid-cols-2 gap-y-2 text-sm">
          <div className="flex items-center gap-1 text-admin-text-secondary">
            <span className="material-symbols-outlined text-base">landscape</span>
            <span>{tour.difficulty || 'Moderate'}</span>
          </div>
          <div className="flex items-center gap-1 text-admin-text-secondary justify-end">
            <span className="material-symbols-outlined text-base">payments</span>
            <span className="font-bold text-admin-text-primary">
              {tour.price ? `$${tour.price.toLocaleString()}` : 'Inquire'}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
