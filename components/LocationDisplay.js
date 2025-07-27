import React from 'react';
import { View, Text, StyleSheet } from 'react-native';


const LocationDisplay = ({ userLocation }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Your Location</Text>
        {userLocation ? (
            <Text style={styles.infoText}>
                Lat: {userLocation.latitude.toFixed(4)}, Lon: {userLocation.longitude.toFixed(4)}
            </Text>
        ) : (
            <Text style={styles.infoText}>Getting location...</Text>
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
});

export default LocationDisplay; 