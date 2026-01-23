import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapView } from '../components/map/MapView';
import type { Item } from '../lib/types';
import { FloatingCardsList } from '../components/rebound/FloatingCardsList';
import { TopHeader } from '../components/rebound/TopHeader';
import type { ToggleValue } from '../components/rebound/ToggleTabs';
import { ReportItemPanel } from '../components/items/ReportItemPanel';
import { Plus } from 'lucide-react';

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
    <div className="min-h-screen rb-page-background">
      <div className="rb-shell">
        <div className="relative h-[calc(100vh-120px)]">
          <TopHeader
            value={type}
            onChange={setType}
            onBell={() => navigate('/alerts')}
            onMenu={() => navigate('/profile')}
          />

          {/* Desktop layout: left list panel + right map */}
          <div className="absolute inset-0 grid grid-cols-[360px_1fr] gap-6">
            {/* Right Panel - Conditional Rendering */}
            <div className="rb-device-surface flex flex-col overflow-hidden rounded-3xl bg-white/90 ring-1 ring-slate-200/70 backdrop-blur">
              {rightPanelView === 'LIST' && (
                <>
                  <div className="border-b border-slate-200 p-5">
                    <div className="text-sm font-semibold text-slate-900">Campus Area</div>
                    <div className="mt-1 text-xs text-slate-500">{items.length} active items nearby</div>
                  </div>
                  <div className="flex-1 overflow-auto p-3">
                    {items.length === 0 ? (
                      <div className="rounded-3xl bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200/70">
                        No items to show.
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {items.slice(0, 20).map((item) => (
                          <button
                            key={item._id}
                            type="button"
                            onClick={() => navigate(`/item/${item._id}`)}
                            className="text-left rounded-3xl bg-white p-4 ring-1 ring-slate-200/70 shadow-card transition hover:bg-slate-50"
                          >
                            <div className="text-sm font-semibold text-slate-900">{item.title}</div>
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

            {/* Map Container */}
            <div className="relative rb-device-surface overflow-hidden rounded-3xl ring-1 ring-slate-200/70">
              <MapView
                typeFilter={mapType}
                radiusKm={5}
                onItemsChange={setItems}
                onItemOpen={(id) => navigate(`/item/${id}`)}
              />
            </div>
          </div>

          {/* Bottom floating cards over map area - desktop flavour */}
          <FloatingCardsList items={items} onSelect={(item) => navigate(`/item/${item._id}`)} />

          {/* Report Item FABs */}
          <div className="pointer-events-none absolute bottom-6 right-6 z-20 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => openReportPanel('LOST')}
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-card hover:shadow-lg transition active:scale-95"
              aria-label="Report Lost Item"
              title="Report Lost Item"
            >
              <Plus className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => openReportPanel('FOUND')}
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-400 text-white shadow-card hover:shadow-lg transition active:scale-95"
              aria-label="Report Found Item"
              title="Report Found Item"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
