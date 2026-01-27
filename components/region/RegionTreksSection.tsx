import React from 'react';
import { useToursByRegion } from '../../lib/hooks/useToursByRegion';
import { TrekCard } from '../tour/TrekCard';
import { TrekCardSkeleton } from '../skeletons/TrekCardSkeleton';

interface RegionTreksSectionProps {
  regionName: string;
}

export const RegionTreksSection: React.FC<RegionTreksSectionProps> = ({ regionName }) => {
  const { tours, loading, error } = useToursByRegion(regionName);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <TrekCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="py-12 text-center text-red-400">Error loading treks: {error}</div>;
  }

  if (tours.length === 0) {
    return (
      <div className="py-12 text-center text-text-secondary">
        <p>No treks found for {regionName} yet.</p>
      </div>
    );
  }

  /* 
    Responsive Grid Layout:
    - Mobile (default): 1 column (grid-cols-1) - Full width cards
    - Tablet (md: 768px): 2 columns (grid-cols-2) - Balanced layout
    - Desktop (lg: 1024px): 3 columns (grid-cols-3) - Maximizes screen real estate
    - Gap: 6 (24px) for breathable spacing
  */
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {tours.map((tour) => (
        <TrekCard 
          key={tour.id} 
          trek={{
            id: tour.id,
            title: tour.name,
            imageUrl: tour.featured_image || 'https://placehold.co/600x400?text=No+Image',
            duration: tour.duration || 'N/A',
            difficulty: tour.difficulty || 'Moderate',
            rating: 5.0, // Placeholder as rating is not in Tour interface
            description: tour.description || '',
            maxAltitude: 'Varies', // Placeholder as maxAltitude is not in Tour interface
            price: tour.price,
            link: `/trek/${tour.url_slug}`
          }} 
        />
      ))}
    </div>
  );
};
