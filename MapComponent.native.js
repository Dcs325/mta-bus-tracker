import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Callout, Polyline } from 'react-native-maps';

export default function MapComponent({ busLocations = [], userLocation, favStops = {}, GTFS_STOPS = {}, nextStop, linesWithColors = {} }) {
    // Default region centered on Brooklyn
    const defaultRegion = {
        latitude: 40.650002,
        longitude: -73.949997,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={userLocation ? {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                } : defaultRegion}
            >
                {/* Route polylines for each closest bus line, colored */}
                {Object.entries(linesWithColors).map(([line, color]) => {
                    const stops = GTFS_STOPS[line];
                    if (!stops || stops.length < 2) return null;
                    const coordinates = stops.map(stop => ({
                        latitude: stop.latitude,
                        longitude: stop.longitude
                    }));
                    return (
                        <Polyline
                            key={`polyline-${line}`}
                            coordinates={coordinates}
                            strokeColor={color}
                            strokeWidth={4}
                        />
                    );
                })}

                {/* User location marker */}
                {userLocation && (
                    <Marker
                        coordinate={{
                            latitude: userLocation.latitude,
                            longitude: userLocation.longitude,
                        }}
                        title="You"
                        pinColor="blue"
                    />
                )}

                {/* Bus markers */}
                {busLocations.map((bus, idx) => (
                    <Marker
                        key={bus.id || idx}
                        coordinate={{
                            latitude: bus.lat || bus.latitude,
                            longitude: bus.lon || bus.longitude,
                        }}
                        title={`Bus ${bus.id || bus.label || ''}`}
                        pinColor="red"
                    >
                        <Callout>
                            <View>
                                <Text style={{ fontWeight: 'bold' }}>Bus {bus.label || bus.id}</Text>
                                {bus.nextStop && <Text>Next Stop: {bus.nextStop}</Text>}
                            </View>
                        </Callout>
                    </Marker>
                ))}

                {/* Favorite stops markers */}
                {Object.entries(favStops).map(([line, stopIds]) =>
                    stopIds.map(stopId => {
                        const stop = GTFS_STOPS[line]?.find(s => s.id === stopId);
                        if (!stop) return null;
                        return (
                            <Marker
                                key={`${line}-${stopId}`}
                                coordinate={{
                                    latitude: stop.latitude,
                                    longitude: stop.longitude,
                                }}
                                title={stop.name}
                                pinColor="green"
                            />
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