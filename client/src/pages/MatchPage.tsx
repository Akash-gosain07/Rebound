import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import type { Item } from '../lib/types';
import { MatchConfirmedCard } from '../components/rebound/MatchConfirmedCard';
import { PrimaryButton } from '../components/rebound/PrimaryButton';
import { SecondaryButton } from '../components/rebound/SecondaryButton';
import { useToast } from '../providers/ToasterProvider';

type MatchApi = {
  matchId: string;
  status: string;
  meetLocation?: { label?: string; lat?: number; lng?: number };
  meetWindow?: { start?: string; end?: string };
  item?: { _id: string; title: string; photos?: string[] };
  // server route returns populated `item` sometimes under `item`
};

function formatWindow(start?: string, end?: string) {
  if (!start || !end) return 'Valid: —';
  const s = new Date(start);
  const e = new Date(end);
  return `Valid: ${s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${e.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })} today`;
}

export function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { push } = useToast();

  const [match, setMatch] = useState<MatchApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    if (!matchId) return;
    setLoading(true);
    try {
      const res = await api.get(`/matches/${matchId}`);
      setMatch(res.data.match);
    } catch (err: any) {
      push({ title: 'Could not load match', description: err?.response?.data?.message || 'Try again.' });
      setMatch(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [matchId]);

  const windowLabel = useMemo(
    () => formatWindow(match?.meetWindow?.start, match?.meetWindow?.end),
    [match?.meetWindow?.start, match?.meetWindow?.end]
  );

  const locationLabel = match?.meetLocation?.label || 'Harmony Cafe';
  const spotCode = match?.meetLocation?.label || 'B5';

  const item: Item | null = (match?.item as any)
    ? ({
        _id: (match!.item as any)._id,
        itemId: '—',
        type: 'FOUND',
        category: 'wallet',
        title: (match!.item as any).title || 'Brown Wallet',
        description: '',
        photos: (match!.item as any).photos || [],
        location: { type: 'Point', coordinates: [0, 0] },
        status: 'ACTIVE',
        postedBy: { _id: '', userId: '', name: '', trustScore: 0 },
        verified: true
      } as Item)
    : null;

  const onNavigate = () => {
    const lat = match?.meetLocation?.lat;
    const lng = match?.meetLocation?.lng;
    if (typeof lat === 'number' && typeof lng === 'number') {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    } else {
      window.open('https://www.google.com/maps', '_blank');
    }
  };

  const onRecovered = async () => {
    if (!matchId) return;
    setActionLoading(true);
    try {
      await api.post(`/matches/${matchId}/recovered`);
      push({ title: 'Marked as recovered' });
      await load();
    } catch (err: any) {
      push({ title: 'Could not mark recovered', description: err?.response?.data?.message || 'Try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="px-5 py-6 text-sm text-slate-500">Loading…</div>;
  }

  if (!match) {
    return <div className="px-5 py-6 text-sm text-slate-500">Match not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#19c9b4] via-teal-500 to-emerald-500 text-white">
      <div className="rb-shell rb-shell-narrow pb-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 text-white backdrop-blur active:scale-[0.98]"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <MatchConfirmedCard
          title="Match Confirmed"
          validLabel={windowLabel}
          item={item}
          matchId={match.matchId || matchId || '—'}
          locationLabel={locationLabel}
          spotCode={spotCode}
        />

        <div className="mt-6 grid gap-3">
          <PrimaryButton
            size="lg"
            variant="accent"
            className="rounded-full shadow-card focus-visible:ring-orange-300"
            type="button"
            onClick={onNavigate}
          >
            Navigate to Meetup
          </PrimaryButton>
          <SecondaryButton
            size="lg"
            className="rounded-full border-white/30 bg-white/10 text-white ring-0 hover:bg-white/20 focus-visible:ring-white/60"
            type="button"
            onClick={onRecovered}
            disabled={actionLoading}
          >
            Mark as Recovered
          </SecondaryButton>
        </div>

        <div className="mt-4 text-center">
          <Link to="/matches" className="text-sm font-semibold text-white/90 underline-offset-4 hover:underline">
            View My Matches
          </Link>
        </div>
      </div>
    </div>
  );
}
