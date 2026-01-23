import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MapPin } from 'lucide-react';
import api from '../lib/api';
import type { Item } from '../lib/types';
import { Card } from '../components/rebound/Card';
import { PrimaryButton } from '../components/rebound/PrimaryButton';
import { SecondaryButton } from '../components/rebound/SecondaryButton';
import { StatusBadge } from '../components/rebound/StatusBadge';
import { useToast } from '../providers/ToasterProvider';

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

export function ItemDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { push } = useToast();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setMe(null),
        { enableHighAccuracy: false, timeout: 3500 }
      );
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.get(`/items/${id}`);
        setItem(res.data.item);
      } catch (err: any) {
        push({ title: 'Could not load item', description: err?.response?.data?.message || 'Try again.' });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const photo = item?.photos?.[0];

  const distanceLabel = useMemo(() => {
    if (!item?.location?.coordinates || !me) return '—';
    const [lng, lat] = item.location.coordinates;
    const meters = haversineMeters(me, { lat, lng });
    if (meters < 1000) return `${Math.round(meters)}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
  }, [item, me]);

  const onClaim = async () => {
    if (!id) return;
    setClaiming(true);
    try {
      // Use existing match system: create a match claim for this item.
      const res = await api.post('/matches', { itemId: id });
      const matchId = res.data.match?.matchId;
      if (!matchId) throw new Error('Match created, but no matchId returned');

      push({ title: 'Match started', description: 'Follow the meetup instructions to complete recovery.' });
      navigate(`/match/${matchId}`);
    } catch (err: any) {
      push({ title: 'Could not start match', description: err?.response?.data?.message || err?.message || 'Try again.' });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return <div className="mx-auto w-full max-w-md px-5 py-6 text-sm text-slate-500">Loading…</div>;
  }

  if (!item) {
    return <div className="mx-auto w-full max-w-md px-5 py-6 text-sm text-slate-500">Item not found.</div>;
  }

  const address = item.location?.address || 'Main Street, Sector 6';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f7f5] via-white to-[#e6f0ff]">
      <div className="rb-shell rb-shell-narrow pb-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-card ring-1 ring-slate-200/70 active:scale-[0.98]"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <div className="text-base font-semibold text-slate-900">Possibly Your Wallet</div>
        </div>

        <Card className="mt-6 overflow-hidden rounded-[28px] shadow-card">
          {photo ? (
            <img src={photo} alt={item.title} className="h-64 w-full object-cover" />
          ) : (
            <div className="h-64 w-full bg-gradient-to-br from-slate-100 to-slate-50" />
          )}
        </Card>

        <div className="mt-6 space-y-5">
          <div className="space-y-3">
            <div className="text-2xl font-semibold text-slate-900">{item.title || 'Brown Wallet'}</div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge>Verified User</StatusBadge>
              <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
                {distanceLabel}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-card ring-1 ring-slate-200/70">
                <MapPin className="h-4 w-4 text-rose-500" />
                <span>{address}</span>
              </div>
            </div>
          </div>

          <Card className="space-y-4 p-5">
            <div className="text-sm font-semibold text-slate-900">Verification checklist</div>
            <div className="grid gap-2 text-sm text-slate-700">
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Spot is verified</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Finder is nearby</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Photo verified</span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200/70">
              <div className="text-sm font-semibold text-slate-900">Suggested meetup</div>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Student Center Info Desk</span>
              </div>
            </div>
          </Card>

          <div className="grid gap-3">
            <PrimaryButton
              size="lg"
              variant="accent"
              className="rounded-full shadow-card focus-visible:ring-orange-400"
              onClick={onClaim}
              disabled={claiming}
            >
              {claiming ? 'Starting…' : 'This Wallet Is Mine'}
            </PrimaryButton>
            <SecondaryButton
              size="lg"
              className="rounded-full"
              onClick={() => push({ title: 'Marked as Similar', description: 'Thanks — this helps improve matches.' })}
            >
              Mark as Similar
            </SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
