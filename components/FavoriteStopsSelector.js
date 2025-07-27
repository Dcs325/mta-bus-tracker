import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { GTFS_STOPS } from '../utils/gtfsStops';

export default function FavoriteStopsSelector({ selectedBusLines, onDone }) {
    // State: { [busLine]: [stopId, ...] }
    const [selectedStops, setSelectedStops] = useState({});

    const toggleStop = (busLine, stopId) => {
        setSelectedStops(prev => {
            const current = prev[busLine] || [];
            return {
                ...prev,
                [busLine]: current.includes(stopId)
                    ? current.filter(id => id !== stopId)
                    : [...current, stopId]
            };
        });
    };

    const handleSave = () => {
        // Flatten to a single array of stop IDs, or keep as { busLine: [stopIds] }
        onDone(selectedStops);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Select Favorite Stops for Each Bus Line</Text>
            {selectedBusLines.map(line => (
                <View key={line} style={styles.lineSection}>
                    <Text style={styles.lineTitle}>{line}</Text>
                    <View style={styles.stopsList}>
                        {(GTFS_STOPS[line] || []).map(stop => (
                            <TouchableOpacity
                                key={stop.id}
                                style={[styles.stopButton, selectedStops[line]?.includes(stop.id) && styles.stopButtonSelected]}
                                onPress={() => toggleStop(line, stop.id)}
                            >
                                <Text style={[styles.stopText, selectedStops[line]?.includes(stop.id) && styles.stopTextSelected]}>{stop.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ))}
            <Button title="Save Favorite Stops" onPress={handleSave} disabled={Object.values(selectedStops).every(arr => !arr || arr.length === 0)} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 24, alignItems: 'center', backgroundColor: '#fff', flexGrow: 1 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1976d2', marginBottom: 20, textAlign: 'center' },
    lineSection: { marginBottom: 24, width: '100%' },
    lineTitle: { fontSize: 18, fontWeight: 'bold', color: '#1976d2', marginBottom: 8 },
    stopsList: { flexDirection: 'row', flexWrap: 'wrap' },
    stopButton: { backgroundColor: '#eee', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14, margin: 4 },
    stopButtonSelected: { backgroundColor: '#1976d2' },
    stopText: { color: '#1976d2', fontWeight: 'bold' },
    stopTextSelected: { color: '#fff' },
});
