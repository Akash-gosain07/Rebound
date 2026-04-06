import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPage } from './pages/MapPage';
import { LandingPage } from './pages/LandingPage';
import { PostItemPage } from './pages/PostItemPage';
import { BrowsePage } from './pages/BrowsePage';
import { AlertsPage } from './pages/AlertsPage';
import { ItemDetailsPage } from './pages/ItemDetailsPage';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';
import { OtpVerifyPage } from './pages/OtpVerifyPage';
import { AdminModerationPage } from './pages/AdminModerationPage';
import { BottomNav } from './components/layout/BottomNav';
import { useAuth } from './providers/AuthProvider';
import { AuthLoginPage } from './pages/AuthLoginPage';
import { AuthRegisterPage } from './pages/AuthRegisterPage';
import { MatchPage } from './pages/MatchPage';

function AppRoutes() {
  const location = useLocation();
  const { user } = useAuth();

  const isLanding = location.pathname === '/' || location.pathname.startsWith('/auth/');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <Routes location={location}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth/login" element={<AuthLoginPage />} />
              <Route path="/auth/register" element={<AuthRegisterPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/item/:id" element={<ItemDetailsPage />} />
              <Route path="/match/:matchId" element={<MatchPage />} />
              <Route path="/post" element={<PostItemPage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/chat/:itemId" element={<ChatPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/otp-verify/:matchId" element={<OtpVerifyPage />} />
              <Route
                path="/admin/moderation"
                element={user?.isAdmin ? <AdminModerationPage /> : <Navigate to="/map" />}
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </motion.main>
        </AnimatePresence>
      </div>
      <BottomNav disabled={isLanding} />
    </div>
  );
}

export default function App() {
  return <AppRoutes />;
}
