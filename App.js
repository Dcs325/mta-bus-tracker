import React, { useEffect, useState } from 'react';
import MapComponent from './MapComponent.web.js';
import { GTFS_STOPS } from './utils/gtfsStops';
import { fetchBusesForLine } from './utils/mtaApi';

const BUS_LINES = [
    { value: 'B1_NB', label: 'B1 - Bay Ridge to Manhattan Beach' },
    { value: 'B1_SB', label: 'B1 - Manhattan Beach to Bay Ridge' },
    { value: 'B2_NB', label: 'B2 - Kings Plaza to Midwood' },
    { value: 'B2_SB', label: 'B2 - Midwood to Kings Plaza' },
    { value: 'B3_NB', label: 'B3 - Sheepshead Bay to Kings Plaza' },
    { value: 'B3_SB', label: 'B3 - Kings Plaza to Sheepshead Bay' },
    { value: 'B49_NB', label: 'B49 - Sheepshead Bay to Downtown Brooklyn' },
    { value: 'B49_SB', label: 'B49 - Downtown Brooklyn to Sheepshead Bay' },
    { value: 'B60_NB', label: 'B60 - Canarsie to Downtown Brooklyn' },
    { value: 'B60_SB', label: 'B60 - Downtown Brooklyn to Canarsie' },
    { value: 'B47_NB', label: 'B47 - Kings Plaza to Downtown Brooklyn' },
    { value: 'B47_SB', label: 'B47 - Downtown Brooklyn to Kings Plaza' },
    // ...add more as needed
];

const LINE_COLORS = ['#d500f9', '#00bcd4', '#ffeb3b', '#ff5722', '#4caf50', '#2196f3', '#e91e63', '#8bc34a', '#ff9800', '#9c27b0'];

