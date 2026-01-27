import { supabase } from '../supabaseClient';

export interface TourInclusion {
    id: string;
    tour_id: string;
    item: string;
    is_excluded: boolean;
}

export interface TourFaq {
    id: string;
    tour_id: string;
    question: string;
    answer: string;
}

export interface TourDeparture {
    id: string;
    tour_id: string;
    start_date: string;
    end_date: string;
    price: number;
    capacity: number;
    spots_booked: number;
    status: 'Available' | 'Full' | 'Cancelled' | 'Completed';
}

export interface Tour {
  id: string;
  name: string;
  url_slug: string;
  destination: string | null;
  region: string | null;
  country: string | null;
  currency?: string | null;
  category: string | null;
  status: 'Published' | 'Draft';
  price: number;
  duration: number | null;
  difficulty: string | null;
  // guide_language removed in migration
  tour_type: string | number | null; // Supports legacy string or new numeric code
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  featured_image: string | null;
  featured_image_alt?: string | null;
  gallery_images?: string[];
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  route_geojson?: any;
  // Joined fields
  itineraries?: ItineraryItem[];
  tour_highlights?: TourHighlight[];
  seasonal_prices?: SeasonalPrice[];
  group_discounts?: GroupDiscount[];
  inclusions?: TourInclusion[];
  faqs?: TourFaq[];
  departures?: TourDeparture[];
}

export interface TourHighlight {
  id: string;
  tour_id: string;
  icon: string;
  text: string;
  title?: string;
  image_url?: string;
  display_order?: number;
  is_visible?: boolean;
}

export interface SeasonalPrice {
  id: string;
  tour_id: string;
  start_date: string;
  end_date: string;
  price: number;
  label: string | null;
}

export interface GroupDiscount {
  id: string;
  tour_id: string;
  min_guests: number;
  max_guests: number;
  discount_percentage: number;
}

export interface ItineraryItem {
    id: string;
    tour_id: string;
    day_number: number;
    title: string;
    description: string | null;
    accommodation: string | null;
    meals: string | null;
}

type TourGalleryImageInput = (File | string)[];

const normalizeGalleryImageUrls = (images: TourGalleryImageInput): string[] => {
  const urls: string[] = [];
  for (const img of images) {
    if (typeof img !== 'string') {
      throw new Error('Gallery images must be uploaded before saving');
    }
    const trimmed = img.trim();
    if (!trimmed) continue;
    urls.push(trimmed);
  }
  return urls;
};

const replaceTourGalleryImages = async (tourId: string, imageUrls: string[]) => {
  const mediaFilePathByUrl = new Map<string, string>();
  for (const url of imageUrls) {
    try {
      const parsed = new URL(url);
      const marker = '/media/';
      const idx = parsed.pathname.indexOf(marker);
      if (idx !== -1) {
        const filePath = decodeURIComponent(parsed.pathname.slice(idx + marker.length));
        if (filePath) mediaFilePathByUrl.set(url, filePath);
      }
    } catch {
      continue;
    }
  }

  const captionByFilePath = new Map<string, string>();
  if (mediaFilePathByUrl.size > 0) {
    const filePaths = Array.from(new Set(Array.from(mediaFilePathByUrl.values())));
    const { data: mediaData, error: mediaError } = await supabase
      .from('media_files')
      .select('file_path, alt_text, caption, title')
      .in('file_path', filePaths);

    if (!mediaError && mediaData) {
      (mediaData as any[]).forEach((row) => {
        const best = row.caption || row.alt_text || row.title;
        if (typeof row.file_path === 'string' && typeof best === 'string' && best.trim().length > 0) {
          captionByFilePath.set(row.file_path, best);
        }
      });
    }
  }

  const { error: deleteError } = await supabase
    .from('tour_gallery_images')
    .delete()
    .eq('tour_id', tourId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (imageUrls.length === 0) return;

  const rows = imageUrls.map((url, index) => {
    const filePath = mediaFilePathByUrl.get(url);
    const caption = filePath ? captionByFilePath.get(filePath) : undefined;
    return {
      tour_id: tourId,
      image_url: url,
      caption: caption ?? null,
      display_order: index
    };
  });

  const { error: insertError } = await supabase
    .from('tour_gallery_images')
    .insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }
};

export interface TourFilterOptions {
  searchTerm?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  difficulty?: string;
  status?: 'Published' | 'Draft';
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc' | 'newest';
}

