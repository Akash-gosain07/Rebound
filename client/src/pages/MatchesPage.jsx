import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../apiClient';
import { useToastStore } from '../store';

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const pushToast = useToastStore((s) => s.pushToast);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest('/api/matches/my');
        setMatches(data.matches || []);
      } catch (err) {
        pushToast({ type: 'error', message: err.message });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pushToast]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-xl w-full space-y-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/map')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 text-sm font-medium transition-all shadow-soft hover-lift"
        >
          <span className="text-lg">←</span>
          <span>Back to Map</span>
        </button>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Matches</div>
              <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">Your recent handovers</div>
            </div>
          </div>

          {loading && <div className="text-sm text-slate-500">Loading matches…</div>}
          {!loading && matches.length === 0 && (
            <div className="text-sm text-slate-500">No matches yet. Claim an item to get started.</div>
          )}

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {matches.map((m) => (
              <button
                key={m._id}
                onClick={() => navigate(`/match/${m.matchId}`)}
                className="w-full text-left rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-600 px-4 py-3 flex items-center justify-between text-sm transition-all shadow-soft"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{m.item?.title || 'Item'}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Match ID: {m.matchId}</div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs uppercase tracking-wide font-medium ${m.status === 'RECOVERED'
                    ? 'bg-success/10 text-success border border-success/30'
                    : m.status === 'VERIFIED'
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                >
                  {m.status}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
