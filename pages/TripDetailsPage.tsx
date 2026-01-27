
import React from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTourData } from '../lib/hooks/useTourData';
import { ExpandableContent } from '../components/common/ExpandableContent';
import { TripDetailsSkeleton } from '../components/skeletons/TripDetailsSkeleton';
import { Tour } from '../lib/services/tourService';
import { TourInfoOverlay } from '../components/tour/TourInfoOverlay';
import TrekMap from '../components/tour/TrekMap';
import { WeatherService, DailyForecast } from '../lib/services/weatherService';
import { Helmet } from 'react-helmet-async';
import { sanitizeHtml, stripHtml } from '../lib/utils/htmlUtils';
import './TripDetailsPage.css'; // Import the override styles

const FaqItem: React.FC<{ title: string, children: React.ReactNode, open?: boolean }> = ({ title, children, open = false }) => (
    <details className="group bg-surface-dark rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 open:border-primary/50 open:shadow-lg open:shadow-primary/5 open:bg-surface-darker/50" open={open}>
        <summary className="flex items-center justify-between p-5 md:p-6 cursor-pointer list-none select-none">
            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{title}</h3>
            <span className="material-symbols-outlined text-text-secondary group-hover:text-primary transition-transform duration-300 group-open:rotate-180">expand_more</span>
        </summary>
        <div className="px-5 md:px-6 pb-6 text-text-secondary leading-relaxed border-t border-white/5 pt-4">
            <p>{children}</p>
        </div>
    </details>
);



interface GalleryImage {
    src: string;
    alt: string;
}

interface Review {
    id: number;
    name: string;
    date: string;
    rating: number;
    avatar: string;
    reviewText: string;
}

interface SimilarTrek {
    id: number;
    title: string;
    imageUrl: string;
    duration: string;
    rating: number;
    price: number;
    description: string;
    link: string;
}

interface Departure {
    id: string;
    startDate: Date;
    endDate: Date;
    price: number;
    spotsLeft: number;
}

const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
        case 'sunny': return { icon: 'wb_sunny', color: 'text-yellow-400' };
        case 'partly cloudy': return { icon: 'partly_cloudy_day', color: 'text-gray-300' };
        case 'cloudy': return { icon: 'cloud', color: 'text-gray-400' };
        case 'light snow': return { icon: 'cloudy_snowing', color: 'text-sky-300' };
        case 'heavy snow': return { icon: 'ac_unit', color: 'text-sky-200' };
        case 'windy': return { icon: 'air', color: 'text-gray-300' };
        default: return { icon: 'thermostat', color: 'text-white' };
    }
};

const StarRating: React.FC<{ rating: number; className?: string }> = ({ rating, className = '' }) => (
    <div className={`flex items-center ${className}`}>
        {[...Array(5)].map((_, index) => (
            <span key={index} className={`material-symbols-outlined text-lg ${index < rating ? 'text-primary' : 'text-white/20'}`}>
                star
            </span>
        ))}
    </div>
);

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
    <div className="bg-surface-dark p-6 rounded-2xl border border-white/5">
        <div className="flex items-start md:items-center mb-4">
            <img src={review.avatar} alt={`${review.name}'s avatar`} className="w-12 h-12 rounded-full mr-4 object-cover" loading="lazy" />
            <div className="flex-grow">
                <h4 className="font-bold text-white">{review.name}</h4>
                <p className="text-sm text-text-secondary">{review.date}</p>
            </div>
            <div className="hidden md:block">
                <StarRating rating={review.rating} />
            </div>
        </div>
        <div className="md:hidden mb-4">
             <StarRating rating={review.rating} />
        </div>
        <p className="text-text-secondary leading-relaxed">{review.reviewText}</p>
    </div>
);

const SimilarTrekCard: React.FC<{ trek: SimilarTrek }> = ({ trek }) => (
    <div className="group relative flex flex-col gap-4 p-3 bg-surface-dark rounded-2xl border border-white/5 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
            <div className="absolute top-4 right-4 z-10 bg-secondary/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10 shadow-md">
                {trek.duration}
            </div>
            <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={trek.title} src={trek.imageUrl} loading="lazy" />
        </div>
        <div className="px-3 pb-3">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-white">{trek.title}</h3>
                <div className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-base">star</span>
                    <span className="text-sm font-bold text-white">{trek.rating}</span>
                </div>
            </div>
            <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                {stripHtml(trek.description)}
            </p>
            <div className="flex items-center justify-between mt-auto">
                <div>
                    <p className="text-xs text-text-secondary uppercase tracking-wide">From</p>
                    <p className="text-lg font-bold text-white">${trek.price}</p>
                </div>
                <Link to={trek.link} className="h-10 w-10 rounded-full bg-secondary hover:bg-primary text-white flex items-center justify-center transition-colors shadow-lg">
                    <span className="material-symbols-outlined text-lg">arrow_outward</span>
                </Link>
            </div>
        </div>
    </div>
);


