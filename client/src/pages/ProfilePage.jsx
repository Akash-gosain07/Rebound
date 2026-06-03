import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../apiClient';
import { useAuthStore, useToastStore } from '../store';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const pushToast = useToastStore((s) => s.pushToast);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest('/api/auth/me');
        setAuth({ user: data.user, token: useAuthStore.getState().token });
      } catch (err) {
        pushToast({ type: 'error', message: err.message });
      }
    };
    load();
  }, [pushToast, setAuth]);

  if (!user) return <div className="p-6 text-sm text-slate-500">Loading profile…</div>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full space-y-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/map')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 text-sm font-medium transition-all shadow-soft hover-lift"
        >
          <span className="text-lg">←</span>
          <span>Back to Map</span>
        </button>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-card p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Profile</div>
              <div className="text-xl font-semibold mt-1 text-slate-900 dark:text-slate-100">{user.fullName}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">{user.email}</div>
            </div>
            <div>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${user.isVerified
                  ? 'bg-success/10 text-success border border-success/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span>{user.isVerified ? 'Verified user' : 'Unverified user'}</span>
              </div>
            </div>
          </div>

          {/* Points & Rating Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/50 rounded-2xl p-4 text-center shadow-soft">
              <div className="text-[10px] uppercase tracking-widest text-teal-600 dark:text-teal-400 font-bold mb-1">Points Wallet</div>
              <div className="text-2xl font-bold text-teal-700 dark:text-teal-300 flex items-center justify-center gap-1">
                <span>🪙</span>
                {user.points || 0}
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl p-4 text-center shadow-soft">
              <div className="text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold mb-1">Avg Rating</div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1">
                <span>⭐</span>
                {user.rating ? user.rating.toFixed(1) : '0.0'}
              </div>
              <div className="text-[10px] text-amber-500 dark:text-amber-500/70 mt-1">{user.reviewCount || 0} reviews</div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Phone</span>
              <span className="text-slate-900 dark:text-slate-100 font-medium">{user.phone || 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 dark:text-slate-400">Member since</span>
              <span className="text-slate-900 dark:text-slate-100 font-medium">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
