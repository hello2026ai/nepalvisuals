-- Add route_geojson column to tours table for interactive maps
ALTER TABLE public.tours
ADD COLUMN IF NOT EXISTS route_geojson JSONB;

-- Comment on column
COMMENT ON COLUMN public.tours.route_geojson IS 'GeoJSON data for the trek route (LineString or MultiPoint)';
