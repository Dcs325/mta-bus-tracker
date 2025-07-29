import { GTFS_STOPS } from './gtfsStops';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

const MTA_API_KEY = "c1c955fd-f1f7-4a27-b3e8-8bb897d30ad7";
const MTA_BASE_URL = "https://bustime.mta.info/api/siri";

// Use local IP for mobile devices
const LOCAL_IP = '172.16.0.182'; // e.g., '192.168.1.100'
const API_BASE_URL = Platform.OS === 'web' ? 'http://localhost:3000' : `http://${LOCAL_IP}:3000`;

// Fetch all buses for a specific line
export async function fetchBusesForLine(lineRef) {
    try {
        console.log(`Fetching buses for line: ${lineRef}`);
        const url = `http://localhost:3000/api/vehicle-monitoring?lineRef=${lineRef}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response received:', JSON.stringify(data).substring(0, 100) + '...');
        
        // Validate the response structure
        if (!data.Siri || 
            !data.Siri.ServiceDelivery || 
            !data.Siri.ServiceDelivery.VehicleMonitoringDelivery || 
            !data.Siri.ServiceDelivery.VehicleMonitoringDelivery[0]) {
            console.error('Invalid API response structure:', JSON.stringify(data).substring(0, 200));
            return [];
        }
        
        // Parse the SIRI VehicleMonitoring data to extract bus info
        const vehicles = data.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity || [];
        console.log(`Found ${vehicles.length} vehicles for line ${lineRef}`);
        
        return vehicles.map(v => {
            const mvj = v.MonitoredVehicleJourney;
            const result = {
                id: mvj.VehicleRef,
                lat: mvj.VehicleLocation?.Latitude,
                lon: mvj.VehicleLocation?.Longitude,
                label: mvj.LineRef,
                nextStop: mvj.OnwardCalls?.OnwardCall?.[0]?.StopPointName || 'N/A',
                destination: mvj.DestinationName || 'Unknown',
                recordedAtTime: v.RecordedAtTime,
                bearing: mvj.Bearing,
                progress: mvj.ProgressRate,
                occupancy: mvj.Occupancy,
                vehicleJourneyRef: mvj.FramedVehicleJourneyRef?.DatedVehicleJourneyRef
            };
            
            // Log any missing critical data
            if (!result.lat || !result.lon) {
                console.warn(`Bus ${result.id} has invalid coordinates:`, result.lat, result.lon);
            }
            
            return result;
        }).filter(bus => {
            // Filter out buses with invalid coordinates
            return typeof bus.lat === 'number' && typeof bus.lon === 'number';
        });
    } catch (error) {
        console.error('Error in fetchBusesForLine:', error);
        throw error;
    }
}

// Fetch bus stops for a specific line
export const fetchStopsForLine = async (lineRef) => {
    // Use static GTFS stops if available
    if (GTFS_STOPS[lineRef]) {
        console.log(`Found ${GTFS_STOPS[lineRef].length} static stops for line ${lineRef}`);
        return GTFS_STOPS[lineRef];
    }

    // Fallback message if line not in static data
    console.log(`No static stops found for line ${lineRef}.`);
    return [];
};

// Get arrival predictions for a specific stop
export const fetchArrivalPredictions = async (stopId) => {
    try {
        const url = `${MTA_BASE_URL}/stop-monitoring.json?key=${MTA_API_KEY}&MonitoringRef=${stopId}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.Siri || !data.Siri.ServiceDelivery || !data.Siri.ServiceDelivery.StopMonitoringDelivery) {
            console.log('No arrival predictions available');
            return [];
        }

        const stopDelivery = data.Siri.ServiceDelivery.StopMonitoringDelivery[0];

        if (!stopDelivery || !stopDelivery.MonitoredStopVisit) {
            console.log('No stop visits found for predictions');
            return [];
        }

        // Extract arrival predictions
        const predictions = stopDelivery.MonitoredStopVisit.map(visit => {
            const journey = visit.MonitoredVehicleJourney;
            const call = journey.MonitoredCall;

            return {
                lineRef: journey.LineRef,
                destination: journey.DestinationName,
                vehicleId: journey.VehicleRef,
                expectedArrival: call.AimedArrivalTime,
                expectedDeparture: call.AimedDepartureTime,
                actualArrival: call.ActualArrivalTime,
                actualDeparture: call.ActualDepartureTime,
                distanceFromStop: call.DistanceFromStop,
                numberOfStopsAway: call.NumberOfStopsAway,
            };
        });

        console.log(`Fetched ${predictions.length} arrival predictions for stop ${stopId}`);
        return predictions;

    } catch (error) {
        console.error('Error fetching arrival predictions:', error);
        throw error;
    }
};

// Save bus location to Firestore
export const saveBusLocation = async (busId, latitude, longitude, lineRef) => {
    await setDoc(doc(db, 'busLocations', busId), {
        latitude,
        longitude,
        lineRef,
        timestamp: Date.now()
    });
};

// Brooklyn-focused bus lines (most popular Brooklyn routes first)
export const COMMON_BUS_LINES = [
    // Major Brooklyn Routes
    'B1', 'B2', 'B3', 'B4', 'B6', 'B7', 'B8', 'B9', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B20', 'B23', 'B24', 'B25', 'B26', 'B27', 'B28', 'B29', 'B31', 'B32', 'B35', 'B36', 'B37', 'B38', 'B39', 'B41', 'B42', 'B43', 'B44', 'B45', 'B46', 'B47', 'B48', 'B49', 'B50', 'B52', 'B54', 'B57', 'B60', 'B61', 'B62', 'B63', 'B64', 'B65', 'B66', 'B67', 'B68', 'B69', 'B70', 'B71', 'B74', 'B78', 'B82', 'B83', 'B84', 'B100', 'B103',

    // Express Routes
    'BM1', 'BM2', 'BM3', 'BM4', 'BM5',

    // Select Bus Service
    'B44-SBS', 'B46-SBS', 'B82-SBS',

    // Manhattan Routes (for reference)
    'M15', 'M15-SBS', 'M14A', 'M14D', 'M23-SBS', 'M34A-SBS', 'M34-SBS', 'M60-SBS', 'M66', 'M72', 'M79-SBS', 'M86-SBS', 'M96', 'M98', 'M101', 'M102', 'M103', 'M104', 'M106', 'M116'
];

// Brooklyn-specific bus lines for quick access
export const BROOKLYN_BUS_LINES = [
    'B1', 'B2', 'B3', 'B4', 'B6', 'B7', 'B8', 'B9', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B20', 'B23', 'B24', 'B25', 'B26', 'B27', 'B28', 'B29', 'B31', 'B32', 'B35', 'B36', 'B37', 'B38', 'B39', 'B41', 'B42', 'B43', 'B44', 'B45', 'B46', 'B47', 'B48', 'B49', 'B50', 'B52', 'B54', 'B57', 'B60', 'B61', 'B62', 'B63', 'B64', 'B65', 'B66', 'B67', 'B68', 'B69', 'B70', 'B71', 'B74', 'B78', 'B82', 'B83', 'B84', 'B100', 'B103'
];