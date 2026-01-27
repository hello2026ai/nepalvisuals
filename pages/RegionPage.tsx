
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useRegionsData } from '../lib/hooks/useRegionsData';
import type { Region } from '../lib/services/regionService';
import { sanitizeHtml } from '../lib/utils/htmlUtils';
import { RegionPageSkeleton } from '../components/skeletons/RegionPageSkeleton';

import { RegionTreksSection } from '../components/region/RegionTreksSection';

function slugifyName(name: string | null | undefined) {
  return (name || '').toLowerCase().replace(/\s+/g, '-')
}


const RegionPage: React.FC = () => {
    const { regionName } = useParams<{ regionName: string }>();
    const { regions, loading, error, refresh } = useRegionsData();
    const region: Region | undefined = React.useMemo(() => {
      const match = regions.find(r => slugifyName(r.name) === (regionName || '').toLowerCase())
      return match
    }, [regions, regionName])

    if (loading) {
        return <RegionPageSkeleton />;
    }

    if (!loading && !error && !region) {
        return (
            <div className="flex-grow flex items-center justify-center text-center">
                <div>
                    <h1 className="text-4xl font-bold text-primary mb-4">Create Region Page</h1>
                    <p className="text-text-secondary mb-6">We couldn’t find an existing page for <span className="font-bold text-white">{regionName}</span>. A basic dynamic view will be shown.</p>
                    <button onClick={refresh} className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl">
                        Retry
                        <span className="material-symbols-outlined text-sm">refresh</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <header className="relative -mt-[100px] min-h-[70vh] flex items-end justify-center overflow-hidden rounded-b-2xl md:rounded-b-[3rem]">
                <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url('${region?.image_url || 'https://placehold.co/1600x900?text=Region'}')` }}></div>
                <div className="absolute inset-0 z-0 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent"></div>
                <div className="relative z-10 container mx-auto px-4 pb-16 pt-32 max-w-7xl">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-sm mb-6">
                            <span className="material-symbols-outlined text-sm text-primary">explore</span>
                            <span className="text-xs font-bold text-white uppercase tracking-wider">{region?.tagline || 'Explore breathtaking trails'}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6 drop-shadow-lg">
                            {region?.name || regionName}
                        </h1>
                        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mb-10 font-medium drop-shadow-md">
                            {region?.description || 'This region page is generated dynamically. Detailed content will appear once the region has been fully configured.'}
                        </p>
                         <div className="flex flex-wrap gap-4">
                            <div className="bg-surface-dark/50 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center gap-3">
                                <span className="material-symbols-outlined text-3xl text-primary">landscape</span>
                                <div>
                                    <p className="text-xs text-text-secondary uppercase tracking-wider">Best Seasons</p>
                                    <p className="text-lg font-bold text-white">Spring \u0026 Autumn</p>
                                </div>
                            </div>
                            <div className="bg-surface-dark/50 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center gap-3">
                                <span className="material-symbols-outlined text-3xl text-primary">schedule</span>
                                <div>
                                    <p className="text-xs text-text-secondary uppercase tracking-wider">Avg. Duration</p>
                                    <p className="text-lg font-bold text-white">10-21 Days</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-grow pt-16 pb-16 px-4 md:px-8 lg:px-16 container mx-auto max-w-7xl">
                <section className="mb-16">
                    <div className="flex items-end justify-between mb-10 px-2">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Available Treks</h2>
                            <p className="text-text-secondary">Choose your adventure in the {region?.name || regionName}.</p>
                        </div>
                    </div>
                    <div className="mt-8">
                        <RegionTreksSection regionName={region?.name || ''} />
                    </div>
                </section>


            </main>
        </>
    );
};

export default RegionPage;
