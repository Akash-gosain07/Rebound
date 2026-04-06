import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRequest } from '../apiClient';
import { useAuthStore, useToastStore } from '../store';
import WorkflowMiniAnimation from '../components/WorkflowMiniAnimation';


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
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        throw new Error('Failed to create guest session');
      }

      const data = await res.json();
      useAuthStore.getState().setAuth({ user: data.user, token: data.token });
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
    google.accounts.id.prompt();
  };

  return (
    <div className="w-full min-h-screen flex text-slate-900 bg-background dark:bg-slate-900 font-sans overflow-hidden">

      {/* LEFT COLUMN: Branding & Info */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary to-primary-dark relative overflow-hidden text-white flex-col justify-between p-16">
        {/* Abstract Pattern overlay */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-light/20 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

        {/* Brand */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-xl">R</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">Rebound</span>
          </div>

          <h2 className="text-5xl font-extrabold leading-tight mb-6">
            Lost it? Found it?<br />
            <span className="text-blue-100">Rebound brings it back.</span>
          </h2>

          <p className="text-lg text-blue-50/90 leading-relaxed max-w-lg mb-8">
            Rebound helps you recover lost items with secure verification, quick reporting, and safe meetups — without compromising your privacy.
          </p>

          <ul className="space-y-4 text-blue-50 font-medium">
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-400/30 flex items-center justify-center">✓</span>
              Secure OTP verification
            </li>
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-400/30 flex items-center justify-center">✓</span>
              Trusted community ratings
            </li>
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-400/30 flex items-center justify-center">✓</span>
              Temporary chat for meetup only
            </li>
          </ul>

          {/* Mini Workflow Animation */}
          <WorkflowMiniAnimation />
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-sm text-blue-200">
          © 2026 Rebound Inc.
        </div>
      </div>

      {/* RIGHT COLUMN: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-transparent"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card dark:shadow-xl p-10 border border-slate-100 dark:border-white/10">

            <div className="mb-8 text-center lg:text-left">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome back</h1>
              <p className="text-slate-500 dark:text-slate-400">Please enter your details to sign in.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/40 focus:border-primary dark:focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  <a href="#" className="text-xs font-medium text-primary dark:text-blue-400 hover:text-primary-dark dark:hover:text-blue-300">Forgot password?</a>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/40 focus:border-primary dark:focus:border-blue-500 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-primary hover:bg-primary-dark dark:bg-primary dark:hover:bg-primary-light text-white font-semibold py-3.5 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">Or continue with</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGoogle}
                disabled={!googleReady}
                className="w-full flex justify-center items-center gap-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-3 transition-all disabled:opacity-50"
              >
                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Google</span>
              </button>
              <button
                onClick={handleGuest}
                className="w-full flex justify-center items-center gap-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-3 transition-all"
              >
                <span className="text-xl">👤</span>
                <span>Continue as Guest</span>
              </button>
            </div>

            <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-semibold text-primary dark:text-blue-400 hover:text-primary-dark dark:hover:text-blue-300 transition-colors">
                Create free account
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

    </div >
  );
}
