import React from 'react';
import { Picker } from '@react-native-picker/picker';

export default function BusLineSelector({ lines, selectedLine, setSelectedLine }) {
    return (
        <Picker
            selectedValue={selectedLine}
            onValueChange={setSelectedLine}
            style={{ backgroundColor: '#f0f4f8', borderRadius: 8, marginBottom: 20 }}
        >
            <Picker.Item label="Select a Brooklyn bus line..." value="" />
            {lines.map(line => (
                <Picker.Item key={line} label={line} value={line} />
            ))}
        </Picker>
    );
} 