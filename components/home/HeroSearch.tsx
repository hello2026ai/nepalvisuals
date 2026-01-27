import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../lib/hooks/useDebounce';
import { TourService, Tour } from '../../lib/services/tourService';
import { SearchSuggestionSkeleton } from '../skeletons/SearchSuggestionSkeleton';

export const HeroSearch: React.FC = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [dropdownRect, setDropdownRect] = useState<{ left: number; top: number; width: number } | null>(null);
    
    const debouncedQuery = useDebounce(query, 300);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Measure position for portal
    useLayoutEffect(() => {
        const updateRect = () => {
            if (!containerRef.current) return;
            const r = containerRef.current.getBoundingClientRect();
            // Only update if values actually changed to avoid loops
            setDropdownRect(prev => {
                if (prev && prev.left === r.left && prev.top === r.bottom && prev.width === r.width) {
                    return prev;
                }
                return { left: r.left, top: r.bottom, width: r.width };
            });
        };

        if (isOpen) {
            updateRect();
            // Immediate update for any layout shifts
            requestAnimationFrame(updateRect);
        }
        
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);
        
        return () => {
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [isOpen]);

    // Fetch suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!debouncedQuery.trim()) {
                setSuggestions([]);
                setIsOpen(false);
                return;
            }

            setLoading(true);
            try {
                // Fetch only published tours matching the search term
                const { data } = await TourService.getAllTours({ 
                    searchTerm: debouncedQuery, 
                    limit: 5,
                    status: 'Published' 
                });
                setSuggestions(data);
                setIsOpen(true);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                setSuggestions([]);
                // Ensure dropdown opens to show no results state if query exists
                if (debouncedQuery.trim()) {
                    setIsOpen(true);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [debouncedQuery]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev > -1 ? prev - 1 : prev));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSelect(suggestions[selectedIndex]);
                } else {
                    // If no suggestion selected, perform full search
                    handleSearch();
                }
                break;
            case 'Escape':
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    };

    const handleSelect = (tour: Tour) => {
        if (!tour.url_slug) {
            setError('Invalid tour URL');
            return;
        }

        setQuery(tour.name);
        setIsOpen(false);
        setIsNavigating(true);
        setError(null);

        try {
            navigate(`/trip/${tour.url_slug}`, {
                state: {
                    fromSearch: true,
                    searchQuery: query
                }
            });
        } catch (err) {
            console.error("Navigation failed", err);
            setError("Failed to redirect to trip page");
            setIsNavigating(false);
        }
    };

    const handleSearch = () => {
        setIsOpen(false);
        if (query.trim()) {
            navigate(`/tours?search=${encodeURIComponent(query)}`);
        }
    };

    return (
        <div 
            className="relative w-full max-w-2xl group z-[9999]" 
            ref={containerRef}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            
            <div className={`
                relative bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center shadow-2xl transition-all duration-300
                ${isOpen && suggestions.length > 0 ? 'rounded-t-2xl rounded-b-none bg-surface-dark/90' : 'rounded-full'}
            `}>
                <div className="pl-6 flex items-center gap-3 flex-1">
                    <span className="material-symbols-outlined text-white/70">search</span>
                    <input 
                        ref={inputRef}
                        className="w-full bg-transparent border-none text-white placeholder-white/70 focus:ring-0 text-lg py-2" 
                        placeholder="Where do you want to go?" 
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setIsOpen(true);
                            setSelectedIndex(-1);
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (query.trim()) setIsOpen(true);
                        }}
                        aria-label="Search treks"
                        aria-expanded={isOpen}
                        aria-controls="search-suggestions"
                        aria-activedescendant={selectedIndex >= 0 ? `suggestion-${suggestions[selectedIndex].id}` : undefined}
                        role="combobox"
                    />
                    {(loading || isNavigating) && (
                        <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full mr-2"></div>
                    )}
                </div>
                
                <div className="h-8 w-[1px] bg-white/20 mx-2 hidden sm:block"></div>
                
                <button 
                    onClick={handleSearch}
                    className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-primary/30 whitespace-nowrap"
                >
                    Search
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
                
                <button 
                    onClick={handleSearch}
                    className="sm:hidden p-3 bg-primary hover:bg-primary-dark text-white rounded-full transition-all shadow-lg"
                    aria-label="Search"
                >
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>

            {isOpen && (
                dropdownRect
                    ? createPortal(
                        <div
                            id="search-suggestions"
                            role="listbox"
                            style={{ position: 'fixed', left: dropdownRect.left, top: dropdownRect.top, width: dropdownRect.width, zIndex: 9999 }}
                            className="bg-surface-dark/95 backdrop-blur-xl border-x border-b border-white/10 rounded-b-2xl shadow-2xl overflow-hidden"
                        >
                            {loading ? (
                                <div className="py-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <SearchSuggestionSkeleton key={i} />
                                    ))}
                                </div>
                            ) : suggestions.length > 0 ? (
                                <ul className="py-2">
                                    {suggestions.map((tour, index) => (
                                        <li
                                            key={tour.id}
                                            id={`suggestion-${tour.id}`}
                                            role="option"
                                            aria-selected={index === selectedIndex}
                                            className={`
                                                px-6 py-3 cursor-pointer flex items-center gap-4 transition-colors
                                                ${index === selectedIndex ? 'bg-white/10 text-white' : 'text-text-secondary hover:bg-white/5 hover:text-white'}
                                            `}
                                            onClick={() => handleSelect(tour)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                        >
                                            <div className="h-10 w-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                                {tour.featured_image ? (
                                                    <img
                                                        src={tour.featured_image}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-white/20">
                                                        <span className="material-symbols-outlined text-sm">landscape</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate text-white">{tour.name}</div>
                                                <div className="text-xs text-white/50 truncate flex items-center gap-2">
                                                    <span>{tour.duration || 'N/A'}</span>
                                                    <span>•</span>
                                                    <span>{tour.difficulty || 'Moderate'}</span>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-white/30 text-sm -rotate-45">arrow_outward</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : query.trim() && !loading ? (
                                <div className="px-6 py-8 text-center text-text-secondary">
                                    <span className="material-symbols-outlined text-4xl mb-2 text-white/20">search_off</span>
                                    <p>No adventures found matching "{query}"</p>
                                </div>
                            ) : null}
                            {suggestions.length > 0 && (
                                <div className="px-4 py-3 border-t border-white/10 bg-white/5">
                                    <button
                                        onClick={handleSearch}
                                        className="w-full text-center text-sm text-primary hover:text-primary-light font-medium transition-colors"
                                    >
                                        View all results for "{query}"
                                    </button>
                                </div>
                            )}
                        </div>,
                        document.body
                    )
                    : (
                        <div
                            id="search-suggestions"
                            className="absolute top-full left-0 w-full bg-surface-dark/95 backdrop-blur-xl border-x border-b border-white/10 rounded-b-2xl shadow-2xl overflow-hidden z-[100]"
                            role="listbox"
                        >
                            {loading ? (
                                <div className="py-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <SearchSuggestionSkeleton key={i} />
                                    ))}
                                </div>
                            ) : suggestions.length > 0 ? (
                                <ul className="py-2">
                                    {suggestions.map((tour, index) => (
                                        <li
                                            key={tour.id}
                                            id={`suggestion-${tour.id}`}
                                            role="option"
                                            aria-selected={index === selectedIndex}
                                            className={`
                                                px-6 py-3 cursor-pointer flex items-center gap-4 transition-colors
                                                ${index === selectedIndex ? 'bg-white/10 text-white' : 'text-text-secondary hover:bg-white/5 hover:text-white'}
                                            `}
                                            onClick={() => handleSelect(tour)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                        >
                                            <div className="h-10 w-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                                {tour.featured_image ? (
                                                    <img
                                                        src={tour.featured_image}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-white/20">
                                                        <span className="material-symbols-outlined text-sm">landscape</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate text-white">{tour.name}</div>
                                                <div className="text-xs text-white/50 truncate flex items-center gap-2">
                                                    <span>{tour.duration || 'N/A'}</span>
                                                    <span>•</span>
                                                    <span>{tour.difficulty || 'Moderate'}</span>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-white/30 text-sm -rotate-45">arrow_outward</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : query.trim() && !loading ? (
                                <div className="px-6 py-8 text-center text-text-secondary">
                                    <span className="material-symbols-outlined text-4xl mb-2 text-white/20">search_off</span>
                                    <p>No adventures found matching "{query}"</p>
                                </div>
                            ) : null}
                            {suggestions.length > 0 && (
                                <div className="px-4 py-3 border-t border-white/10 bg-white/5">
                                    <button
                                        onClick={handleSearch}
                                        className="w-full text-center text-sm text-primary hover:text-primary-light font-medium transition-colors"
                                    >
                                        View all results for "{query}"
                                    </button>
                                </div>
                            )}
                        </div>
                    )
            )}
            {/* Error Message */}
            {error && (
                <div className="absolute top-full mt-2 w-full bg-red-500/90 text-white text-sm px-4 py-2 rounded-lg backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-2 z-50">
                    {error}
                </div>
            )}
        </div>
    );
};
