const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync').parse;

// Helper to read and parse CSV
function readCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return parse(content, { columns: true, skip_empty_lines: true });
}

// Paths
const gtfsDir = path.join(__dirname, 'gtfs_data');
const stopsFile = path.join(gtfsDir, 'stops.txt');
const routesFile = path.join(gtfsDir, 'routes.txt');
const tripsFile = path.join(gtfsDir, 'trips.txt');
const stopTimesFile = path.join(gtfsDir, 'stop_times.txt');

// 1. Parse stops.txt
const stops = {};
readCSV(stopsFile).forEach(row => {
    stops[row.stop_id] = {
        id: row.stop_id,
        name: row.stop_name,
        latitude: parseFloat(row.stop_lat),
        longitude: parseFloat(row.stop_lon)
    };
});

// 2. Parse routes.txt to get Brooklyn bus lines (B1, B2, ..., B103, B44-SBS, etc.)
const brooklynRoutes = {};
readCSV(routesFile).forEach(row => {
    if (/^B\d+(-SBS)?$/.test(row.route_short_name)) {
        brooklynRoutes[row.route_id] = row.route_short_name;
    }
});

// 3. Parse trips.txt to map route_id to trip_id and direction_id
const DIRECTION_MAP = { '0': 'NB', '1': 'SB' }; // Adjust as needed for EB/WB
const routeTrips = {};
const tripDirections = {};
readCSV(tripsFile).forEach(row => {
    const lineRef = brooklynRoutes[row.route_id];
    if (lineRef) {
        const dir = row.direction_id; // '0' or '1'
        const key = `${lineRef}_${DIRECTION_MAP[dir] || dir}`;
        if (!routeTrips[key]) routeTrips[key] = new Set();
        routeTrips[key].add(row.trip_id);
        tripDirections[row.trip_id] = key;
    }
});

// 4. Parse stop_times.txt to map trip_id to stop_ids (with sequence)
const lineStops = {};
readCSV(stopTimesFile).forEach(row => {
    const key = tripDirections[row.trip_id];
    if (key && stops[row.stop_id]) {
        if (!lineStops[key]) lineStops[key] = {};
        // Use stop_sequence to order stops
        lineStops[key][row.stop_id] = {
            ...stops[row.stop_id],
            sequence: parseInt(row.stop_sequence, 10)
        };
    }
});

// 5. Deduplicate and sort stops by sequence for each line+direction
const output = {};
for (const key in lineStops) {
    const stopsArr = Object.values(lineStops[key]);
    // Remove duplicates by stop_id, keep the lowest sequence
    const deduped = {};
    stopsArr.forEach(stop => {
        if (!deduped[stop.id] || stop.sequence < deduped[stop.id].sequence) {
            deduped[stop.id] = stop;
        }
    });
    // Sort by sequence
    output[key] = Object.values(deduped)
        .sort((a, b) => a.sequence - b.sequence)
        .map(({ sequence, ...rest }) => rest); // Remove sequence from output
}

// 6. Write to utils/gtfsStops.js
const outPath = path.join(__dirname, 'utils', 'gtfsStops.js');
fs.writeFileSync(
    outPath,
    'export const GTFS_STOPS = ' + JSON.stringify(output, null, 2) + ';\n'
);

console.log('Generated utils/gtfsStops.js!');