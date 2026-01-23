import { Bell, MapPin } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../providers/NotificationsProvider';
import { useAuth } from '../../providers/AuthProvider';
import { Button } from '../ui/button';

export function TopBar() {
  const { unreadCount } = useNotifications();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const showMapShortcut = location.pathname !== '/map';

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-primary-soft to-primary shadow-soft/40">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-white/15 flex items-center justify-center shadow-soft">
            <span className="text-lg font-black tracking-tight">RB</span>
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm">Rebound</span>
              <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                Beta
              </span>
            </div>
            <p className="text-[11px] opacity-85">Lost &amp; found for your campus</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showMapShortcut && (
            <button
              onClick={() => navigate('/map')}
              className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium hover:bg-white/25 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5" />
              Map
            </button>
          )}
          <button
            onClick={() => navigate('/alerts')}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] rounded-full bg-accent px-1 text-[10px] font-semibold leading-tight text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-medium max-w-[120px] truncate">{user.name}</span>
              <Button variant="outline" size="default" className="h-8 px-3 text-xs bg-white/95" onClick={logout}>
                Logout
              </Button>
            </div>
          ) : (
            <Link to="/" className="hidden sm:inline-flex">
              <Button variant="outline" size="default" className="h-8 px-3 text-xs bg-white/95">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
