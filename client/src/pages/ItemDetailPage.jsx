import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../apiClient';
import { useAuthStore, useToastStore } from '../store';

export default function ItemDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const pushToast = useToastStore((s) => s.pushToast);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest(`/api/items/${id}`);
        setItem(data.item);
      } catch (err) {
        pushToast({ type: 'error', message: err.message });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, pushToast]);

  const handleClaim = async () => {
    setCreatingMatch(true);
    try {
      const data = await apiRequest('/api/matches', {
        method: 'POST',
        body: { itemId: id },
      });
      const match = data.match;
      pushToast({ type: 'success', message: 'Match request created' });
      navigate(`/match/${match.matchId}`);
    } catch (err) {
      pushToast({ type: 'error', message: err.message });
    } finally {
      setCreatingMatch(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading item…</div>;
  if (!item) return <div className="p-6 text-sm text-slate-500">Item not found.</div>;

  const creatorVerified = item.createdBy?.isVerified;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <div className="max-w-2xl w-full space-y-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/map')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-sm font-medium transition-all shadow-soft hover-lift"
        >
          <span className="text-lg">←</span>
          <span>Back to Map</span>
        </button>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-card overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2 bg-slate-100 relative">
              {item.photoUrl ? (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'}${item.photoUrl}`}
                  alt={item.title}
                  className="w-full h-64 md:h-full object-cover"
                />
              ) : (
                <div className="w-full h-64 md:h-full flex items-center justify-center text-sm text-slate-400">
                  No photo uploaded
                </div>
              )}
            </div>
            <div className="md:w-1/2 p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs uppercase tracking-wide text-slate-700 font-medium">
                    <span
                      className={`w-2 h-2 rounded-full ${item.type === 'lost' ? 'bg-danger' : 'bg-success'
                        }`}
                    />
                    <span>{item.type === 'lost' ? 'Lost' : 'Found'}</span>
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">{item.title}</h2>
                  <div className="text-sm text-slate-600 capitalize">{item.category}</div>
                </div>
                {creatorVerified && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/30 text-xs text-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    <span>Verified spotter</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="text-slate-700 font-medium">Description</div>
                <div className="text-slate-600 leading-relaxed min-h-[3rem]">
                  {item.description || 'No extra details provided.'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                  <div className="text-slate-500 mb-1">Spot verified</div>
                  <div className="font-semibold text-success">{creatorVerified ? 'Yes' : 'Pending'}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                  <div className="text-slate-500 mb-1">Finder nearby</div>
                  <div className="font-semibold text-slate-900">Smart radius</div>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                  <div className="text-slate-500 mb-1">Photo verified</div>
                  <div className="font-semibold text-slate-900">Visual check</div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div>
                  Saved at{' '}
                  <span className="text-slate-900 font-medium">
                    {item.location?.address || 'Bhubaneswar vicinity'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleClaim}
                  disabled={creatingMatch}
                  className="flex-1 inline-flex justify-center items-center gap-2 rounded-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-3 shadow-button hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 active:scale-[0.98]"
                >
                  {creatingMatch ? 'Processing…' : 'This item is mine'}
                </button>
                <button
                  onClick={() =>
                    user
                      ? navigate('/matches')
                      : pushToast({ type: 'error', message: 'Login to track similar items.' })
                  }
                  className="flex-1 inline-flex justify-center items-center gap-2 rounded-full bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold py-3 transition-all duration-200"
                >
                  Mark as similar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
