import React, { useEffect, useState } from 'react';
import MapComponent from './MapComponent.web.js';
import { GTFS_STOPS } from './utils/gtfsStops';
import { fetchBusesForLine } from './utils/mtaApi';

const BUS_LINES = [
    // B1 - Bay Ridge - Manhattan Beach
    { value: 'B1_NB', label: 'B1 - Bay Ridge to Manhattan Beach' },
    { value: 'B1_SB', label: 'B1 - Manhattan Beach to Bay Ridge' },
    
    // B2 - Kings Hwy Station - Kings Plaza
    { value: 'B2_NB', label: 'B2 - Kings Hwy Station to Kings Plaza' },
    { value: 'B2_SB', label: 'B2 - Kings Plaza to Kings Hwy Station' },
    
    // B3 - Bensonhurst - Bergen Beach
    { value: 'B3_NB', label: 'B3 - Bensonhurst to Bergen Beach' },
    { value: 'B3_SB', label: 'B3 - Bergen Beach to Bensonhurst' },
    
    // B4 - Bay Ridge - Sheepshead Bay
    { value: 'B4_NB', label: 'B4 - Bay Ridge to Sheepshead Bay' },
    { value: 'B4_SB', label: 'B4 - Sheepshead Bay to Bay Ridge' },
    
    // B6 - Bath Beach - East New York
    { value: 'B6_NB', label: 'B6 - Bath Beach to East New York' },
    { value: 'B6_SB', label: 'B6 - East New York to Bath Beach' },
    
    // B7 - Midwood - Bedford-Stuyvesant
    { value: 'B7_NB', label: 'B7 - Midwood to Bedford-Stuyvesant' },
    { value: 'B7_SB', label: 'B7 - Bedford-Stuyvesant to Midwood' },
    
    // B8 - Dyker Heights - East Flatbush
    { value: 'B8_NB', label: 'B8 - Dyker Heights to East Flatbush' },
    { value: 'B8_SB', label: 'B8 - East Flatbush to Dyker Heights' },
    
    // B9 - Bay Ridge - Kings Plaza
    { value: 'B9_NB', label: 'B9 - Bay Ridge to Kings Plaza' },
    { value: 'B9_SB', label: 'B9 - Kings Plaza to Bay Ridge' },
    
    // B11 - Sunset Park - Midwood
    { value: 'B11_NB', label: 'B11 - Sunset Park to Midwood' },
    { value: 'B11_SB', label: 'B11 - Midwood to Sunset Park' },
    
    // B12 - Lefferts Gardens - East New York
    { value: 'B12_NB', label: 'B12 - Lefferts Gardens to East New York' },
    { value: 'B12_SB', label: 'B12 - East New York to Lefferts Gardens' },
    
    // B13 - Spring Creek - Wyckoff Hospital
    { value: 'B13_NB', label: 'B13 - Spring Creek to Wyckoff Hospital' },
    { value: 'B13_SB', label: 'B13 - Wyckoff Hospital to Spring Creek' },
    
    // B14 - Spring Creek - Crown Heights
    { value: 'B14_NB', label: 'B14 - Spring Creek to Crown Heights' },
    { value: 'B14_SB', label: 'B14 - Crown Heights to Spring Creek' },
    
    // B15 - Bedford Stuyvesant - JFK AirTrain
    { value: 'B15_NB', label: 'B15 - Bedford Stuyvesant to JFK AirTrain' },
    { value: 'B15_SB', label: 'B15 - JFK AirTrain to Bedford Stuyvesant' },
    
    // B16 - Bay Ridge - Lefferts Gardens
    { value: 'B16_NB', label: 'B16 - Bay Ridge to Lefferts Gardens' },
    { value: 'B16_SB', label: 'B16 - Lefferts Gardens to Bay Ridge' },
    
    // B17 - Canarsie - Crown Heights
    { value: 'B17_NB', label: 'B17 - Canarsie to Crown Heights' },
    { value: 'B17_SB', label: 'B17 - Crown Heights to Canarsie' },
    
    // B20 - Ridgewood - Spring Creek
    { value: 'B20_NB', label: 'B20 - Ridgewood to Spring Creek' },
    { value: 'B20_SB', label: 'B20 - Spring Creek to Ridgewood' },
    
    // B24 - Williamsburg - Greenpoint
    { value: 'B24_NB', label: 'B24 - Williamsburg to Greenpoint' },
    { value: 'B24_SB', label: 'B24 - Greenpoint to Williamsburg' },
    
    // B25 - Downtown Brooklyn & DUMBO - Broadway Junction
    { value: 'B25_NB', label: 'B25 - Downtown Brooklyn & DUMBO to Broadway Junction' },
    { value: 'B25_SB', label: 'B25 - Broadway Junction to Downtown Brooklyn & DUMBO' },
    
    // B26 - Downtown Brooklyn - Ridgewood
    { value: 'B26_NB', label: 'B26 - Downtown Brooklyn to Ridgewood' },
    { value: 'B26_SB', label: 'B26 - Ridgewood to Downtown Brooklyn' },
    
    // B31 - Gerritsen Beach - Kings Hwy Station
    { value: 'B31_NB', label: 'B31 - Gerritsen Beach to Kings Hwy Station' },
    { value: 'B31_SB', label: 'B31 - Kings Hwy Station to Gerritsen Beach' },
    
    // B32 - Williamsburg - Long Island City
    { value: 'B32_NB', label: 'B32 - Williamsburg to Long Island City' },
    { value: 'B32_SB', label: 'B32 - Long Island City to Williamsburg' },
    
    // B35 - Brownsville - Sunset Park
    { value: 'B35_NB', label: 'B35 - Brownsville to Sunset Park' },
    { value: 'B35_SB', label: 'B35 - Sunset Park to Brownsville' },
    
    // B36 - Sheepshead Bay - Coney Island
    { value: 'B36_NB', label: 'B36 - Sheepshead Bay to Coney Island' },
    { value: 'B36_SB', label: 'B36 - Coney Island to Sheepshead Bay' },
    
    // B37 - Downtown Brooklyn - Bay Ridge
    { value: 'B37_NB', label: 'B37 - Downtown Brooklyn to Bay Ridge' },
    { value: 'B37_SB', label: 'B37 - Bay Ridge to Downtown Brooklyn' },
    
    // B38 - Ridgewood - Downtown Brooklyn
    { value: 'B38_NB', label: 'B38 - Ridgewood to Downtown Brooklyn' },
    { value: 'B38_SB', label: 'B38 - Downtown Brooklyn to Ridgewood' },
    
    // B39 - Williamsburg Bridge Plaza - Lower East Side
    { value: 'B39_NB', label: 'B39 - Williamsburg Bridge Plaza to Lower East Side' },
    { value: 'B39_SB', label: 'B39 - Lower East Side to Williamsburg Bridge Plaza' },
    
    // B41 - Kings Plaza - Downtown Brooklyn
    { value: 'B41_NB', label: 'B41 - Kings Plaza to Downtown Brooklyn' },
    { value: 'B41_SB', label: 'B41 - Downtown Brooklyn to Kings Plaza' },
    
    // B42 - Canarsie Pier - Rockaway Parkway Station
    { value: 'B42_NB', label: 'B42 - Canarsie Pier to Rockaway Parkway Station' },
    { value: 'B42_SB', label: 'B42 - Rockaway Parkway Station to Canarsie Pier' },
    
    // B43 - Greenpoint - Lefferts Gardens
    { value: 'B43_NB', label: 'B43 - Greenpoint to Lefferts Gardens' },
    { value: 'B43_SB', label: 'B43 - Lefferts Gardens to Greenpoint' },
    
    // B44 - Sheepshead Bay - Williamsburg
    { value: 'B44_NB', label: 'B44 - Sheepshead Bay to Williamsburg' },
    { value: 'B44_SB', label: 'B44 - Williamsburg to Sheepshead Bay' },
    
    // B44 SBS - Sheepshead Bay - Williamsburg (Select Bus Service)
    { value: 'B44+_NB', label: 'B44-SBS - Sheepshead Bay to Williamsburg (Select Bus)' },
    { value: 'B44+_SB', label: 'B44-SBS - Williamsburg to Sheepshead Bay (Select Bus)' },
    
    // B45 - Downtown Brooklyn - Crown Heights
    { value: 'B45_NB', label: 'B45 - Downtown Brooklyn to Crown Heights' },
    { value: 'B45_SB', label: 'B45 - Crown Heights to Downtown Brooklyn' },
    
    // B46 - Kings Plaza - Williamsburg
    { value: 'B46_NB', label: 'B46 - Kings Plaza to Williamsburg' },
    { value: 'B46_SB', label: 'B46 - Williamsburg to Kings Plaza' },
    
    // B46 SBS - Kings Plaza - Williamsburg (Select Bus Service)
    { value: 'B46+_NB', label: 'B46-SBS - Kings Plaza to Williamsburg (Select Bus)' },
    { value: 'B46+_SB', label: 'B46-SBS - Williamsburg to Kings Plaza (Select Bus)' },
    
    // B47 - Kings Plaza - Bedford-Stuyvesant
    { value: 'B47_NB', label: 'B47 - Kings Plaza to Bedford-Stuyvesant' },
    { value: 'B47_SB', label: 'B47 - Bedford-Stuyvesant to Kings Plaza' },
    
    // B48 - Lefferts Gardens - Greenpoint
    { value: 'B48_NB', label: 'B48 - Lefferts Gardens to Greenpoint' },
    { value: 'B48_SB', label: 'B48 - Greenpoint to Lefferts Gardens' },
    
    // B49 - Manhattan Beach - Bedford-Stuyvesant
    { value: 'B49_NB', label: 'B49 - Manhattan Beach to Bedford-Stuyvesant' },
    { value: 'B49_SB', label: 'B49 - Bedford-Stuyvesant to Manhattan Beach' },
    
    // B52 - Downtown Brooklyn - Ridgewood
    { value: 'B52_NB', label: 'B52 - Downtown Brooklyn to Ridgewood' },
    { value: 'B52_SB', label: 'B52 - Ridgewood to Downtown Brooklyn' },
    
    // B54 - Downtown Brooklyn - Ridgewood
    { value: 'B54_NB', label: 'B54 - Downtown Brooklyn to Ridgewood' },
    { value: 'B54_SB', label: 'B54 - Ridgewood to Downtown Brooklyn' },
    
    // B57 - Gowanus - Maspeth
    { value: 'B57_NB', label: 'B57 - Gowanus to Maspeth' },
    { value: 'B57_SB', label: 'B57 - Maspeth to Gowanus' },
    
    // B60 - Williamsburg - Canarsie
    { value: 'B60_NB', label: 'B60 - Williamsburg to Canarsie' },
    { value: 'B60_SB', label: 'B60 - Canarsie to Williamsburg' },
    
    // B61 - Park Slope - Downtown Brooklyn
    { value: 'B61_NB', label: 'B61 - Park Slope to Downtown Brooklyn' },
    { value: 'B61_SB', label: 'B61 - Downtown Brooklyn to Park Slope' },
    
    // B62 - Downtown Brooklyn - Long Island City
    { value: 'B62_NB', label: 'B62 - Downtown Brooklyn to Long Island City' },
    { value: 'B62_SB', label: 'B62 - Long Island City to Downtown Brooklyn' },
    
    // B63 - Bay Ridge - Cobble Hill
    { value: 'B63_NB', label: 'B63 - Bay Ridge to Cobble Hill' },
    { value: 'B63_SB', label: 'B63 - Cobble Hill to Bay Ridge' },
    
    // B64 - Bay Ridge - Coney Island
    { value: 'B64_NB', label: 'B64 - Bay Ridge to Coney Island' },
    { value: 'B64_SB', label: 'B64 - Coney Island to Bay Ridge' },
    
    // B65 - Downtown Brooklyn - Crown Heights
    { value: 'B65_NB', label: 'B65 - Downtown Brooklyn to Crown Heights' },
    { value: 'B65_SB', label: 'B65 - Crown Heights to Downtown Brooklyn' },
    
    // B67 - Brooklyn Navy Yard - Kensington
    { value: 'B67_NB', label: 'B67 - Brooklyn Navy Yard to Kensington' },
    { value: 'B67_SB', label: 'B67 - Kensington to Brooklyn Navy Yard' },
    
    // B68 - Coney Island - Windsor Terrace
    { value: 'B68_NB', label: 'B68 - Coney Island to Windsor Terrace' },
    { value: 'B68_SB', label: 'B68 - Windsor Terrace to Coney Island' },
    
    // B69 - Downtown Brooklyn - Kensington
    { value: 'B69_NB', label: 'B69 - Downtown Brooklyn to Kensington' },
    { value: 'B69_SB', label: 'B69 - Kensington to Downtown Brooklyn' },
    
    // B70 - Dyker Heights - Sunset Park
    { value: 'B70_NB', label: 'B70 - Dyker Heights to Sunset Park' },
    { value: 'B70_SB', label: 'B70 - Sunset Park to Dyker Heights' },
    
    // B74 - Sea Gate - Stillwell Av
    { value: 'B74_NB', label: 'B74 - Sea Gate to Stillwell Av' },
    { value: 'B74_SB', label: 'B74 - Stillwell Av to Sea Gate' },
    
    // B82 - Coney Island - Spring Creek Towers
    { value: 'B82_NB', label: 'B82 - Coney Island to Spring Creek Towers' },
    { value: 'B82_SB', label: 'B82 - Spring Creek Towers to Coney Island' },
    
    // B82 SBS - Coney Island - Spring Creek Towers (Select Bus Service)
    { value: 'B82+_NB', label: 'B82-SBS - Coney Island to Spring Creek Towers (Select Bus)' },
    { value: 'B82+_SB', label: 'B82-SBS - Spring Creek Towers to Coney Island (Select Bus)' },
    
    // B83 - Spring Creek - Broadway Junction
    { value: 'B83_NB', label: 'B83 - Spring Creek to Broadway Junction' },
    { value: 'B83_SB', label: 'B83 - Broadway Junction to Spring Creek' },
    
    // B84 - Spring Creek - New Lots
    { value: 'B84_NB', label: 'B84 - Spring Creek to New Lots' },
    { value: 'B84_SB', label: 'B84 - New Lots to Spring Creek' }
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
            
            // Mark the closest bus with isClosestToStop property
            if (closestBus) {
                closestBus.isClosestToStop = true;
            }
            
            return closestBus && stopObj ? {
                line,
                stop: stopObj,
                bus: closestBus,
                distance: minDistance
            } : null;
        })
    ).filter(Boolean);
    
    // Sort closest buses by distance
    closestBuses.sort((a, b) => a.distance - b.distance);
    
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
                        @keyframes pulse {
                            0% {
                                box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
                            }
                            70% {
                                box-shadow: 0 0 0 6px rgba(76, 175, 80, 0);
                            }
                            100% {
                                box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
                            }
                        }
                    `}</style>
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ 
                            fontWeight: 'bold', 
                            color: '#1976d2', 
                            fontSize: 18, 
                            marginBottom: 8, 
                            display: 'flex', 
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <span>Closest Buses to Your Stops</span>
                            <div style={{ 
                                fontSize: 12, 
                                color: '#666', 
                                fontWeight: 'normal',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <span style={{ 
                                    display: 'inline-block', 
                                    width: 10, 
                                    height: 10, 
                                    borderRadius: '50%', 
                                    backgroundColor: '#4caf50', 
                                    marginRight: 4 
                                }}></span>
                                Auto-updating every 15s
                            </div>
                        </div>
                    </div>
                    {closestBuses.length > 0 && closestBuses.map(({ line, stop, bus, distance }, idx) => {
                        // Determine distance color based on proximity
                        const distanceColor = distance < 0.01 ? '#4caf50' : // Very close (< 1km)
                                            distance < 0.03 ? '#ff9800' : // Moderate distance (< 3km)
                                            '#f44336'; // Far away
                        
                        // Format distance for display
                        const formattedDistance = distance < 0.01 ? 
                            `${(distance * 1000).toFixed(0)}m` : // Show in meters if < 1km
                            `${distance.toFixed(2)}km`; // Show in km otherwise
                        
                        return (
                            <div key={line + '-' + stop.id} style={{ 
                                marginBottom: 12, 
                                padding: 12, 
                                background: '#fff', 
                                borderRadius: 8, 
                                border: '1px solid #e0e0e0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                transition: 'all 0.2s ease-in-out',
                                cursor: 'pointer',
                                position: 'relative',
                                borderLeft: `4px solid ${linesWithColors[line]}`,
                                ':hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }
                            }}>
                                {/* Pulsing indicator for active tracking */}
                                <div style={{ 
                                    position: 'absolute', 
                                    top: 8, 
                                    right: 8, 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: '50%', 
                                    backgroundColor: '#4caf50',
                                    boxShadow: '0 0 0 rgba(76, 175, 80, 0.4)',
                                    animation: 'pulse 2s infinite'
                                }}></div>
                                
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
                                            backgroundColor: distanceColor,
                                            padding: '2px 8px',
                                            borderRadius: 12,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4
                                        }}>
                                            <span style={{ fontSize: 10 }}>📍</span>
                                            {formattedDistance}
                                        </span>
                                    </div>
                                    <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                                        {bus.nextStop && (
                                            <div style={{ 
                                                fontSize: '13px', 
                                                backgroundColor: '#e3f2fd', 
                                                padding: '5px 8px', 
                                                borderRadius: '4px', 
                                                marginBottom: '8px',
                                                borderLeft: '3px solid #1976d2',
                                                fontWeight: 'bold',
                                                color: '#0d47a1'
                                            }}>
                                                <span>Current Stop:</span> {bus.nextStop}
                                            </div>
                                        )}
                                        <div style={{ marginBottom: 2 }}><strong>Location:</strong> {bus.lat || bus.latitude}, {bus.lon || bus.longitude}</div>
                                        {bus.recordedAtTime && (
                                            <div style={{ marginTop: 2 }}><strong>Updated:</strong> {new Date(bus.recordedAtTime).toLocaleTimeString()}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
                    favStops={favStops}
                    linesWithColors={linesWithColors}
                    closestBuses={closestBuses}
                />
            </div>
        </div>
    );
}
