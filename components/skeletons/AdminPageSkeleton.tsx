import React from 'react';
import { Skeleton } from '../common/Skeleton';

export const AdminPageSkeleton: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <Skeleton className="h-8 w-48 mb-2 bg-admin-surface border border-admin-border" />
                    <Skeleton className="h-4 w-64 bg-admin-surface border border-admin-border" />
                </div>
                <Skeleton className="h-10 w-32 rounded-lg bg-admin-surface border border-admin-border" />
            </div>

            {/* Table Card */}
            <div className="bg-admin-surface rounded-xl border border-admin-border shadow-sm overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-admin-border flex flex-col md:flex-row gap-4">
                     <Skeleton className="h-10 flex-grow bg-admin-background" />
                     <Skeleton className="h-10 w-32 bg-admin-background" />
                     <Skeleton className="h-10 w-32 bg-admin-background" />
                </div>
                
                {/* Table Header */}
                <div className="bg-admin-background p-4 border-b border-admin-border grid grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-20 bg-admin-border" />
                    ))}
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-admin-border">
                    {Array.from({ length: 5 }).map((_, i) => (
                         <div key={i} className="p-4 grid grid-cols-6 gap-4 items-center">
                             <Skeleton className="h-5 w-full bg-admin-background" />
                             <Skeleton className="h-5 w-full bg-admin-background" />
                             <Skeleton className="h-5 w-full bg-admin-background" />
                             <Skeleton className="h-5 w-full bg-admin-background" />
                             <Skeleton className="h-5 w-full bg-admin-background" />
                             <Skeleton className="h-8 w-16 bg-admin-background rounded" />
                         </div>
                    ))}
                </div>
                
                {/* Pagination */}
                <div className="p-4 border-t border-admin-border flex justify-between items-center">
                    <Skeleton className="h-5 w-48 bg-admin-background" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded bg-admin-background" />
                        <Skeleton className="h-8 w-8 rounded bg-admin-background" />
                        <Skeleton className="h-8 w-8 rounded bg-admin-background" />
                    </div>
                </div>
            </div>
        </div>
    );
};
