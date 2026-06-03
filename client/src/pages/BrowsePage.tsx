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
    <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:pb-8">
      <div className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,246,251,0.92))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Discovery feed</div>
            <h1 className="mt-2 font-display text-4xl font-semibold text-slate-950">Browse every active report in one structured view.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Filter by report type, search details, and jump straight into the existing claim flow without changing any backend behavior.
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-soft">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Active results</div>
            <div className="mt-1 font-display text-3xl font-semibold text-slate-950">{filtered.length}</div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Filter by type and keywords</h2>
          <p className="text-xs text-slate-500">Find the most relevant report faster.</p>
        </div>
        <div className="flex gap-2 text-xs">
          {['ALL', 'LOST', 'FOUND'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t as any)}
              className={
                'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ' +
                (t === type ? 'bg-slate-950 text-white shadow-soft' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50')
              }
            >
              {t === 'ALL' ? 'All' : t === 'LOST' ? 'Lost' : 'Found'}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center rounded-[24px] bg-white px-4 py-3 shadow-soft ring-1 ring-slate-200">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          placeholder="Search by title or description..."
        />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && <p className="text-xs text-slate-500">Loading items...</p>}
        {!loading && filtered.length === 0 && (
          <div className="rounded-[28px] bg-slate-50 p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200">
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
