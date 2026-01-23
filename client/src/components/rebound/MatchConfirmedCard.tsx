import { CheckCircle2, MapPin } from 'lucide-react';
import { Card } from './Card';
import type { Item } from '../../lib/types';

export function MatchConfirmedCard({
  title,
  validLabel,
  item,
  matchId,
  locationLabel,
  spotCode
}: {
  title: string;
  validLabel: string;
  item?: Item | null;
  matchId: string;
  locationLabel: string;
  spotCode: string;
}) {
  const photo = item?.photos?.[0];

  return (
    <div className="w-full">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/40">
          <CheckCircle2 className="h-8 w-8 text-white drop-shadow" />
        </div>
        <div className="text-2xl font-semibold text-white">{title}</div>
        <div className="mt-1 text-sm text-white/85">{validLabel}</div>
      </div>

      <Card className="mt-6 overflow-hidden rounded-[26px] bg-white/95 shadow-card ring-1 ring-white/50 backdrop-blur">
        {photo ? (
          <img src={photo} alt={item?.title || 'Matched item'} className="h-48 w-full object-cover" />
        ) : (
          <div className="h-48 w-full bg-gradient-to-br from-slate-100 to-slate-50" />
        )}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-slate-900">{item?.title || 'Brown Wallet'}</div>
              <div className="mt-1 text-sm text-slate-600">{locationLabel}</div>
            </div>
            <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
              Match ID&nbsp;{matchId}
            </span>
          </div>

          <div className="grid gap-2 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-rose-500" />
              <span className="font-semibold">{locationLabel}</span>
              <span className="text-slate-500">• Spot {spotCode}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{validLabel}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
