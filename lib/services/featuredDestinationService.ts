import { supabase } from '../supabaseClient';

export interface FeaturedDestination {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    price: string | null;
    duration: string | null;
    rating: number | null;
    link_url: string | null;
    display_order: number;
    is_active: boolean;
}

// Fallback data to use when the database table is missing
const FALLBACK_DESTINATIONS: FeaturedDestination[] = [
    {
        id: 'fallback-1',
        name: 'Everest Base Camp',
        description: "Stand at the foot of the world's highest peak and experience Sherpa culture firsthand.",
        image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRhAgmyafMtZInsKcZjC6PERny9fQkTYXnQc2xe3Dn2hSTQ2D2bEPyiLHkfuqDOIamvdyHiV6lOBJgYm_mzEkiQeGcxj6XcjWqapph7IcKty8Mcbs7CdDGengbgwALm5rAVVQmydirCKo5JLlaeh-L3z0AJYecOSmxkI8TpR7pMITU12XLou8iXgEwQe7_3NbQK8rZDzw39TV_j5JnhmpBQ55T2U0LJGQROBZEKe8IxNVO4-xOcOfSMr99VgNtWGMAriy0J_zOV2il',
        price: '$1,200',
        duration: '14 Days',
        rating: 4.9,
        link_url: '/trip/everest-base-camp',
        display_order: 1,
        is_active: true
    },
    {
        id: 'fallback-2',
        name: 'Annapurna Circuit',
        description: 'Traverse through diverse landscapes, from subtropical forests to alpine peaks.',
        image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwWW3lEJ9YYM6nDdQ_clegxQ7nPWH-Trbv40arFyiafhUfI8TSQG1BbV5qC8CVnbZTdocnjJPmXxOW8gwfFA04Byy5vrMjRBD8rXQCFOAKi77ATkMO6rJbEN7truIDQj484smO4H2WPG9dNRmsDO33DoBkSP7HikkIFWIqYm89TDPRD-g9CAIz4zoCF_ixKAl_E7arOVyQ36V-Nl3tdG9w0ZAfFYMJZsq7qHFyh6AeiRd81D4QcIIVtWzZjZmBGyoIMmZ020UPJGo5',
        price: '$950',
        duration: '12 Days',
        rating: 4.8,
        link_url: '/trip/annapurna-circuit',
        display_order: 2,
        is_active: true
    },
    {
        id: 'fallback-3',
        name: 'Langtang Valley',
        description: 'The valley of glaciers, offering stunning views and rich Tamang culture.',
        image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7oJvicfMYF2tTDspjyC_dNc6L_u3AS3u1gLba-Lnwk50u3YZOQu3BkxHIjp6qOm8t6-NdGiFKjAxtFwVL1N5XTTmnRQEsYogfMQZfRLPcoYucuMk0ybPhdPiwooV3LVT_bSwr3Ld2FpmTFJP4MwAgLfiztLA7j1qaUiTbpBEa-bWWzUGuIU_wFBqd0T-S_5J3Xle-0CUZZp84IdPuI3fpZyaG0t50baFmMaApe8X6CrvYDROuk7W1PI6KncjUpZ3zKUnhjmCd4hWa',
        price: '$800',
        duration: '10 Days',
        rating: 4.7,
        link_url: '/trip/langtang-valley',
        display_order: 3,
        is_active: true
    }
];

export const featuredDestinationService = {
    async getFeaturedDestinations(): Promise<FeaturedDestination[]> {
        try {
            const { data, error } = await supabase
                .from('featured_destinations')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) {
                // Check for "Relation does not exist" (42P01) or Schema Cache Error (PGRST205)
                // These indicate the table is missing.
                if (error.code === '42P01' || error.code === 'PGRST205') {
                    // Use debug level to avoid console noise when tables are intentionally missing/not yet created
                    console.debug(`ℹ️ Table "featured_destinations" missing (Code: ${error.code}). Using fallback data.`);
                    
                    // Try to fetch from 'tours' table as alternative source if dedicated table is missing
                    try {
                        const { data: tourData, error: tourError } = await supabase
                            .from('tours')
                            .select('id, name, description, featured_image, price, duration, difficulty, url_slug')
                            .eq('status', 'Published')
                            .limit(6);
                            
                        if (!tourError && tourData && tourData.length > 0) {
                            return tourData.map((tour: any, index: number) => ({
                                id: tour.id,
                                name: tour.name,
                                description: tour.description,
                                image_url: tour.featured_image,
                                price: tour.price ? `$${tour.price}` : null,
                                duration: tour.duration,
                                rating: 5.0, // Default rating for now
                                link_url: `/trip/${tour.url_slug || tour.id}`,
                                display_order: index,
                                is_active: true
                            }));
                        }
                    } catch (e) {
                        console.warn('Failed to fetch from tours table as fallback', e);
                    }
                    
                    return FALLBACK_DESTINATIONS;
                }
                
                // Log other real errors as errors
                console.error(`Supabase Error [featured_destinations]: ${error.message} (Code: ${error.code})`);
                throw new Error(error.message);
            }

            if (!data || data.length === 0) {
                // If table exists but is empty, try to fetch from tours table
                const { data: tourData, error: tourError } = await supabase
                    .from('tours')
                    .select('id, name, description, featured_image, price, duration, difficulty, url_slug')
                    .eq('status', 'Published')
                    .limit(6);
                    
                if (!tourError && tourData && tourData.length > 0) {
                    return tourData.map((tour: any, index: number) => ({
                        id: tour.id,
                        name: tour.name,
                        description: tour.description,
                        image_url: tour.featured_image,
                        price: tour.price ? `$${tour.price}` : null,
                        duration: tour.duration,
                        rating: 5.0,
                        link_url: `/trip/${tour.url_slug || tour.id}`,
                        display_order: index,
                        is_active: true
                    }));
                }
            }

            return data || [];
        } catch (err: any) {
            // Check again for the error message in case it was wrapped
            if (err.message?.includes('does not exist') || err.message?.includes('schema cache')) {
                console.warn('⚠️ Table "featured_destinations" missing (caught in catch). Using fallback data.');
                return FALLBACK_DESTINATIONS;
            }

            console.error('Service Error fetching featured destinations:', err);
            throw err;
        }
    }
};
