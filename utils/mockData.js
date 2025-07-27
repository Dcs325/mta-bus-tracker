export const MOCK_BUS_STOPS = {
    '123456': { name: 'E 86 St/Lexington Av', latitude: 40.7797, longitude: -73.9555 },
    '654321': { name: 'W 42 St/8 Av', latitude: 40.7579, longitude: -73.9904 },
    // Add more mock stops as needed for testing
};

export const getMockBuses = (selectedBusStop) => [
    { id: 'BUS123', latitude: selectedBusStop.latitude + 0.015, longitude: selectedBusStop.longitude + 0.015, lineRef: 'M15', destination: 'Downtown' }, // ~1 mile away
    { id: 'BUS456', latitude: selectedBusStop.latitude + 0.005, longitude: selectedBusStop.longitude + 0.005, lineRef: 'M15', destination: 'Downtown' }, // ~0.5 miles away
    { id: 'BUS789', latitude: selectedBusStop.latitude + 0.001, longitude: selectedBusStop.longitude + 0.001, lineRef: 'M15', destination: 'Downtown' }, // ~0.1 miles away
    { id: 'BUS000', latitude: selectedBusStop.latitude + 0.03, longitude: selectedBusStop.longitude + 0.03, lineRef: 'M15', destination: 'Uptown' }, // Far away
]; 