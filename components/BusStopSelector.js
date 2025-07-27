import React from 'react';
import { Picker } from '@react-native-picker/picker';

// Modified: Passes full stop object to parent, ensures unique keys
export default function BusStopSelector({ stops, selectedStop, onSelectStop }) {
    return (
        <Picker
            selectedValue={selectedStop ? selectedStop.id : ''}
            onValueChange={value => {
                const stopObj = stops.find(s => s.id === value);
                onSelectStop(stopObj || null);
            }}
            enabled={stops.length > 0}
            style={{ backgroundColor: '#f0f4f8', borderRadius: 8, marginBottom: 10 }}
        >
            <Picker.Item label="Select a stop..." value="" />
            {stops.map((stop, idx) => (
                <Picker.Item key={stop.id + '-' + idx} label={stop.name} value={stop.id} />
            ))}
        </Picker>
    );
}