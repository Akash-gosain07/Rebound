import { Home, LayoutGrid, Bell, User2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

const items = [
  { to: '/map', label: 'Home', icon: Home },
  { to: '/browse', label: 'Feed', icon: LayoutGrid },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User2 }
];

export function BottomNav({ disabled = false }: { disabled?: boolean }) {
  return (
    <nav className="fixed bottom-6 left-1/2 z-30 w-full max-w-4xl -translate-x-1/2 transform px-4">
      <div className="mx-auto flex items-stretch justify-between rounded-[22px] bg-white/90 px-3 py-2 shadow-card ring-1 ring-slate-200/80 backdrop-blur">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={(e) => {
                if (disabled) e.preventDefault();
              }}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-2xl px-1.5 py-1 text-[11px] font-medium transition',
                  disabled && 'pointer-events-none opacity-40',
                  isActive ? 'text-slate-900' : 'text-slate-500'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-2xl transition',
                      isActive && !disabled
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-400 text-white shadow-soft'
                        : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/70'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
