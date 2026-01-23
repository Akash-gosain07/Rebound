import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../store/notificationStore';
import { useNavigate } from 'react-router-dom';

export const NotificationPopup = () => {
    const { showPopup, currentPopup, dismissPopup } = useNotificationStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (showPopup) {
            const timer = setTimeout(() => {
                dismissPopup();
            }, 10000); // Auto-dismiss after 10 seconds

            return () => clearTimeout(timer);
        }
    }, [showPopup, dismissPopup]);

    const handleClick = () => {
        if (currentPopup?.data?.matchId) {
            // Navigate to map and trigger the tracking modal
            navigate('/map', { state: { meetupId: currentPopup.data.matchId } });
        } else if (currentPopup?.type === 'MATCH_FOUND' && currentPopup?.data?.match?.matchId) {
            navigate('/map', { state: { meetupId: currentPopup.data.match.matchId } });
        }
        dismissPopup();
    };

    return (
        <AnimatePresence>
            {showPopup && currentPopup && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
                >
                    <div
                        onClick={handleClick}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 cursor-pointer hover:shadow-3xl transition-shadow border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                {currentPopup.type === 'MATCH_FOUND' && (
                                    <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">🎯</span>
                                    </div>
                                )}
                                {currentPopup.type === 'OTP_READY' && (
                                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">🔐</span>
                                    </div>
                                )}
                                {currentPopup.type === 'MEETUP_COMPLETED' && (
                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">🎉</span>
                                    </div>
                                )}
                                {currentPopup.type === 'TRACKING_STARTED' && (
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">📍</span>
                                    </div>
                                )}
                                {currentPopup.type === 'LOCATION_CHANGE_REQUEST' && (
                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">📍</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                                    {currentPopup.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                                    {currentPopup.body}
                                </p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    dismissPopup();
                                }}
                                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
