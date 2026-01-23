import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../apiClient';
import { useToastStore, useAuthStore } from '../store';

export default function VerifyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const emailFromState = location.state?.email || '';
  const [email, setEmail] = useState(emailFromState);
  const pushToast = useToastStore((s) => s.pushToast);
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const data = await apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        body: { email, otp },
      });
      pushToast({ type: 'success', message: 'Phone verified. You are now a verified user.' });
      if (user) {
        setAuth({ user: { ...user, isVerified: true }, token: useAuthStore.getState().token });
      }
      navigate('/map');
    } catch (err) {
      pushToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-app">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-soft p-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Verify phone</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Enter the 6-digit OTP sent to your phone. For local dev, check the server response in the console.
          </p>
        </div>
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1 text-xs">
            <label className="text-slate-700 dark:text-slate-300">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-1 text-xs">
            <label className="text-slate-700 dark:text-slate-300">OTP code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              className="w-full tracking-[0.4em] text-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            type="submit"
            className="w-full mt-2 inline-flex justify-center items-center gap-2 rounded-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-3 shadow-button hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
          >
            Verify
          </button>
        </form>
      </div>
    </div>
  );
}
