import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Map Controller to handle layout invalidation and moves
function MapViewController({ onMoveEnd }) {
    const map = useMap();

    useMapEvents({
        moveend: () => {
            const newCenter = map.getCenter();
            onMoveEnd({ lat: newCenter.lat, lng: newCenter.lng });
        }
    });

    // CRITICAL: Invalidate size to ensure map renders correctly in modal
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timer);
    }, [map]);

    return null;
}

function LocationMarker({ position, onPositionChange }) {
    const map = useMap();

    // Fly to position on initial load if provided
    useEffect(() => {
        if (position) {
            map.flyTo([position.lat, position.lng], map.getZoom());
        }
    }, [map]);

    useMapEvents({
        click(e) {
            onPositionChange(e.latlng);
        },
    });

    return position ? <Marker position={position} /> : null;
}

export default function SafeLocationMapPicker({ initialCenter, onConfirm, onCancel }) {
    const [position, setPosition] = useState(initialCenter || { lat: 20.2961, lng: 85.8245 });
    const [label, setLabel] = useState('');

    const handleConfirm = () => {
        if (!position) return alert('Please click on the map to set a location');
        if (!label.trim()) return alert('Please name this location');

        onConfirm({
            lat: position.lat,
            lng: position.lng,
            label: label.trim(),
            address: 'Custom Location (Map Selected)',
            type: 'SAFE_POINT'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-slate-900 dark:text-white">
                    <h3 className="font-semibold text-lg">Select Help Desk Location</h3>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">✕</button>
                </div>

                {/* Map Area */}
                <div className="h-[400px] w-full relative bg-slate-100 dark:bg-slate-800">
                    <MapContainer
                        center={[position.lat, position.lng]}
                        zoom={16}
                        className="w-full h-full z-0"
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />
                        <MapViewController onMoveEnd={() => { }} />
                        <LocationMarker position={position} onPositionChange={setPosition} />
                    </MapContainer>

                    {/* Helper overlay */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 px-4 py-2 rounded-full text-xs font-medium shadow-sm backdrop-blur border border-slate-200 dark:border-slate-700 z-[400] pointer-events-none">
                        Tap anywhere to pin location
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 space-y-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Location Name</label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="e.g. Engineering Gate, Canteen Help Desk..."
                            className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all dark:text-white"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 py-3 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
