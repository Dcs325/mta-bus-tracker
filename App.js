import React, { useEffect, useState } from 'react';
import MapComponent from './components/MapComponent.web.js';
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
    const [favStops, setFavStops] = useState({
        B49_SB: ['stop1', 'stop2'],
        B60_SB: ['stop3'],
        B47_NB: ['stop4'],
        // ...example favorite stops by line
    });
    const [lastUpdateTime, setLastUpdateTime] = useState(null);

    // Fetch bus data for selected line
    useEffect(() => {
        async function fetchData() {
            const buses = await fetchBusesForLine(selectedLine.split('_')[0]);
            setBusData(buses);
            setLastUpdateTime(new Date());
        }
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
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

    // Compute closest buses to each stop (simplified for demo)
    const closestBuses = Object.entries(favStops).flatMap(([line, stopIds]) =>
        stopIds.map(stopId => {
            const stopObj = (GTFS_STOPS[line] || []).find(s => s.id === stopId);
            if (!stopObj) return null;
            let closestBus = null;
            let minDistance = Infinity;
            busData.forEach(bus => {
                const busLat = bus.lat || bus.latitude;
                const busLon = bus.lon || bus.longitude;
                if (typeof busLat === 'number' && typeof busLon === 'number') {
                    const dist = Math.sqrt(Math.pow(busLat - stopObj.latitude, 2) + Math.pow(busLon - stopObj.longitude, 2));
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestBus = bus;
                    }
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

    return (
        <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', background: '#f8f8f8' }}>
            {/* Left panel */}
            <div style={{ width: 400, background: '#fff', padding: 16, overflowY: 'auto' }}>
                <h2 style={{ color: '#1976d2', textAlign: 'center' }}>MTA Tracker App</h2>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 'bold', color: '#1976d2' }}>Quick Bus Line Selector:</label>
                    <select
                        value={selectedLine}
                        onChange={e => setSelectedLine(e.target.value)}
                        style={{ width: '100%', fontSize: 16, padding: 6, borderRadius: 6, borderColor: '#1976d2', color: '#1976d2', marginTop: 4 }}
                    >
                        {BUS_LINES.map(line => (
                            <option key={line.value} value={line.value}>{line.label}</option>
                        ))}
                    </select>
                </div>
                <div style={{ background: '#f0f4f8', borderRadius: 16, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontWeight: 'bold', color: '#1976d2', fontSize: 18 }}>closest buses to your stops</span>
                        <span style={{ color: '#666', fontSize: 12, fontStyle: 'italic' }}>
                            Last updated: {lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : 'Never'}
                        </span>
                    </div>
                    {closestBuses.length > 0 ? closestBuses.map(({ line, stop, bus, distance }, idx) => (
                        <div key={line + '-' + stop.id} style={{ marginBottom: 12, padding: 8, background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 16 }}>{line} → {stop.name}</span>
                                <span style={{ color: linesWithColors[line], fontWeight: 'bold', fontSize: 14 }}>●</span>
                            </div>
                            <div style={{ paddingLeft: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <span style={{ color: '#333', fontWeight: 'bold' }}>Bus {bus.id || 'Unknown'}</span>
                                    <span style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 14 }}>~{(distance * 100).toFixed(2)} km</span>
                                </div>
                                <span style={{ color: '#666', fontSize: 12 }}>Location: {bus.lat || bus.latitude}, {bus.lon || bus.longitude}</span><br />
                                <span style={{ color: '#666', fontSize: 12 }}>Next Stop: {bus.nextStop}</span>
                            </div>
                        </div>
                    )) : <span style={{ color: '#888', marginTop: 8 }}>No favorite stops selected</span>}
                </div>
            </div>
            {/* Right panel: Map */}
            <div style={{ flex: 1, background: '#eaeaea', padding: 16 }}>
                <MapComponent
                    buses={busData}
                    center={[40.650002, -73.949997]}
                    routeCoordinates={routeCoordinates}
                />
            </div>
        </div>
    );
}
