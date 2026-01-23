import { useEffect, useState } from 'react';
import api from '../lib/api';
import type { Item } from '../lib/types';
import { ItemCard } from '../components/items/ItemCard';

export function BrowsePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (type !== 'ALL') params.type = type;
        const res = await api.get('/items', { params });
        setItems(res.data.items);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [type]);

  const filtered = items.filter((i) =>
    query ? `${i.title} ${i.description}`.toLowerCase().includes(query.toLowerCase()) : true
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-3 pb-20 md:pb-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Browse all items</h1>
          <p className="text-xs text-slate-500">Filter by type and search keywords.</p>
        </div>
        <div className="flex gap-2 text-xs">
          {['ALL', 'LOST', 'FOUND'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t as any)}
              className={
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors ' +
                (t === type ? 'bg-slate-900 text-white shadow-soft' : 'bg-white text-slate-600 hover:bg-slate-100')
              }
            >
              {t === 'ALL' ? 'All' : t === 'LOST' ? 'Lost' : 'Found'}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center rounded-2xl bg-white px-3 py-2 shadow-soft ring-1 ring-slate-200">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 w-full bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
          placeholder="Search by title or description…"
        />
      </div>
      <div className="mt-4 grid gap-3">
        {loading && <p className="text-xs text-slate-500">Loading items…</p>}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500">
            No items match this filter yet. Try broadening your search or posting a new item.
          </div>
        )}
        {filtered.map((item) => (
          <ItemCard key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
}
