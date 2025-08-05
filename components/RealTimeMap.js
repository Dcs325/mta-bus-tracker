import React, { useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Compass from './Compass';

const userIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149060.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});
const busIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconSize: [18, 18],
    iconAnchor: [9, 18],
});
const stopIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconSize: [14, 14],
    iconAnchor: [7, 14],
});
const nextStopIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconSize: [18, 18],
    iconAnchor: [9, 18],
});

function CenterMapButton({ userLocation }) {
    const map = useMap();
    if (!userLocation) return null;
    return (
        <button
            style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, padding: 8, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            onClick={() => map.setView([userLocation.latitude, userLocation.longitude], 15)}
        >
            Center on Me
        </button>
    );
}

// Helper function to get coordinates from bus data (handles both lat/lon and latitude/longitude)
const getBusCoordinates = (bus) => {
    const lat = bus.lat || bus.latitude;
    const lon = bus.lon || bus.longitude;
    return { lat, lon };
};

// Helper function to validate coordinates
const isValidCoordinates = (lat, lon) => {
    return typeof lat === 'number' && typeof lon === 'number' &&
        !isNaN(lat) && !isNaN(lon) &&
        lat !== undefined && lon !== undefined;
};

export default function RealTimeMap({ busLocations, userLocation, favStops = {}, GTFS_STOPS = {}, nextStop }) {
    const center = userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : [40.6782, -73.9442]; // Default to Brooklyn

    // Flatten all favorite stops into an array of {line, stopId}
    const allFavStops = Object.entries(favStops).flatMap(([line, stops]) =>
        (stops || []).map(stopId => {
            // Find the correct route key that matches the base line name
            const possibleRoutes = Object.keys(GTFS_STOPS).filter(route => route.startsWith(line + '_'));
            let stop = null;
            
            // Try to find the stop in any of the matching routes
            for (const route of possibleRoutes) {
                const foundStop = (GTFS_STOPS[route] || []).find(s => s.id === stopId);
                if (foundStop) {
                    stop = foundStop;
                    break;
                }
            }
            return stop ? { ...stop, line } : null;
        }).filter(Boolean)
    );

    // Color palette for lines
    const lineColors = [
        'yellow', 'cyan', 'magenta', 'lime', 'orange', 'red', 'blue', 'purple', 'green', 'pink'
    ];

    return (
        <div style={{ position: 'relative', width: '100%', height: 600 }}>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: 600, width: '100%' }}
                scrollWheelZoom={true}
                dragging={true}
                doubleClickZoom={true}
                touchZoom={true}
                keyboard={true}
            >
                <Compass />
                <CenterMapButton userLocation={userLocation} />
                <TileLayer
                    url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                    attribution="&copy; <a href='https://stadiamaps.com/'>Stadia Maps</a>, &copy; <a href='https://openmaptiles.org/'>OpenMapTiles</a> &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors"
                />
                {userLocation && (
                    <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
                        <Popup>Your Location</Popup>
                    </Marker>
                )}
                {busLocations && busLocations.map(bus => {
                    const { lat, lon } = getBusCoordinates(bus);
                    if (!isValidCoordinates(lat, lon)) {
                        console.warn('Invalid bus coordinates:', bus);
                        return null;
                    }
                    return (
                        <Marker key={bus.id} position={[lat, lon]} icon={busIcon}>
                            <Popup>Bus {bus.lineRef || bus.label} ({bus.destination || 'Unknown'})</Popup>
                        </Marker>
                    );
                })}
                {allFavStops.map(stop => {
                    if (!isValidCoordinates(stop.latitude, stop.longitude)) {
                        console.warn('Invalid stop coordinates:', stop);
                        return null;
                    }
                    return (
                        <Marker key={stop.id + stop.line} position={[stop.latitude, stop.longitude]} icon={stopIcon}>
                            <Popup>{stop.name} ({stop.line})</Popup>
                        </Marker>
                    );
                })}
                {nextStop && isValidCoordinates(nextStop.latitude, nextStop.longitude) && (
                    <Marker position={[nextStop.latitude, nextStop.longitude]} icon={nextStopIcon}>
                        <Popup>Next Stop: {nextStop.name}</Popup>
                    </Marker>
                )}
                {/* Draw a colored line from each bus to its first favorite stop for each line */}
                {busLocations && allFavStops && Object.entries(favStops).map(([line, stops], idx) => {
                    const bus = busLocations.find(b => (b.lineRef || b.label) === line);
                    const stopId = stops && stops.length > 0 ? stops[0] : null;
                    let stop = null;
                    if (stopId) {
                        // Find the correct route key that matches the base line name
                        const possibleRoutes = Object.keys(GTFS_STOPS).filter(route => route.startsWith(line + '_'));
                        
                        // Try to find the stop in any of the matching routes
                        for (const route of possibleRoutes) {
                            const foundStop = (GTFS_STOPS[route] || []).find(s => s.id === stopId);
                            if (foundStop) {
                                stop = foundStop;
                                break;
                            }
                        }
                    }
                    if (bus && stop) {
                        const { lat, lon } = getBusCoordinates(bus);
                        if (isValidCoordinates(lat, lon) && isValidCoordinates(stop.latitude, stop.longitude)) {
                            return (
                                <Polyline
                                    key={line}
                                    positions={[[lat, lon], [stop.latitude, stop.longitude]]}
                                    pathOptions={{ color: lineColors[idx % lineColors.length], weight: 4 }}
                                />
                            );
                        }
                    }
                    return null;
                })}
                {/* Draw a colored line for each favorite bus route connecting all favorite stops for that route */}
                {Object.entries(favStops).map(([line, stops], idx) => {
                    // Find the correct route key that matches the base line name
                    const possibleRoutes = Object.keys(GTFS_STOPS).filter(route => route.startsWith(line + '_'));
                    let routeStops = [];
                    
                    // Try to find stops in any of the matching routes
                    for (const route of possibleRoutes) {
                        const foundStops = (GTFS_STOPS[route] || []).filter(s => stops.includes(s.id));
                        if (foundStops.length > 0) {
                            routeStops = foundStops;
                            break;
                        }
                    }
                    if (routeStops.length > 1) {
                        const positions = routeStops
                            .filter(stop => isValidCoordinates(stop.latitude, stop.longitude))
                            .map(s => [s.latitude, s.longitude]);
                        if (positions.length > 1) {
                            return (
                                <Polyline
                                    key={line + '-route'}
                                    positions={positions}
                                    pathOptions={{ color: lineColors[idx % lineColors.length], weight: 3, dashArray: '6' }}
                                />
                            );
                        }
                    }
                    return null;
                })}
                {/* Draw a colored line from each bus to each favorite stop for that line */}
                {busLocations && Object.entries(favStops).map(([line, stops], idx) => {
                    const bus = busLocations.find(b => (b.lineRef || b.label) === line);
                    if (bus && stops && stops.length > 0) {
                        const { lat, lon } = getBusCoordinates(bus);
                        if (isValidCoordinates(lat, lon)) {
                            return stops.map((stopId, sIdx) => {
                                // Find the correct route key that matches the base line name
                                const possibleRoutes = Object.keys(GTFS_STOPS).filter(route => route.startsWith(line + '_'));
                                let stop = null;
                                
                                // Try to find the stop in any of the matching routes
                                for (const route of possibleRoutes) {
                                    const foundStop = (GTFS_STOPS[route] || []).find(s => s.id === stopId);
                                    if (foundStop) {
                                        stop = foundStop;
                                        break;
                                    }
                                }
                                if (stop && isValidCoordinates(stop.latitude, stop.longitude)) {
                                    const positions = [[lat, lon], [stop.latitude, stop.longitude]];
                                    console.log('Drawing Polyline:', { line, stopId, positions }); // Debug log
                                    return (
                                        <Polyline
                                            key={line + '-' + stopId}
                                            positions={positions}
                                            pathOptions={{ color: 'white', weight: 6, opacity: 0.9, zIndex: 1000 }} // High contrast for debug
                                        />
                                    );
                                }
                                return null;
                            });
                        }
                    }
                    return null;
                })}
            </MapContainer>
        </div>
    );
}
