import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapComponent({ buses, center }) {
    return (
        <div style={{ height: 400, width: '100%' }}>
            <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {buses.map(bus => (
                    <Marker key={bus.id} position={[bus.lat, bus.lon]}>
                        <Popup>
                            <div>
                                <strong>Bus {bus.label}</strong><br />
                                Next Stop: {bus.nextStop}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
} 