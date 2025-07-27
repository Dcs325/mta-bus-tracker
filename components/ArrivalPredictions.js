import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ArrivalPredictions = ({ predictions, selectedStop }) => {
    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        const date = new Date(timeString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getMinutesAway = (timeString) => {
        if (!timeString) return 'N/A';
        const arrivalTime = new Date(timeString);
        const now = new Date();
        const diffMs = arrivalTime - now;
        const diffMins = Math.round(diffMs / 60000);
        return diffMins > 0 ? `${diffMins} min` : 'Due';
    };

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Arrival Predictions</Text>
            {selectedStop ? (
                <Text style={styles.stopInfo}>
                    Stop: {selectedStop.name || selectedStop.id}
                </Text>
            ) : (
                <Text style={styles.infoText}>Select a bus stop to see arrival predictions.</Text>
            )}

            {predictions.length > 0 ? (
                predictions.map((prediction, index) => (
                    <View key={`${prediction.vehicleId}-${index}`} style={styles.predictionItem}>
                        <Text style={styles.busLine}>
                            {prediction.lineRef} → {prediction.destination}
                        </Text>
                        <Text style={styles.arrivalTime}>
                            Expected: {formatTime(prediction.expectedArrival)} ({getMinutesAway(prediction.expectedArrival)})
                        </Text>
                        {prediction.numberOfStopsAway && (
                            <Text style={styles.stopsAway}>
                                {prediction.numberOfStopsAway} stops away
                            </Text>
                        )}
                        {prediction.distanceFromStop && (
                            <Text style={styles.distance}>
                                {prediction.distanceFromStop} meters from stop
                            </Text>
                        )}
                    </View>
                ))
            ) : (
                <Text style={styles.infoText}>
                    {selectedStop ? 'No arrival predictions available.' : 'Select a bus stop first.'}
                </Text>
            )}
        </View>
    );
};

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
    stopInfo: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1d4ed8',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 16,
        color: '#555',
        marginTop: 5,
    },
    predictionItem: {
        backgroundColor: '#f0f9ff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#1d4ed8',
    },
    busLine: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1d4ed8',
        marginBottom: 4,
    },
    arrivalTime: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 2,
    },
    stopsAway: {
        fontSize: 12,
        color: '#6b7280',
    },
    distance: {
        fontSize: 12,
        color: '#6b7280',
    },
});

export default ArrivalPredictions; 