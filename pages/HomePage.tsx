
import React from 'react';
import { Link } from 'react-router-dom';
import UpcomingDepartures from '../components/home/UpcomingDepartures';
import CustomerReviews from '../components/home/CustomerReviews';
import FeaturedDestinations from '../components/home/FeaturedDestinations';
import { useRegionsData } from '../lib/hooks/useRegionsData';
import type { Region } from '../lib/services/regionService';
// import RegionTripStatsSection from '../components/home/RegionTripStatsSection';
import { useRegionTripStats } from '../lib/hooks/useRegionTripStats';
import { RegionService } from '../lib/services/regionService';
import { useNavigate } from 'react-router-dom';
import { sanitizeHtml } from '../lib/utils/htmlUtils';
import { AnalyticsService } from '../lib/services/analyticsService';

const FaqItem: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <details className="group bg-surface-dark rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 hover:border-primary/30 open:bg-surface-dark open:border-primary/50 open:shadow-lg open:shadow-primary/5">
        <summary className="flex justify-between items-center p-6 cursor-pointer list-none text-lg font-bold text-white select-none outline-none focus:text-primary transition-colors">
            <span>{title}</span>
            <span className="material-symbols-outlined text-text-secondary transition-transform duration-300 group-open:rotate-180 group-open:text-primary">expand_more</span>
        </summary>
        <div className="px-6 pb-6 text-text-secondary leading-relaxed border-t border-white/5 mt-2 pt-4">
            {children}
        </div>
    </details>
);

import { HeroSearch } from '../components/home/HeroSearch';

