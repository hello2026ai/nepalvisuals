import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Tour, TourService, ItineraryItem } from '../lib/services/tourService';
import { RichTextEditor } from '../components/common/RichTextEditor';
import { getCountries } from '../lib/utils/countries';
import FeaturedImageUpload from '../components/common/FeaturedImageUpload';
import { MultiImageUpload } from '../components/common/MultiImageUpload';
import FocusKeywordsInput from '../components/common/FocusKeywordsInput';
import RegionSelect from '../components/common/RegionSelect';
import PricingTab from './AdminTrekEditorPage-PricingTab';
import InclusionsTab from './AdminTrekEditorPage-InclusionsTab';
import FaqsTab from './AdminTrekEditorPage-FaqsTab';
import MapTab from './AdminTrekEditorPage-MapTab';
import TripHighlightsEditor from '../components/admin/TripHighlightsEditor';
import { MediaService } from '../lib/services/mediaService';

const TABS = ['Details', 'Pricing', 'Highlights', 'Itinerary', 'Inclusions', 'Images', 'FAQs', 'Map'];

const TabButton: React.FC<{ name: string; activeTab: string; setActiveTab: (name: string) => void; }> = ({ name, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(name)}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${activeTab === name ? 'bg-admin-primary/10 text-admin-primary' : 'text-admin-text-secondary hover:bg-gray-100'}`}
    >
        {name}
    </button>
);

const ICON_LIST = ['landscape', 'photo_camera', 'hiking', 'temple_buddhist', 'forest', 'star', 'groups', 'self_improvement', 'local_florist', 'filter_hdr', 'eco', 'verified_user', 'medical_services', 'synagogue', 'restaurant', 'bed', 'schedule'];

const IconPicker: React.FC<{ onSelect: (icon: string) => void, onClose: () => void }> = ({ onSelect, onClose }) => {
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div ref={pickerRef} className="absolute top-full left-0 mt-2 w-64 bg-admin-surface border border-admin-border rounded-lg shadow-lg p-2 z-20 grid grid-cols-5 gap-1">
            {ICON_LIST.map(icon => (
                <button
                    key={icon}
                    onClick={() => { onSelect(icon); onClose(); }}
                    className="w-full aspect-square flex items-center justify-center rounded-md hover:bg-admin-primary/10 text-admin-text-secondary hover:text-admin-primary transition-colors"
                    title={icon}
                >
                    <span className="material-symbols-outlined">{icon}</span>
                </button>
            ))}
        </div>
    );
};

interface TabProps {
    tour: Partial<Tour>;
    onChange: (updates: Partial<Tour>) => void;
}

const DetailsTab: React.FC<TabProps> = ({ tour, onChange }) => {
    const [slugAuto, setSlugAuto] = useState(true);
    const lastAutoSlug = useRef<string>('');
    const slugify = (input: string) =>
        input
            .toLowerCase()
            .trim()
            .replace(/[\s_]+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    const handleChange = (field: keyof Tour, value: any) => {
        onChange({ [field]: value });
    };

    // Field validation helpers
    const getFieldValidationClass = (field: keyof Tour, isRequired: boolean = false) => {
        const value = tour[field];
        const isEmpty = value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
        
        if (isRequired && isEmpty) {
            return 'border-red-300 focus:ring-red-500 focus:border-red-500';
        }
        
        return 'border-admin-border focus:ring-admin-primary focus:border-transparent';
    };

    const getFieldErrorMessage = (field: keyof Tour, label: string, isRequired: boolean = false) => {
        const value = tour[field];
        const isEmpty = value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
        
        if (isRequired && isEmpty) {
            return `${label} is required`;
        }
        
        return null;
    };

    return (
        <div className="space-y-8">
            {/* General Information */}
            <div className="bg-admin-surface rounded-lg border border-admin-border">
                <div className="p-6 border-b border-admin-border">
                    <h3 className="font-semibold text-admin-text-primary">General Information</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-admin-text-primary block mb-1">
                            Tour Title
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input 
                            type="text" 
                            value={tour.name || ''} 
                            onChange={(e) => {
                                const val = e.target.value;
                                handleChange('name', val);
                                const generated = slugify(val);
                                if (slugAuto && ((tour.url_slug || '') === '' || (tour.url_slug || '') === lastAutoSlug.current)) {
                                    lastAutoSlug.current = generated;
                                    onChange({ url_slug: generated });
                                }
                            }}
                            className={`w-full border rounded-lg text-sm focus:ring-2 focus:border-transparent transition ${
                                getFieldValidationClass('name', true)
                            }`}
                            aria-invalid={!tour.name || tour.name.trim().length === 0}
                            aria-describedby="name-error"
                        />
                        {(!tour.name || tour.name.trim().length === 0) && (
                            <p id="name-error" className="text-xs text-red-600 mt-1">Tour title is required</p>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-admin-text-primary block mb-1">
                            URL Slug
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="flex items-center">
                            <span className="px-3 py-2 bg-admin-background border border-r-0 border-admin-border rounded-l-lg text-sm text-admin-text-secondary">https://yourdomain.com/tour/</span>
                            <div className="relative w-full">
                                <input 
                                    type="text" 
                                    value={tour.url_slug || ''} 
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        handleChange('url_slug', val);
                                        if (val === '' || val === lastAutoSlug.current) {
                                            setSlugAuto(true);
                                        } else {
                                            setSlugAuto(false);
                                        }
                                    }}
                                    className={`w-full border rounded-r-lg text-sm focus:ring-2 focus:border-transparent transition pr-20 ${
                                        getFieldValidationClass('url_slug', true)
                                    }`}
                                    aria-invalid={!tour.url_slug || tour.url_slug.trim().length === 0}
                                    aria-describedby="url-slug-error"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    {slugAuto ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-admin-background text-admin-text-secondary text-xs">
                                            <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                            Auto
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSlugAuto(true);
                                                const generated = slugify(tour.name || '');
                                                lastAutoSlug.current = generated;
                                                onChange({ url_slug: generated });
                                            }}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-admin-background text-admin-text-secondary text-xs hover:text-admin-primary"
                                            title="Re-enable auto"
                                        >
                                            <span className="material-symbols-outlined text-sm">sync</span>
                                            Sync
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {(!tour.url_slug || tour.url_slug.trim().length === 0) && (
                            <p id="url-slug-error" className="text-xs text-red-600 mt-1">URL slug is required</p>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <RegionSelect 
                                label="Region"
                                value={tour.region || ''}
                                onChange={(value) => handleChange('region', value)}
                                required={true}
                                error={(!tour.region || tour.region.trim().length === 0) ? "Region is required" : undefined}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-admin-text-primary block mb-1">
                                Country
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            {(() => {
                                const countries = getCountries();
                                const current = tour.country || '';
                                const selectedValue = current.length === 2
                                    ? current
                                    : (countries.find(c => c.name.toLowerCase() === current.toLowerCase())?.code || '');
                                return (
                                    <select
                                        value={selectedValue}
                                        onChange={(e) => handleChange('country', e.target.value)}
                                        className={`w-full border rounded-lg text-sm focus:ring-2 focus:border-transparent transition ${
                                            !tour.country || tour.country.trim().length === 0
                                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                                : 'border-admin-border focus:ring-admin-primary focus:border-transparent'
                                        }`}
                                        aria-invalid={!tour.country || tour.country.trim().length === 0}
                                        aria-describedby="country-error"
                                    >
                                        <option value="">Select country...</option>
                                        {countries.map(c => (
                                            <option key={c.code} value={c.code}>{c.name}</option>
                                        ))}
                                    </select>
                                );
                            })()}
                            {(!tour.country || tour.country.trim().length === 0) && (
                                <p id="country-error" className="text-xs text-red-600 mt-1">Country is required</p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium text-admin-text-primary block mb-1">
                                Tour Duration (days)
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input 
                                type="number"
                                inputMode="numeric"
                                min={1}
                                step={1}
                                placeholder="e.g., 14"
                                value={tour.duration || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const num = val === '' ? '' : String(Math.max(1, Math.floor(Number(val))));
                                    handleChange('duration', num);
                                }}
                                aria-invalid={tour.duration !== null && tour.duration !== undefined && tour.duration.trim() !== '' && (isNaN(Number(tour.duration)) || Number(tour.duration) < 1 || Number(tour.duration) > 365)}
                                aria-describedby="duration-help"
                                className={`w-full border rounded-lg text-sm focus:ring-2 focus:border-transparent transition ${
                                    tour.duration !== null && tour.duration !== undefined && tour.duration.trim() !== '' && (isNaN(Number(tour.duration)) || Number(tour.duration) < 1 || Number(tour.duration) > 365)
                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                        : 'border-admin-border focus:ring-admin-primary focus:border-transparent'
                                }`} 
                            />
                            <p id="duration-help" className="text-xs text-admin-text-secondary mt-1">Enter a positive number of days (1-365).</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-admin-text-primary block mb-1">Difficulty Level</label>
                            <select 
                                value={tour.difficulty || ''} 
                                onChange={(e) => handleChange('difficulty', e.target.value)}
                                className="w-full border border-admin-border rounded-lg text-sm focus:ring-2 focus:ring-admin-primary focus:border-transparent transition"
                            >
                                <option value="">Select difficulty...</option>
                                <option value="Easy">Easy</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Challenging">Challenging</option>
                                <option value="Strenuous">Strenuous</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-admin-text-primary block mb-1">
                            Description
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <RichTextEditor
                            content={tour.description || ''}
                            onChange={(html) => handleChange('description', html)}
                            placeholder="Detailed description of the tour..."
                        />
                        {(!tour.description || tour.description.trim().length === 0) && (
                            <p className="text-xs text-red-600 mt-1">Description is required for published tours</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Featured Image */}
            <div className="bg-admin-surface rounded-lg border border-admin-border">
                <div className="p-6 border-b border-admin-border">
                    <h3 className="font-semibold text-admin-text-primary">Featured Image</h3>
                </div>
                <div className="p-6">
                    <FeaturedImageUpload
                        value={tour.featured_image}
                        onChange={(value) => handleChange('featured_image', value)}
                    />
                </div>
            </div>

            {/* SEO Settings */}
            <div className="bg-admin-surface rounded-lg border border-admin-border" id="seo-settings">
                <div className="p-6 border-b border-admin-border">
                    <h3 className="font-semibold text-admin-text-primary">SEO Settings</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-admin-text-primary block mb-1">Meta Title</label>
                        <input 
                            type="text" 
                            placeholder="Title tag for SEO" 
                            value={tour.meta_title || ''} 
                            onChange={(e) => handleChange('meta_title', e.target.value)}
                            className="w-full border border-admin-border rounded-lg text-sm focus:ring-2 focus:ring-admin-primary focus:border-transparent transition" 
                        />
                        <p className="text-xs text-admin-text-secondary mt-1">Recommended length: 50-60 characters</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-admin-text-primary block mb-1">Meta Description</label>
                        <textarea 
                            rows={3} 
                            placeholder="Meta description for search results..." 
                            value={tour.meta_description || ''} 
                            onChange={(e) => handleChange('meta_description', e.target.value)}
                            className="w-full border border-admin-border rounded-lg text-sm focus:ring-2 focus:ring-admin-primary focus:border-transparent transition"
                        ></textarea>
                        <p className="text-xs text-admin-text-secondary mt-1">Recommended length: 150-160 characters</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

const Calendar: React.FC<{
    value: string;
    onChange: (date: string) => void;
    onClose: () => void;
}> = ({ value, onChange, onClose }) => {
    const parseDate = (dateString: string) => {
        if (!dateString) return new Date();
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const [displayDate, setDisplayDate] = useState(parseDate(value));

    const daysInMonth = useMemo(() => new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate(), [displayDate]);
    const firstDayOfMonth = useMemo(() => new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay(), [displayDate]);

    const handleDateClick = (day: number) => {
        // Adjust for timezone offset to ensure the date string is correct local time
        const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
        const offset = newDate.getTimezoneOffset();
        const adjustedDate = new Date(newDate.getTime() - (offset * 60 * 1000));
        onChange(adjustedDate.toISOString().split('T')[0]);
        onClose();
    };
    
    const changeMonth = (offset: number) => {
        setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + offset, 1));
    };

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const leadingEmptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    return (
        <div className="absolute top-full left-0 mt-2 w-72 bg-admin-surface border border-admin-border rounded-lg shadow-lg p-4 z-10">
            <div className="flex items-center justify-between mb-2">
                <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-admin-background"><span className="material-symbols-outlined text-lg">chevron_left</span></button>
                <span className="font-semibold text-sm">{displayDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-admin-background"><span className="material-symbols-outlined text-lg">chevron_right</span></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-admin-text-secondary">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {leadingEmptyDays.map(i => <div key={`empty-${i}`}></div>)}
                {days.map(day => {
                    const dateStr = new Date(displayDate.getFullYear(), displayDate.getMonth(), day).toISOString().split('T')[0]; // Very rough approximation for highlighting
                    // Better to compare date objects
                    const currentRenderDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
                    // Check if selected value matches
                    const isSelected = value === currentRenderDate.toISOString().split('T')[0]; // Simple string match
                    
                    return (
                        <button
                            key={day}
                            onClick={() => handleDateClick(day)}
                            className={`w-full aspect-square text-sm rounded-full transition-colors ${
                                isSelected ? 'bg-admin-primary text-white' : 'hover:bg-admin-background'
                            }`}
                        >
                            {day}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

const ImagesTab: React.FC<TabProps> = ({ tour, onChange }) => {
    const handleChange = (field: keyof Tour, value: any) => {
        onChange({ [field]: value });
    };

    return (
        <div className="space-y-8">
            <div className="bg-admin-surface rounded-lg border border-admin-border">
                <div className="p-6 border-b border-admin-border">
                    <h3 className="font-semibold text-admin-text-primary">Gallery Images</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-admin-text-primary block mb-1">Gallery Images</label>
                        <MultiImageUpload 
                            images={tour.gallery_images || []}
                            onChange={(images) => handleChange('gallery_images', images)}
                            onUpload={async (files) => {
                                const uploadedUrls: string[] = [];
                                for (const file of files) {
                                    const uploaded = await MediaService.uploadFile(file);
                                    if (!uploaded.public_url) {
                                        throw new Error(`Upload succeeded but no public URL was returned for ${file.name}`);
                                    }
                                    uploadedUrls.push(uploaded.public_url);
                                }
                                return uploadedUrls;
                            }}
                            maxImages={10}
                            maxSizeMB={10}
                            acceptedFormats={['image/jpeg', 'image/png', 'image/webp', 'image/gif']}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
};

const PlaceholderTab: React.FC = () => {
    return <div className="text-admin-text-secondary p-4 bg-gray-50 rounded-lg">This section is under development. Please save the tour details first.</div>;
};

import { tourSchema } from '../lib/utils/validation';

const AdminTrekEditorPage: React.FC = () => {
    const { trekId } = useParams<{ trekId: string }>();
    const isEditing = !!trekId && trekId !== 'new';
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [loading, setLoading] = useState(false);
    const [savingStatus, setSavingStatus] = useState<'Draft' | 'Published' | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [tour, setTour] = useState<Partial<Tour>>({
        name: '',
        url_slug: '',
        status: 'Draft',
        price: 0,
        country: 'Nepal',
        difficulty: 'Moderate',
        category: 'Adventure'
    });

    const loadTourData = async () => {
        if (isEditing && trekId) {
            try {
                console.log('Loading tour data for ID:', trekId);
                const data = await TourService.getTourById(trekId);
                if (data) {
                    console.log('Tour data loaded successfully:', {
                        id: data.id,
                        name: data.name,
                        hasFeaturedImage: !!data.featured_image
                    });
                    setTour(data);
                } else {
                    console.warn('No tour data returned for ID:', trekId);
                    setSaveError('Tour not found. It may have been deleted.');
                }
            } catch (err: any) {
                console.error('Failed to load tour data:', err);
                const errorMessage = err.message || 'Failed to load tour data. Please refresh the page.';
                setSaveError(errorMessage);
                
                // If tour not found, redirect to tours list
                if (err.message?.includes('not found')) {
                    setTimeout(() => {
                        navigate('/admin/tours');
                    }, 3000);
                }
            }
        }
    };

    useEffect(() => {
        if (isEditing && trekId) {
            setLoading(true);
            loadTourData().finally(() => setLoading(false));
        }
    }, [isEditing, trekId]);

    useEffect(() => {
        const origin = window.location.origin;
        const basePath = isEditing ? `/#/admin/trek/edit/${trekId}` : '/#/admin/trek/new';
        const sectionUrl = `${origin}${basePath}`;
        const sectionCanonical = `${sectionUrl}?section=seo-settings`;
        const existingManagedCanonicals = Array.from(
            document.head.querySelectorAll('link[rel="canonical"][data-canonical-section="seo-settings"]')
        );
        existingManagedCanonicals.forEach(el => el.parentElement?.removeChild(el));
        const headLink = document.createElement('link');
        headLink.setAttribute('rel', 'canonical');
        headLink.setAttribute('href', encodeURI(sectionCanonical));
        headLink.setAttribute('data-canonical-section', 'seo-settings');
        document.head.appendChild(headLink);
        const sectionEl = document.getElementById('seo-settings');
        if (sectionEl) {
            const tables = Array.from(sectionEl.querySelectorAll('table'));
            const existingTableCanonicals = Array.from(
                sectionEl.querySelectorAll('link[rel="canonical"][data-canonical-section="seo-settings-table"]')
            );
            existingTableCanonicals.forEach(el => el.parentElement?.removeChild(el));
            tables.forEach((table, idx) => {
                const tableUrl = `${sectionUrl}?section=seo-settings&table=${encodeURIComponent(String(idx + 1))}`;
                const linkEl = document.createElement('link');
                linkEl.setAttribute('rel', 'canonical');
                linkEl.setAttribute('href', encodeURI(tableUrl));
                linkEl.setAttribute('data-canonical-section', 'seo-settings-table');
                table.parentElement?.insertBefore(linkEl, table);
            });
            const urlsToValidate = [sectionCanonical, ...tables.map((_, idx) => `${sectionUrl}?section=seo-settings&table=${encodeURIComponent(String(idx + 1))}`)];
            const shouldValidate = !import.meta.env.DEV;
            if (shouldValidate) {
                urlsToValidate.forEach(async (u) => {
                    try {
                        const res = await fetch(u, { method: 'HEAD' });
                        if (!res.ok) {
                            console.warn('Canonical URL did not return 200:', u, res.status);
                        }
                    } catch (e) {
                        console.warn('Canonical URL validation failed:', u, e);
                    }
                });
            }
        }
    }, [isEditing, trekId]);

    const isDurationValid = useMemo(() => {
        // Duration is valid if it's null (for drafts) or a positive number
        if (tour.duration === null || tour.duration === undefined) return true;
        if (typeof tour.duration !== 'number') return false;
        return tour.duration >= 1 && tour.duration <= 365;
    }, [tour.duration]);

    const validateTourData = (tourData: Partial<Tour>, status: 'Published' | 'Draft' = 'Draft'): { isValid: boolean; errors: string[] } => {
        if (status === 'Draft') return { isValid: true, errors: [] }; // Relaxed validation for drafts

        const result = tourSchema.safeParse(tourData);
        
        if (!result.success) {
            const errors = result.error.issues.map(e => e.message);
            return { isValid: false, errors };
        }
        
        return { isValid: true, errors: [] };
    };

    const handleSave = async (status: 'Published' | 'Draft') => {
        if (status === 'Published') {
            if (!window.confirm('Are you sure you want to publish this tour? It will become visible to the public immediately.')) {
                return;
            }
        }

        setSaveError(null);
        setLoading(true);
        setSavingStatus(status);
        
        try {
            // Prepare tour data - only include fields that exist in the database schema
            // This prevents errors from trying to update non-existent columns
            const safeFields = [
                'name', 'url_slug', 'destination', 'region', 'country', 'category',
                'status', 'price', 'duration', 'difficulty', 'guide_language', 'tour_type',
                'description', 'meta_title', 'meta_description', 'featured_image', 'published_at',
                'route_geojson'
            ];
            
            // Create a safe data object with only valid database fields
            const tourData: any = { status };
            
            // Only include fields that exist in the database schema
            safeFields.forEach(field => {
                if (tour[field as keyof Tour] !== undefined) {
                    tourData[field] = tour[field as keyof Tour];
                }
            });

            if (tour.gallery_images !== undefined) {
                const invalidGalleryItem = (tour.gallery_images as any[]).find((img) => typeof img !== 'string');
                if (invalidGalleryItem) {
                    throw new Error('Gallery images must finish uploading before saving');
                }
                tourData.gallery_images = tour.gallery_images;
            }
            
            // Ensure status is set to the requested status, overriding current tour state
            tourData.status = status;
            // Explicitly set/clear published_at for clarity (service also handles this)
            if (status === 'Published') {
                tourData.published_at = new Date().toISOString();
            } else {
                tourData.published_at = null;
            }
            
            // Set defaults for required fields only if they're null/undefined
            tourData.country = tourData.country ?? 'Nepal';
            tourData.difficulty = tourData.difficulty ?? 'Moderate';
            tourData.category = tourData.category ?? 'Adventure';
            
            // Validate tour data with status-specific requirements
            const validation = validateTourData(tourData, status);
            if (!validation.isValid) {
                // Format errors with better readability
                const formattedErrors = validation.errors.map((error, index) => 
                    `${index + 1}. ${error}`
                ).join('\n');
                setSaveError(formattedErrors);
                setLoading(false);
                setIsFormDirty(false); // Keep form dirty to preserve user input
                return;
            }
            
            // Log the data being saved for debugging
            console.log('Saving tour data:', {
                id: trekId,
                isEditing,
                status,
                tourData: { ...tourData, featured_image: tourData.featured_image ? '[Image Data]' : null }
            });
            
            // Create a timeout for the save operation
            const saveTimeout = setTimeout(() => {
                throw new Error('Save operation timed out. Please check your connection and try again.');
            }, 30000); // 30 second timeout
            
            let result;
            if (isEditing && trekId) {
                result = await TourService.updateTour(trekId, tourData);
                clearTimeout(saveTimeout);
                
                // Show success notification instead of alert
                setSaveError(null);
                setIsFormDirty(false);
                
                // Show a subtle success message
                const successMessage = document.createElement('div');
                successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                successMessage.textContent = status === 'Published' ? 'Tour published successfully!' : 'Tour updated successfully!';
                document.body.appendChild(successMessage);
                setTimeout(() => successMessage.remove(), 3000);
                
                // Refresh the tour data after successful update
                await loadTourData();
            } else {
                result = await TourService.createTour(tourData);
                clearTimeout(saveTimeout);
                
                // Show success notification
                setSaveError(null);
                setIsFormDirty(false);
                
                const successMessage = document.createElement('div');
                successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                successMessage.textContent = status === 'Published' ? 'Tour published successfully!' : 'Tour created successfully!';
                document.body.appendChild(successMessage);
                setTimeout(() => successMessage.remove(), 3000);
                
                navigate(`/admin/trek/edit/${result.id}`);
            }
            
        } catch (err: any) {
            console.error('Save error details:', err);
            
            // Handle different types of errors
            let errorMessage = 'Failed to save tour. Please try again.';
            
            if (err.message?.includes('timeout')) {
                errorMessage = 'Save operation timed out. Please check your connection and try again.';
            } else if (err.message?.includes('network')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (err.message?.includes('validation')) {
                errorMessage = 'Validation error: ' + err.message;
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setSaveError(errorMessage);
            
            // Show error notification
            const errorNotification = document.createElement('div');
            errorNotification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            errorNotification.textContent = errorMessage;
            document.body.appendChild(errorNotification);
            setTimeout(() => errorNotification.remove(), 5000);
            
        } finally {
            setLoading(false);
            setSavingStatus(null);
        }
    };

    if (loading && isEditing && !tour.id) return (
        <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-primary"></div>
                <div>
                    <p className="text-admin-text-primary font-medium">Loading tour data...</p>
                    <p className="text-sm text-admin-text-secondary mt-1">Please wait while we fetch the tour information.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <Link to="/admin/tours" className="inline-flex items-center gap-2 text-sm font-semibold text-admin-text-secondary hover:text-admin-primary mb-4">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Tours
                </Link>
                <div className="sm:flex sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-admin-text-primary">
                            {isEditing ? 'Edit Tour' : 'Create New Tour'}
                        </h1>
                        <p className="mt-1 text-sm text-admin-text-secondary">
                            {isEditing ? `Editing tour ID: ${trekId}` : 'Fill in the details for the new tour.'}
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center gap-3">
                        {isFormDirty && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">
                                <span className="material-symbols-outlined text-sm">warning</span>
                                Unsaved changes
                            </span>
                        )}
                         <button 
                            onClick={() => handleSave('Draft')}
                            disabled={loading}
                            title={loading ? 'Saving...' : 'Save as draft (allows incomplete data)'}
                            className={`px-4 py-2 border border-admin-border rounded-lg text-sm font-semibold transition-colors ${
                                loading 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'hover:bg-admin-background'
                            }`}
                        >
                            {loading && savingStatus === 'Draft' ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin w-4 h-4 border-2 border-admin-primary border-t-transparent rounded-full"></span>
                                    Saving...
                                </span>
                            ) : (
                                'Save as Draft'
                            )}
                        </button>
                        <button 
                            onClick={() => handleSave('Published')}
                            disabled={loading}
                            title={loading ? 'Publishing...' : 'Publish tour (requires all required fields)'}
                            className={`px-4 py-2 bg-admin-primary text-white font-semibold rounded-lg shadow-sm transition-colors ${
                                loading 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'hover:bg-admin-primary-hover'
                            }`}
                        >
                            {loading && savingStatus === 'Published' ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                                    Publishing...
                                </span>
                            ) : (
                                'Publish Tour'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {saveError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-red-600 mt-0.5">error</span>
                        <div className="flex-1">
                            <span className="text-sm font-medium text-red-800">Save Error</span>
                            <p className="mt-1 text-sm text-red-700">{saveError}</p>
                            <div className="mt-2 flex gap-2">
                                <button 
                                    onClick={() => setSaveError(null)}
                                    className="text-xs text-red-600 hover:text-red-800 underline"
                                >
                                    Dismiss
                                </button>
                                <button 
                                    onClick={() => {
                                        console.log('Current tour data:', tour);
                                        alert('Tour data logged to console for debugging');
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800 underline"
                                >
                                    Debug Info
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="border-b border-admin-border mb-8">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                    {TABS.map(tab => (
                        <TabButton key={tab} name={tab} activeTab={activeTab} setActiveTab={setActiveTab} />
                    ))}
                </div>
            </div>

            <div>
                {activeTab === 'Details' && <DetailsTab tour={tour} onChange={(updates) => {
                    setTour(prev => ({ ...prev, ...updates }));
                    setIsFormDirty(true);
                }} />}
                {activeTab === 'Pricing' && <PricingTab tour={tour} onChange={(updates) => {
                    setTour(prev => ({ ...prev, ...updates }));
                    setIsFormDirty(true);
                }} />}
                
                {activeTab === 'Highlights' && (
                    tour.id ? (
                        <TripHighlightsEditor 
                            tourId={tour.id} 
                            highlights={tour.tour_highlights || []} 
                            onUpdate={loadTourData}
                            itinerary={tour.itineraries || []} 
                        />
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">save</span>
                            <p className="text-gray-500">Please save the tour details first to add highlights.</p>
                        </div>
                    )
                )}

                {activeTab === 'Images' && <ImagesTab tour={tour} onChange={(updates) => {
                    setTour(prev => ({ ...prev, ...updates }));
                    setIsFormDirty(true);
                }} />}
                
                {activeTab === 'Itinerary' && <ItineraryTab tour={tour as { id: string; itineraries?: ItineraryItem[] }} refreshTour={loadTourData} />}
                
                {activeTab === 'Inclusions' && <InclusionsTab tour={tour} onChange={(updates) => {
                    setTour(prev => ({ ...prev, ...updates }));
                    setIsFormDirty(true);
                }} refreshTour={loadTourData} />}

                {activeTab === 'FAQs' && <FaqsTab tour={tour} onChange={(updates) => {
                    setTour(prev => ({ ...prev, ...updates }));
                    setIsFormDirty(true);
                }} refreshTour={loadTourData} />}

                {activeTab === 'Map' && <MapTab tour={tour} onChange={(updates) => {
                    setTour(prev => ({ ...prev, ...updates }));
                    setIsFormDirty(true);
                }} />}
            </div>

             <div className="mt-8 pt-6 border-t border-admin-border flex justify-end gap-3">
                <Link to="/admin/tours" className="px-4 py-2 border border-admin-border rounded-lg text-sm font-semibold hover:bg-admin-background transition-colors">Cancel</Link>
                 <button 
                    onClick={() => handleSave('Published')}
                    disabled={loading}
                    title={loading ? 'Publishing...' : 'Publish tour (requires all required fields)'}
                    className={`px-4 py-2 bg-admin-primary text-white font-semibold rounded-lg shadow-sm transition-colors ${
                        loading 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-admin-primary-hover'
                    }`}
                >
                    {loading && savingStatus === 'Published' ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                            Publishing...
                        </span>
                    ) : (
                        'Publish Tour'
                    )}
                </button>
            </div>
        </div>
    );
};

export default AdminTrekEditorPage;

export const ItineraryTab: React.FC<{
    tour: { id: string; itineraries?: ItineraryItem[] };
    refreshTour: () => void;
}> = ({ tour, refreshTour }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const startAdd = () => {
        setIsAdding(true);
        setEditingId(null);
        setTitle('');
        setDescription('');
    };

    const startEdit = (item: ItineraryItem) => {
        setIsAdding(false);
        setEditingId(item.id);
        setTitle(item.title);
        setDescription(item.description || '');
    };

    const cancelForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setTitle('');
        setDescription('');
    };

    const handleAdd = async () => {
        if (!tour.id) return;
        const nextDay =
            (tour.itineraries?.reduce((max, i) => Math.max(max, i.day_number), 0) || 0) + 1;
        await TourService.addItineraryItem({
            tour_id: tour.id,
            day_number: nextDay,
            title,
            description,
            accommodation: null,
            meals: null
        });
        cancelForm();
        refreshTour();
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        await TourService.updateItineraryItem(editingId, {
            title,
            description
        });
        cancelForm();
        refreshTour();
    };

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm('Are you sure you want to delete this day?');
        if (!confirmed) return;
        await TourService.deleteItineraryItem(id);
        refreshTour();
    };

    return (
        <div className="bg-admin-surface rounded-lg border border-admin-border p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-admin-text-primary">Itinerary</h3>
                <button
                    onClick={startAdd}
                    className="px-3 py-2 bg-admin-primary text-white rounded-lg text-sm font-semibold"
                >
                    Add Day
                </button>
            </div>

            {isAdding && (
                <div className="space-y-3 mb-6">
                    <h4 className="font-medium">Add New Day</h4>
                    <input
                        aria-label="Title"
                        className="w-full border border-admin-border rounded-lg px-3 py-2 text-sm"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title"
                    />
                    <textarea
                        aria-label="Description"
                        className="w-full border border-admin-border rounded-lg px-3 py-2 text-sm"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleAdd}
                            className="px-3 py-2 bg-admin-primary text-white rounded-lg text-sm font-semibold"
                        >
                            Save Day
                        </button>
                        <button
                            onClick={cancelForm}
                            className="px-3 py-2 border border-admin-border rounded-lg text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {editingId && (
                <div className="space-y-3 mb-6">
                    <h4 className="font-medium">Edit Day</h4>
                    <input
                        aria-label="Title"
                        className="w-full border border-admin-border rounded-lg px-3 py-2 text-sm"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <textarea
                        aria-label="Description"
                        className="w-full border border-admin-border rounded-lg px-3 py-2 text-sm"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveEdit}
                            className="px-3 py-2 bg-admin-primary text-white rounded-lg text-sm font-semibold"
                        >
                            Save Day
                        </button>
                        <button
                            onClick={cancelForm}
                            className="px-3 py-2 border border-admin-border rounded-lg text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {!tour.itineraries || tour.itineraries.length === 0 ? (
                <p className="text-admin-text-secondary">No itinerary days added yet.</p>
            ) : (
                <div className="space-y-3">
                    {tour.itineraries.map((item) => (
                        <div key={item.id} className="p-3 rounded-lg border border-admin-border">
                            <div className="flex items-center justify-between">
                                <div>
                                    {(() => {
                                        const normalizedTitle = (item.title || '').trim();
                                        const startsWithDayPrefix = normalizedTitle.toLowerCase().startsWith(`day ${item.day_number}`);
                                        const isExactlyDay = normalizedTitle.toLowerCase() === `day ${item.day_number}`;
                                        const headerText = startsWithDayPrefix
                                            ? normalizedTitle
                                            : isExactlyDay
                                            ? `Day ${item.day_number}`
                                            : `Day ${item.day_number}: ${normalizedTitle}`;
                                        return (
                                            <p className="font-semibold text-admin-text-primary">
                                                {headerText}
                                            </p>
                                        );
                                    })()}
                                    {item.description && (
                                        <p className="text-admin-text-secondary text-sm">
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startEdit(item)}
                                        className="p-2 text-admin-text-secondary hover:text-admin-primary rounded-md"
                                    >
                                        edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-admin-text-secondary hover:text-red-600 rounded-md"
                                    >
                                        delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
