import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../apiClient';
import { useToastStore } from '../store';

export function TrackingModal({ matchId, onClose }) {
    const [status, setStatus] = useState(null);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const pushToast = useToastStore((s) => s.pushToast);

    const fetchStatus = useCallback(async () => {
        try {
            const data = await apiRequest(`/api/matches/${matchId}/tracking/status`);
            setStatus(data);
        } catch (err) {
            console.error('Failed to fetch tracking status', err);
        }
    }, [matchId]);

    // Poll status every 2 seconds
    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 2000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleVerify = async () => {
        if (!otp) return;
        setLoading(true);
        try {
            // New enhanced OTP verification
            const res = await apiRequest(`/api/matches/${matchId}/otp/verify`, 'POST', { otp });
            pushToast({ type: 'success', message: 'OTP Verified! 🎉' });
            fetchStatus();
            setOtp('');
        } catch (err) {
            pushToast({ type: 'error', message: err.message || 'Verification failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateOTP = async () => {
        setLoading(true);
        try {
            await apiRequest(`/api/matches/${matchId}/otp/generate`, 'POST');
            pushToast({ type: 'success', message: 'OTPs Generated!' });
            fetchStatus();
        } catch (err) {
            pushToast({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    if (!status) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Live Tracking & Meetup</h2>
                        <div className="text-xs text-slate-500 mt-1">Cross-Server Safe Exchange</div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-xl">✕</button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Location Info */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Distance</span>
                            <span className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                {status.distance ? `${status.distance.toFixed(2)} km` : 'Calculating...'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-900/30">
                            <span className="text-sm font-medium text-teal-700 dark:text-teal-300">ETA</span>
                            <span className="text-xl font-bold text-teal-900 dark:text-teal-100">
                                {status.eta ? `${status.eta} mins` : '--'}
                            </span>
                        </div>
                    </div>

                    {/* OTP Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>🔐</span> Security Verification
                        </h3>

                        {!status.session?.ownerOtp && !status.session?.finderOtp && !status.session?.otpVerifiedByOwner && (
                            <button
                                onClick={handleGenerateOTP}
                                disabled={loading}
                                className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-lg hover:scale-[1.02] transition-transform"
                            >
                                {loading ? 'Generating...' : 'Generate Safe Exchange Token'}
                            </button>
                        )}

                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Ask the other person for their OTP code when you meet.
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="Enter their OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 focus:border-primary font-mono text-lg tracking-widest text-center"
                                />
                                <button
                                    onClick={handleVerify}
                                    disabled={loading || !otp}
                                    className="px-6 py-3 rounded-xl bg-primary text-white font-bold shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Verify
                                </button>
                            </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex gap-2">
                            <div className={`flex-1 p-2 rounded-lg text-center text-xs font-semibold border ${status.session?.otpVerifiedByOwner ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                Owner Verified {status.session?.otpVerifiedByOwner ? '✓' : '...'}
                            </div>
                            <div className={`flex-1 p-2 rounded-lg text-center text-xs font-semibold border ${status.session?.otpVerifiedByFinder ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                Finder Verified {status.session?.otpVerifiedByFinder ? '✓' : '...'}
                            </div>
                        </div>

                        {status.session?.otpVerifiedByOwner && status.session?.otpVerifiedByFinder && (
                            <div className="p-4 bg-green-100 text-green-800 rounded-xl text-center font-bold animate-pulse">
                                Exchange Complete! Item Recovered. 🎉
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
