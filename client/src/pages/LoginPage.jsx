import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRequest } from '../apiClient';
import { useAuthStore, useToastStore } from '../store';


const splashVariants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 140 } },
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const pushToast = useToastStore((s) => s.pushToast);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set; Google Sign-In disabled');
      return;
    }

    let cancelled = false;

    const tryInit = () => {
      const google = window.google;
      if (!google || !google.accounts || !google.accounts.id) {
        return false;
      }

      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            const idToken = response.credential;
            if (!idToken) {
              pushToast({ type: 'error', message: 'Google did not return a credential.' });
              return;
            }
            const data = await apiRequest('/api/auth/google', {
              method: 'POST',
              body: { idToken },
            });
            setAuth({ user: data.user, token: data.token });
            pushToast({ type: 'success', message: 'Signed in with Google' });
            navigate('/map');
          } catch (err) {
            pushToast({ type: 'error', message: err.message });
          }
        },
      });

      setGoogleReady(true);
      return true;
    };

    if (tryInit()) return;

    const interval = setInterval(() => {
      if (cancelled) {
        clearInterval(interval);
        return;
      }
      if (tryInit()) {
        clearInterval(interval);
      }
    }, 300);

    return () => {
      cancelled = true;
    };
  }, [navigate, pushToast, setAuth]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      setAuth({ user: data.user, token: data.token });
      pushToast({ type: 'success', message: 'Welcome back to Rebound' });
      navigate('/map');
    } catch (err) {
      pushToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        throw new Error('Failed to create guest session');
      }

      const data = await res.json();
      useAuthStore.getState().setAuth({ user: data.user, token: data.accessToken });
      pushToast({ type: 'success', message: 'Browsing as guest – login to claim or post items.' });
      navigate('/map');
    } catch (err) {
      pushToast({ type: 'error', message: err.message });
    }
  };

  const handleGoogle = () => {
    if (!googleReady) {
      pushToast({ type: 'error', message: 'Google Sign-In is still initializing. Please try again.' });
      return;
    }

    const google = window.google;
    if (!google || !google.accounts || !google.accounts.id) {
      pushToast({ type: 'error', message: 'Google Identity Services not available.' });
      return;
    }

    // Triggers the Google One Tap / popup flow; callback configured in useEffect.
    google.accounts.id.prompt();
  };

  return (
    <div className="w-full px-4">

      <motion.div
        variants={splashVariants}
        initial="initial"
        animate="animate"
        className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-card p-8 relative overflow-hidden border border-slate-200/60 dark:border-slate-700/60"
      >
        <div className="relative space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 text-primary dark:text-primary-light text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-primary dark:bg-primary-light animate-pulse" />
              <span>Reuniting you with what matters</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Rebound</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              Track lost & found items around you with a live map, smart matching, and verified meetups.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-white dark:bg-slate-700 border border-border dark:border-slate-600 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-white dark:bg-slate-700 border border-border dark:border-slate-600 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex justify-center items-center gap-2 rounded-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-3 shadow-button hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 active:scale-[0.98]"
            >
              {loading ? 'Signing in…' : 'Login'}
            </button>
          </form>

          <div className="space-y-3">
            <button
              onClick={handleGoogle}
              disabled={!googleReady}
              className="w-full inline-flex justify-center items-center gap-3 rounded-full bg-white dark:bg-slate-700 border-2 border-border dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 text-sm font-medium py-3 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="text-lg">🔵</span>
              <span>Continue with Google</span>
            </button>
            <button
              onClick={handleGuest}
              className="w-full inline-flex justify-center items-center gap-2 rounded-full bg-white dark:bg-slate-700 border border-border dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600 text-sm text-slate-700 dark:text-slate-300 py-2.5 transition-all duration-200"
            >
              <span className="text-xs">👤</span>
              <span className="font-medium">Continue as Guest</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              New here?{' '}
              <Link to="/signup" className="text-primary dark:text-primary-light hover:text-primary-dark dark:hover:text-primary font-medium">
                Create account
              </Link>
            </span>
            <span className="inline-flex gap-2 text-slate-400 dark:text-slate-500">
              <span>Privacy</span>
              <span>·</span>
              <span>Help</span>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
