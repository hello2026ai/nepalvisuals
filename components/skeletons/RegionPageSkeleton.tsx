import React from 'react';
import { Skeleton } from '../common/Skeleton';
import { TrekCardSkeleton } from './TrekCardSkeleton';

export const RegionPageSkeleton: React.FC = () => {
  return (
    <>
      <header className="relative -mt-[100px] min-h-[70vh] flex items-end justify-center overflow-hidden rounded-b-2xl md:rounded-b-[3rem] bg-background-dark">
        <div className="absolute inset-0 z-0 bg-surface-dark animate-pulse"></div>
        
        <div className="relative z-10 container mx-auto px-4 pb-16 pt-32 max-w-7xl">
            <div className="max-w-3xl">
                {/* Badge */}
                <Skeleton className="h-8 w-48 rounded-full mb-6 bg-white/5" />
                
                {/* Title */}
                <Skeleton className="h-16 w-3/4 md:w-1/2 mb-6 bg-white/5" />
                
                {/* Description */}
                <Skeleton className="h-24 w-full max-w-2xl mb-10 bg-white/5" />
                
                {/* Stats */}
                <div className="flex flex-wrap gap-4">
                    <Skeleton className="h-24 w-48 rounded-xl bg-white/5" />
                    <Skeleton className="h-24 w-48 rounded-xl bg-white/5" />
                </div>
            </div>
        </div>
      </header>
      
      <main className="flex-grow pt-16 pb-16 px-4 md:px-8 lg:px-16 container mx-auto max-w-7xl">
          <section className="mb-16">
              <div className="mb-10">
                  <Skeleton className="h-10 w-64 mb-2 bg-surface-dark border border-white/5" />
                  <Skeleton className="h-6 w-96 bg-surface-dark border border-white/5" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                  {Array.from({ length: 3 }).map((_, i) => (
                      <TrekCardSkeleton key={i} />
                  ))}
              </div>
          </section>
      </main>
    </>
  );
};
