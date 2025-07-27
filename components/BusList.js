import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BusList = ({ busData, selectedBusStop, haversineDistance }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Nearby Buses</Text>
        {busData.length > 0 ? (
            busData.map(bus => (
                <View key={bus.id} style={styles.busItem}>
                    <Text style={styles.busText}>Bus: {bus.lineRef} ({bus.destination}) - ID: {bus.id}</Text>
                    {selectedBusStop && (
                        <Text style={styles.busText}>
                            Distance to stop: {haversineDistance(selectedBusStop.latitude, selectedBusStop.longitude, bus.latitude, bus.longitude).toFixed(2)} miles
                        </Text>
                    )}
                </View>
            ))
        ) : (
            <Text style={styles.infoText}>No bus data available or stop not selected.</Text>
        )}
    </View>
);

const styles = StyleSheet.create({
    section: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    infoText: {
        fontSize: 16,
        color: '#555',
        marginTop: 5,
    },
    busItem: {
        backgroundColor: '#e0f2fe',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    busText: {
        fontSize: 15,
        color: '#1d4ed8',
    },
});

export default BusList; 