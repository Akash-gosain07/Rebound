import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { useToast } from '../providers/ToasterProvider';

export function OtpVerifyPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const { push } = useToast();
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchId) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/matches/${matchId}/verify-otp`, { otp });
      setConfirmed(true);
      setCertificateUrl(res.data.certificateUrl);
      push({ title: 'Match confirmed', description: 'Great – this item is now marked as recovered.' });
    } catch (err: any) {
      push({ title: 'Incorrect or expired code', description: err?.response?.data?.message || 'Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (!matchId) return;
    const url = certificateUrl || `/api/matches/${matchId}/certificate`;
    window.open(url, '_blank');
  };

  if (confirmed) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-5xl items-center justify-center px-4 py-6">
        <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-teal-500 via-teal-400 to-emerald-400 p-[1px] shadow-soft">
          <div className="rounded-3xl bg-white/95 px-5 py-6 text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-3xl bg-emerald-100 flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Match confirmed</h1>
            <p className="mt-1 text-xs text-slate-600">
              Awesome. Both sides have verified the handoff. This item is now marked as recovered and
              your trust score has been updated.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button size="lg" className="w-full justify-center" type="button" onClick={handleDownload}>
                Download recovery certificate
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full justify-center"
                type="button"
                onClick={() => navigate('/map')}
              >
                Back to map
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-5xl items-center justify-center px-4 py-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-soft ring-1 ring-slate-200">
        <h1 className="text-base font-semibold text-slate-900">Enter recovery code</h1>
        <p className="mt-1 text-xs text-slate-500">
          Enter the 6-digit OTP shared by the finder after they verified your proof. This confirms
          the handoff on Rebound.
        </p>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">6-digit code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-center text-lg tracking-[0.4em] focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
              placeholder="••••••"
            />
          </div>
          <Button type="submit" size="lg" className="w-full justify-center" disabled={submitting || otp.length !== 6}>
            {submitting ? 'Verifying…' : 'Verify code'}
          </Button>
        </form>
      </div>
    </div>
  );
}
