import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../apiClient';
import { useToastStore, useAuthStore } from '../store';
import SafeLocationSelector from '../components/SafeLocationSelector';
import SafeLocationMapPicker from '../components/SafeLocationMapPicker';

export default function MatchPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatedOtp, setGeneratedOtp] = useState(''); // Code shown to owner
  const [inputOtp, setInputOtp] = useState(''); // Code entered by finder
  const [safeLocations, setSafeLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [helpDeskOtp, setHelpDeskOtp] = useState('');
  const pushToast = useToastStore((s) => s.pushToast);
  const user = useAuthStore((s) => s.user);

  const loadMatch = async () => {
    try {
      const data = await apiRequest(`/api/matches/${matchId}`);
      // Server now returns { match, myRole } - merge them for easier access
      setMatch({ ...data.match, myRole: data.myRole });
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

  const handleFetchSafeLocations = async () => {
    try {
      const data = await apiRequest(`/api/matches/${matchId}/location/suggest`, { method: 'POST' });
      setSafeLocations(data.safeLocations);
    } catch (err) {
      pushToast({ type: 'error', message: err.message });
    }
  };

  const handleSelectLocation = async (location) => {
    try {
      setSelectedLocation(location);
      await apiRequest(`/api/matches/${matchId}/location/select`, {
        method: 'POST',
        body: { location }
      });
      await loadMatch();
      pushToast({ type: 'success', message: 'Location selected' });
    } catch (err) {
      pushToast({ type: 'error', message: 'Failed to select location' });
    }
  };

  const handleLockLocation = async () => {
    try {
      await apiRequest(`/api/matches/${matchId}/location/lock`, { method: 'POST' });
      await loadMatch();
      pushToast({ type: 'success', message: 'Location confirmed and locked' });
    } catch (err) {
      pushToast({ type: 'error', message: err.message });
    }
  };

  const handleHandoverToHelpDesk = async () => {
    // If no location selected, we force the user to see options and pick one
    if (!selectedLocation) {
      // If we haven't fetched locations yet, fetch them now
      if (safeLocations.length === 0) {
        await handleFetchSafeLocations();
      }
      pushToast({ type: 'info', message: 'Please select a Help Desk location from the list above.' });
      return;
    }

    if (!window.confirm(`Confirm handing over to Help Desk at ${selectedLocation.label}?`)) return;

    try {
      await apiRequest(`/api/matches/${matchId}/handover/help-desk`, {
        method: 'POST',
        body: { location: selectedLocation }
      });
      await loadMatch();
      pushToast({ type: 'success', message: 'Handed over to Help Desk' });
    } catch (err) {
      pushToast({ type: 'error', message: err.message });
    }
  };

  const handleGenerateHelpDeskOtp = async () => {
    try {
      const data = await apiRequest(`/api/matches/${matchId}/otp/help-desk/generate`, { method: 'POST' });
      setHelpDeskOtp(data.ownerOTP);
    } catch (err) {
      pushToast({ type: 'error', message: err.message });
    }
  };

  const handleVerifyHelpDeskClaim = async () => {
    try {
      if (!inputOtp) return pushToast({ type: 'error', message: 'Enter the code' });
      await apiRequest(`/api/matches/${matchId}/verify/help-desk-claim`, {
        method: 'POST',
        body: { otp: inputOtp }
      });
      pushToast({ type: 'success', message: 'Item recovered successfully!' });
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

  // Use server-provided role for robust identification
  const isOwner = match && match.myRole === 'OWNER';
  const isFinder = match && match.myRole === 'FINDER';

  const googleMapsUrl = match && match.status === 'HELD_AT_HELP_DESK' && match.helpDesk?.location
    ? `https://www.google.com/maps/search/?api=1&query=${match.helpDesk.location.lat},${match.helpDesk.location.lng}`
    : match && match.meetLocation
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
          <div className="flex items-start justify-between">
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
            <button
              onClick={loadMatch}
              className="p-2 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg"
              title="Refresh status"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
            </button>
          </div>
          {/* Role Badge - Visual Debug & Clarity */}
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${isOwner
            ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
            : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}>
            {isOwner ? 'You are the Owner' : 'You are the Finder'}
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

          {/* Help Desk Status Banner */}
          {match.status === 'HELD_AT_HELP_DESK' && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-6 text-center space-y-2">
              <div className="text-xl">🏛️</div>
              <div className="font-semibold text-amber-800 dark:text-amber-200">
                {match.helpDesk?.location?.label ? `Held at ${match.helpDesk.location.label}` : 'Item held at Help Desk'}
              </div>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                {isFinder ? "Thank you! You have handed over the item. The owner will retrieve it." : "The item is at the Help Desk. Please proceed there to claim it."}
              </div>
            </div>
          )}

          {/* Location Selection & Handover Flow */}
          {match.status === 'REQUESTED' && !match.meetLocation?.isLocked && !match.handoverType?.includes('HELP_DESK') && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6">
              {isFinder && (
                <>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Choose Meetup Location</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowMapPicker(true)}
                          className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1"
                        >
                          <span className="text-lg leading-none">📍</span> Select on Map
                        </button>
                        <button
                          onClick={handleFetchSafeLocations}
                          className="text-xs bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-3 py-1.5 rounded-lg font-medium hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                        >
                          Find Safe Spots
                        </button>
                      </div>
                    </div>

                    <SafeLocationSelector
                      locations={safeLocations}
                      selectedLocation={match.meetLocation?.label && match.meetLocation?.type === 'SAFE_POINT' ? match.meetLocation : selectedLocation}
                      onSelect={handleSelectLocation}
                    />

                    {showMapPicker && (
                      <SafeLocationMapPicker
                        initialCenter={match.item?.location?.coordinates ? { lat: match.item.location.coordinates[1], lng: match.item.location.coordinates[0] } : null}
                        onConfirm={(loc) => {
                          setSafeLocations(prev => {
                            const exists = prev.find(p => p.label === loc.label);
                            return exists ? prev : [loc, ...prev];
                          });
                          handleSelectLocation(loc);
                          setShowMapPicker(false);
                        }}
                        onCancel={() => setShowMapPicker(false)}
                      />
                    )}

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
                      <div className="relative flex justify-center"><span className="bg-white dark:bg-slate-900 px-2 text-xs text-slate-500">OR</span></div>
                    </div>

                    <div className="space-y-2">
                      {/* Contextual Hint */}
                      {!selectedLocation && safeLocations.length > 0 && (
                        <div className="text-xs text-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 py-2 rounded-lg animate-pulse">
                          Please select a location above to hand over
                        </div>
                      )}

                      <button
                        onClick={handleHandoverToHelpDesk}
                        className={`w-full py-3 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 ${selectedLocation
                          ? 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-slate-200'
                          : 'border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600'
                          }`}
                      >
                        <span>🏛️</span> Hand Over to Help Desk
                      </button>
                    </div>
                  </div>
                </>
              )}

              {isOwner && (
                <div className="text-center py-8 space-y-3">
                  <div className="text-slate-400 text-4xl">📍</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {match.meetLocation?.suggestedBy
                      ? `Finder suggested: ${match.meetLocation.label}`
                      : "Waiting for finder to suggest a safe location..."}
                  </div>
                  {match.meetLocation?.suggestedBy && (
                    <button
                      onClick={handleLockLocation}
                      className="mt-2 bg-teal-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-teal-600 transition-colors"
                    >
                      Confirm Location
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Verification Flow */}
          {((match.status !== 'VERIFIED' && match.status !== 'RECOVERED' && match.status !== 'HELD_AT_HELP_DESK') || match.status === 'HELD_AT_HELP_DESK') && match.meetLocation?.isLocked && (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="text-center space-y-1">
                <div className="text-sm font-medium text-slate-900 dark:text-white">Verification</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {match.status === 'HELD_AT_HELP_DESK'
                    ? (isOwner ? "Show this code to the Help Desk." : "You're all set.")
                    : (isOwner ? "Read this code to the finder." : "Ask owner for code.")}
                </div>
              </div>

              {isOwner && (
                <div className="space-y-3">
                  {/* Direct Meetup OTP */}
                  {match.status !== 'HELD_AT_HELP_DESK' && (
                    <>
                      {generatedOtp ? (
                        <div className="text-4xl font-mono font-bold text-center text-slate-900 dark:text-white tracking-[0.2em] py-4 bg-white dark:bg-slate-950 rounded-xl border-2 border-dashed border-teal-500/30">
                          {generatedOtp}
                        </div>
                      ) : (
                        <button
                          onClick={handleGenerateOtp}
                          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl"
                        >
                          Generate Meetup Code
                        </button>
                      )}
                    </>
                  )}

                  {/* Help Desk OTP */}
                  {match.status === 'HELD_AT_HELP_DESK' && (
                    <>
                      {helpDeskOtp ? (
                        <div className="space-y-4">
                          <div className="text-4xl font-mono font-bold text-center text-amber-600 dark:text-amber-400 tracking-[0.2em] py-4 bg-white dark:bg-slate-950 rounded-xl border-2 border-dashed border-amber-500/30">
                            {helpDeskOtp}
                          </div>
                          <div className="text-xs text-center text-slate-500">Provide this code to the Help Desk official.</div>

                          {/* Simulate Kiosk Input for Demo */}
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                            <div className="text-xs text-center mb-2 font-mono text-slate-400">[DEMO: Simulate Help Desk Kiosk]</div>
                            <input
                              value={inputOtp}
                              onChange={(e) => setInputOtp(e.target.value)}
                              placeholder="Enter code here"
                              className="w-full text-center p-2 rounded-lg border text-sm mb-2 dark:bg-slate-800 dark:border-slate-700"
                            />
                            <button onClick={handleVerifyHelpDeskClaim} className="w-full py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-xs">Simulate Verification</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleGenerateHelpDeskOtp}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-amber-500/20"
                        >
                          Show Help Desk Code
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {isFinder && match.status !== 'HELD_AT_HELP_DESK' && (
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
    </div >
  );
}
