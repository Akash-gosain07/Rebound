import type { Item } from '../../lib/types';
import { Card } from './Card';

function safeAddress(item: Item) {
  return item.location?.address || 'Campus Area';
}

export function FloatingCardsList({
  items,
  onSelect
}: {
  items: Item[];
  onSelect: (item: Item) => void;
}) {
  const top = items.slice(0, 3);
  const nearbyCount = items.length;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 px-4 md:pb-2">
      <div className="mx-auto max-w-4xl">
        <Card className="pointer-events-auto overflow-hidden rounded-[26px] bg-white/95 shadow-card ring-1 ring-slate-200/80 backdrop-blur">
          <div className="flex items-center justify-between px-5 pt-5">
            <div>
              <div className="text-sm font-semibold text-slate-900">Campus Area</div>
              <div className="mt-1 text-xs text-slate-500">
                {nearbyCount > 0 ? `${nearbyCount} active item${nearbyCount === 1 ? '' : 's'} nearby` : 'No active items nearby'}
              </div>
            </div>
            <div className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
              Live map
            </div>
          </div>

          {top.length === 0 ? (
            <div className="px-5 pb-5 pt-3 text-sm text-slate-600">Nothing around you yet. Try panning the map.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {top.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50 active:scale-[0.99]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 text-sm font-semibold text-slate-600 ring-1 ring-slate-200/70">
                    {item.title?.[0] ? item.title[0].toUpperCase() : '•'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">{item.title || 'Nearby item'}</div>
                      <span className="text-sm font-semibold text-slate-300">›</span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">{safeAddress(item)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
