import React, { useCallback, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Link } from 'react-router-dom';
import { FeaturedDestination } from '../../lib/services/featuredDestinationService';
import { FeaturedDestinationSkeleton } from '../skeletons/FeaturedDestinationSkeleton';
import { sanitizeHtml } from '../../lib/utils/htmlUtils';

interface FeaturedDestinationsCarouselProps {
    destinations: FeaturedDestination[];
    loading: boolean;
    error: string | null;
    onScrollStateChange?: (state: { canScrollLeft: boolean; canScrollRight: boolean }) => void;
}

const FeaturedDestinationsCarousel = forwardRef<{ scrollLeft: () => void; scrollRight: () => void; canScrollLeft: boolean; canScrollRight: boolean }, FeaturedDestinationsCarouselProps>(({ destinations, loading, error, onScrollStateChange }, ref) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]);
    const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
    const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
    const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

    useImperativeHandle(ref, () => ({
        scrollLeft: scrollPrev,
        scrollRight: scrollNext,
        canScrollLeft: prevBtnEnabled,
        canScrollRight: nextBtnEnabled
    }));

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
        const canPrev = emblaApi.canScrollPrev();
        const canNext = emblaApi.canScrollNext();
        setPrevBtnEnabled(canPrev);
        setNextBtnEnabled(canNext);
        onScrollStateChange?.({ canScrollLeft: canPrev, canScrollRight: canNext });
    }, [emblaApi, onScrollStateChange]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        setScrollSnaps(emblaApi.scrollSnapList());
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);

    // Image fallback handler
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = 'https://placehold.co/600x400?text=Image+Unavailable';
    };

    if (loading) {
        return (
            <div className="overflow-hidden">
                <div className="flex gap-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0">
                            <FeaturedDestinationSkeleton />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 bg-surface-dark/50 rounded-2xl border border-white/5 mx-4">
                <span className="material-symbols-outlined text-4xl text-red-400 mb-3">error_outline</span>
                <p className="text-red-300 mb-6 max-w-md mx-auto">{error}</p>
            </div>
        );
    }

    if (destinations.length === 0) {
        return (
            <div className="col-span-full text-center text-text-secondary py-12 bg-surface-dark/30 rounded-2xl border border-white/5">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">landscape</span>
                <p>No featured destinations currently available.</p>
            </div>
        );
    }

    return (
        <div className="relative group">
            {/* Carousel Viewport */}
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex touch-pan-y gap-6 -ml-6">
                    {destinations.map((destination) => (
                        <div key={destination.id} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0 pl-6">
                            <div className="group/card relative flex flex-col gap-4 p-3 bg-surface-dark rounded-[2rem] border border-white/5 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 h-full">
                                <div className="relative w-full aspect-[4/3] rounded-[1.5rem] overflow-hidden">
                                    {destination.duration && (
                                        <div className="absolute top-4 right-4 z-10 bg-secondary/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10 shadow-md">
                                            {destination.duration}
                                        </div>
                                    )}
                                    <img
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                                        alt={destination.name}
                                        src={destination.image_url || 'https://placehold.co/600x400?text=No+Image'}
                                        onError={handleImageError}
                                        loading="lazy"
                                    />
                                </div>
                                <div className="px-3 pb-3 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-white">{destination.name}</h3>
                                        {destination.rating && (
                                            <div className="flex items-center gap-1 text-primary">
                                                <span className="material-symbols-outlined text-[18px]">star</span>
                                                <span className="text-sm font-bold text-white">{destination.rating}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-text-secondary text-sm mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: sanitizeHtml(destination.description) }} />
                                    <div className="flex items-center justify-between mt-auto">
                                        <div>
                                            {destination.price && (
                                                <>
                                                    <p className="text-xs text-text-secondary uppercase tracking-wide">Starting from</p>
                                                    <p className="text-xl font-bold text-white">{destination.price}</p>
                                                </>
                                            )}
                                        </div>
                                        <Link
                                            to={destination.link_url || '#'}
                                            className="h-10 w-10 rounded-full bg-secondary hover:bg-primary text-white flex items-center justify-center transition-colors shadow-lg"
                                            aria-label={`View details for ${destination.name}`}
                                        >
                                            <span className="material-symbols-outlined">arrow_outward</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dot Indicators */}
            <div className="flex justify-center gap-2 mt-8">
                {scrollSnaps.map((_, index) => (
                    <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === selectedIndex ? 'w-8 bg-primary' : 'bg-white/20 hover:bg-white/40'
                        }`}
                        onClick={() => scrollTo(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
});

export default FeaturedDestinationsCarousel;
