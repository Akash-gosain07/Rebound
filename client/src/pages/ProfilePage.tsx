import { useEffect, useState } from 'react';
import api from '../lib/api';
import type { Item } from '../lib/types';
import { useAuth } from '../providers/AuthProvider';
import { ItemCard } from '../components/items/ItemCard';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const res = await api.get('/items');
      setItems(res.data.items);
    };
    void load();
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-4 pb-20 md:pb-6 text-xs text-slate-500">
        You need to sign in to view your profile.
      </div>
    );
  }

  const myItems = items.filter((i) => (i.postedBy as any)._id === user._id);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 pb-20 md:pb-6 space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Profile
          </p>
          <h1 className="mt-1 text-base font-semibold text-slate-900">{user.name}</h1>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
        <div className="flex flex-col gap-2 text-xs text-slate-600">
          <div>
            <span className="mr-2 text-[11px] font-semibold text-slate-700">Trust score</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              {user.trustScore.toFixed(1)} / 5
            </span>
          </div>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400"
              style={{ width: `${(user.trustScore / 5) * 100}%` }}
            />
          </div>
          <div className="flex gap-3 text-[11px]">
            <span>Posted: {user.stats?.itemsPosted ?? myItems.length}</span>
            <span>Matches: {user.stats?.matchesFound ?? 0}</span>
            <span>Recovered: {user.stats?.recovered ?? 0}</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-semibold text-slate-800">Your posts</span>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
        {myItems.length === 0 && (
          <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500">
            You have not posted any items yet. Try posting a lost or found item from the Post tab.
          </div>
        )}
        <div className="grid gap-3">
          {myItems.map((item) => (
            <ItemCard key={item._id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
