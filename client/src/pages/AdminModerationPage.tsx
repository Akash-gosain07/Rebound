import { useEffect, useState } from 'react';
import api from '../lib/api';
import type { Item } from '../lib/types';
import { Button } from '../components/ui/button';

export function AdminModerationPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/unverified-items');
      setItems(res.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const verifyItem = async (id: string) => {
    await api.patch(`/admin/items/${id}/verify`);
    await load();
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 pb-20 md:pb-6">
      <h1 className="text-base font-semibold text-slate-900">Admin moderation</h1>
      <p className="text-xs text-slate-500">Review and verify items before they appear as trusted.</p>
      <div className="mt-4 space-y-3">
        {loading && <p className="text-xs text-slate-500">Loading unverified items…</p>}
        {!loading && items.length === 0 && (
          <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500">
            All caught up. No unverified items right now.
          </div>
        )}
        {items.map((item) => (
          <div
            key={item._id}
            className="flex items-start justify-between gap-3 rounded-2xl bg-white p-4 text-xs shadow-soft ring-1 ring-slate-200"
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                <span
                  className={
                    'h-1.5 w-1.5 rounded-full ' + (item.type === 'LOST' ? 'bg-rose-500' : 'bg-emerald-500')
                  }
                />
                {item.type === 'LOST' ? 'Lost' : 'Found'} • {item.category}
              </div>
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="text-[11px] text-slate-600 line-clamp-2">{item.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button size="default" className="h-8 px-4" onClick={() => verifyItem(item._id)}>
                Mark verified
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
