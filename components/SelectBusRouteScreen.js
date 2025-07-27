import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function SelectBusRouteScreen({ onDone }) {
    const busRoutes = [
        'B1', 'B2', 'B3', 'B4', 'B6', 'B7', 'B8', 'B9', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B20', 'B24', 'B25', 'B26', 'B31', 'B32', 'B35', 'B36', 'B37', 'B38', 'B39', 'B41', 'B42', 'B43', 'B44', 'B44-SBS', 'B45', 'B46', 'B46-SBS', 'B47', 'B48', 'B49', 'B52', 'B54', 'B57', 'B60', 'B61', 'B62', 'B63', 'B64', 'B65', 'B67', 'B68', 'B69', 'B70', 'B74', 'B82', 'B82-SBS', 'B83', 'B84'
    ];
    const [selected, setSelected] = useState([]);

    const toggleRoute = (route) => {
        setSelected((prev) =>
            prev.includes(route) ? prev.filter(r => r !== route) : [...prev, route]
        );
    };

    const handleContinue = () => {
        if (onDone) onDone(selected);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select Your Favorite Bus Routes</Text>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {busRoutes.map(route => (
                    <TouchableOpacity
                        key={route}
                        style={[styles.routeButton, selected.includes(route) && styles.routeButtonSelected]}
                        onPress={() => toggleRoute(route)}
                    >
                        <Text style={[styles.routeText, selected.includes(route) && styles.routeTextSelected]}>{route}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <Button title="Continue" onPress={handleContinue} disabled={selected.length === 0} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        marginBottom: 24,
        color: '#1976d2',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    scroll: {
        maxHeight: 240,
        marginBottom: 24,
        width: '100%',
    },
    scrollContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    routeButton: {
        borderWidth: 1,
        borderColor: '#1976d2',
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 16,
        margin: 6,
        backgroundColor: '#fff',
    },
    routeButtonSelected: {
        backgroundColor: '#1976d2',
    },
    routeText: {
        color: '#1976d2',
        fontSize: 16,
        fontWeight: 'bold',
    },
    routeTextSelected: {
        color: '#fff',
    },
});