const HomePage: React.FC = () => {
    const { regions, loading, error, refresh } = useRegionsData();
    const { stats } = useRegionTripStats();
    const navigate = useNavigate();
    const activitiesHeadingRef = React.useRef<HTMLHeadingElement>(null);
    React.useEffect(() => {
        if (activitiesHeadingRef.current) {
            activitiesHeadingRef.current.textContent = 'Regions';
        }
    }, []);
    const countsByRegion = React.useMemo(() => {
        const map = new Map<string, number>();
        stats.forEach(s => {
            map.set((s.region || '').trim(), s.count);
        });
        return map;
    }, [stats]);
    return (
        <>
            <header className="relative -mt-[100px] min-h-[85vh] flex items-center justify-center z-20">
                <div className="absolute inset-0 z-0 overflow-hidden rounded-b-2xl md:rounded-b-[3rem]">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB7oJvicfMYF2tTDspjyC_dNc6L_u3AS3u1gLba-Lnwk50u3YZOQu3BkxHIjp6qOm8t6-NdGiFKjAxtFwVL1N5XTTmnRQEsYogfMQZfRLPcoYucuMk0ybPhdPiwooV3LVT_bSwr3Ld2FpmTFJP4MwAgLfiztLA7j1qaUiTbpBEa-bWWzUGuIU_wFBqd0T-S_5J3Xle-0CUZZp84IdPuI3fpZyaG0t50baFmMaApe8X6CrvYDROuk7W1PI6KncjUpZ3zKUnhjmCd4hWa')" }}>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-secondary-dark/60 via-secondary-dark/30 to-background-dark/90"></div>
                </div>
                <div className="relative z-10 container mx-auto px-4 pt-32 text-center max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/30 border border-white/20 backdrop-blur-sm mb-6">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-xs font-medium text-white uppercase tracking-wider">New Season Open</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black text-white tracking-tight leading-[1.1] mb-6 drop-shadow-lg">
                        Conquer the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-primary">Unseen Peaks</span>
                    </h1>
                    <p className="text-xl md:text-2xl mb-12 text-white/90 font-medium drop-shadow-md max-w-2xl">
                        Discover the majesty of the Himalayas. Curated trekking experiences for every adventurer.
                    </p>
                    
                    <HeroSearch />
                </div>
            </header>

            <main className="flex-grow pt-24 pb-16 px-4 md:px-8 lg:px-16 container mx-auto max-w-7xl">
                {/* Sections go here, converted from HTML */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    <div className="bg-surface-dark p-8 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group hover:shadow-xl hover:shadow-primary/5">
                        <div className="w-14 h-14 rounded-full bg-secondary text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-secondary/30">
                            <span className="material-symbols-outlined text-3xl">eco</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Eco-Friendly Treks</h3>
                        <p className="text-text-secondary leading-relaxed">
                            We prioritize sustainable travel practices to protect the pristine environments we explore, ensuring they remain for future generations.
                        </p>
                    </div>
                    <div className="bg-surface-dark p-8 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group hover:shadow-xl hover:shadow-primary/5">
                        <div className="w-14 h-14 rounded-full bg-secondary text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-secondary/30">
                            <span className="material-symbols-outlined text-3xl">verified_user</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Certified Guides</h3>
                        <p className="text-text-secondary leading-relaxed">
                            Our local experts are fully certified, bringing years of experience and deep cultural knowledge to every expedition.
                        </p>
                    </div>
                    <div className="bg-surface-dark p-8 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group hover:shadow-xl hover:shadow-primary/5">
                        <div className="w-14 h-14 rounded-full bg-secondary text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-secondary/30">
                            <span className="material-symbols-outlined text-3xl">medical_services</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Safety First</h3>
                        <p className="text-text-secondary leading-relaxed">
                            Comprehensive safety protocols, top-tier equipment, and emergency support systems ensure your peace of mind.
                        </p>
                    </div>
                </section>
                
                <section className="mb-24">
                  <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-16 px-4">
                      {/* ... reviews and activities ... */}
                  </div>
                  <div className="flex items-end justify-between mb-10 px-2">
                      <div>
                          <h2 ref={activitiesHeadingRef} className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Activities</h2>
                          <p className="text-text-secondary">Explore diverse landscapes and find your perfect trail.</p>
                      </div>
                      <div className="hidden md:flex gap-2">
                          <button className="h-10 w-10 rounded-full border border-white/10 hover:border-primary hover:text-primary text-white flex items-center justify-center transition-all bg-surface-dark">
                              <span className="material-symbols-outlined">chevron_left</span>
                          </button>
                          <button className="h-10 w-10 rounded-full border border-white/10 hover:border-primary hover:text-primary text-white flex items-center justify-center transition-all bg-surface-dark">
                              <span className="material-symbols-outlined">chevron_right</span>
                          </button>
                      </div>
                  </div>
                  <div className="flex overflow-x-auto gap-6 pb-6 no-scrollbar snap-x snap-mandatory" aria-label="Available regions">
                    {loading && (
                      <>
                        <div className="min-w-[280px] md:min-w-[320px] snap-center rounded-[2rem] bg-surface-dark/60 border border-white/10 animate-pulse h-[400px]" />
                        <div className="min-w-[280px] md:min-w-[320px] snap-center rounded-[2rem] bg-surface-dark/60 border border-white/10 animate-pulse h-[400px]" />
                        <div className="min-w-[280px] md:min-w-[320px] snap-center rounded-[2rem] bg-surface-dark/60 border border-white/10 animate-pulse h-[400px]" />
                      </>
                    )}
                    {!loading && error && (
                      <div role="alert" className="min-w-full bg-red-600/20 border border-red-600/40 text-white rounded-xl p-4 flex items-center justify-between">
                        <span>Failed to load regions. Please try again.</span>
                        <button onClick={refresh} className="px-3 py-1 rounded-md bg-primary hover:bg-primary-dark text-white font-bold">Retry</button>
                      </div>
                    )}
                    {!loading && !error && regions.length === 0 && (
                        <div className="min-w-full text-center py-10 text-text-secondary bg-surface-dark/30 rounded-2xl border border-white/5">
                            <p>No regions available at the moment.</p>
                        </div>
                    )}
                    {!loading && !error && regions.map((region: Region) => {
                      const slug = (region.name || '').toLowerCase().replace(/\s+/g, '-')
                      const linkPath = `/region/${slug}`
                      const imageSrc = region.image_url || 'https://placehold.co/1200x800?text=Region'
                      const tagline = region.tagline || ''
                      const description = region.description || ''
                      const tripCount = countsByRegion.get((region.name || '').trim()) || 0
                      return (
                        <Link
                          to={linkPath}
                          key={region.id}
                          className="min-w-[280px] md:min-w-[320px] snap-center group cursor-pointer"
                          data-region-name={region.name}
                          onMouseEnter={() => {
                            // Prefetch existence (warm supabase cache)
                            AnalyticsService.track('region_prefetch_hover', { id: region.id, name: region.name })
                            RegionService.existsByName(region.name || '').catch(() => {});
                          }}
                          onClick={async (e) => {
                            AnalyticsService.track('region_click', { id: region.id, name: region.name })
                            try {
                              const ok = await RegionService.existsByName(region.name || '');
                              if (ok) {
                                // let router handle navigation with history
                                return;
                              } else {
                                e.preventDefault();
                                AnalyticsService.track('region_missing_navigate_builder', { slug })
                                navigate(linkPath); // navigate to builder flow
                              }
                            } catch {
                              // On API error, proceed to route; page will show retry/fallback
                              AnalyticsService.track('region_click_error', { id: region.id, name: region.name })
                              return;
                            }
                          }}
                        >
                          <div className="relative h-[400px] w-full rounded-[2rem] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-90"></div>
                            <img alt={region.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" src={imageSrc} loading="lazy" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                              <h3 className="text-2xl font-bold text-white mb-1">{region.name}</h3>
                              <div className="flex items-center gap-2 mb-3" title={`Total Trips: ${tripCount.toLocaleString()}`}>
                                <span className="text-primary font-bold text-lg">{tripCount.toLocaleString()}</span>
                                <span className="text-gray-300 text-sm font-medium">Unique Trips</span>
                              </div>
                              <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300 opacity-0 group-hover:opacity-100">
                                <p className="text-xs text-gray-300 mb-3 line-clamp-2">{tagline || description}</p>
                                <div className="inline-flex items-center text-primary text-sm font-bold">
                                  Explore region <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
                
                <UpcomingDepartures />
                
                <CustomerReviews />

                <FeaturedDestinations />
                
                {/* FAQ Section */}
                <section className="mb-24 px-4 md:px-8 lg:px-16 container mx-auto max-w-7xl">
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
                        <div className="lg:w-1/3">
                            <div className="lg:sticky lg:top-32">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 mb-6">
                                    <span className="text-secondary font-bold uppercase tracking-wider text-xs">Support</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                                    Frequently Asked <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">Questions</span>
                                </h2>
                                <p className="text-text-secondary text-lg mb-8 leading-relaxed">
                                    Everything you need to know about preparing for your adventure. Can't find the answer you're looking for?
                                </p>
                                <a className="inline-flex items-center text-primary font-bold hover:text-primary-dark transition-colors gap-2 group" href="#">
                                    Contact our support team
                                    <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                                </a>
                            </div>
                        </div>
                        <div className="lg:w-2/3 flex flex-col gap-4">
                            <FaqItem title="What fitness level is required for these treks?">
                                Fitness requirements vary by trek. For easier treks like Poon Hill, a moderate fitness level is sufficient. For challenging expeditions like Everest Base Camp or Kilimanjaro, we recommend a solid cardio routine (running, hiking, swimming) for at least 3 months prior to departure. Each package lists a difficulty rating to help you choose.
                            </FaqItem>
                             <FaqItem title="What is included in the package price?">
                                Our packages are comprehensive. They typically include airport transfers, accommodation (teahouses/hotels), all meals during the trek, certified guides and porters, necessary permits (TIMS, National Park fees), and first aid support. Personal gear, travel insurance, and international flights are generally not included.
                            </FaqItem>
                            <FaqItem title="Do I need travel insurance?">
                                Yes, mandatory comprehensive travel insurance is required for all trekkers. It must cover emergency medical evacuation (helicopter rescue) up to the maximum altitude of your trek (e.g., 6,000m). We will ask for proof of insurance before the trek begins for your safety.
                            </FaqItem>
                             <FaqItem title="How do you handle altitude sickness?">
                                Safety is our top priority. Our itineraries are designed with proper acclimatization days. Our guides are trained in wilderness first aid and carry oximeters to monitor your oxygen levels daily. If symptoms persist, we have protocols for descent and evacuation if necessary.
                            </FaqItem>
                            <FaqItem title="What gear do I need to bring?">
                                We provide a detailed packing list upon booking. Essentials include broken-in hiking boots, a down jacket, thermal layers, and a good sleeping bag (which can also be rented). We provide duffel bags for porters to carry your heavy gear, while you carry a daypack.
                            </FaqItem>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
};

export default HomePage;
