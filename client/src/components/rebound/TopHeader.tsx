import { Bell, Menu } from 'lucide-react';
import { ToggleValue } from './ToggleTabs';
import { LostFoundToggle } from './LostFoundToggle';

export function TopHeader({
  value,
  onChange,
  onMenu,
  onBell
}: {
  value: ToggleValue;
  onChange: (v: ToggleValue) => void;
  onMenu?: () => void;
  onBell?: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-4 pt-5 md:px-6">
      <div className="pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-[28px] border border-white/70 bg-white/82 px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.14)] ring-1 ring-slate-200/60 backdrop-blur">
        <button
          type="button"
          onClick={onMenu}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white ring-1 ring-slate-900/10 transition hover:bg-slate-800 active:scale-[0.98]"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex-1 text-center">
          <LostFoundToggle value={value} onChange={onChange} />
        </div>

        <button
          type="button"
          onClick={onBell}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-[0.98]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
