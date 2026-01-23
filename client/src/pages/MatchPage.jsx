import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../apiClient';
import { useToastStore, useAuthStore } from '../store';

export default function MatchPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatedOtp, setGeneratedOtp] = useState(''); // Code shown to owner
  const [inputOtp, setInputOtp] = useState(''); // Code entered by finder
  const pushToast = useToastStore((s) => s.pushToast);
  const user = useAuthStore((s) => s.user);

  const loadMatch = async () => {
    try {
      const data = await apiRequest(`/api/matches/${matchId}`);
      setMatch(data.match);
    } catch (err) {
      pushToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const handleGenerateOtp = async () => {
    try {
      const data = await apiRequest(`/api/matches/${matchId}/otp/generate`, { method: 'POST' });
      pushToast({ type: 'success', message: 'Verification code generated' });
      setGeneratedOtp(data.ownerOTP);
      await loadMatch();
    } catch (err) {
      pushToast({ type: 'error', message: err.message });
    }
  };

  const handleVerifyOtp = async () => {
    try {
      if (!inputOtp) {
        pushToast({ type: 'error', message: 'Please enter the code' });
        return;
      }
      await apiRequest(`/api/matches/${matchId}/otp/verify`, {
        method: 'POST',
        body: { otp: inputOtp },
      });
      pushToast({ type: 'success', message: 'Two-way verification successful!' });
      await loadMatch();
    } catch (err) {
      pushToast({ type: 'error', message: err.message });
    }
  };

  const handleRecovered = async () => {
    try {
      await apiRequest(`/api/matches/${matchId}/recovered`, { method: 'POST' });
      pushToast({ type: 'success', message: 'Marked as recovered' });
      await loadMatch();
    } catch (err) {
      pushToast({ type: 'error', message: err.message });
    }
  };

  if (loading) return <div className="p-6 text-xs text-slate-400">Loading match…</div>;
  if (!match) return <div className="p-6 text-xs text-slate-400">Match not found.</div>;

  // Robust ID comparison to handle both populated objects and ID strings
  const isOwner = user && match.owner && (match.owner._id?.toString() === user._id?.toString() || match.owner.toString() === user._id?.toString());
  const isFinder = user && match.finder && (match.finder._id?.toString() === user._id?.toString() || match.finder.toString() === user._id?.toString());

  const googleMapsUrl = match.meetLocation
    ? `https://www.google.com/maps/search/?api=1&query=${match.meetLocation.lat},${match.meetLocation.lng}`
    : '#';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-xl space-y-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/matches')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-all shadow-soft hover-lift"
        >
          <span className="text-lg">←</span>
          <span>Back to Matches</span>
        </button>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-card p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${match.status === 'VERIFIED' ? 'bg-emerald-100 dark:bg-emerald-500 text-emerald-600 dark:text-slate-950' : 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400'}`}>
              {match.status === 'VERIFIED' ? '✓' : '🤝'}
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-teal-600 dark:text-teal-300">
                {match.status === 'VERIFIED' ? 'Handover Complete' : 'Meetup & Verify'}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-200 mt-1">
                {match.status === 'VERIFIED'
                  ? 'The item has been successfully returned.'
                  : 'Meet up and use the code below to verify the handover.'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-3 space-y-1">
              <div className="text-slate-500 dark:text-slate-400">Match ID</div>
              <div className="text-lg font-semibold tracking-[0.35em] text-slate-900 dark:text-slate-100">{match.matchId}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-3 space-y-1">
              <div className="text-slate-500 dark:text-slate-400">Status</div>
              <div className="text-sm font-semibold text-teal-600 dark:text-teal-300">{match.status}</div>
            </div>
          </div>

          {match.status !== 'VERIFIED' && match.status !== 'RECOVERED' && (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="text-center space-y-1">
                <div className="text-sm font-medium text-slate-900 dark:text-white">Verification Code</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isOwner
                    ? "Read this code to the finder to confirm you are the owner."
                    : "Ask the owner for their code and enter it below."}
                </div>
              </div>

              {isOwner && (
                <div className="space-y-3">
                  {generatedOtp ? (
                    <div className="text-4xl font-mono font-bold text-center text-slate-900 dark:text-white tracking-[0.2em] py-4 bg-white dark:bg-slate-950 rounded-xl border-2 border-dashed border-teal-500/30">
                      {generatedOtp}
                    </div>
                  ) : match.ownerOTP?.generated ? (
                    <div className="text-center py-4 bg-white dark:bg-slate-950 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 text-xs italic">Code hidden for security</span>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-slate-400 text-xs italic">
                      Code not generated yet
                    </div>
                  )}

                  <button
                    onClick={handleGenerateOtp}
                    className="w-full flex justify-center items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 transition-colors shadow-lg shadow-teal-500/20"
                  >
                    {match.ownerOTP?.generated ? 'Regenerate Code' : 'Generate Verification Code'}
                  </button>
                </div>
              )}

              {isFinder && (
                <div className="space-y-3">
                  <input
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full text-2xl font-mono text-center tracking-[0.2em] rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                  />
                  <button
                    onClick={handleVerifyOtp}
                    className="w-full flex justify-center items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 transition-colors shadow-lg shadow-teal-500/20"
                  >
                    Verify Owner
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-xs pt-1">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium py-2 transition-colors"
            >
              Navigate to meetup
            </a>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs">
            {match.status === 'VERIFIED' && (
              <button
                onClick={handleRecovered}
                disabled={match.status !== 'VERIFIED' && match.status !== 'RECOVERED'}
                className={`inline-flex justify-center items-center gap-2 rounded-xl px-3 py-2 border text-[11px] ${match.status === 'RECOVERED'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-200 border-emerald-500/30'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600 border-transparent shadow-lg shadow-emerald-500/20'
                  }`}
              >
                {match.status === 'RECOVERED' ? 'Marked as Recovered' : 'Confirm Recovery Complete'}
              </button>
            )}
            <Link
              to="/matches"
              className="ml-auto text-[11px] text-teal-500 hover:text-teal-600 font-medium underline-offset-4 hover:underline"
            >
              View my matches
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
