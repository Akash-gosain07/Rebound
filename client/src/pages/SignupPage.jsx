import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../apiClient';
import { useAuthStore, useToastStore } from '../store';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const pushToast = useToastStore((s) => s.pushToast);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: { fullName, email, phone, password },
      });
      setAuth({ user: data.user, token: data.token });
      pushToast({ type: 'success', message: 'Account created. Verify your phone via OTP.' });
      // For demo we surface OTP in console
      if (data.devOtp) console.log('Signup OTP (dev only):', data.devOtp);
      navigate('/verify', { state: { email } });
    } catch (err) {
      pushToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-app">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-3xl shadow-card p-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Join Rebound</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Create an account to report and track lost & found items.</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-xl bg-white dark:bg-slate-700 border border-border dark:border-slate-600 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl bg-white border border-border px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder="your@email.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded-xl bg-white border border-border px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder="+91 98765 43210"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl bg-white border border-border px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex justify-center items-center gap-2 rounded-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-3 shadow-button hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 active:scale-[0.98]"
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Already have an account?{' '}
            <Link to="/login" className="text-primary dark:text-primary-light hover:text-primary-dark dark:hover:text-primary font-medium">
              Login
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
