import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Webpack/Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TrekMapProps {
    geoJsonData: any;
    className?: string;
}

const MapBounds: React.FC<{ data: any }> = ({ data }) => {
    const map = useMap();

    useEffect(() => {
        if (data) {
            try {
                const geoJsonLayer = L.geoJSON(data);
                const bounds = geoJsonLayer.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            } catch (e) {
                console.warn('Invalid GeoJSON data for bounds:', e);
            }
        }
    }, [data, map]);

    return null;
};

const TrekMap: React.FC<TrekMapProps> = ({ geoJsonData, className = "h-[400px] w-full rounded-2xl overflow-hidden" }) => {
    if (!geoJsonData) return null;

    return (
        <div className={`${className} z-0 relative`}>
            <MapContainer
                center={[28.3949, 84.1240]} // Default to Nepal center
                zoom={7}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <GeoJSON 
                    data={geoJsonData} 
                    style={() => ({
                        color: '#ff0000', // Red route
                        weight: 4,
                        opacity: 0.7
                    })}
                />
                <MapBounds data={geoJsonData} />
            </MapContainer>
        </div>
    );
};

export default TrekMap;