const ItineraryItem: React.FC<{
    day: number;
    title: string;
    description: string;
    altitude?: string;
    duration?: string;
    isLast: boolean;
    open?: boolean;
}> = ({ day, title, description, altitude, duration, isLast, open = false }) => {
    return (
        <div className="relative pl-14">
            {/* Timeline line */}
            <div className={`absolute top-5 left-5 -ml-px h-full w-0.5 bg-white/10 ${isLast ? 'hidden' : ''}`}></div>
            
            {/* Day marker */}
            <div className="absolute top-0 left-0 w-10 h-10 rounded-full bg-surface-darker border-2 border-primary flex items-center justify-center font-bold text-white z-10">
                {day}
            </div>
            
            <details className="group pb-8" open={open}>
                <summary className="flex items-center justify-between cursor-pointer list-none pt-1">
                    <div>
                        <h4 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{title}</h4>
                    </div>
                    <div className="pr-4">
                        <span className="material-symbols-outlined text-text-secondary transition-transform duration-300 group-open:rotate-180 group-open:text-primary">expand_more</span>
                    </div>
                </summary>
                
                <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-4">
                        {altitude && (
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-primary">landscape</span>
                                <span className="text-text-secondary">Altitude: <span className="font-bold text-white">{altitude}</span></span>
                            </div>
                        )}
                        {duration && (
                             <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-primary">schedule</span>
                                <span className="text-text-secondary">Duration: <span className="font-bold text-white">{duration}</span></span>
                            </div>
                        )}
                    </div>
                    <p className="text-text-secondary leading-relaxed">{description}</p>
                </div>
            </details>
        </div>
    );
};

const WhatsAppIcon = () => (
    <svg className="w-5 h-5 fill-current text-green-500" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.38 1.25 4.81L2 22l5.3-1.38c1.37.74 2.93 1.18 4.59 1.18h.12c5.45 0 9.9-4.45 9.9-9.91s-4.45-9.9-9.9-9.9zM17.1 15.3c-.28-.14-1.68-.83-1.94-.93-.26-.1-.45-.14-.64.14-.19.28-.73.93-.9 1.12-.17.19-.34.22-.63.07-.29-.15-1.21-.45-2.3-1.42-.85-.76-1.42-1.7-1.59-1.99-.17-.29-.02-.45.12-.59.13-.13.28-.34.42-.51.14-.17.19-.28.28-.47.1-.19.05-.36-.02-.51s-.64-1.53-.87-2.1c-.23-.56-.47-.48-.64-.48-.17 0-.36-.02-.55-.02s-.5.07-.76.36c-.26.28-.98 1-1.2 2.38-.22 1.38.28 2.76.5 2.95.22.2.98 1.58 2.38 2.2a7.6 7.6 0 002.66 1.05c.82.23 1.3.18 1.69.05.47-.16 1.35-.9 1.54-1.76.19-.86.19-1.6.14-1.76-.05-.17-.19-.26-.42-.4z"></path></svg>
);

