import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { Button } from '../ui/button';
import { useToast } from '../../providers/ToasterProvider';

export function LoginForm({ initialMode = 'signin' }: { initialMode?: 'signin' | 'signup' }) {
  const navigate = useNavigate();
  const { loginWithEmail, signup } = useAuth();
  const { push } = useToast();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('john@example.com');
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (mode === 'signup') {
        if (password !== confirmPassword) {
          push({ title: 'Passwords do not match', description: 'Make sure both passwords are the same.' });
          return;
        }

        await signup(name, email, password);
        push({ title: 'Account created', description: 'You are now signed in.' });
      } else {
        await loginWithEmail(email, password);
        push({ title: 'Welcome back', description: 'You are now signed in.' });
      }

      // After any successful auth, send the user to the main map view
      navigate('/map');
    } catch (err: any) {
      const defaultMsg = mode === 'signup' ? 'Could not create account.' : 'Check your credentials.';
      push({ title: mode === 'signup' ? 'Signup failed' : 'Login failed', description: err?.response?.data?.message || defaultMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {mode === 'signup' && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600">Full name</label>
          <input
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">Campus email</label>
        <input
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">Password</label>
        <input
          type="password"
          required
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {mode === 'signup' && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600">Confirm password</label>
          <input
            type="password"
            required
            autoComplete="new-password"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      )}
      <Button type="submit" size="lg" className="w-full justify-center" disabled={loading}>
        {loading ? (mode === 'signup' ? 'Creating…' : 'Signing in…') : mode === 'signup' ? 'Create account' : 'Sign in'}
      </Button>

      <div className="pt-1 text-center text-[12px] text-slate-500">
        {mode === 'signup' ? (
          <button
            type="button"
            className="font-semibold text-teal-700 hover:underline"
            onClick={() => setMode('signin')}
            disabled={loading}
          >
            Already have an account? Sign in
          </button>
        ) : (
          <button
            type="button"
            className="font-semibold text-teal-700 hover:underline"
            onClick={() => setMode('signup')}
            disabled={loading}
          >
            New here? Create an account
          </button>
        )}
      </div>
    </form>
  );
}
