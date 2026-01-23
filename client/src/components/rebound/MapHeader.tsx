import { Bell, Menu } from 'lucide-react';

export function MapHeader({
  onMenu,
  onBell
}: {
  onMenu?: () => void;
  onBell?: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pt-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <button
          type="button"
          onClick={onMenu}
          className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 shadow-card ring-1 ring-slate-200/70 backdrop-blur transition active:scale-[0.98]"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5 text-slate-700" />
        </button>

        <button
          type="button"
          onClick={onBell}
          className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 shadow-card ring-1 ring-slate-200/70 backdrop-blur transition active:scale-[0.98]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-slate-700" />
        </button>
      </div>
    </div>
  );
}
