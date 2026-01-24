import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { apiRequest } from '../apiClient';
import { useAuthStore, useMapStore, useToastStore } from '../store';
import { TrackingModal } from '../components/TrackingModal';

// Category-specific emoji mapping
const getCategoryEmoji = (category, type) => {
  const emojiMap = {
    'Wallet': type === 'lost' ? '💳' : '💰',
    'Electronics': type === 'lost' ? '📱' : '💻',
    'Cards': type === 'lost' ? '🎫' : '🪪',
    'Keys': type === 'lost' ? '🔑' : '🗝️',
    'Bag': type === 'lost' ? '🎒' : '👜',
    'Jewelry': type === 'lost' ? '💍' : '📿',
    'Documents': type === 'lost' ? '📄' : '📋',
    'Pet': type === 'lost' ? '🐾' : '🐕',
    'Others': type === 'lost' ? '❓' : '✅'
  };
  return emojiMap[category] || (type === 'lost' ? '🔴' : '🟢');
};

const createCategoryIcon = (category, type) => {
  const emoji = getCategoryEmoji(category, type);
  // Enhanced Marker Colors
  const bgColor = type === 'lost' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)'; // Rose-500 / Emerald-500 base
  const borderColor = type === 'lost' ? '#F43F5E' : '#10B981'; // Rose-500 / Emerald-500 border

  return new L.DivIcon({
    className: `${type}-pin`,
    html: `<div style="
      width: 40px; 
      height: 40px; 
      background: ${bgColor};
      backdrop-filter: blur(10px);
      border: 2px solid ${borderColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: transform 0.2s;
    " class="marker-icon">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

function MapViewController({ center, onMoveEnd }) {
  const map = useMap();

  useMapEvents({
    moveend: () => {
      const newCenter = map.getCenter();
      onMoveEnd({ lat: newCenter.lat, lng: newCenter.lng });
    }
  });

  // Ensure the map correctly fills its container when layout changes
  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  // Keep view in sync with the app's center ONLY when external center changes (like search)
  // We don't want to re-set view on drag, that causes jitters/loops
  useEffect(() => {
    if (center) {
      // Check distance to avoid small jitter re-renders
      const current = map.getCenter();
      const dist = map.distance(center, current); // meters. map.distance works in Leaflet 1.0+
      if (dist > 100) { // Only fly to if significantly different (e.g. search result)
        map.flyTo([center.lat, center.lng], map.getZoom());
      }
    }
  }, [center, map]);

  return null;
}

function LocationPicker({ onPick, position }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  if (!position) return null;
  return (
    <Marker
      position={[position.lat, position.lng]}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const { lat, lng } = marker.getLatLng();
          onPick({ lat, lng });
        },
      }}
    />
  );
}

export default function MapPage() {
  const { center, radius, type, category, search, setCenter, setFilters } = useMapStore();
  const [items, setItems] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(null); // 'lost' | 'found' | null
  const [showMenu, setShowMenu] = useState(false);
  const [userItems, setUserItems] = useState([]);
  const [activeMeetups, setActiveMeetups] = useState([]); // [NEW] Active meetups for tracking
  const [selectedMeetupId, setSelectedMeetupId] = useState(null); // [NEW] Selected meetup for tracking
  const [loadingUserItems, setLoadingUserItems] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Wallet',
    description: '',
    petDetails: { breed: '', identicalMark: '', petName: '', allergicTo: '' }
  });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const pushToast = useToastStore((s) => s.pushToast);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle direct navigation to tracking (from Notification)
  useEffect(() => {
    if (location.state?.meetupId) {
      setSelectedMeetupId(location.state.meetupId);
      // Clear state so it doesn't reopen on refresh/navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setCenter(loc);
        },
        () => { },
        { enableHighAccuracy: true }
      );
    }
  }, [setCenter]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (type) params.set('type', type);
        if (radius) params.set('radius', radius.toString());
        if (center) {
          params.set('lat', center.lat.toString());
          params.set('lng', center.lng.toString());
        }
        if (category && category !== 'all') params.set('category', category);
        if (search) params.set('q', search);
        const data = await apiRequest(`/api/items?${params.toString()}`);
        setItems(data.items || []);
      } catch (err) {
        pushToast({ type: 'error', message: err.message });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [center, radius, type, category, search, pushToast]);

  // Load user's submitted items AND active meetups when menu opens
  useEffect(() => {
    const loadMenuData = async () => {
      if (!showMenu || !user) return;
      setLoadingUserItems(true);
      try {
        // Fetch User Items (Reported by me)
        const itemsData = await apiRequest('/api/items/reported');
        setUserItems(itemsData.items || []);

        // Fetch Active Meetups [NEW]
        const meetupsData = await apiRequest('/api/matches/active');
        setActiveMeetups(meetupsData.meetups || []);

      } catch (err) {
        console.error('Failed to load menu data:', err);
      } finally {
        setLoadingUserItems(false);
      }
    };
    loadMenuData();
  }, [showMenu, user, pushToast]);

  const handleReport = async (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      pushToast({ type: 'error', message: 'Click on the map to choose a spot first.' });
      return;
    }
    try {
      const token = useAuthStore.getState().token;
      const formData = new FormData();
      formData.append('type', showModal.toLowerCase());
      formData.append('title', form.title);
      formData.append('category', form.category);
      formData.append('description', form.description);

      // Include pet details if category is Pet
      if (form.category === 'Pet') {
        formData.append('petDetails', JSON.stringify(form.petDetails));
      }

      formData.append('location', JSON.stringify({
        type: 'Point',
        coordinates: [selectedLocation.lng, selectedLocation.lat],
        address: `Near ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`
      }));
      if (selectedPhoto) {
        formData.append('photo', selectedPhoto);
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'}/api/items`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to post item' }));
        throw new Error(err.message || 'Failed to post item');
      }
      const data = await res.json();
      pushToast({ type: 'success', message: `${showModal === 'lost' ? 'Lost' : 'Found'} item posted` });
      setShowModal(null);
      setForm({
        title: '',
        category: 'Wallet',
        description: '',
        petDetails: { breed: '', identicalMark: '', petName: '', allergicTo: '' }
      });
      setSelectedPhoto(null);
      setItems((prev) => [data.item, ...prev]);
    } catch (err) {
      pushToast({ type: 'error', message: err.message });
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => item.status !== 'RECOVERED');
  }, [items]);

  const handleRecenter = () => {
    if (userLocation) {
      setCenter(userLocation);
    } else {
      pushToast({ type: 'error', message: 'Location not available yet.' });
    }
  };

  const primaryAreaLabel = 'Campus Area';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-app">
      <div className="md:flex-1 h-[60vh] md:h-screen relative flex items-stretch justify-center px-3 pt-3 md:px-4 md:pt-4">
        {/* Hamburger Button - Fully visible on the left */}
        <button
          onClick={() => setShowMenu(true)}
          className="absolute left-4 top-6 w-11 h-11 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-soft flex items-center justify-center text-slate-700 dark:text-slate-200 text-xl font-semibold transition-all hover-lift cursor-pointer z-20 border border-slate-200 dark:border-slate-700"
        >
          ≡
        </button>

        <div className="w-full h-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl bg-white/40 dark:bg-slate-900/40 relative border border-white/20 dark:border-white/5 ring-1 ring-white/30 dark:ring-white/5 backdrop-blur-2xl">
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={14}
            className="w-full h-full"
            scrollWheelZoom
          >
            {/* Premium CartoDB Tiles - Adaptive Light/Dark */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapViewController center={center} onMoveEnd={(newLoc) => setCenter(newLoc)} />
            <LocationPicker position={selectedLocation} onPick={setSelectedLocation} />

            {/* Live User Location Marker */}
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={new L.DivIcon({
                  className: 'user-location-pulse',
                  html: `
                    <div class="relative flex h-6 w-6">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-6 w-6 bg-blue-500 border-2 border-white shadow-lg"></span>
                    </div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                })}
              >
                <Popup>You are here</Popup>
              </Marker>
            )}

            {filteredItems.map((item) => (
              <Marker
                key={item._id}
                position={[item.location.coordinates[1], item.location.coordinates[0]]}
                icon={createCategoryIcon(item.category, item.type)}
              >
                <Popup>
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-slate-500 capitalize">{item.category}</div>
                    <button
                      className="mt-2 w-full inline-flex items-center justify-center px-3 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-md transition-all active:scale-95"
                      onClick={() => navigate(`/item/${item._id}`)}
                    >
                      View Full Details →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Top controls bar: Lost/Found toggle, recenter */}
          <div className="pointer-events-none absolute top-4 inset-x-4 flex items-center justify-between">
            <div className="w-9" /> {/* Spacer for alignment */}
            <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-white dark:bg-slate-800 p-1.5 shadow-soft text-sm font-semibold overflow-hidden border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setFilters({ type: 'lost' })}
                className={`px-5 py-2 rounded-full transition-all duration-200 ${type === 'lost' ? 'bg-primary text-white shadow-button' : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                Lost
              </button>
              <button
                onClick={() => setFilters({ type: 'found' })}
                className={`px-5 py-2 rounded-full transition-all duration-200 ${type === 'found' ? 'bg-primary text-white shadow-button' : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                Found
              </button>
            </div>
            <button
              onClick={handleRecenter}
              className="pointer-events-auto w-9 h-9 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-soft flex items-center justify-center text-slate-700 dark:text-slate-200 text-lg border border-slate-200 dark:border-slate-700 transition-all"
              title="Recenter to my location"
            >
              <span className="text-xl">⌖</span>
            </button>
            {/* Theme Toggle Button (Floating) */}
            <button
              onClick={() => {
                const isDark = document.documentElement.classList.contains('dark');
                if (isDark) {
                  document.documentElement.classList.remove('dark');
                  localStorage.setItem('theme', 'light');
                } else {
                  document.documentElement.classList.add('dark');
                  localStorage.setItem('theme', 'dark');
                }
                // Force re-render of map tiles by toggling key or state (simplified here by relying on React re-render from parent or state)
                // For now, let's just force a reload or state update if needed, but the TileLayer component might need a key change to swap URLs instantly.
                // A quick hack for this demo:
                window.dispatchEvent(new Event('theme-change'));
                setShowMenu(false);
                setTimeout(() => setShowMenu(true), 10); // Hack to trigger re-render if needed
              }}
              className="pointer-events-auto w-9 h-9 ml-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-soft flex items-center justify-center text-slate-700 dark:text-slate-200 text-lg border border-slate-200 dark:border-slate-700 transition-all hover:scale-110 active:scale-95"
              title="Toggle Theme"
            >
              {document.documentElement.classList.contains('dark') ? '🌙' : '☀️'}
            </button>
          </div>

          {/* Mobile bottom sheet cards over map */}
          <div className="pointer-events-none absolute inset-x-4 bottom-5 space-y-3 md:hidden">
            <div className="pointer-events-auto rounded-3xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-card px-5 py-3 flex items-center justify-between border border-slate-200 dark:border-slate-700">
              <div>
                <div className="text-xs font-bold text-slate-900">{primaryAreaLabel}</div>
                <div className="text-xs text-slate-600">
                  {filteredItems.length} active items nearby · {radius / 1000} km radius
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
              </div>
            </div>

            <div className="pointer-events-auto space-y-2 max-h-40 overflow-y-auto">
              {filteredItems.slice(0, 3).map((item) => (
                <button
                  key={item._id}
                  onClick={() => navigate(`/item/${item._id}`)}
                  className="w-full rounded-2xl bg-white dark:bg-slate-800 shadow-soft px-3 py-2 flex items-center justify-between text-left text-[11px] border border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-semibold text-white shadow-sm ${item.type === 'lost'
                        ? 'bg-gradient-to-br from-rose-400 to-rose-600'
                        : 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                        }`}
                    >
                      {item.type === 'lost' ? '?' : '!'}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{item.title}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                        {item.location?.address || 'Bhubaneswar vicinity'}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">{item.category}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:flex md:w-[400px] border-t md:border-t-0 md:border-l border-white/20 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl flex-col h-[40vh] md:h-screen shadow-2xl z-10 relative">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Nearby items</div>
            <div className="text-sm text-slate-700 font-medium">Live map</div>
          </div>
          {user && (
            <div className="text-right text-[10px]">
              <div className="font-semibold text-slate-900">{user.fullName}</div>
              <div className={`mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] ${user.isVerified ? 'bg-success/10 text-success border border-success/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span>{user.isVerified ? 'Verified' : 'Unverified'}</span>
              </div>
            </div>
          )}
        </div>
        <div className="px-4 py-3 space-y-3 border-b border-slate-200">
          <div className="flex gap-2">
            <input
              placeholder="Search items…"
              value={search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="flex-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-2 text-sm">
            <select
              value={radius}
              onChange={(e) => setFilters({ radius: Number(e.target.value) })}
              className="flex-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            >
              <option value={1000}>1 km</option>
              <option value={3000}>3 km</option>
              <option value={5000}>5 km</option>
            </select>
            <select
              value={category}
              onChange={(e) => setFilters({ category: e.target.value })}
              className="flex-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            >
              <option value="all">All categories</option>
              <option value="Wallet">Wallets</option>
              <option value="Electronics">Electronics</option>
              <option value="Cards">Cards</option>
              <option value="Pet">Pets</option>
              <option value="Others">Others</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {loading && <div className="text-xs text-slate-500 px-2 py-2">Loading items…</div>}
          {!loading && filteredItems.length === 0 && (
            <div className="text-xs text-slate-500 px-2 py-4">No items here yet. Be the first to report.</div>
          )}
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="group w-full rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:border-primary/30 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 flex items-center gap-3 p-3 backdrop-blur-sm relative"
            >
              {/* Clickable Area for Map Location */}
              <button
                onClick={() => {
                  if (item.location?.coordinates) {
                    map.flyTo([item.location.coordinates[1], item.location.coordinates[0]], 16);
                  }
                }}
                className="flex flex-1 items-center gap-4 text-left"
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base shadow-lg transition-transform group-hover:scale-110 duration-300 ${item.type === 'lost'
                    ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/20 text-white'
                    : 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-500/20 text-white'
                    }`}
                >
                  {item.type === 'lost' ? '?' : '!'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary transition-colors max-w-[120px]">{item.title}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-full whitespace-nowrap">{item.category}</div>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 dark:bg-primary/60"></span>
                    <span className="truncate">{item.location?.address && item.location.address !== 'Bhubaneswar vicinity' ? item.location.address : `Near ${item.location?.coordinates?.[1]?.toFixed(4)}, ${item.location?.coordinates?.[0]?.toFixed(4)}`}</span>
                  </div>
                </div>
              </button>

              {/* Details/Navigate Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/item/${item._id}`);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700/50 text-slate-400 hover:text-primary dark:hover:text-white hover:bg-white dark:hover:bg-primary transition-all shadow-sm"
                title="View Details"
              >
                →
              </button>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 flex gap-2">
          <button
            onClick={() => setShowModal('lost')}
            className="flex-1 inline-flex justify-center items-center gap-2 rounded-full bg-accent hover:bg-accent-dark text-white text-sm font-semibold py-3 shadow-button hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
          >
            <span className="text-lg">🔴</span>
            Report Lost Item
          </button>
          <button
            onClick={() => setShowModal('found')}
            className="flex-1 inline-flex justify-center items-center gap-2 rounded-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-3 shadow-button hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
          >
            <span className="text-lg">🟢</span>
            Report Found Item
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-card relative border border-slate-200 dark:border-slate-700 my-8 max-h-[90vh] flex flex-col">

            {/* Fixed Header */}
            <div className="relative flex items-center justify-between p-6 pb-4 border-b border-slate-200">
              <div>
                <div className="text-lg font-bold text-slate-900">
                  {showModal === 'lost' ? 'Report Lost Item' : 'Report Found Item'}
                </div>
                <div className="text-sm text-slate-600 mt-1">Tap on map to drop the exact spot.</div>
              </div>
              <button
                onClick={() => setShowModal(null)}
                className="text-sm text-slate-400 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="relative overflow-y-auto px-6 py-4 flex-1">
              <form onSubmit={handleReport} className="space-y-4 text-xs">
                <div className="field-group">
                  <label className="label-modern">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                    placeholder="Brief description of the item"
                    className="input-modern"
                  />
                </div>
                <div className="field-group">
                  <label className="label-modern">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="input-modern"
                  >
                    <option value="Wallet">Wallet</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Cards">Cards</option>
                    <option value="Pet">Pet</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                {/* Conditional Pet Fields - Only shown when Pet category is selected */}
                {form.category === 'Pet' && (
                  <div className="space-y-3 p-4 rounded-xl bg-slate-900/30 border border-slate-700/30 animate-slide-down">
                    <div className="text-xs font-semibold text-teal-400 mb-2">🐾 Pet Details (Optional)</div>

                    <div className="field-group">
                      <label className="label-modern">Pet Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Max, Bella"
                        value={form.petDetails.petName}
                        onChange={(e) => setForm((f) => ({
                          ...f,
                          petDetails: { ...f.petDetails, petName: e.target.value }
                        }))}
                        className="input-modern"
                      />
                    </div>

                    <div className="field-group">
                      <label className="label-modern">Breed</label>
                      <input
                        type="text"
                        placeholder="e.g., Golden Retriever, Persian Cat"
                        value={form.petDetails.breed}
                        onChange={(e) => setForm((f) => ({
                          ...f,
                          petDetails: { ...f.petDetails, breed: e.target.value }
                        }))}
                        className="input-modern"
                      />
                    </div>

                    <div className="field-group">
                      <label className="label-modern">Identical Mark</label>
                      <input
                        type="text"
                        placeholder="e.g., White spot on chest, collar color"
                        value={form.petDetails.identicalMark}
                        onChange={(e) => setForm((f) => ({
                          ...f,
                          petDetails: { ...f.petDetails, identicalMark: e.target.value }
                        }))}
                        className="input-modern"
                      />
                    </div>

                    <div className="field-group">
                      <label className="label-modern">Allergic To</label>
                      <input
                        type="text"
                        placeholder="e.g., Peanuts, certain medications"
                        value={form.petDetails.allergicTo}
                        onChange={(e) => setForm((f) => ({
                          ...f,
                          petDetails: { ...f.petDetails, allergicTo: e.target.value }
                        }))}
                        className="input-modern"
                      />
                    </div>
                  </div>
                )}

                <div className="field-group">
                  <label className="label-modern">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Provide additional details..."
                    className="input-modern resize-none"
                  />
                </div>
                <div className="field-group">
                  <label className="label-modern">Photo (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setSelectedPhoto(e.target.files[0])}
                    className="w-full rounded-xl bg-slate-900/50 border border-slate-700/50 px-3 py-2 text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-teal-500 file:text-slate-950 hover:file:bg-teal-400 file:cursor-pointer transition-all"
                  />
                  {selectedPhoto && (
                    <div className="text-[11px] text-teal-400 mt-1.5 flex items-center gap-1.5">
                      <span>✓</span>
                      <span>Selected: {selectedPhoto.name}</span>
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedLocation
                    ? `Location locked at (${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)})`
                    : 'No location selected yet.'}
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex justify-center items-center gap-2 rounded-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-3 shadow-button hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Hamburger Menu Drawer */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setShowMenu(false)}
          />

          {/* Slide-out Menu */}
          <div className="fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Menu</h2>
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* User Info */}
              {user && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">{user.fullName}</div>
                  <div className="text-xs text-slate-600">{user.email}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">User ID:</span>
                    <span className="font-mono text-primary">{user.userId || user._id}</span>
                  </div>
                  {user.isVerified && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 border border-success/30 text-[10px] text-success">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      <span>Verified User</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* LIVE TRACKING SECTION [NEW] */}
            {activeMeetups.length > 0 && (
              <div className="p-4 border-b border-slate-200 bg-blue-50/50 dark:bg-blue-900/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Live Tracking
                  </h3>
                </div>
                <div className="space-y-2">
                  {activeMeetups.map(meetup => (
                    <button
                      key={meetup._id}
                      onClick={() => {
                        setSelectedMeetupId(meetup.matchId || meetup._id);
                        setShowMenu(false);
                      }}
                      className="w-full text-left rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 p-3 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Meeting for: {meetup.item?.title || 'Item'}
                        </span>
                        <span className="text-blue-500 group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Tap to view location & verify OTP
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-2">
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-3"
              >
                <span className="text-lg">👤</span>
                <span>Profile</span>
              </button>
              <button
                onClick={() => {
                  navigate('/matches');
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-3"
              >
                <span className="text-lg">🤝</span>
                <span>My Matches</span>
              </button>
            </div>

            {/* User's Submitted Items */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">My Submitted Items</h3>
                <span className="text-xs text-slate-400">{userItems.length}</span>
              </div>

              {/* ... existing user items list ... */}
              {!loadingUserItems && userItems.length === 0 && (
                <div className="text-xs text-slate-500 py-4 text-center">No items submitted yet</div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {userItems.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => {
                      navigate(`/item/${item._id}`);
                      setShowMenu(false);
                    }}
                    className="w-full text-left rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-primary/30 p-3 transition-all"
                  >
                    {/* ... existing item card content ... */}
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold ${item.type === 'lost' || item.type === 'LOST' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                        }`}>
                        {item.type === 'lost' || item.type === 'LOST' ? '?' : '!'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{item.title}</div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 capitalize mt-0.5">{item.category}</div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full ${item.status === 'RECOVERED' ? 'bg-success/10 text-success' :
                        item.status === 'MATCHED' ? 'bg-primary/10 text-primary' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                        {item.status || 'ACTIVE'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="p-4 border-t border-slate-200">
              <button
                onClick={() => {
                  const isDark = document.documentElement.classList.contains('dark');
                  if (isDark) {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                  } else {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('theme', 'dark');
                  }
                  // Force re-render to update UI if needed, though class change is immediate
                  setShowMenu(false);
                  setTimeout(() => setShowMenu(true), 10);
                }}
                className="w-full px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <span className="text-lg">🌓</span>
                <span>Switch Theme</span>
              </button>
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-slate-200 mt-auto">
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full px-4 py-2.5 rounded-full bg-danger/10 hover:bg-danger/20 border border-danger/30 text-danger hover:text-danger text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
