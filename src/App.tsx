
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import OnboardingPage from './pages/OnboardingPage';
import AuthCallback from './pages/AuthCallback';
import LoadingSpinner from './components/LoadingSpinner';

function AppRoutes() {
  const { user, userProfile, loading, isNewUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Protected routes */}
        <Route path="/onboarding" element={
          user ? (
            isNewUser() ? <OnboardingPage /> : <Navigate to="/dashboard" />
          ) : <Navigate to="/login" />
        } />
        <Route path="/dashboard" element={
          user ? (
            userProfile ? <DashboardPage /> : <Navigate to="/onboarding" />
          ) : <Navigate to="/login" />
        } />
        <Route path="/settings" element={
          user ? (
            userProfile ? <SettingsPage /> : <Navigate to="/onboarding" />
          ) : <Navigate to="/login" />
        } />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <AppRoutes />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#fff',
              color: '#374151',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </AuthProvider>
  );
}

export default App;