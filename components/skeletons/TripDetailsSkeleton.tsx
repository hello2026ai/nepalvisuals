import React from 'react';
import { Skeleton } from '../common/Skeleton';

export const TripDetailsSkeleton: React.FC = () => {
  return (
    <div className="bg-background-dark min-h-screen">
       {/* Hero Section */}
       <div className="relative -mt-[100px] h-[70vh] w-full">
         <Skeleton className="h-full w-full rounded-b-[3rem] bg-surface-dark" />
       </div>
       
       <div className="container mx-auto px-4 md:px-8 lg:px-16 pt-12 pb-16 max-w-7xl">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           {/* Left Column */}
           <div className="lg:col-span-2 space-y-16">
             
             {/* Stats Grid */}
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
               {Array.from({ length: 6 }).map((_, i) => (
                 <Skeleton key={i} className="h-24 rounded-2xl bg-surface-dark border border-white/5" />
               ))}
             </div>

             {/* Overview */}
             <div className="space-y-4">
               <Skeleton className="h-10 w-48 bg-surface-dark" />
               <div className="space-y-2">
                 <Skeleton className="h-4 w-full bg-surface-dark" />
                 <Skeleton className="h-4 w-full bg-surface-dark" />
                 <Skeleton className="h-4 w-3/4 bg-surface-dark" />
               </div>
             </div>
             
             {/* Highlights */}
             <div className="space-y-6">
               <Skeleton className="h-10 w-64 bg-surface-dark" />
               <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                        <Skeleton className="h-8 w-8 rounded-full bg-surface-dark flex-shrink-0" />
                        <Skeleton className="h-6 w-full bg-surface-dark" />
                    </div>
                ))}
               </div>
             </div>

           </div>

           {/* Right Column (Booking Card) */}
           <div className="hidden lg:block lg:col-span-1">
             <Skeleton className="h-[600px] rounded-2xl bg-surface-dark border border-white/5 sticky top-24" />
           </div>
         </div>
       </div>
    </div>
  );
};
