import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon issues - only run in browser environment
if (typeof window !== 'undefined' && typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
    try {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
        console.log('Leaflet icon paths configured');
    } catch (error) {
        console.error('Error configuring Leaflet icons:', error);
    }
}

// Make sure Leaflet CSS is loaded - only run in browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Check if the CSS is already loaded
    const existingLink = document.querySelector('link[href*="leaflet.css"]');
    if (!existingLink) {
        console.log('Adding Leaflet CSS to document head');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
    } else {
        console.log('Leaflet CSS already loaded');
    }
}

// Create a custom bus icon
const busIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
    className: 'bus-icon'
});

function CenterMapButton({ center, routeCoordinates, buses }) {
    const map = useMap();
    const centeringTimeoutRef = useRef(null);
    const [isCentering, setIsCentering] = useState(false);
    
    const centerMapOnRoute = () => {
        if (!map) return;
        
        setIsCentering(true);
        
        try {
            // First invalidate the map size to ensure proper rendering
            map.invalidateSize(true);
            
            // Try to center on buses first if available
            if (buses && buses.length > 0) {
                try {
                    const validBuses = buses.filter(bus => {
                        const { lat, lon } = getBusCoordinates(bus);
                        return isValidCoordinates(lat, lon);
                    });
                    
                    if (validBuses.length > 0) {
                        const busBounds = L.latLngBounds(
                            validBuses.map(bus => {
                                const { lat, lon } = getBusCoordinates(bus);
                                return [lat, lon];
                            })
                        );
                        map.fitBounds(busBounds, { padding: [50, 50] });
                        console.log('Map centered on bus positions');
                        setIsCentering(false);
                        return;
                    }
                } catch (busError) {
                    console.error('Error centering on buses:', busError);
                    // Continue to try route coordinates
                }
            }
            
            // If no buses or error, try route coordinates
            if (routeCoordinates && routeCoordinates.length > 1) {
                try {
                    const bounds = L.latLngBounds(routeCoordinates.map(coord => L.latLng(coord[0], coord[1])));
                    map.fitBounds(bounds, { padding: [50, 50] });
                    console.log('Map centered on route');
                    setIsCentering(false);
                    return;
                } catch (routeError) {
                    console.error('Error centering on route:', routeError);
                    // Fall back to center point
                }
            }
            
            // Fallback to center point
            map.setView(center, 14);
            console.log('Map centered on default position');
        } catch (error) {
            console.error('Error in centerMapOnRoute:', error);
            // Ultimate fallback
            try {
                map.setView([40.650002, -73.949997], 12); // Brooklyn
            } catch (finalError) {
                console.error('Failed to set fallback view:', finalError);
            }
        } finally {
            setIsCentering(false);
        }
    };

    // Center map when component mounts or when route/buses change
    useEffect(() => {
        // Clear any existing timeout
        if (centeringTimeoutRef.current) {
            clearTimeout(centeringTimeoutRef.current);
        }
        
        // Set a new timeout for initial centering
        centeringTimeoutRef.current = setTimeout(() => {
            centerMapOnRoute();
        }, 1000); // Longer delay for initial centering
        
        return () => {
            if (centeringTimeoutRef.current) {
                clearTimeout(centeringTimeoutRef.current);
            }
        };
    }, [map, routeCoordinates, buses]);
    
    return (
        <button
            style={{ 
                position: 'absolute', 
                top: 10, 
                right: 10, 
                zIndex: 1000, 
                padding: '8px 12px', 
                background: isCentering ? '#0d47a1' : '#1976d2', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                cursor: isCentering ? 'default' : 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'background-color 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isCentering ? 0.8 : 1
            }}
            onClick={centerMapOnRoute}
            disabled={isCentering}
            title="Center map on route and buses"
        >
            {isCentering ? 'Centering...' : 'Center Map'}
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

// Map initialization component to handle map loading and updates
function MapInitializer({ routeCoordinates, buses }) {
    const map = useMap();
    const initTimeoutRef = useRef(null);
    
    useEffect(() => {
        // Clear any existing timeout
        if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
        }
        
        // Force a map invalidation and redraw with a delay
        initTimeoutRef.current = setTimeout(() => {
            if (!map) return;
            
            try {
                console.log('MapInitializer: Invalidating map size');
                map.invalidateSize(true);
                
                // If we have route coordinates, fit the map to them
                if (routeCoordinates && routeCoordinates.length > 1) {
                    try {
                        console.log(`MapInitializer: Fitting map to ${routeCoordinates.length} route coordinates`);
                        const bounds = L.latLngBounds(routeCoordinates.map(coord => L.latLng(coord[0], coord[1])));
                        map.fitBounds(bounds, { padding: [50, 50] });
                    } catch (error) {
                        console.error('MapInitializer: Error fitting map to route bounds:', error);
                        
                        // Try to center on buses if route fails
                        if (buses && buses.length > 0) {
                            try {
                                const validBuses = buses.filter(bus => {
                                    const { lat, lon } = getBusCoordinates(bus);
                                    return isValidCoordinates(lat, lon);
                                });
                                
                                if (validBuses.length > 0) {
                                    const busBounds = L.latLngBounds(
                                        validBuses.map(bus => {
                                            const { lat, lon } = getBusCoordinates(bus);
                                            return [lat, lon];
                                        })
                                    );
                                    map.fitBounds(busBounds, { padding: [50, 50] });
                                    console.log('MapInitializer: Centered on bus positions as fallback');
                                }
                            } catch (busError) {
                                console.error('MapInitializer: Error centering on buses:', busError);
                            }
                        }
                    }
                } else if (buses && buses.length > 0) {
                    // If no route but we have buses, fit to buses
                    try {
                        const validBuses = buses.filter(bus => {
                            const { lat, lon } = getBusCoordinates(bus);
                            return isValidCoordinates(lat, lon);
                        });
                        
                        if (validBuses.length > 0) {
                            console.log(`MapInitializer: Fitting map to ${validBuses.length} buses`);
                            const busBounds = L.latLngBounds(
                                validBuses.map(bus => {
                                    const { lat, lon } = getBusCoordinates(bus);
                                    return [lat, lon];
                                })
                            );
                            map.fitBounds(busBounds, { padding: [50, 50] });
                        }
                    } catch (error) {
                        console.error('MapInitializer: Error fitting map to bus bounds:', error);
                    }
                }
            } catch (error) {
                console.error('MapInitializer: General error during map initialization:', error);
            }
        }, 500);
        
        return () => {
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
            }
        };
    }, [map, routeCoordinates, buses]);
    
    return null;
}

