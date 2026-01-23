import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useAuthStore, useToastStore } from './store';
import ThemeToggle from './components/ThemeToggle';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import VerifyPage from './pages/VerifyPage.jsx';
import MapPage from './pages/MapPage.jsx';
import ItemDetailPage from './pages/ItemDetailPage.jsx';
import MatchPage from './pages/MatchPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import MatchesPage from './pages/MatchesPage.jsx';

function ProtectedRoute({ children, allowGuest = false }) {
  const token = useAuthStore((s) => s.token);
  const isGuest = useAuthStore((s) => s.isGuest);
  if (!token && !(allowGuest && isGuest)) return <Navigate to="/login" replace />;
  return children;
}

function Toasts() {
  const { toasts, dismissToast } = useToastStore();

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        dismissToast(toasts[0].id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toasts, dismissToast]);

  return (
    <div className="fixed inset-x-0 top-4 flex flex-col items-center z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded-xl shadow-soft text-sm backdrop-blur bg-slate-900/80 border ${t.type === 'error' ? 'border-red-500 text-red-100' : 'border-teal-500 text-teal-100'
            }`}
        >
          <div className="flex items-center gap-3">
            <span>{t.message}</span>
            <button
              className="text-xs text-slate-400 hover:text-slate-100"
              onClick={() => dismissToast(t.id)}
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="min-h-screen flex items-center justify-center bg-gradient-app"
            >
              <LoginPage />
            </motion.div>
          }
        />
        <Route
          path="/signup"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="min-h-screen flex items-center justify-center bg-gradient-app">
              <SignupPage />
            </motion.div>
          }
        />
        <Route
          path="/verify"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <VerifyPage />
            </motion.div>
          }
        />

        <Route
          path="/map"
          element={
            <ProtectedRoute allowGuest>
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <MapPage />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/item/:id"
          element={
            <ProtectedRoute>
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <ItemDetailPage />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/match/:matchId"
          element={
            <ProtectedRoute>
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <MatchPage />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <ProfilePage />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <MatchesPage />
              </motion.div>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  // Initialize theme from localStorage on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {useLocation().pathname !== '/map' && <ThemeToggle />}
      <AnimatedRoutes />
      <Toasts />
    </div>
  );
}
