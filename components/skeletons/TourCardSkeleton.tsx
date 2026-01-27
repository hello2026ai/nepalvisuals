import React from 'react';
import { Skeleton } from '../common/Skeleton';

export const TourCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
      {/* Image Placeholder */}
      <Skeleton className="h-48 w-full rounded-none" />
      
      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Region Tag */}
        <div className="mb-2">
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        
        {/* Title */}
        <Skeleton className="h-7 w-3/4 mb-3" />
        
        {/* Description */}
        <div className="mb-4 flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-admin-border grid grid-cols-2 gap-y-2">
          <div className="flex items-center gap-1">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center gap-1 justify-end">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
};
