import React from 'react';
import { Skeleton } from '../common/Skeleton';

export const FeaturedDestinationSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-3 bg-surface-dark rounded-[2rem] border border-white/5 h-full">
      {/* Image */}
      <Skeleton className="w-full aspect-[4/3] rounded-[1.5rem] bg-white/5" />
      
      {/* Content */}
      <div className="px-3 pb-3 space-y-3">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-1/2 bg-white/5" />
          <Skeleton className="h-6 w-12 bg-white/5" />
        </div>
        <Skeleton className="h-4 w-full bg-white/5" />
        <Skeleton className="h-4 w-3/4 bg-white/5" />
      </div>
    </div>
  );
};
