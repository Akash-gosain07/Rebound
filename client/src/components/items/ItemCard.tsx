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
      className="group block overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 transition-all hover:-translate-y-1 hover:ring-cyan-100 hover:shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
    >
      <div className="flex h-full">
        <div
          className={`hidden h-auto w-24 shrink-0 md:block ${isLost ? 'bg-gradient-to-b from-rose-100 to-orange-50' : 'bg-gradient-to-b from-emerald-100 to-cyan-50'}`}
        />
        <div className="flex-1 p-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
              <span className={'h-1.5 w-1.5 rounded-full ' + (isLost ? 'bg-rose-500' : 'bg-emerald-500')} />
              {isLost ? 'Lost' : 'Found'} • {item.category}
            </div>
            {item.verified && (
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </div>
            )}
          </div>
          <h3 className="text-base font-semibold text-slate-900 line-clamp-1">{item.title}</h3>
          <p className="mt-1 text-sm text-slate-500 line-clamp-2">{item.description}</p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              <span>{distanceLabel || 'Campus area'}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <Sparkles className="h-3 w-3 text-cyan-500 transition group-hover:text-emerald-500" />
              <span>{item.postedBy.name}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
