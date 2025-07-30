import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import MapView, { Marker, Callout, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

export default function MapComponent({ buses = [], center = [40.650002, -73.949997], routeCoordinates = [], favStops = {}, linesWithColors = {}, closestBuses = [] }) {
    // Default region centered on Brooklyn
    const defaultRegion = {
        latitude: center[0],
        longitude: center[1],
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={defaultRegion}
            >
                {/* Route polylines removed - buses now show as individual moving icons */}

                {/* Bus markers */}
                {buses.map((bus, idx) => {
                    const isClosestBus = bus.isClosestToStop === true;
                    const pinColor = isClosestBus ? '#4caf50' : 'red';
                    
                    // Create animated marker for closest bus
                    if (isClosestBus) {
                        const scaleAnim = useRef(new Animated.Value(1)).current;
                        
                        useEffect(() => {
                            Animated.loop(
                                Animated.sequence([
                                    Animated.timing(scaleAnim, {
                                        toValue: 1.2,
                                        duration: 1000,
                                        useNativeDriver: true,
                                    }),
                                    Animated.timing(scaleAnim, {
                                        toValue: 1,
                                        duration: 1000,
                                        useNativeDriver: true,
                                    })
                                ])
                            ).start();
                            
                            return () => {
                                scaleAnim.stopAnimation();
                            };
                        }, []);
                        
                        return (
                            <Marker
                                key={bus.id || idx}
                                coordinate={{
                                    latitude: bus.lat || bus.latitude,
                                    longitude: bus.lon || bus.longitude,
                                }}
                                title={`Bus ${bus.id || bus.label || ''} (Tracking)`}
                                pinColor={pinColor}
                                zIndex={999}
                            >
                                <Callout>
                                    <View style={{ padding: 5, minWidth: 150 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                            <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#4caf50' }}>Bus {bus.label || bus.id} {(() => {
                                                const directionLine = bus.directionLine || '';
                                                if (directionLine.includes('_NB')) return '(NB)';
                                                if (directionLine.includes('_SB')) return '(SB)';
                                                if (directionLine.includes('_EB')) return '(EB)';
                                                if (directionLine.includes('_WB')) return '(WB)';
                                                return '';
                                            })()}</Text>
                                            <View style={{ backgroundColor: '#4caf50', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                                                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>TRACKING</Text>
                                            </View>
                                        </View>
                                        {bus.nextStop && (
                                            <View style={{ 
                                                backgroundColor: '#e8f5e9', 
                                                padding: 8, 
                                                borderRadius: 4, 
                                                marginBottom: 8,
                                                borderLeftWidth: 3,
                                                borderLeftColor: '#4caf50'
                                            }}>
                                                <Text style={{ fontWeight: 'bold', color: '#2e7d32' }}>Current Stop: {bus.nextStop}</Text>
                                            </View>
                                        )}
                                        {bus.destination && <Text>Destination: {bus.destination}</Text>}
                                        {bus.distance !== undefined && (
                                            <Text style={{ marginTop: 4 }}>
                                                <Text style={{ fontWeight: 'bold' }}>Distance: </Text>
                                                {bus.distance < 0.01 ? 
                                                    `${(bus.distance * 1000).toFixed(0)}m` : 
                                                    `${bus.distance.toFixed(2)}km`}
                                            </Text>
                                        )}
                                    </View>
                                </Callout>
                            </Marker>
                        );
                    }
                    
                    // Regular bus marker
                    return (
                        <Marker
                            key={bus.id || idx}
                            coordinate={{
                                latitude: bus.lat || bus.latitude,
                                longitude: bus.lon || bus.longitude,
                            }}
                            title={`Bus ${bus.id || bus.label || ''}`}
                            pinColor={pinColor}
                        >
                            <Callout>
                                <View style={{ padding: 5, minWidth: 150 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 5 }}>Bus {bus.label || bus.id} {(() => {
                                        const directionLine = bus.directionLine || '';
                                        if (directionLine.includes('_NB')) return '(NB)';
                                        if (directionLine.includes('_SB')) return '(SB)';
                                        if (directionLine.includes('_EB')) return '(EB)';
                                        if (directionLine.includes('_WB')) return '(WB)';
                                        return '';
                                    })()}</Text>
                                    {bus.nextStop && (
                                        <View style={{ 
                                            backgroundColor: '#e3f2fd', 
                                            padding: 8, 
                                            borderRadius: 4, 
                                            marginBottom: 8,
                                            borderLeftWidth: 3,
                                            borderLeftColor: '#1976d2'
                                        }}>
                                            <Text style={{ fontWeight: 'bold', color: '#0d47a1' }}>Current Stop: {bus.nextStop}</Text>
                                        </View>
                                    )}
                                    {bus.destination && <Text>Destination: {bus.destination}</Text>}
                                    {bus.distance !== undefined && (
                                        <Text style={{ marginTop: 4 }}>
                                            <Text style={{ fontWeight: 'bold' }}>Distance: </Text>
                                            {bus.distance < 0.01 ? 
                                                `${(bus.distance * 1000).toFixed(0)}m` : 
                                                `${bus.distance.toFixed(2)}km`}
                                        </Text>
                                    )}
                                </View>
                            </Callout>
                        </Marker>
                    );
                })}

                {/* Draw colored lines from favorite stops to their closest buses */}
                {closestBuses.map((closestBus, idx) => {
                    const { line, stop, bus } = closestBus;
                    const busLat = bus.lat || bus.latitude;
                    const busLon = bus.lon || bus.longitude;
                    
                    // Find the stop coordinates
                    const stopData = GTFS_STOPS[line]?.find(s => s.id === stop.id);
                    if (!stopData || !busLat || !busLon || !stopData.latitude || !stopData.longitude) {
                        return null;
                    }
                    
                    // Get color for this line
                    const lineColor = linesWithColors[line] || '#1976d2';
                    
                    return (
                        <Polyline
                            key={`tracking-line-${line}-${stop.id}-${idx}`}
                            coordinates={[
                                {
                                    latitude: stopData.latitude,
                                    longitude: stopData.longitude
                                },
                                {
                                    latitude: busLat,
                                    longitude: busLon
                                }
                            ]}
                            strokeColor={lineColor}
                            strokeWidth={4}
                            lineDashPattern={[10, 5]}
                        />
                    );
                })}

                {/* Favorite stops markers */}
                {Object.entries(favStops).map(([line, stopIds]) =>
                    stopIds.map(stopId => {
                        const stop = GTFS_STOPS[line]?.find(s => s.id === stopId);
                        if (!stop) return null;
                        
                        // Get color for this line
                        const lineColor = linesWithColors[line] || '#1976d2';
                        
                        return (
                            <Marker
                                key={`${line}-${stopId}`}
                                coordinate={{
                                    latitude: stop.latitude,
                                    longitude: stop.longitude,
                                }}
                                title={stop.name}
                                pinColor={lineColor}
                            >
                                <Callout>
                                    <View style={{ padding: 5 }}>
                                        <Text style={{ fontWeight: 'bold', color: lineColor, marginBottom: 5 }}>
                                            {line} - Favorite Stop
                                        </Text>
                                        <Text style={{ fontSize: 12 }}>
                                            <Text style={{ fontWeight: 'bold' }}>Stop:</Text> {stop.name}{"\n"}
                                            <Text style={{ fontWeight: 'bold' }}>ID:</Text> {stop.id}
                                        </Text>
                                    </View>
                                </Callout>
                            </Marker>
                        );
                    })
                )}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { ...StyleSheet.absoluteFillObject },
});