export default function App() {
    const [selectedLine, setSelectedLine] = useState('B47_NB');
    const [busData, setBusData] = useState([]);
    // Initialize favorite stops from localStorage or with defaults
    const [favStops, setFavStops] = useState(() => {
        // Try to load from localStorage first
        const savedStops = localStorage.getItem('favStops');
        if (savedStops) {
            try {
                return JSON.parse(savedStops);
            } catch (e) {
                console.error('Error parsing saved stops:', e);
            }
        }
        
        // Default to some B47 stops if nothing in localStorage
        return {
            'B47': ['MTA_303156', 'MTA_301092'] // Broadway/Arion Pl and Broadway/Park St
        };
    });
    
    // Save favorite stops to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('favStops', JSON.stringify(favStops));
    }, [favStops]);
    const [lastUpdateTime, setLastUpdateTime] = useState({ time: null, loading: false, error: false });

    // Fetch bus data for selected line
    useEffect(() => {
        let isMounted = true;
        let intervalId = null;
        
        async function fetchData() {
            try {
                const lineId = selectedLine.split('_')[0];
                console.log('Fetching buses for line:', lineId);
                
                // Show loading state
                setLastUpdateTime(prev => ({ ...prev, loading: true }));
                
                const buses = await fetchBusesForLine(lineId);
                
                // Only update state if component is still mounted
                if (isMounted) {
                    console.log(`Fetched ${buses.length} buses for line ${lineId}`);
                    if (buses.length === 0) {
                        console.warn('No buses found for this line');
                    }
                    setBusData(buses);
                    setLastUpdateTime({ time: new Date(), loading: false });
                }
            } catch (error) {
                console.error('Error fetching bus data:', error);
                if (isMounted) {
                    setLastUpdateTime({ time: new Date(), loading: false, error: true });
                }
            }
        }
        
        // Initial fetch
        fetchData();
        
        // Set up interval for subsequent fetches
        intervalId = setInterval(fetchData, 15000);
        
        // Cleanup function
        return () => {
            isMounted = false;
            if (intervalId) clearInterval(intervalId);
        };
    }, [selectedLine]);

    // Compute linesWithColors for polylines
    const linesWithColors = {};
    let colorIdx = 0;
    Object.keys(favStops).forEach(line => {
        linesWithColors[line] = LINE_COLORS[colorIdx % LINE_COLORS.length];
        colorIdx++;
    });

    // Compute routeCoordinates for selected line
    const routeCoordinates = (GTFS_STOPS[selectedLine] || []).map(stop => [stop.latitude, stop.longitude]);
    
    // Debug information
    console.log('Selected Line:', selectedLine);
    console.log('GTFS_STOPS has this line:', !!GTFS_STOPS[selectedLine]);
    console.log('Route Coordinates Length:', routeCoordinates.length);
    console.log('Bus Data Length:', busData.length);
    
    // Fallback to default route if no coordinates found
    if (routeCoordinates.length === 0) {
        console.log('No route coordinates found for selected line, using fallback');
        // Brooklyn default route
        const defaultRoute = [
            [40.650002, -73.949997],
            [40.655, -73.94],
            [40.645, -73.93]
        ];
        routeCoordinates.push(...defaultRoute);
    }

    // Compute closest buses to each stop (simplified for demo)
    const closestBuses = Object.entries(favStops).flatMap(([line, stopIds]) =>
        stopIds.map(stopId => {
            const stopObj = (GTFS_STOPS[line] || []).find(s => s.id === stopId);
            if (!stopObj) {
                console.warn(`Stop ${stopId} not found for line ${line}`);
                return null;
            }
            
            // Filter buses for this line only
            const lineBuses = busData.filter(bus => bus.label === line);
            console.log(`Found ${lineBuses.length} buses for line ${line}`);
            
            if (lineBuses.length === 0) {
                console.warn(`No buses found for line ${line}`);
                return null;
            }
            
            let closestBus = null;
            let minDistance = Infinity;
            
            lineBuses.forEach(bus => {
                const busLat = bus.lat || bus.latitude;
                const busLon = bus.lon || bus.longitude;
                
                if (typeof busLat === 'number' && typeof busLon === 'number') {
                    // Calculate distance using Haversine formula for more accuracy
                    const R = 6371; // Earth radius in km
                    const dLat = (busLat - stopObj.latitude) * Math.PI / 180;
                    const dLon = (busLon - stopObj.longitude) * Math.PI / 180;
                    const a = 
                        Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(stopObj.latitude * Math.PI / 180) * Math.cos(busLat * Math.PI / 180) * 
                        Math.sin(dLon/2) * Math.sin(dLon/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    const dist = R * c; // Distance in km
                    
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestBus = bus;
                    }
                } else {
                    console.warn(`Bus ${bus.id} has invalid coordinates:`, busLat, busLon);
                }
            });
            
            return closestBus && stopObj ? {
                line,
                stop: stopObj,
                bus: closestBus,
                distance: minDistance
            } : null;
        })
    ).filter(Boolean);
    
    // Log closest buses for debugging
    console.log('Closest buses:', closestBuses.length > 0 ? 
        closestBuses.map(b => `${b.line} at ${b.stop.name}: Bus ${b.bus.id} (${b.distance.toFixed(2)} km)`) : 
        'None found');

    return (
        <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', background: '#f8f8f8' }}>
            {/* Left panel */}
            <div style={{ width: 400, background: '#fff', padding: 16, overflowY: 'auto' }}>
                <h2 style={{ color: '#1976d2', textAlign: 'center' }}>MTA Tracker App</h2>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 'bold', color: '#1976d2', display: 'block', marginBottom: 4 }}>Quick Bus Line Selector:</label>
                    <select
                        value={selectedLine}
                        onChange={e => setSelectedLine(e.target.value)}
                        style={{ 
                            width: '100%', 
                            fontSize: 16, 
                            padding: 8, 
                            borderRadius: 6, 
                            borderColor: '#1976d2', 
                            color: '#1976d2', 
                            backgroundColor: '#fff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            appearance: 'menulist' // Ensures dropdown arrow appears
                        }}
                    >
                        {BUS_LINES.map(line => (
                            <option key={line.value} value={line.value}>{line.label}</option>
                        ))}
                    </select>
                </div>
                <div style={{ background: '#f0f4f8', borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #e0e0e0', paddingBottom: 8 }}>
                        <span style={{ fontWeight: 'bold', color: '#1976d2', fontSize: 18 }}>Closest Buses to Your Stops</span>
                        <span style={{ color: '#666', fontSize: 12, fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
                            <span>Last updated: {lastUpdateTime.time ? lastUpdateTime.time.toLocaleTimeString() : 'Never'}</span>
                            {lastUpdateTime.loading && (
                                <span style={{ marginLeft: 5, color: '#0066cc', display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: 4 }}>Refreshing</span>
                                    <div style={{ 
                                        width: 12, 
                                        height: 12, 
                                        borderRadius: '50%', 
                                        border: '2px solid #f3f3f3', 
                                        borderTop: '2px solid #0066cc', 
                                        animation: 'spin 1s linear infinite' 
                                    }}></div>
                                </span>
                            )}
                            {lastUpdateTime.error && <span style={{ marginLeft: 5, color: '#cc0000' }}> (Error)</span>}
                        </span>
                    </div>
                    
                    {/* Add favorite stops section */}
                    <div style={{ 
                        marginBottom: 16, 
                        padding: 12, 
                        background: '#e3f2fd', 
                        borderRadius: 8, 
                        border: '1px solid #bbdefb',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ fontWeight: 'bold', color: '#0d47a1', marginBottom: 8 }}>
                            Add Favorite Stops
                        </div>
                        <div style={{ fontSize: 14, color: '#555', marginBottom: 10 }}>
                            Select stops to track nearby buses:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Stop selector for current line */}
                            {(GTFS_STOPS[selectedLine] || []).length > 0 ? (
                                <div>
                                    <select 
                                        style={{ 
                                            width: '100%', 
                                            padding: 8, 
                                            borderRadius: 4, 
                                            border: '1px solid #bbdefb',
                                            marginBottom: 8
                                        }}
                                        onChange={(e) => {
                                            const stopId = e.target.value;
                                            if (stopId && stopId !== 'default') {
                                                // Add to favorites
                                                const line = selectedLine.split('_')[0];
                                                const newFavStops = {...favStops};
                                                if (!newFavStops[line]) {
                                                    newFavStops[line] = [];
                                                }
                                                if (!newFavStops[line].includes(stopId)) {
                                                    newFavStops[line] = [...newFavStops[line], stopId];
                                                    setFavStops(newFavStops);
                                                    // Reset the select
                                                    e.target.value = 'default';
                                                }
                                            }
                                        }}
                                        defaultValue="default"
                                    >
                                        <option value="default">Select a stop for {selectedLine.split('_')[0]}...</option>
                                        {(GTFS_STOPS[selectedLine] || []).map(stop => (
                                            <option key={stop.id} value={stop.id}>
                                                {stop.name} ({stop.id})
                                            </option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={() => {
                                            const lineId = selectedLine.split('_')[0];
                                            // Add all stops for this line
                                            const allStopIds = (GTFS_STOPS[selectedLine] || []).map(stop => stop.id);
                                            const newFavStops = {...favStops};
                                            newFavStops[lineId] = allStopIds;
                                            setFavStops(newFavStops);
                                        }}
                                        style={{ 
                                            padding: '4px 8px', 
                                            background: '#1976d2', 
                                            color: 'white',
                                            border: 'none', 
                                            borderRadius: 4, 
                                            cursor: 'pointer',
                                            fontSize: 12
                                        }}
                                    >
                                        Add All Stops
                                    </button>
                                </div>
                            ) : (
                                <div style={{ color: '#666', fontStyle: 'italic' }}>
                                    No stops available for {selectedLine.split('_')[0]}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Current favorite stops */}
                    {Object.keys(favStops).length > 0 && (
                        <div style={{ 
                            marginBottom: 16, 
                            padding: 12, 
                            background: '#fff', 
                            borderRadius: 8, 
                            border: '1px solid #e0e0e0',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ fontWeight: 'bold', color: '#333', marginBottom: 8 }}>
                                Your Favorite Stops
                            </div>
                            {Object.entries(favStops).map(([line, stopIds]) => (
                                <div key={line} style={{ marginBottom: 8 }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        marginBottom: 4,
                                        borderBottom: '1px solid #f0f0f0',
                                        paddingBottom: 4
                                    }}>
                                        <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                                            Line {line} ({stopIds.length} stops)
                                        </span>
                                        <button 
                                            onClick={() => {
                                                const newFavStops = {...favStops};
                                                delete newFavStops[line];
                                                setFavStops(newFavStops);
                                            }}
                                            style={{ 
                                                padding: '2px 6px', 
                                                background: '#f44336', 
                                                color: 'white',
                                                border: 'none', 
                                                borderRadius: 4, 
                                                cursor: 'pointer',
                                                fontSize: 10
                                            }}
                                        >
                                            Remove All
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {stopIds.map(stopId => {
                                            const stop = (GTFS_STOPS[`${line}_0`] || []).find(s => s.id === stopId) || 
                                                       (GTFS_STOPS[`${line}_1`] || []).find(s => s.id === stopId);
                                            return (
                                                <div key={stopId} style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    background: '#e3f2fd', 
                                                    padding: '2px 6px', 
                                                    borderRadius: 4,
                                                    fontSize: 12
                                                }}>
                                                    <span style={{ marginRight: 4 }}>
                                                        {stop ? stop.name : stopId}
                                                    </span>
                                                    <button 
                                                        onClick={() => {
                                                            const newFavStops = {...favStops};
                                                            newFavStops[line] = newFavStops[line].filter(id => id !== stopId);
                                                            if (newFavStops[line].length === 0) {
                                                                delete newFavStops[line];
                                                            }
                                                            setFavStops(newFavStops);
                                                        }}
                                                        style={{ 
                                                            background: 'none', 
                                                            border: 'none', 
                                                            cursor: 'pointer',
                                                            color: '#f44336',
                                                            fontSize: 12,
                                                            padding: 0,
                                                            marginLeft: 2
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                    {closestBuses.length > 0 ? closestBuses.map(({ line, stop, bus, distance }, idx) => (
                        <div key={line + '-' + stop.id} style={{ 
                            marginBottom: 12, 
                            padding: 12, 
                            background: '#fff', 
                            borderRadius: 8, 
                            border: '1px solid #e0e0e0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                            cursor: 'pointer',
                            ':hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>
                                <span style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 16, display: 'flex', alignItems: 'center' }}>
                                    <span style={{ color: linesWithColors[line], fontWeight: 'bold', fontSize: 18, marginRight: 6 }}>●</span>
                                    {line} → {stop.name}
                                </span>
                            </div>
                            <div style={{ paddingLeft: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ color: '#333', fontWeight: 'bold', fontSize: 14 }}>Bus {bus.id || bus.vehicleRef || 'Unknown'}</span>
                                    <span style={{ 
                                        color: '#fff', 
                                        fontWeight: 'bold', 
                                        fontSize: 12,
                                        backgroundColor: '#1976d2',
                                        padding: '2px 6px',
                                        borderRadius: 12
                                    }}>~{(distance * 100).toFixed(2)} km</span>
                                </div>
                                <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                                    <div style={{ marginBottom: 2 }}><strong>Location:</strong> {bus.lat || bus.latitude}, {bus.lon || bus.longitude}</div>
                                    <div><strong>Next Stop:</strong> {bus.nextStop || 'Unknown'}</div>
                                    {bus.recordedAtTime && (
                                        <div style={{ marginTop: 2 }}><strong>Updated:</strong> {new Date(bus.recordedAtTime).toLocaleTimeString()}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div style={{ 
                            color: '#666', 
                            marginTop: 12, 
                            padding: 16, 
                            background: '#fff', 
                            borderRadius: 8, 
                            border: '1px solid #e0e0e0',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 8
                        }}>
                            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#888' }}>No favorite stops selected</div>
                            <div style={{ fontSize: 14, color: '#888' }}>Select your favorite stops to see the closest buses</div>
                        </div>
                    )}
                </div>
            </div>
            {/* Right panel: Map */}
            <div style={{ flex: 1, background: '#eaeaea', padding: 16 }}>
                <div style={{ 
                    marginBottom: 10, 
                    padding: 12, 
                    background: '#fff', 
                    borderRadius: 8, 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 'bold', color: '#1976d2' }}>Map Status</div>
                        <div style={{ 
                            fontSize: 12, 
                            backgroundColor: lastUpdateTime.error ? '#ffebee' : '#e8f5e9', 
                            color: lastUpdateTime.error ? '#c62828' : '#2e7d32',
                            padding: '2px 8px',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}>
                            {lastUpdateTime.loading ? (
                                <>
                                    <div style={{ 
                                        width: 10, 
                                        height: 10, 
                                        borderRadius: '50%', 
                                        border: '2px solid #f3f3f3', 
                                        borderTop: '2px solid #1976d2', 
                                        animation: 'spin 1s linear infinite' 
                                    }}></div>
                                    <span>Refreshing</span>
                                </>
                            ) : lastUpdateTime.error ? (
                                <span>Error</span>
                            ) : (
                                <span>Active</span>
                            )}
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ 
                            padding: '4px 8px', 
                            backgroundColor: '#e3f2fd', 
                            borderRadius: 4, 
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}>
                            <span style={{ fontWeight: 'bold' }}>Buses:</span> 
                            <span style={{ 
                                backgroundColor: busData.length > 0 ? '#4caf50' : '#f44336', 
                                color: 'white', 
                                borderRadius: 12, 
                                padding: '1px 6px',
                                fontSize: 12,
                                fontWeight: 'bold'
                            }}>
                                {busData.length}
                            </span>
                        </div>
                        
                        <div style={{ 
                            padding: '4px 8px', 
                            backgroundColor: '#e8f5e9', 
                            borderRadius: 4, 
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}>
                            <span style={{ fontWeight: 'bold' }}>Route Points:</span> 
                            <span>{routeCoordinates.length}</span>
                        </div>
                        
                        <div style={{ 
                            padding: '4px 8px', 
                            backgroundColor: '#fff8e1', 
                            borderRadius: 4, 
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}>
                            <span style={{ fontWeight: 'bold' }}>Line:</span> 
                            <span>{selectedLine}</span>
                        </div>
                    </div>
                    
                    <div style={{ fontSize: '0.9em', color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontWeight: 'bold' }}>Last updated:</span> 
                        <span>{lastUpdateTime.time ? lastUpdateTime.time.toLocaleTimeString() : 'Never'}</span>
                    </div>
                </div>
                {busData.length === 0 && (
                    <div style={{ 
                        marginBottom: 10, 
                        padding: 16, 
                        background: lastUpdateTime.error ? '#ffebee' : '#fff3cd', 
                        color: lastUpdateTime.error ? '#c62828' : '#856404', 
                        borderRadius: 8, 
                        border: lastUpdateTime.error ? '1px solid #ffcdd2' : '1px solid #ffeeba',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                            {lastUpdateTime.error ? 'Error Loading Bus Data' : 'No Bus Data Available'}
                        </div>
                        
                        <div style={{ marginBottom: 12 }}>
                            {lastUpdateTime.error 
                                ? 'There was an error connecting to the MTA server. Please try refreshing or select a different bus line.' 
                                : 'The server may be starting up or there might be no active buses for this route at the moment.'}
                        </div>
                        
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <button 
                                onClick={() => {
                                    const lineId = selectedLine.split('_')[0];
                                    console.log('Manually refreshing data for line:', lineId);
                                    setLastUpdateTime({ time: new Date(), loading: true, error: false });
                                    fetchBusesForLine(lineId)
                                        .then(buses => {
                                            setBusData(buses);
                                            setLastUpdateTime({ time: new Date(), loading: false, error: false });
                                        })
                                        .catch(error => {
                                            console.error('Error manually refreshing data:', error);
                                            setLastUpdateTime({ time: new Date(), loading: false, error: true });
                                        });
                                }}
                                style={{ 
                                    padding: '6px 12px', 
                                    background: lastUpdateTime.loading ? '#e0e0e0' : '#1976d2', 
                                    color: lastUpdateTime.loading ? '#757575' : 'white',
                                    border: 'none', 
                                    borderRadius: 4, 
                                    cursor: lastUpdateTime.loading ? 'default' : 'pointer',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                                    transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)'
                                }}
                                disabled={lastUpdateTime.loading}
                            >
                                {lastUpdateTime.loading ? (
                                    <>
                                        <div style={{ 
                                            width: 14, 
                                            height: 14, 
                                            borderRadius: '50%', 
                                            border: '2px solid rgba(255,255,255,0.3)', 
                                            borderTop: '2px solid white', 
                                            animation: 'spin 1s linear infinite' 
                                        }}></div>
                                        <span>Refreshing...</span>
                                    </>
                                ) : (
                                    <span>Refresh Now</span>
                                )}
                            </button>
                            
                            <div style={{ fontSize: 12, color: '#666' }}>
                                {lastUpdateTime.time && (
                                    <span>Last attempt: {lastUpdateTime.time.toLocaleTimeString()}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <MapComponent
                    buses={busData}
                    center={[40.650002, -73.949997]}
                    routeCoordinates={routeCoordinates}
                />
            </div>
        </div>
    );
}