export const TourService = {
  async getAllTours(filters: TourFilterOptions = {}) {
    let query = supabase
      .from('tours')
      .select('*', { count: 'exact' });

    if (filters.searchTerm) {
      query = query.ilike('name', `%${filters.searchTerm}%`);
    }

    if (filters.region) {
      query = query.eq('region', filters.region);
    }

    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters.minDuration !== undefined) {
      query = query.gte('duration', filters.minDuration);
    }

    if (filters.maxDuration !== undefined) {
      query = query.lte('duration', filters.maxDuration);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 100; // Default limit
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Apply sorting
    if (filters.sortBy === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (filters.sortBy === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else if (filters.sortBy === 'duration_asc') {
      query = query.order('duration', { ascending: true });
    } else if (filters.sortBy === 'duration_desc') {
      query = query.order('duration', { ascending: false });
    } else {
      // Default to newest
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(from, to);

    const { data, error, count } = await query;
    
    if (error) throw error;
    return { data: data as Tour[], count };
  },
  async getToursByRegion(regionName: string, opts: Omit<TourFilterOptions, 'region'> = {}) {
    const { data, count } = await this.getAllTours({ ...opts, region: regionName })
    return { data, count }
  },

  async getTourById(id: string) {
    // Fetch the main tour data first
    const { data: tours, error: tourError } = await supabase
      .from('tours')
      .select(`
        *,
        tour_highlights (*),
        seasonal_prices (*),
        group_discounts (*),
        itineraries (*),
        inclusions:tour_inclusions (*),
        faqs:tour_faqs (*)
      `)
      .eq('id', id)
      .limit(1);
    
    if (tourError) {
      console.error('Error fetching tour by ID:', tourError);
      throw new Error(tourError.message);
    }
    
    const tourData = tours?.[0];
    
    if (!tourData) {
      throw new Error('Tour not found');
    }

    let departures: TourDeparture[] = [];
    try {
        const { data: departureData, error: departureError } = await supabase
            .from('tour_departures')
            .select('*')
            .eq('tour_id', id);
            
        if (!departureError && departureData) {
            departures = departureData as TourDeparture[];
        } else if (departureError && departureError.code !== '42P01' && departureError.code !== 'PGRST205' && departureError.code !== 'PGRST100') {
            // Log warning but don't fail the whole request if departures fail
            // 42P01 is "undefined table", which we can ignore safely (treat as empty)
            console.warn('Warning: Failed to fetch tour departures', departureError);
        }
    } catch (err) {
        console.warn('Exception fetching departures:', err);
    }

    let galleryImages: string[] | undefined = undefined;
    try {
      const { data: galleryData, error: galleryError } = await supabase
        .from('tour_gallery_images')
        .select('image_url')
        .eq('tour_id', id)
        .order('display_order', { ascending: true });

      if (!galleryError && galleryData) {
        galleryImages = (galleryData as any[])
          .map((r) => r.image_url)
          .filter((v) => typeof v === 'string' && v.trim().length > 0);
      } else if (galleryError && galleryError.code !== '42P01' && galleryError.code !== 'PGRST205' && galleryError.code !== 'PGRST100') {
        console.warn('Warning: Failed to fetch tour gallery images', galleryError);
      }
    } catch (err) {
      console.warn('Exception fetching tour gallery images:', err);
    }

    // Combine the data
    const fullTourData = {
        ...tourData,
        departures: departures,
        ...(galleryImages !== undefined ? { gallery_images: galleryImages } : {})
    };

    // Sort itineraries by day_number if they exist
    if (fullTourData.itineraries && Array.isArray(fullTourData.itineraries)) {
        fullTourData.itineraries.sort((a: any, b: any) => a.day_number - b.day_number);
    }

    return fullTourData as Tour;
  },

  async getTourBySlug(slug: string) {
    // Fetch the main tour data by slug
    const { data: tours, error: tourError } = await supabase
      .from('tours')
      .select(`
        *,
        tour_highlights (*),
        seasonal_prices (*),
        group_discounts (*),
        itineraries (*),
        inclusions:tour_inclusions (*),
        faqs:tour_faqs (*)
      `)
      .eq('url_slug', slug)
      .limit(1);
    
    if (tourError) {
      console.error('Error fetching tour by slug:', tourError);
      throw new Error(tourError.message);
    }
    
    const tourData = tours?.[0];

    if (!tourData) {
      throw new Error('Tour not found');
    }

    // Separately fetch departures using the tour ID we just found
    // This maintains the same robustness pattern as getTourById
    let departures: TourDeparture[] = [];
    try {
        const { data: departureData, error: departureError } = await supabase
            .from('tour_departures')
            .select('*')
            .eq('tour_id', tourData.id);
            
        if (!departureError && departureData) {
            departures = departureData as TourDeparture[];
        } else if (departureError && departureError.code !== '42P01' && departureError.code !== 'PGRST205' && departureError.code !== 'PGRST100') {
            console.warn('Warning: Failed to fetch tour departures', departureError);
        }
    } catch (err) {
        console.warn('Exception fetching departures:', err);
    }

    let galleryImages: string[] | undefined = undefined;
    try {
      const { data: galleryData, error: galleryError } = await supabase
        .from('tour_gallery_images')
        .select('image_url')
        .eq('tour_id', tourData.id)
        .order('display_order', { ascending: true });

      if (!galleryError && galleryData) {
        galleryImages = (galleryData as any[])
          .map((r) => r.image_url)
          .filter((v) => typeof v === 'string' && v.trim().length > 0);
      } else if (galleryError && galleryError.code !== '42P01' && galleryError.code !== 'PGRST205' && galleryError.code !== 'PGRST100') {
        console.warn('Warning: Failed to fetch tour gallery images', galleryError);
      }
    } catch (err) {
      console.warn('Exception fetching tour gallery images:', err);
    }

    // Combine the data
    const fullTourData = {
        ...tourData,
        departures: departures,
        ...(galleryImages !== undefined ? { gallery_images: galleryImages } : {})
    };

    // Sort itineraries by day_number if they exist
    if (fullTourData.itineraries && Array.isArray(fullTourData.itineraries)) {
        fullTourData.itineraries.sort((a: any, b: any) => a.day_number - b.day_number);
    }

    return fullTourData as Tour;
  },

  async createTour(tour: Partial<Tour>) {
    const {
      itineraries,
      tour_highlights,
      seasonal_prices,
      group_discounts,
      gallery_images,
      ...tourData
    } = tour;

    const allowedFields = [
      'name',
      'url_slug',
      'destination',
      'region',
      'country',
      'category',
      'status',
      'price',
      'duration',
      'difficulty',
      'guide_language',
      'tour_type',
      'description',
      'meta_title',
      'meta_description',
      'featured_image',
      'currency',
      // 'published_at', // Requires DB migration 20260108000000_add_published_at_to_tours.sql
    ];

    const insertData: any = {};
    allowedFields.forEach((field) => {
      const value = (tourData as any)[field];
      if (value !== undefined) insertData[field] = value;
    });

    insertData.name = insertData.name ?? '';
    insertData.url_slug = insertData.url_slug ?? '';
    // status will only be included if provided
    insertData.price = insertData.price ?? 0;
    
    // Set published_at if status is Published
    // Commented out until DB migration is applied
    /*
    if (insertData.status === 'Published' && !insertData.published_at) {
        insertData.published_at = new Date().toISOString();
    }
    */

    // Do not add defaults for optional fields to keep minimal payloads

    const { data, error } = await supabase
      .from('tours')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating tour:', error);
      throw new Error(error.message);
    }
    
    const created = data as Tour;

    if (gallery_images !== undefined) {
      try {
        const urls = normalizeGalleryImageUrls(gallery_images as TourGalleryImageInput);
        await replaceTourGalleryImages(created.id, urls);
        return { ...created, gallery_images: urls };
      } catch (err) {
        console.error('Error saving tour gallery images:', { tourId: created.id, err });
        throw err;
      }
    }

    return created;
  },

  async updateTour(id: string, updates: Partial<Tour>) {
    // Remove joined fields before update and ensure valid data
    const { itineraries, tour_highlights, seasonal_prices, group_discounts, inclusions, faqs, departures, gallery_images, ...tourData } = updates;
    
    // Define only the fields that actually exist in the database schema
    // This prevents errors from trying to update non-existent columns
    const safeFields = [
      'name', 'url_slug', 'destination', 'region', 'country', 'category',
      'status', 'price', 'duration', 'difficulty', 'guide_language', 'tour_type', 'currency',
      'description', 'meta_title', 'meta_description', 'featured_image', 'route_geojson' // published_at handled conditionally below
    ];
    
    // Create a safe update object with only valid fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Only include fields that exist in the database schema
    safeFields.forEach(field => {
      if (tourData[field as keyof Tour] !== undefined) {
        updateData[field] = tourData[field as keyof Tour];
      }
    });

    // Handle published_at based on status transition
    if (tourData.status !== undefined) {
      if (tourData.status === 'Published') {
        // updateData.published_at = new Date().toISOString(); // Disable until DB migration
      } else if (tourData.status === 'Draft') {
        // updateData.published_at = null; // Disable until DB migration
      }
    }

    // Remove undefined values to prevent database errors
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabase
      .from('tours')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating tour:', error);
      throw new Error(error.message);
    }
    
    const updated = data as Tour;

    if (gallery_images !== undefined) {
      try {
        const urls = normalizeGalleryImageUrls(gallery_images as TourGalleryImageInput);
        await replaceTourGalleryImages(id, urls);
        return { ...updated, gallery_images: urls };
      } catch (err) {
        console.error('Error saving tour gallery images:', { tourId: id, err });
        throw err;
      }
    }

    return updated;
  },

  async deleteTour(id: string) {
    const { error } = await supabase
      .from('tours')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Sub-resources
  async addHighlight(highlight: Omit<TourHighlight, 'id'>) {
    const { data, error } = await supabase
      .from('tour_highlights')
      .insert(highlight)
      .select()
      .single();
    if (error) throw error;
    return data as TourHighlight;
  },

  async updateHighlight(id: string, updates: Partial<TourHighlight>) {
    const { data, error } = await supabase
      .from('tour_highlights')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TourHighlight;
  },

  async deleteHighlight(id: string) {
    const { error } = await supabase.from('tour_highlights').delete().eq('id', id);
    if (error) throw error;
  },

  async addSeasonalPrice(price: Omit<SeasonalPrice, 'id'>) {
      const { data, error } = await supabase.from('seasonal_prices').insert(price).select().single();
      if (error) throw error;
      return data as SeasonalPrice;
  },

  async deleteSeasonalPrice(id: string) {
      const { error } = await supabase.from('seasonal_prices').delete().eq('id', id);
      if (error) throw error;
  },

  async addGroupDiscount(discount: Omit<GroupDiscount, 'id'>) {
      const { data, error } = await supabase.from('group_discounts').insert(discount).select().single();
      if (error) throw error;
      return data as GroupDiscount;
  },

  async deleteGroupDiscount(id: string) {
      const { error } = await supabase.from('group_discounts').delete().eq('id', id);
      if (error) throw error;
  },

  // Itineraries
  async getItinerary(tourId: string) {
      const { data, error } = await supabase
          .from('itineraries')
          .select('*')
          .eq('tour_id', tourId)
          .order('day_number', { ascending: true });
      if (error) throw error;
      return data as ItineraryItem[];
  },

  async addItineraryItem(item: Omit<ItineraryItem, 'id'>) {
      const { data, error } = await supabase.from('itineraries').insert(item).select().single();
      if (error) throw error;
      return data as ItineraryItem;
  },

  async updateItineraryItem(id: string, updates: Partial<ItineraryItem>) {
      const { data, error } = await supabase.from('itineraries').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as ItineraryItem;
  },

  async deleteItineraryItem(id: string) {
      const { error } = await supabase.from('itineraries').delete().eq('id', id);
      if (error) throw error;
  },

  // Inclusions
  async addInclusion(inclusion: Omit<TourInclusion, 'id'>) {
      const { data, error } = await supabase.from('tour_inclusions').insert(inclusion).select().single();
      if (error) throw error;
      return data as TourInclusion;
  },

  async deleteInclusion(id: string) {
      const { error } = await supabase.from('tour_inclusions').delete().eq('id', id);
      if (error) throw error;
  },

  // FAQs
  async addFaq(faq: Omit<TourFaq, 'id'>) {
      const { data, error } = await supabase.from('tour_faqs').insert(faq).select().single();
      if (error) throw error;
      return data as TourFaq;
  },

  async deleteFaq(id: string) {
      const { error } = await supabase.from('tour_faqs').delete().eq('id', id);
      if (error) throw error;
  },

  // Departures
  async addDeparture(departure: Omit<TourDeparture, 'id'>) {
      const { data, error } = await supabase.from('tour_departures').insert(departure).select().single();
      if (error) throw error;
      return data as TourDeparture;
  },

  async updateDeparture(id: string, updates: Partial<TourDeparture>) {
      const { data, error } = await supabase.from('tour_departures').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as TourDeparture;
  },

  async deleteDeparture(id: string) {
      const { error } = await supabase.from('tour_departures').delete().eq('id', id);
      if (error) throw error;
  }
};
