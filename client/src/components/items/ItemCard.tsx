import { MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Item } from '../../lib/types';

interface Props {
  item: Item;
  distanceLabel?: string;
}

export function ItemCard({ item, distanceLabel }: Props) {
  const isLost = item.type === 'LOST';

  return (
    <Link
      to={`/item/${item._id}`}
      className="block rounded-2xl bg-white shadow-soft/40 ring-1 ring-slate-100 hover:ring-teal-100 hover:shadow-soft transition-all overflow-hidden"
    >
      <div className="flex">
        <div className="hidden h-full w-24 shrink-0 bg-gradient-to-b from-slate-100 to-slate-50 md:block" />
        <div className="flex-1 p-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
              <span
                className={
                  'h-1.5 w-1.5 rounded-full ' + (isLost ? 'bg-rose-500' : 'bg-emerald-500')
                }
              />
              {isLost ? 'Lost' : 'Found'} • {item.category}
            </div>
            {item.verified && (
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </div>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{item.title}</h3>
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{item.description}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              <span>{distanceLabel || 'Campus area'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-teal-500" />
              <span>{item.postedBy.name}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