const Calendar: React.FC<{
    displayDate: Date;
    setDisplayDate: (date: Date) => void;
    selectedDate: Date | null;
    onSelectDate: (date: Date) => void;
    availableDates: Date[];
    onClose: () => void;
}> = ({ displayDate, setDisplayDate, selectedDate, onSelectDate, availableDates, onClose }) => {
    
    const availableDateStrings = React.useMemo(() => availableDates.map(d => d.toDateString()), [availableDates]);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const prevMonthDays = Array.from({ length: firstDay }, (_, i) => {
        const prevMonth = new Date(year, month, 0);
        return prevMonth.getDate() - firstDay + i + 1;
    });

    const goToPrevMonth = () => setDisplayDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setDisplayDate(new Date(year, month + 1, 1));

    const handleDateClick = (day: number) => {
        const newDate = new Date(year, month, day);
        if (availableDateStrings.includes(newDate.toDateString())) {
            onSelectDate(newDate);
            onClose();
        }
    };

    const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newYear = parseInt(event.target.value, 10);
        setDisplayDate(new Date(newYear, month, 1));
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
    
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
        <div className="absolute top-full left-0 mt-2 w-full bg-surface-darker border border-white/10 rounded-xl shadow-2xl p-4 z-20 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
                <button onClick={goToPrevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors" aria-label="Previous month">
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                        {displayDate.toLocaleString('default', { month: 'long' })}
                    </span>
                    <div className="relative">
                        <select
                            value={year}
                            onChange={handleYearChange}
                            aria-label="Select year"
                            className="bg-surface-darker border border-transparent hover:border-white/10 rounded-md font-bold text-white text-sm appearance-none cursor-pointer py-1 pl-2 pr-6 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                        >
                            {years.map(y => <option key={y} value={y} className="bg-surface-darker text-white font-medium">{y}</option>)}
                        </select>
                        <span className="material-symbols-outlined text-text-secondary text-base absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                    </div>
                </div>
                <button onClick={goToNextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors" aria-label="Next month">
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {weekDays.map(day => <div key={day} className="text-xs font-bold text-text-secondary">{day}</div>)}
                
                {prevMonthDays.map(day => <div key={`prev-${day}`} className="text-text-secondary/50 p-1 text-sm">{day}</div>)}
                
                {days.map(day => {
                    const currentDate = new Date(year, month, day);
                    const isSelected = selectedDate?.toDateString() === currentDate.toDateString();
                    const isAvailable = availableDateStrings.includes(currentDate.toDateString());
                    
                    const dayClass = isSelected
                        ? "bg-primary text-white font-bold"
                        : isAvailable
                        ? "bg-primary/20 text-primary font-medium hover:bg-primary hover:text-white cursor-pointer"
                        : "text-white/50 cursor-not-allowed";

                    return (
                        <div 
                            key={day}
                            onClick={() => handleDateClick(day)}
                            className={`w-full aspect-square flex items-center justify-center rounded-full text-sm transition-colors ${dayClass}`}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

import TourPricingCard from '../components/tour/TourPricingCard';
import TourHighlights from '../components/tour/TourHighlights';

interface TripDetailsPageProps {
    setIsHeaderVisible?: (visible: boolean) => void;
}

const TripDetailsPage: React.FC<TripDetailsPageProps> = ({ setIsHeaderVisible }) => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    
    // Determine if the parameter is a UUID or a slug
    const isUuid = slug?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    const { tour, loading, error } = useTourData({ 
        id: slug || '',
        enabled: !!slug,
        isSlug: !isUuid // Use the new isSlug parameter we'll add to useTourData
    });

    const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
    const [isLinkCopied, setIsLinkCopied] = React.useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = React.useState(false);
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
    
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
    const [selectedDepartureId, setSelectedDepartureId] = React.useState<string | null>(null);

    const [displayDate, setDisplayDate] = React.useState(new Date());
    const [guestCount, setGuestCount] = React.useState(2);
    
    const [filterYear, setFilterYear] = React.useState<number | 'all'>('all');
    const [filterMonth, setFilterMonth] = React.useState<number | 'all'>('all');

    const [weatherData, setWeatherData] = React.useState<DailyForecast[]>([]);
    const [weatherLocation, setWeatherLocation] = React.useState<string>('the mountains');

    const galleryImages: GalleryImage[] = React.useMemo(() => {
        const images: GalleryImage[] = [];
        
        // Add featured image first
        if (tour?.featured_image) {
            images.push({ src: tour.featured_image, alt: tour.name || 'Featured image' });
        }
        
        // Add gallery images
        if (tour?.gallery_images && tour.gallery_images.length > 0) {
            tour.gallery_images.forEach((imgUrl, index) => {
                // Avoid duplicates if featured image is also in gallery
                if (imgUrl !== tour.featured_image) {
                    images.push({ src: imgUrl, alt: `${tour.name} gallery image ${index + 1}` });
                }
            });
        }
        
        // Fallback if no images at all
        if (images.length === 0) {
            images.push({ src: 'https://placehold.co/1200x800?text=Tour+Image', alt: tour?.name || 'Tour image' });
        }
        
        return images;
    }, [tour]);

    const reviewsData: Review[] = React.useMemo(() => [], []);
    
    const similarTreksData: SimilarTrek[] = React.useMemo(() => [], []);

    const fixedDeparturesData: Departure[] = React.useMemo(() => {
        if (!tour?.seasonal_prices) return [];
        return tour.seasonal_prices.map(sp => ({
            id: sp.id,
            startDate: new Date(sp.start_date),
            endDate: new Date(sp.end_date),
            price: sp.price,
            spotsLeft: 10
        })).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    }, [tour]);

    const availableDates = React.useMemo(() => {
        return fixedDeparturesData.map(d => d.startDate);
    }, [fixedDeparturesData]);

    const parsedGeoJson = React.useMemo(() => {
        if (!tour?.route_geojson) return null;
        if (typeof tour.route_geojson === 'string') {
            try {
                return JSON.parse(tour.route_geojson);
            } catch (e) {
                console.error("Failed to parse route_geojson", e);
                return null;
            }
        }
        return tour.route_geojson;
    }, [tour]);

    React.useEffect(() => {
        if (tour?.destination || tour?.region) {
            setWeatherLocation(tour.destination || tour.region);
        }
    }, [tour]);

    React.useEffect(() => {
        const fetchWeather = async () => {
            console.log("TripDetailsPage: fetchWeather started. parsedGeoJson:", parsedGeoJson);
            
            let coord: number[] | null = null;

            try {
                // 1. Try to get coordinates from GeoJSON
                if (parsedGeoJson) {
                    // Robust recursive coordinate extraction
                    const findCoord = (obj: any): number[] | null => {
                        if (!obj) return null;
                        
                        // If it has a geometry property (Feature), try that
                        if (obj.geometry) return findCoord(obj.geometry);
                        
                        // If it has features (FeatureCollection), try to find valid coordinates in any feature
                        if (obj.features && Array.isArray(obj.features)) {
                            for (const feature of obj.features) {
                                const result = findCoord(feature);
                                if (result) return result;
                            }
                        }

                        // If it has coordinates, try to extract from there
                        if (obj.coordinates && Array.isArray(obj.coordinates)) {
                            let c = obj.coordinates;
                            // Drill down until we find a number array (Leaflet/GeoJSON structure)
                            // This handles Point [x,y], LineString [[x,y]...], Polygon [[[x,y]...]]
                            while (Array.isArray(c) && c.length > 0 && Array.isArray(c[0])) {
                                c = c[0];
                            }
                            // Check if we found a [lon, lat] pair
                            if (Array.isArray(c) && c.length >= 2 && typeof c[0] === 'number') {
                                return c;
                            }
                        }
                        
                        return null;
                    };

                    coord = findCoord(parsedGeoJson);
                    console.log("TripDetailsPage: Extracted coordinates from GeoJSON:", coord);
                } else {
                    console.log("TripDetailsPage: parsedGeoJson is null/undefined");
                }

                // 2. Fallback to Geocoding if no coordinates found
                if (!coord && tour) {
                    console.log("TripDetailsPage: No coordinates from GeoJSON. Attempting fallback geocoding...");
                    const locationQuery = tour.destination || tour.region || tour.name;
                    if (locationQuery) {
                         console.log(`TripDetailsPage: Geocoding query: ${locationQuery}`);
                         const geoResult = await WeatherService.getCoordinates(locationQuery);
                         if (geoResult) {
                             coord = [geoResult.lon, geoResult.lat];
                             console.log("TripDetailsPage: Geocoding successful:", coord);
                         } else {
                             console.warn("TripDetailsPage: Geocoding failed for query:", locationQuery);
                         }
                    } else {
                        console.warn("TripDetailsPage: No location info available for geocoding");
                    }
                }
                
                // 3. Fetch Weather if we have coordinates
                if (coord) {
                     const [lon, lat] = coord; // GeoJSON is [lon, lat]
                     console.log(`TripDetailsPage: Fetching weather for lat=${lat}, lon=${lon}`);
                     
                     if (typeof lat === 'number' && typeof lon === 'number') {
                         const data = await WeatherService.getForecast(lat, lon);
                         console.log("TripDetailsPage: Weather data received:", data);
                         if (data && data.length > 0) {
                            setWeatherData(data);
                         } else {
                            console.warn("TripDetailsPage: Weather data is empty");
                         }
                     }
                } else {
                    console.warn("TripDetailsPage: Could not determine coordinates (GeoJSON or Geocoding)");
                }
                
            } catch (err) {
                console.error("Failed to load weather", err);
            }
        };
        fetchWeather();
    }, [parsedGeoJson, tour]);

    const [isSticky, setIsSticky] = React.useState(false);
    const [activeSection, setActiveSection] = React.useState('overview');
    const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
    const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null);

    React.useEffect(() => {
        setPortalTarget(document.getElementById('tour-info-portal'));
    }, []);

    const pageHeaderRef = React.useRef<HTMLElement>(null);
    const overviewRef = React.useRef<HTMLElement>(null);
    const mapRef = React.useRef<HTMLElement>(null);
    const highlightsRef = React.useRef<HTMLElement>(null);
    const weatherRef = React.useRef<HTMLElement>(null);
    const itineraryRef = React.useRef<HTMLElement>(null);
    const galleryRef = React.useRef<HTMLElement>(null);
    const faqRef = React.useRef<HTMLElement>(null);
    const reviewsRef = React.useRef<HTMLElement>(null);

    const sections = React.useMemo(() => [
        { id: 'overview', ref: overviewRef, name: 'Overview' },
        { id: 'map', ref: mapRef, name: 'Route Map' },
        { id: 'highlights', ref: highlightsRef, name: 'Trip Highlights' },
        { id: 'gallery', ref: galleryRef, name: 'Gallery' },
        { id: 'itinerary', ref: itineraryRef, name: 'Itinerary' },
        { id: 'faq', ref: faqRef, name: 'FAQs' },
    ], []);

    React.useEffect(() => {
        // When sticky nav appears, hide main header. When it disappears, show main header.
        setIsHeaderVisible?.(!isSticky);
    }, [isSticky, setIsHeaderVisible]);

    React.useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 100);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    React.useEffect(() => {
        const observerOptions = {
            rootMargin: '-150px 0px -40% 0px',
            threshold: 0,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            if (section.ref.current) observer.observe(section.ref.current);
        });

        return () => {
            sections.forEach(section => {
                if (section.ref.current) observer.unobserve(section.ref.current);
            });
        };
    }, [sections]);

    const handleTabClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
        e.preventDefault();
        setIsMobileNavOpen(false);
        const section = document.getElementById(sectionId);
        if (section) {
            const headerOffset = 150;
            const elementPosition = section.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };
    
    const calendarRef = React.useRef<HTMLDivElement>(null);

     React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setIsCalendarOpen(false);
            }
        };

        if (isCalendarOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isCalendarOpen]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setIsLinkCopied(true);
            setTimeout(() => {
                setIsLinkCopied(false);
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy link: ', err);
        });
    };

    const openGallery = (index: number) => {
        if (galleryImages.length === 0) return;
        if (index < 0 || index >= galleryImages.length) return;
        setCurrentImageIndex(index);
        setIsGalleryOpen(true);
    };

    const closeGallery = () => {
        setIsGalleryOpen(false);
    };

    const showNextImage = React.useCallback(() => {
        if (galleryImages.length === 0) return;
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % galleryImages.length);
    }, [galleryImages.length]);

    const showPrevImage = React.useCallback(() => {
        if (galleryImages.length === 0) return;
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + galleryImages.length) % galleryImages.length);
    }, [galleryImages.length]);
    
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isGalleryOpen) return;
            if (e.key === 'Escape') closeGallery();
            if (e.key === 'ArrowRight') showNextImage();
            if (e.key === 'ArrowLeft') showPrevImage();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isGalleryOpen, showNextImage, showPrevImage]);

    const averageRating = React.useMemo(() => {
        if (reviewsData.length === 0) return '0.0';
        const total = reviewsData.reduce((acc, review) => acc + review.rating, 0);
        return (total / reviewsData.length).toFixed(1);
    }, []);

    const formattedSelectedDate = selectedDate 
        ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(selectedDate)
        : 'Select a date';

    const handleSelectDate = (date: Date) => {
        setSelectedDate(date);
        setSelectedDepartureId(null); // Deselect fixed departure
    };

    const handleSelectDeparture = (id: string) => {
        setSelectedDepartureId(id);
        setSelectedDate(null); // Deselect private date
    };

    const handleGuestChange = (amount: number) => {
        setGuestCount(prev => Math.max(1, Math.min(12, prev + amount)));
    };

    const { totalBasePrice, fees, totalPrice } = React.useMemo(() => {
        const fees = 100;
        let basePrice = 0;

        if (selectedDepartureId) {
            const departure = fixedDeparturesData.find(d => d.id === selectedDepartureId);
            basePrice = departure?.price || tour.price;
        } else if (selectedDate) {
            basePrice = tour.price; // Base price for a private trip
        }
        
        const totalBasePrice = basePrice * guestCount;
        const totalPrice = totalBasePrice > 0 ? totalBasePrice + fees : 0;
        
        return { totalBasePrice, fees, totalPrice };
    }, [selectedDate, selectedDepartureId, guestCount]);

    const isBookingOptionSelected = selectedDate || selectedDepartureId;

    const departureYears = React.useMemo(() => {
        const years = new Set(fixedDeparturesData.map(d => d.startDate.getFullYear()));
        return Array.from(years).sort();
    }, []);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const filteredDepartures = React.useMemo(() => {
        return fixedDeparturesData.filter(dep => {
            const yearMatch = filterYear === 'all' || dep.startDate.getFullYear() === filterYear;
            const monthMatch = filterMonth === 'all' || dep.startDate.getMonth() === filterMonth;
            return yearMatch && monthMatch;
        });
    }, [filterYear, filterMonth]);

    const activeSectionName = sections.find(s => s.id === activeSection)?.name || 'Overview';
    
    if (loading) {
        return <TripDetailsSkeleton />;
    }

    if (error || !tour) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background-dark text-white p-4">
                <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
                <h1 className="text-2xl font-bold mb-2">Failed to Load Tour</h1>
                <p className="text-text-secondary mb-6 text-center max-w-md">
                    {error || "The tour you're looking for could not be found."}
                </p>
                <Link 
                    to="/" 
                    className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-full font-bold transition-colors"
                >
                    Return Home
                </Link>
            </div>
        );
    }
    
    return (
        <div className="trip-details-page-white-override">
            <Helmet>
                <title>{tour.meta_title || `${tour.name} - Nepal Visuals`}</title>
                <meta name="description" content={tour.meta_description || tour.description || `Experience ${tour.name} with Nepal Visuals.`} />
                <meta property="og:title" content={tour.meta_title || tour.name} />
                <meta property="og:description" content={tour.meta_description || tour.description || `Experience ${tour.name} with Nepal Visuals.`} />
                <meta property="og:image" content={tour.featured_image || ''} />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
            </Helmet>
            <div className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 ${isSticky ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
                <div className="relative container mx-auto px-4">
                    <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 p-2 flex items-center gap-4 shadow-lg transition-colors duration-300 rounded-b-2xl">
                        {/* Tour Info (Region Display) */}
                        <div className="hidden xl:flex flex-col min-w-[200px] flex-shrink-0">
                            <h3 className="font-bold text-black text-sm leading-tight truncate max-w-[250px]">{tour.name}</h3>
                            <div className="flex items-center gap-1 text-xs text-primary animate-pulse">
                                <span className="material-symbols-outlined text-[12px]">location_on</span>
                                <span className="uppercase tracking-wider font-bold">{tour.region || 'Nepal'}</span>
                            </div>
                        </div>

                        {/* Scrollable Nav */}
                        <div className="flex-1 overflow-x-auto flex items-center gap-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {sections.map(tab => (
                                <a 
                                    key={tab.id}
                                    href={`#${tab.id}`}
                                    onClick={(e) => handleTabClick(e, tab.id)}
                                    className={`relative px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap flex-shrink-0 group ${
                                        activeSection === tab.id 
                                            ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                                            : 'text-gray-600 hover:text-black hover:bg-gray-100'
                                    }`}
                                    aria-current={activeSection === tab.id ? 'page' : undefined}
                                >
                                    <span className="relative z-10">{tab.name}</span>
                                    {activeSection === tab.id && (
                                        <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    )}
                                </a>
                            ))}
                        </div>

                        <Link to="/booking/checkout" className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-full text-sm font-bold transition-all items-center gap-2 shadow-lg shadow-primary/20 flex whitespace-nowrap flex-shrink-0">
                            <span>Book Now</span>
                            <span className="material-symbols-outlined text-[18px] hidden sm:inline">arrow_forward</span>
                        </Link>
                    </div>
                </div>
            </div>

            <header ref={pageHeaderRef} className="relative -mt-[100px] min-h-[70vh] overflow-hidden rounded-b-2xl md:rounded-b-[3rem] row-start-1 col-start-1">
                <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url('${tour.featured_image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRhAgmyafMtZInsKcZjC6PERny9fQkTYXnQc2xe3Dn2hSTQ2D2bEPyiLHkfuqDOIamvdyHiV6lOBJgYm_mzEkiQeGcxj6XcjWqapph7IcKty8Mcbs7CdDGengbgwALm5rAVVQmydirCKo5JLlaeh-L3z0AJYecOSmxkI8TpR7pMITU12XLou8iXgEwQe7_3NbQK8rZDzw39TV_j5JnhmpBQ55T2U0LJGQROBZEKe8IxNVO4-xOcOfSMr99VgNtWGMAriy0J_zOV2il'}')` }}>
                </div>
                <div className="absolute inset-0 z-0 bg-gradient-to-t from-background-dark via-background-dark/50 to-transparent"></div>
            </header>

            {portalTarget && createPortal(
                <TourInfoOverlay 
                    tour={tour} 
                    averageRating={Number(averageRating)} 
                    reviewCount={reviewsData.length} 
                    onShareClick={() => setIsShareModalOpen(true)} 
                />,
                portalTarget
            )}
            <main className="flex-grow pt-12 pb-16 px-4 md:px-8 lg:px-16 container mx-auto max-w-7xl row-start-2">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-16">
                        {/* Overview Section */}
                        <section id="overview" ref={overviewRef}>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-surface-dark p-4 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl text-primary mb-2">hiking</span>
                                    <p className="text-xs text-text-secondary uppercase">Duration</p>
                                    <p className="text-lg font-bold text-white">{tour.duration} Days</p>
                                </div>
                                <div className="bg-surface-dark p-4 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl text-secondary mb-2">bar_chart</span>
                                    <p className="text-xs text-text-secondary uppercase">Difficulty</p>
                                    <p className="text-lg font-bold text-white">{tour.difficulty}</p>
                                </div>
                                <div className="bg-surface-dark p-4 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl text-primary mb-2">bed</span>
                                    <p className="text-xs text-text-secondary uppercase">Accommodation</p>
                                    <p className="text-lg font-bold text-white">Teahouse</p>
                                </div>
                                <div className="bg-surface-dark p-4 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl text-secondary mb-2">restaurant</span>
                                    <p className="text-xs text-text-secondary uppercase">Meals Included</p>
                                    <p className="text-lg font-bold text-white">All Meals</p>
                                </div>
                                <div className="bg-surface-dark p-4 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl text-primary mb-2">groups</span>
                                    <p className="text-xs text-text-secondary uppercase">Max Group Size</p>
                                    <p className="text-lg font-bold text-white">12 People</p>
                                </div>
                                <div className="bg-surface-dark p-4 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl text-secondary mb-2">verified_user</span>
                                    <p className="text-xs text-text-secondary uppercase">Guide</p>
                                    <p className="text-lg font-bold text-white">Certified</p>
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-6">Overview</h2>
                            <ExpandableContent 
                                content={tour.description} 
                                className="mb-8"
                            />

                            <div className="bg-surface-dark border border-white/5 rounded-2xl p-6">
                                <h3 className="text-xl font-bold text-white mb-4">Trek Duration Breakdown</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                    <div className="bg-surface-darker p-4 rounded-xl border border-white/5">
                                        <span className="material-symbols-outlined text-2xl text-secondary mb-2">calendar_month</span>
                                        <p className="text-xs text-text-secondary uppercase">Total Journey</p>
                                        <p className="text-lg font-bold text-white">{tour.duration} Days</p>
                                    </div>
                                    <div className="bg-surface-darker p-4 rounded-xl border border-white/5">
                                        <span className="material-symbols-outlined text-2xl text-primary mb-2">hiking</span>
                                        <p className="text-xs text-text-secondary uppercase">On The Trail</p>
                                        <p className="text-lg font-bold text-white">11 Days</p>
                                    </div>
                                    <div className="bg-surface-darker p-4 rounded-xl border border-white/5">
                                        <span className="material-symbols-outlined text-2xl text-secondary mb-2">flight_land</span>
                                        <p className="text-xs text-text-secondary uppercase">In Kathmandu</p>
                                        <p className="text-lg font-bold text-white">3 Days</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Trip Highlights Section */}
                        <section id="highlights" ref={highlightsRef}>
                            <h2 className="text-3xl font-bold text-white mb-8">Trip Highlights</h2>
                            <TourHighlights highlights={tour.tour_highlights || []} />
                            {(!tour.tour_highlights || tour.tour_highlights.length === 0) && (
                                <p className="text-text-secondary">No highlights available for this tour.</p>
                            )}
                        </section>
                        
                        {/* Gallery Section */}
                        <section id="gallery" ref={galleryRef}>
                            <h2 className="text-3xl font-bold text-white mb-8">Photo Gallery</h2>
                            {galleryImages.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[450px]">
                                    <div 
                                        className="col-span-2 row-span-2 rounded-2xl overflow-hidden cursor-pointer group relative"
                                        onClick={() => openGallery(0)}
                                    >
                                        <img 
                                            src={galleryImages[0].src} 
                                            alt={galleryImages[0].alt} 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                            loading="lazy"
                                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/1200x800?text=Image+Unavailable'; }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                    {galleryImages.slice(1, 5).map((image, index) => (
                                        <div 
                                            key={index}
                                            className="rounded-2xl overflow-hidden cursor-pointer group relative"
                                            onClick={() => openGallery(index + 1)}
                                        >
                                            <img 
                                                src={image.src} 
                                                alt={image.alt} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                                loading="lazy"
                                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/800x600?text=No+Image'; }}
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            {index === 3 && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                                    <div className="text-center">
                                                        <span className="material-symbols-outlined text-white text-4xl">collections</span>
                                                        <p className="text-white font-bold">View Gallery</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-text-secondary text-sm p-4 bg-surface-darker rounded-xl">
                                    No images available for this tour.
                                </div>
                            )}
                        </section>

                        {/* Weather Forecast Section */}
                        <section id="weather" ref={weatherRef}>
                            <h2 className="text-3xl font-bold text-white mb-8">7-Day Weather Forecast</h2>
                            <div className="bg-surface-dark border border-white/5 rounded-3xl p-6">
                                <div className="flex items-center gap-3 text-sm text-text-secondary mb-6">
                                    <span className="material-symbols-outlined text-base">info</span>
                                    <p>Forecast for {weatherLocation}. Weather can change rapidly in the mountains.</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                                    {weatherData.length > 0 ? (
                                        weatherData.map((forecast, index) => {
                                            const { icon, color } = getWeatherIcon(forecast.condition);
                                            return (
                                                <div key={index} className={`p-4 rounded-2xl flex flex-col items-center text-center transition-all duration-300 ${index === 0 ? 'bg-primary/10 border-2 border-primary' : 'bg-surface-darker border border-transparent hover:border-white/10'}`}>
                                                    <p className={`font-bold ${index === 0 ? 'text-primary' : 'text-white'}`}>{forecast.day}</p>
                                                    <div className="my-3">
                                                        <span className={`material-symbols-outlined text-4xl ${color}`}>{icon}</span>
                                                    </div>
                                                    <div className="font-bold">
                                                        <span className="text-white">{forecast.high}°</span>
                                                        <span className="text-text-secondary/70"> / {forecast.low}°</span>
                                                    </div>
                                                    <p className="text-xs text-text-secondary mt-1 capitalize">{forecast.condition}</p>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="col-span-full text-center text-text-secondary py-8">
                                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">cloud_off</span>
                                            <p>Weather forecast unavailable for this location.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Itinerary Section */}
                        <section id="itinerary" ref={itineraryRef}>
                            <h2 className="text-3xl font-bold text-white mb-8">Daily Itinerary</h2>
                            <div className="relative">
                                {tour.itineraries && tour.itineraries.map((item, index) => (
                                    <ItineraryItem
                                        key={item.id}
                                        day={item.day_number}
                                        title={item.title}
                                        description={item.description || ''}
                                        isLast={index === (tour.itineraries?.length || 0) - 1}
                                        open={index === 0}
                                    />
                                ))}
                                {(!tour.itineraries || tour.itineraries.length === 0) && (
                                    <p className="text-text-secondary">Itinerary details are coming soon.</p>
                                )}
                            </div>
                        </section>

                        {/* Route Map Section */}
                        {tour.route_geojson && (
                            <section id="map" ref={mapRef}>
                                <h2 className="text-3xl font-bold text-white mb-8">Route Map</h2>
                                <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                                    <TrekMap geoJsonData={parsedGeoJson} />
                                </div>
                            </section>
                        )}
                        
                        {/* FAQ Section */}
                        <section id="faq" ref={faqRef}>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
                            </div>
                            <div className="space-y-4">
                                <FaqItem title="How difficult is the Everest Base Camp Trek?" open={true}>
                                    The Everest Base Camp trek is considered a moderate to challenging hike. You do not need technical climbing skills or previous mountaineering experience. However, you should be reasonably fit and able to walk for 5-7 hours a day over hilly terrain with a light daypack. The primary challenge is the altitude, which is why our itinerary includes two specific acclimatization days to help your body adjust.
                                </FaqItem>
                                <FaqItem title="When is the best time to trek?">
                                    There are two main trekking seasons for Everest Base Camp. The pre-monsoon spring season (February to May) offers warmer temperatures and blooming rhododendrons. The post-monsoon autumn season (late September to November) provides the clearest skies and most spectacular mountain views, though it can be colder. We do not recommend trekking during the monsoon (June-August) or deep winter (January).
                                </FaqItem>
                                <FaqItem title="How do I handle altitude sickness?">
                                    Altitude sickness is a genuine concern, but manageable. Our itinerary is carefully designed with a slow ascent profile and rest days in Namche Bazaar and Dingboche. We recommend drinking 3-4 liters of water daily, walking at a slow steady pace ('bistari'), and avoiding alcohol. Our guides are trained in wilderness first aid and carry Oximeters to monitor your oxygen saturation daily.
                                </FaqItem>
                            </div>
                        </section>

                        {/* Reviews Section */}
                        <section id="reviews" ref={reviewsRef}>
                            <h2 className="text-3xl font-bold text-white mb-4">What Our Trekkers Say</h2>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 bg-surface-dark border border-white/5 rounded-2xl p-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-4xl font-black text-white">{averageRating}</span>
                                    <div className="flex flex-col">
                                        <StarRating rating={Math.round(parseFloat(averageRating))} />
                                        <p className="text-sm text-text-secondary">Based on {reviewsData.length} reviews</p>
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-white/10 hidden sm:block mx-4"></div>
                                <div className="flex-grow">
                                    <p className="text-text-secondary text-sm">We pride ourselves on creating unforgettable experiences. See what fellow adventurers have to say about their journey with us.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {reviewsData.map(review => (
                                    <ReviewCard key={review.id} review={review} />
                                ))}
                            </div>
                        </section>

                        {/* Similar Treks Section */}
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-8">Similar Treks You Might Like</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {similarTreksData.map(trek => (
                                    <SimilarTrekCard key={trek.id} trek={trek} />
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sticky Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-32 space-y-6">
                            <div className="bg-surface-dark rounded-3xl border border-white/5 p-6 shadow-xl shadow-black/20 text-center">
                                <p className="text-sm text-text-secondary uppercase tracking-wider mb-2">Starting From</p>
                                <div className="flex items-baseline justify-center gap-2 mb-2">
                                    <span className="text-4xl md:text-5xl font-bold text-white">${tour.price}</span>
                                    <span className="text-text-secondary text-xl line-through">${Math.round(tour.price * 1.2)}</span>
                                </div>
                                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-bold text-sm px-3 py-1 rounded-full border border-primary/20">
                                    <span className="material-symbols-outlined text-base">sell</span>
                                    <span>Early Bird Offer</span>
                                </div>
                            </div>
                            
                            <TourPricingCard
                                tour={tour}
                                selectedDate={selectedDate}
                                selectedDepartureId={selectedDepartureId}
                                onSelectDate={handleSelectDate}
                                onSelectDeparture={handleSelectDeparture}
                                guestCount={guestCount}
                                onGuestChange={handleGuestChange}
                                calendarOpen={isCalendarOpen}
                                setCalendarOpen={setIsCalendarOpen}
                                availableDates={availableDates}
                                departureYears={departureYears}
                                monthNames={monthNames}
                                filterYear={filterYear}
                                setFilterYear={setFilterYear}
                                filterMonth={filterMonth}
                                setFilterMonth={setFilterMonth}
                                formattedSelectedDate={formattedSelectedDate}
                            >
                                <Calendar 
                                    displayDate={displayDate}
                                    setDisplayDate={setDisplayDate}
                                    selectedDate={selectedDate}
                                    onSelectDate={handleSelectDate}
                                    availableDates={availableDates}
                                    onClose={() => setIsCalendarOpen(false)}
                                />
                            </TourPricingCard>
                        </div>
                    </div>
                </div>
            </main>

            {isShareModalOpen && (
                <div 
                    className="fixed inset-0 z-[2000] bg-background-dark/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" 
                    onClick={() => setIsShareModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="share-modal-title"
                >
                    <div 
                        className="relative w-full max-w-md bg-surface-dark rounded-3xl border border-white/10 shadow-2xl shadow-black/30 p-8 animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setIsShareModalOpen(false)}
                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/5 rounded-full transition-colors"
                            aria-label="Close share dialog"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <h2 id="share-modal-title" className="text-2xl font-bold text-white mb-2">Share this Adventure</h2>
                        <p className="text-text-secondary mb-6">Know someone who'd love this trek? Let them know!</p>
                        
                        <div className="flex flex-col gap-2">
                            <label htmlFor="trip-url" className="text-xs font-bold text-text-secondary uppercase">Trip Link</label>
                            <div className="flex items-center gap-2 bg-surface-darker border border-white/10 rounded-xl p-2">
                                <input 
                                    id="trip-url"
                                    type="text" 
                                    readOnly 
                                    value={window.location.href} 
                                    className="flex-grow bg-transparent text-white placeholder-white/70 focus:ring-0 border-none text-sm"
                                />
                                <button 
                                    onClick={handleCopyLink}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                                        isLinkCopied 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-primary hover:bg-primary-dark text-white'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-base">
                                        {isLinkCopied ? 'check' : 'content_copy'}
                                    </span>
                                    {isLinkCopied ? 'Copied!' : 'Copy Link'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {isGalleryOpen && (
                 <div 
                    className="fixed inset-0 z-[2000] bg-background-dark/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
                    onClick={closeGallery}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Photo Gallery"
                >
                    <button 
                        onClick={closeGallery}
                        className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
                        aria-label="Close gallery"
                    >
                        <span className="material-symbols-outlined text-3xl">close</span>
                    </button>
                    
                    <div className="relative w-full h-full flex items-center justify-center">
                        <button 
                            onClick={(e) => { e.stopPropagation(); showPrevImage(); }}
                            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
                            aria-label="Previous image"
                        >
                            <span className="material-symbols-outlined text-3xl">chevron_left</span>
                        </button>
                        
                        <div className="relative max-w-screen-lg max-h-[90vh] aspect-video animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                             <img 
                                src={galleryImages[currentImageIndex].src} 
                                alt={galleryImages[currentImageIndex].alt}
                                className="w-full h-full object-contain rounded-lg shadow-2xl shadow-black/50"
                            />
                        </div>

                        <button 
                             onClick={(e) => { e.stopPropagation(); showNextImage(); }}
                             className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
                             aria-label="Next image"
                        >
                            <span className="material-symbols-outlined text-3xl">chevron_right</span>
                        </button>
                        
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-4 py-2 rounded-full">
                            {currentImageIndex + 1} / {galleryImages.length}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripDetailsPage;
