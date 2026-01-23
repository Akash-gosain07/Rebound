import 'mapbox-gl/dist/mapbox-gl.css';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { useState, useEffect } from 'react';
import { MapPin, Navigation2 } from 'lucide-react';

interface Props {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
}

const CAMPUS_CENTER = { lat: 37.4275, lng: -122.1697 };

export function MapLocationPicker({ onLocationSelect, initialLat, initialLng }: Props) {
  const [view, setView] = useState({
    latitude: initialLat || CAMPUS_CENTER.lat,
    longitude: initialLng || CAMPUS_CENTER.lng,
    zoom: 15
  });
  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [address, setAddress] = useState<string>('');
  const [loadingAddress, setLoadingAddress] = useState(false);

  const token = import.meta.env.VITE_MAPBOX_TOKEN as string;

  // Get user's current location on mount
  useEffect(() => {
    if ('geolocation' in navigator && !initialLat && !initialLng) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setView((v) => ({ ...v, latitude: lat, longitude: lng }));
          setMarkerPos({ lat, lng });
          onLocationSelect(lat, lng);
          fetchAddress(lng, lat);
        },
        () => {
          // If geolocation fails, use campus center
          if (!markerPos) {
            setMarkerPos({ lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng });
            onLocationSelect(CAMPUS_CENTER.lat, CAMPUS_CENTER.lng);
          }
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const fetchAddress = async (lng: number, lat: number) => {
    setLoadingAddress(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`
      );
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        setAddress(place.place_name);
      }
    } catch (err) {
      console.error('Failed to fetch address:', err);
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleMapClick = (evt: any) => {
    const { lngLat } = evt;
    const lat = lngLat.lat;
    const lng = lngLat.lng;
    setMarkerPos({ lat, lng });
    onLocationSelect(lat, lng, address);
    fetchAddress(lng, lat);
  };

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setView((v) => ({ ...v, latitude: lat, longitude: lng, zoom: 16 }));
          setMarkerPos({ lat, lng });
          onLocationSelect(lat, lng);
          fetchAddress(lng, lat);
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-slate-200 ring-1 ring-slate-200" style={{ position: 'relative', zIndex: 0, isolation: 'isolate' }}>
        <Map
          mapboxAccessToken={token}
          {...view}
          onMove={(evt) => setView(evt.viewState)}
          onClick={handleMapClick}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
          {markerPos && (
            <Marker longitude={markerPos.lng} latitude={markerPos.lat} anchor="bottom">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-3 border-white bg-teal-500 shadow-lg">
                <MapPin className="h-5 w-5 text-white" fill="white" />
              </div>
            </Marker>
          )}
        </Map>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-lg ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
          style={{ zIndex: 10, position: 'relative' }}
        >
          <Navigation2 className="h-3.5 w-3.5" />
          Use my location
        </button>
      </div>
      <div className="text-xs text-slate-500">
        {markerPos ? (
          <div className="space-y-1">
            <p className="font-medium text-slate-700">
              📍 {loadingAddress ? 'Loading address...' : address || 'Location selected'}
            </p>
            <p className="text-[11px] text-slate-400">
              Tap anywhere on the map to change the location
            </p>
          </div>
        ) : (
          <p className="text-slate-600">Tap on the map to select where you lost/found the item</p>
        )}
      </div>
    </div>
  );
}
