import React from 'react';
import { Skeleton } from '../common/Skeleton';

export const TrekCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col bg-surface-dark rounded-2xl border border-white/5 overflow-hidden w-full">
      {/* Image */}
      <Skeleton className="w-full aspect-[4/3] bg-white/5 rounded-none" />
      
      {/* Content */}
      <div className="flex flex-col p-6 flex-grow">
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="h-7 w-3/4 bg-white/5" />
          <Skeleton className="h-6 w-12 bg-white/5" />
        </div>
        
        <div className="mb-4 space-y-2">
          <Skeleton className="h-4 w-full bg-white/5" />
          <Skeleton className="h-4 w-2/3 bg-white/5" />
        </div>
        
        <div className="flex gap-4 mb-4">
          <Skeleton className="h-4 w-24 bg-white/5" />
          <Skeleton className="h-4 w-24 bg-white/5" />
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
          <div>
             <Skeleton className="h-3 w-10 mb-1 bg-white/5" />
             <Skeleton className="h-7 w-20 bg-white/5" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full bg-white/5" />
        </div>
      </div>
    </div>
  );
};
