import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { ToastProvider } from './components/shared/Toast';
import Spinner from './components/shared/Spinner';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TourPlannerPage from './pages/TourPlannerPage';
import BrowsePackagesPage from './pages/BrowsePackagesPage';
import MyBookingsPage from './pages/MyBookingsPage';
import DiscoverPage from './pages/DiscoverPage';
import GuideToursPage from './pages/GuideToursPage';
import GuideBookingsPage from './pages/GuideBookingsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={32} className="text-emerald-600" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  if (isLoading) return null;
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'GUIDE' ? '/guide/tours' : '/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Tourist routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/browse" element={<BrowsePackagesPage />} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
        <Route path="/discover" element={<DiscoverPage />} />

        {/* Guide routes */}
        <Route path="/guide/tours" element={<ProtectedRoute><GuideToursPage /></ProtectedRoute>} />
        <Route path="/guide/bookings" element={<ProtectedRoute><GuideBookingsPage /></ProtectedRoute>} />

        {/* Shared — viewable by anyone, editing gated by role in component */}
        <Route path="/tours/:id" element={<TourPlannerPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
