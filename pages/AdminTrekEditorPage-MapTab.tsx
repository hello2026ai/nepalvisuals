import React, { useState, useEffect, useMemo } from 'react';
import { Tour } from '../lib/services/tourService';
import TrekMap from '../components/tour/TrekMap';

interface MapTabProps {
    tour: Partial<Tour>;
    onChange: (updates: Partial<Tour>) => void;
}

const MapTab: React.FC<MapTabProps> = ({ tour, onChange }) => {
    const [jsonInput, setJsonInput] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Sync local state when tour prop updates (external change)
    useEffect(() => {
        if (tour.route_geojson) {
            setJsonInput(JSON.stringify(tour.route_geojson, null, 2));
        } else {
            setJsonInput('');
        }
    }, [tour.route_geojson]);

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setJsonInput(newVal);
        
        if (!newVal.trim()) {
            onChange({ route_geojson: null });
            setError(null);
            return;
        }

        try {
            const parsed = JSON.parse(newVal);
            // Basic GeoJSON validation
            if (!parsed.type || (parsed.type !== 'Feature' && parsed.type !== 'FeatureCollection')) {
                 // Relaxed validation, but we could warn
            }
            setError(null);
            onChange({ route_geojson: parsed });
        } catch (err) {
            setError('Invalid JSON format');
        }
    };

    // Parse the current input for preview, separate from the 'committed' tour state if needed,
    // but using tour.route_geojson is safer as it's the valid state.
    const previewData = useMemo(() => {
        return tour.route_geojson;
    }, [tour.route_geojson]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const parsed = JSON.parse(content);
                
                // Update local input state
                setJsonInput(content);
                
                // Update parent state
                onChange({ route_geojson: parsed });
                setError(null);
            } catch (err) {
                setError('Failed to parse the uploaded file. Ensure it is valid JSON/GeoJSON.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor Section */}
            <div className="space-y-4">
                <div className="bg-admin-surface p-6 rounded-lg border border-admin-border h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-admin-text-primary">Route Map Data</h3>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".json,.geojson"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="geojson-upload"
                            />
                            <label
                                htmlFor="geojson-upload"
                                className="cursor-pointer px-3 py-1.5 bg-admin-primary/10 text-admin-primary hover:bg-admin-primary/20 rounded-md text-sm font-bold transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-base">upload_file</span>
                                Upload File
                            </label>
                        </div>
                    </div>
                    
                    <p className="text-sm text-admin-text-secondary mb-4">
                        Paste your GeoJSON data below or upload a .json/.geojson file. 
                        Ideally, use a <code>LineString</code> or <code>MultiLineString</code> feature for the route.
                    </p>
                    
                    <textarea
                        value={jsonInput}
                        onChange={handleJsonChange}
                        className={`w-full flex-grow min-h-[400px] bg-admin-background border ${error ? 'border-red-500' : 'border-admin-border'} rounded-md p-4 text-sm font-mono text-admin-text-primary focus:ring-2 focus:ring-admin-primary focus:border-transparent outline-none resize-y`}
                        placeholder='{"type": "Feature", "geometry": { "type": "LineString", "coordinates": [...] }, "properties": {}}'
                    />
                    
                    {error && (
                        <p className="mt-2 text-sm text-red-500 flex items-center">
                            <span className="material-symbols-outlined text-sm mr-1">error</span>
                            {error}
                        </p>
                    )}

                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            className="px-4 py-2 bg-admin-surface border border-admin-border text-admin-text-secondary rounded-md hover:bg-admin-background transition-colors text-sm"
                            onClick={() => {
                                setJsonInput('');
                                onChange({ route_geojson: null });
                                setError(null);
                            }}
                        >
                            Clear Map Data
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="space-y-4">
                <div className="bg-admin-surface p-6 rounded-lg border border-admin-border h-full">
                    <h3 className="text-lg font-semibold text-admin-text-primary mb-4">Map Preview</h3>
                    {previewData ? (
                        <div className="w-full h-[500px] rounded-lg overflow-hidden border border-admin-border">
                            <TrekMap geoJsonData={previewData} className="w-full h-full" />
                        </div>
                    ) : (
                        <div className="w-full h-[500px] rounded-lg border-2 border-dashed border-admin-border flex flex-col items-center justify-center text-admin-text-secondary bg-admin-background/50">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">map</span>
                            <p>No valid map data to preview</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapTab;
