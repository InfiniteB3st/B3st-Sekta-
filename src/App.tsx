import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import Gatekeeper from './components/Gatekeeper';
import Home from './pages/Home';
import Filter from './pages/Filter';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import SetupAccount from './pages/SetupAccount';
import AddonManager from './pages/AddonManager';
import AnimeDetails from './pages/AnimeDetails';
import Watch from './pages/Watch';
import AdminPanel from './pages/AdminPanel';
import { HelpCenter, DMCA, Terms, Privacy } from './components/FooterPages';
import { DevOverlay } from './components/DevOverlay';

/**
 * MASTER GUARD: 100% SUCCESS RATE REDIRECTS
 * Mandatory Onboarding Logic.
 */
function MasterGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
      <div className="w-20 h-20 border-4 border-[#ffb100] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // Auto-Onboarding: Redirect if profile missing username
  if (user && !profile?.username && location.pathname !== '/finish-setup' && location.pathname !== '/login') {
    return <Navigate to="/finish-setup" replace />;
  }

  // SUPERUSER REDIRECT: Auto-navigate to Dev Dashboard on entry
  if (user?.email === 'wambuamaxwell696@gmail.com' && location.pathname === '/home') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const [showDiagnostics, setShowDiagnostics] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Changed to Z as emergency bypass
      if (e.ctrlKey && e.shiftKey && (e.key === 'Z' || e.key === 'z')) {
        setShowDiagnostics(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <MasterGuard>
            <Gatekeeper>
              <Layout>
                <Routes>
                  {/* Public Core */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/auth" element={<Navigate to="/login" replace />} />
                  <Route path="/finish-setup" element={<SetupAccount />} />
                  
                  {/* Authenticated Application */}
                  <Route path="/" element={<Home />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/filter" element={<Filter />} />
                  <Route path="/anime/:id" element={<AnimeDetails />} />
                  <Route path="/watch/:id" element={<Watch />} />
                  
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/addons" element={<AddonManager />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  
                  {/* Footer Pages */}
                  <Route path="/help" element={<HelpCenter />} />
                  <Route path="/dmca" element={<DMCA />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  
                  {/* Global Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </Gatekeeper>
          </MasterGuard>
          <DiagnosticWrapper isOpen={showDiagnostics} onClose={() => setShowDiagnostics(false)} />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

function DiagnosticWrapper({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  // EMERGENCY BYPASS: Allow trigger for all users to debug handshake issues
  if (!isOpen) return null;
  return <DevOverlay isOpen={isOpen} onClose={onClose} />;
}
