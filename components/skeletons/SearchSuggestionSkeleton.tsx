import React from 'react';
import { Skeleton } from '../common/Skeleton';

export const SearchSuggestionSkeleton: React.FC = () => {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      {/* Thumbnail */}
      <Skeleton className="w-12 h-12 rounded-lg bg-white/5 flex-shrink-0" />
      
      {/* Text Info */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 bg-white/5" />
        <Skeleton className="h-3 w-1/2 bg-white/5" />
      </div>
    </div>
  );
};
