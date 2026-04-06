import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { MapView } from '../components/map/MapView';
import type { Item } from '../lib/types';
import { FloatingCardsList } from '../components/rebound/FloatingCardsList';
import { TopHeader } from '../components/rebound/TopHeader';
import type { ToggleValue } from '../components/rebound/ToggleTabs';
import { ReportItemPanel } from '../components/items/ReportItemPanel';

type RightPanelView = 'LIST' | 'REPORT_LOST' | 'REPORT_FOUND';

export function MapPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<ToggleValue>('LOST');
  const [items, setItems] = useState<Item[]>([]);
  const [rightPanelView, setRightPanelView] = useState<RightPanelView>('LIST');

  const mapType = useMemo(() => type, [type]);

  const openReportPanel = (reportType: 'LOST' | 'FOUND') => {
    setRightPanelView(reportType === 'LOST' ? 'REPORT_LOST' : 'REPORT_FOUND');
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef6fb_0%,#f6fafc_100%)]">
      <div className="rb-shell">
        <div className="mb-6 flex flex-col gap-4 pt-2 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Operations dashboard</div>
            <h1 className="mt-2 font-display text-4xl font-semibold text-slate-950">
              Monitor reports, map activity, and recovery flow from one place.
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Your existing matching and map connections stay intact. This refresh only improves the presentation and navigation experience.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[24px] border border-white/70 bg-white/85 px-4 py-3 shadow-soft">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Visible</div>
              <div className="mt-1 text-2xl font-display font-semibold text-slate-950">{items.length}</div>
            </div>
            <div className="rounded-[24px] border border-white/70 bg-white/85 px-4 py-3 shadow-soft">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Focus</div>
              <div className="mt-1 text-2xl font-display font-semibold text-slate-950">{type}</div>
            </div>
            <div className="rounded-[24px] border border-white/70 bg-white/85 px-4 py-3 shadow-soft">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Mode</div>
              <div className="mt-1 text-2xl font-display font-semibold text-slate-950">Live</div>
            </div>
          </div>
        </div>

        <div className="relative h-[calc(100vh-260px)] min-h-[42rem]">
          <TopHeader
            value={type}
            onChange={setType}
            onBell={() => navigate('/alerts')}
            onMenu={() => navigate('/profile')}
          />

          <div className="absolute inset-0 grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="rb-device-surface flex flex-col overflow-hidden rounded-[30px] border border-white/70 bg-white/88 ring-1 ring-slate-200/70 backdrop-blur">
              {rightPanelView === 'LIST' && (
                <>
                  <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,rgba(6,182,212,0.08),rgba(16,185,129,0.06))] p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-700">Nearby reports</div>
                    <div className="mt-2 text-lg font-semibold text-slate-950">Campus Area</div>
                    <div className="mt-1 text-xs text-slate-500">{items.length} active items nearby</div>
                  </div>
                  <div className="flex-1 overflow-auto p-3">
                    {items.length === 0 ? (
                      <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500 ring-1 ring-slate-200/70">
                        No items to show.
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {items.slice(0, 20).map((item) => (
                          <button
                            key={item._id}
                            type="button"
                            onClick={() => navigate(`/item/${item._id}`)}
                            className="text-left rounded-3xl bg-white p-4 ring-1 ring-slate-200/70 shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-50"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${item.type === 'LOST' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}
                              >
                                {item.type}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{item.category}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {rightPanelView === 'REPORT_LOST' && (
                <ReportItemPanel
                  type="LOST"
                  onClose={() => setRightPanelView('LIST')}
                  onSuccess={() => window.location.reload()}
                />
              )}

              {rightPanelView === 'REPORT_FOUND' && (
                <ReportItemPanel
                  type="FOUND"
                  onClose={() => setRightPanelView('LIST')}
                  onSuccess={() => window.location.reload()}
                />
              )}
            </div>

            <div className="relative rb-device-surface overflow-hidden rounded-[34px] border border-white/70 ring-1 ring-slate-200/70">
              <MapView
                typeFilter={mapType}
                radiusKm={5}
                onItemsChange={setItems}
                onItemOpen={(id) => navigate(`/item/${id}`)}
              />
            </div>
          </div>

          <FloatingCardsList items={items} onSelect={(item) => navigate(`/item/${item._id}`)} />

          <div className="pointer-events-none absolute bottom-6 right-6 z-20 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => openReportPanel('LOST')}
              className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 px-4 py-4 text-sm font-semibold text-white shadow-card transition hover:shadow-lg active:scale-95"
              aria-label="Report Lost Item"
              title="Report Lost Item"
            >
              <Plus className="h-6 w-6" />
              <span className="hidden sm:inline">Report lost</span>
            </button>
            <button
              type="button"
              onClick={() => openReportPanel('FOUND')}
              className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 px-4 py-4 text-sm font-semibold text-white shadow-card transition hover:shadow-lg active:scale-95"
              aria-label="Report Found Item"
              title="Report Found Item"
            >
              <Plus className="h-6 w-6" />
              <span className="hidden sm:inline">Report found</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
