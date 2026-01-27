import { supabase } from '../supabaseClient';

export interface Region {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  status: 'Published' | 'Draft';
  image_url: string | null;
  parent_id: string | null;
  latitude: number | null;
  longitude: number | null;
  zoom_level: number;
  created_at?: string;
  updated_at?: string;
  tourCount?: number; // Virtual field for display
  subRegions?: Region[]; // Virtual field for hierarchy display
}

export const RegionService = {
  async getAllRegions() {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .order('name', { ascending: true }); // Alphabetical for hierarchy building
    
    if (error) {
      console.error('Error fetching regions:', error);
      throw error;
    }
    return (data || []) as Region[];
  },
  async existsByName(regionName: string) {
    const name = (regionName || '').trim()
    const { data, error } = await supabase
      .from('regions')
      .select('id,name')
      .ilike('name', name)
      .limit(1)
    if (error) throw error
    return Array.isArray(data) && data.length > 0
  },
  async getByName(regionName: string) {
    const name = (regionName || '').trim()
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .ilike('name', name)
      .maybeSingle(); // Use maybeSingle to avoid error if not found
    
    if (error) {
        console.error('Error fetching region by name:', error);
        return null;
    }
    return data as Region;
  },
  // Simple retry wrapper for existence check (3 attempts)
  async existsByNameWithRetry(regionName: string, attempts: number = 3) {
    let lastError: any = null
    for (let i = 0; i < attempts; i++) {
      try {
        return await this.existsByName(regionName)
      } catch (e) {
        lastError = e
        await new Promise(res => setTimeout(res, 200 * (i + 1)))
      }
    }
    throw lastError
  },

  async getRegionHierarchy() {
      const regions = await this.getAllRegions();
      const regionMap = new Map<string, Region>();
      const rootRegions: Region[] = [];

      // Initialize map and subRegions array
      regions.forEach(region => {
          region.subRegions = [];
          regionMap.set(region.id, region);
      });

      // Build hierarchy
      regions.forEach(region => {
          if (region.parent_id && regionMap.has(region.parent_id)) {
              regionMap.get(region.parent_id)!.subRegions!.push(region);
          } else {
              rootRegions.push(region);
          }
      });

      return rootRegions;
  },

  async getRegionById(id: string) {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Region;
  },

  async createRegion(region: Partial<Region>) {
    const { data, error } = await supabase
      .from('regions')
      .insert(region)
      .select()
      .single();
    
    if (error) throw error;
    return data as Region;
  },

  async updateRegion(id: string, updates: Partial<Region>) {
    const { data, error } = await supabase
      .from('regions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Region;
  },

  async deleteRegion(id: string) {
    const { error } = await supabase
      .from('regions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
