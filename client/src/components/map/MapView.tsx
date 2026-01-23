import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import api from '../../lib/api';
import type { Item } from '../../lib/types';

interface Props {
  typeFilter: 'LOST' | 'FOUND';
  radiusKm: number;
  onItemsChange?: (items: Item[]) => void;
  onItemOpen?: (itemId: string) => void;
}

// Bhubaneswar, Odisha default center.
const CAMPUS_CENTER = { lat: 20.2961, lng: 85.8245, zoom: 13 };

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function makeMarkerIcon(isLost: boolean) {
  return L.divIcon({
    className: 'rebound-marker',
    html: `<div class="flex items-center justify-center rounded-full border-2 border-white shadow-lg ${
      isLost ? 'bg-rose-500' : 'bg-emerald-500'
    } h-9 w-9"><span class="text-sm font-bold text-white">${isLost ? '?' : '!'}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
}

type Center = { lat: number; lng: number; zoom: number };

function MapEvents({ onCenterChange }: { onCenterChange: (center: Center) => void }) {
  useMapEvents({
    moveend(e) {
      const m = e.target;
      const c = m.getCenter();
      onCenterChange({ lat: c.lat, lng: c.lng, zoom: m.getZoom() });
    }
  });

  return null;
}

export function MapView({ typeFilter, radiusKm, onItemsChange, onItemOpen }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const [center, setCenter] = useState<Center>(CAMPUS_CENTER);
  const [items, setItems] = useState<Item[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // Geolocation with graceful fallback to Bhubaneswar.
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          zoom: 15
        };
        setCenter(next);
        setUserLocation({ lat: next.lat, lng: next.lng });
      },
      () => {
        setCenter(CAMPUS_CENTER);
        setUserLocation(null);
      },
      { enableHighAccuracy: false, timeout: 4000 }
    );
  }, []);

  const fetchItems = async (c: Center) => {
    try {
      const params: any = { lat: c.lat, lng: c.lng, radiusKm, type: typeFilter };
      const res = await api.get('/items', { params });
      const fetchedItems = (res.data.items || []) as Item[];
      setItems(fetchedItems);
      onItemsChange?.(fetchedItems);
    } catch (err) {
      console.error(err);
      setItems([]);
      onItemsChange?.([]);
    }
  };

  // Refetch when filter, radius, or center changes.
  useEffect(() => {
    void fetchItems(center);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, radiusKm, center.lat, center.lng]);

  // Fix blank map issues on layout / route changes.
  useEffect(() => {
    if (!mapInstance) return;
    const m = mapInstance;

    const invalidate = () => {
      setTimeout(() => {
        m.invalidateSize();
      }, 150);
    };

    invalidate();

    window.addEventListener('resize', invalidate);
    return () => {
      window.removeEventListener('resize', invalidate);
    };
  }, [mapInstance, location.pathname]);

  const onMarkerOpen = (item: Item) => {
    if (onItemOpen) {
      onItemOpen(item._id);
    } else {
      navigate(`/item/${item._id}`);
    }
  };

  const distanceLabel = useMemo(() => {
    if (!userLocation) return null;

    return (item: Item) => {
      if (!item.location?.coordinates) return '—';
      const [lng, lat] = item.location.coordinates;
      const meters = haversineMeters(userLocation, { lat, lng });
      if (meters < 1000) return `${Math.round(meters)}m away`;
      return `${(meters / 1000).toFixed(1)}km away`;
    };
  }, [userLocation]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={center.zoom}
        minZoom={3}
        maxZoom={19}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(map) => {
          setMapInstance(map);
          setTimeout(() => {
            map.invalidateSize();
          }, 150);
        }}
        zoomAnimation
        scrollWheelZoom
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEvents onCenterChange={setCenter} />

        {/* User location marker */}
        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={7}
            pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.8 }}
          />
        )}

        {/* Clustered item pins */}
        <MarkerClusterGroup>
          {items.map((item) => {
            const [lng, lat] = item.location.coordinates;
            const isLost = item.type === 'LOST' || item.type === 'lost';
            const icon = makeMarkerIcon(isLost);

            return (
              <Marker key={item._id} position={[lat, lng]} icon={icon} eventHandlers={{ click: () => onMarkerOpen(item) }}>
                <Popup>
                  <div className="space-y-1 text-sm">
                    <div className="font-semibold text-slate-900">{item.title}</div>
                    {distanceLabel && (
                      <div className="text-xs text-slate-500">{distanceLabel(item)}</div>
                    )}
                    <button
                      type="button"
                      onClick={() => onMarkerOpen(item)}
                      className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 px-3 py-1.5 text-xs font-semibold text-white shadow-card"
                    >
                      View details
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
