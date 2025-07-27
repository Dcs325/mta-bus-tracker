import React from 'react';
import { useMap } from 'react-leaflet';

export default function Compass() {
    const map = useMap();
    // Dummy compass always points north (up)
    return (
        <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.7)',
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 24
        }}>
            
        </div>
    );
}