export default function MapComponent({ buses = [], center = [40.650002, -73.949997], routeCoordinates = [] }) {
    const [mapReady, setMapReady] = useState(false);
    const mapRef = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [isMapInitialized, setIsMapInitialized] = useState(false);
    const initTimeoutRef = useRef(null);
    
    // Log props for debugging
    useEffect(() => {
        console.log('MapComponent mounted with props:', {
            buses: buses.length,
            center,
            routeCoordinates: routeCoordinates.length
        });
        
        // Set map as ready after a short delay
        const timer = setTimeout(() => {
            setMapReady(true);
        }, 800); // Increased delay for better reliability
        
        return () => {
            clearTimeout(timer);
            // Also clear initialization timeout if component unmounts
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
            }
        };
    }, []);
    
    // Effect to handle data changes
    useEffect(() => {
        if (mapInstance && isMapInitialized) {
            console.log('Data changed, updating map view');
            // Force a map invalidation when data changes
            try {
                mapInstance.invalidateSize(true);
            } catch (error) {
                console.error('Error invalidating map size on data change:', error);
            }
        }
    }, [buses, routeCoordinates, mapInstance, isMapInitialized]);

    // Handle map instance creation
    const handleMapCreated = (map) => {
        console.log('Map created and stored in ref');
        mapRef.current = map;
        setMapInstance(map);
        
        // Clear any existing timeout
        if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
        }
        
        // Force a map invalidation and redraw after a short delay
        initTimeoutRef.current = setTimeout(() => {
            if (mapRef.current) {
                try {
                    mapRef.current.invalidateSize(true);
                    console.log('Map size invalidated');
                    
                    // If we have route coordinates, fit bounds
                    if (routeCoordinates && routeCoordinates.length > 1) {
                        try {
                            const bounds = L.latLngBounds(routeCoordinates.map(coord => L.latLng(coord[0], coord[1])));
                            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
                            console.log('Map fitted to route bounds');
                        } catch (error) {
                            console.error('Error fitting bounds to route:', error);
                            
                            // Try to fit to buses if route fails
                            if (buses && buses.length > 0) {
                                try {
                                    const validBuses = buses.filter(bus => {
                                        const { lat, lon } = getBusCoordinates(bus);
                                        return isValidCoordinates(lat, lon);
                                    });
                                    
                                    if (validBuses.length > 0) {
                                        const busBounds = L.latLngBounds(
                                            validBuses.map(bus => {
                                                const { lat, lon } = getBusCoordinates(bus);
                                                return [lat, lon];
                                            })
                                        );
                                        mapRef.current.fitBounds(busBounds, { padding: [50, 50] });
                                        console.log('Map fitted to bus bounds as fallback');
                                    }
                                } catch (busError) {
                                    console.error('Error fitting bounds to buses:', busError);
                                }
                            }
                        }
                    } else if (buses && buses.length > 0) {
                        // If no route coordinates but we have buses
                        try {
                            const validBuses = buses.filter(bus => {
                                const { lat, lon } = getBusCoordinates(bus);
                                return isValidCoordinates(lat, lon);
                            });
                            
                            if (validBuses.length > 0) {
                                const busBounds = L.latLngBounds(
                                    validBuses.map(bus => {
                                        const { lat, lon } = getBusCoordinates(bus);
                                        return [lat, lon];
                                    })
                                );
                                mapRef.current.fitBounds(busBounds, { padding: [50, 50] });
                                console.log('Map fitted to bus bounds');
                            }
                        } catch (error) {
                            console.error('Error fitting bounds to buses:', error);
                        }
                    }
                    
                    // Mark map as initialized
                    setIsMapInitialized(true);
                } catch (error) {
                    console.error('Error during map initialization:', error);
                }
            }
        }, 1000);
    };
    // Color palette for lines
    const lineColors = [
        '#d500f9', '#00bcd4', '#ffeb3b', '#ff5722', '#4caf50', '#2196f3', '#e91e63', '#8bc34a', '#ff9800', '#9c27b0'
    ];

    console.log('MapComponent rendering with:', { 
        busCount: buses.length, 
        center, 
        routeCoordinatesCount: routeCoordinates.length 
    });
    
    // Ensure we have valid data
    if (!Array.isArray(buses)) {
        console.error('Buses prop is not an array:', buses);
        buses = [];
    }
    
    if (!Array.isArray(routeCoordinates)) {
        console.error('RouteCoordinates prop is not an array:', routeCoordinates);
        routeCoordinates = [];
    }
    
    // Filter out buses with invalid coordinates
    const validBuses = buses.filter(bus => {
        const { lat, lon } = getBusCoordinates(bus);
        return isValidCoordinates(lat, lon);
    });
    
    if (validBuses.length !== buses.length) {
        console.warn(`Filtered out ${buses.length - validBuses.length} buses with invalid coordinates`);
    }
    
    return (
        <div style={{ 
            height: 600, 
            width: '100%', 
            position: 'relative', 
            border: '1px solid #ccc', 
            borderRadius: '8px', 
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
        }}>
            {/* Map loading indicator */}
            {!mapReady && (
                <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    backgroundColor: 'rgba(255,255,255,0.8)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center',
                    zIndex: 1000 
                }}>
                    <div style={{ 
                        width: 40, 
                        height: 40, 
                        border: '4px solid #f3f3f3', 
                        borderTop: '4px solid #1976d2', 
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                    }}></div>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                    <div style={{ marginTop: 10, fontWeight: 'bold' }}>Loading map...</div>
                </div>
            )}
            
            <MapContainer 
                center={center} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }} 
                key="map-container"
                whenCreated={handleMapCreated}
                attributionControl={true}
                zoomControl={true}
                scrollWheelZoom={true}
            >
                <MapInitializer routeCoordinates={routeCoordinates} buses={validBuses} />
                <CenterMapButton center={center} routeCoordinates={routeCoordinates} buses={validBuses} />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Display the bus route polyline */}
                {routeCoordinates && routeCoordinates.length > 1 && (
                    <Polyline 
                        positions={routeCoordinates}
                        pathOptions={{ color: '#1976d2', weight: 5, opacity: 0.8 }}
                    />
                )}
                
                {/* Debug message if no route coordinates */}
                {(!routeCoordinates || routeCoordinates.length <= 1) && console.log('No valid route coordinates to display')}
                
                {/* Bus markers */}
                {validBuses.map(bus => {
                    const { lat, lon } = getBusCoordinates(bus);
                    return (
                        <Marker 
                            key={bus.id || bus.vehicleRef || `bus-${lat}-${lon}`} 
                            position={[lat, lon]} 
                            icon={busIcon}
                        >
                            <Popup>
                                <div style={{ padding: '5px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px', color: '#1976d2' }}>
                                        Bus {bus.label || bus.lineRef || 'Unknown'}
                                    </div>
                                    <div style={{ fontSize: '12px' }}>
                                        <strong>ID:</strong> {bus.id || bus.vehicleRef || 'Unknown'}<br />
                                        <strong>Next Stop:</strong> {bus.nextStop || 'Unknown'}<br />
                                        {bus.destinationName && (
                                            <><strong>Destination:</strong> {bus.destinationName}<br /></>
                                        )}
                                        {bus.recordedAtTime && (
                                            <><strong>Updated:</strong> {new Date(bus.recordedAtTime).toLocaleTimeString()}<br /></>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
                
                {/* Draw real-time movement lines between buses */}
                {validBuses.length > 1 && validBuses.map((bus, idx) => {
                    if (idx === validBuses.length - 1) return null; // Skip last bus
                    const nextBus = validBuses[idx + 1];
                    const { lat: lat1, lon: lon1 } = getBusCoordinates(bus);
                    const { lat: lat2, lon: lon2 } = getBusCoordinates(nextBus);
                    
                    return (
                        <Polyline
                            key={`bus-connection-${idx}`}
                            positions={[[lat1, lon1], [lat2, lon2]]}
                            pathOptions={{ color: lineColors[idx % lineColors.length], weight: 2, dashArray: '5,10' }}
                        />
                    );
                })}
                
                {/* No buses message */}
                {validBuses.length === 0 && mapReady && isMapInitialized && (
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        padding: '10px 15px',
                        borderRadius: '5px',
                        boxShadow: '0 1px 5px rgba(0,0,0,0.2)',
                        zIndex: 1000,
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#856404',
                        border: '1px solid #ffeeba',
                        backgroundColor: '#fff3cd',
                    }}>
                        No active buses found for this route
                    </div>
                )}
            </MapContainer>
        </div>
    );
}