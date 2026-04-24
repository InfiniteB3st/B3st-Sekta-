import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Database } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import Gatekeeper from './components/Gatekeeper';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
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

  const [isDbOffline, setIsDbOffline] = React.useState(false);

  useEffect(() => {
    // Inject global styles to ensure Branding consistency
    const style = document.createElement('style');
    style.innerHTML = `
      .logo-b3st { color: #ffffff; }
      .logo-sekta { color: #ffb100; }
      .accent-primary { color: #ffb100; }
      .bg-primary { background-color: #ffb100 !important; }
      .border-primary { border-color: #ffb100 !important; }
      .text-primary { color: #ffb100 !important; }
      :root { 
        --primary: #ffb100;
        --primary-rgb: 255, 177, 0;
      }
      .accent-yellow { color: #ffb100; }
      .bg-yellow { background-color: #ffb100; }
      
      /* Global Scraper UI Improvements */
      .source-active { border-color: #ffb100; background: rgba(255, 177, 0, 0.1); }
      .source-inactive { border-color: rgba(255, 255, 255, 0.05); }
    `;
    document.head.appendChild(style);
    document.title = "B3st Sekta";

    // DB Probe
    const checkDb = async () => {
      try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1);
        if (error && error.code === '401') setIsDbOffline(true);
      } catch {
        setIsDbOffline(true);
      }
    };
    checkDb();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Emergency bypass shortcut: Ctrl + Shift + Z
      if (e.ctrlKey && e.shiftKey && (e.key === 'Z' || e.key === 'z')) {
        setShowDiagnostics(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isDbOffline) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in duration-700">
        <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center text-primary animate-pulse border-4 border-primary/20">
          <Database size={64} />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">System Maintenance: Connection Lost</h1>
          <p className="text-gray-500 max-w-sm font-black uppercase tracking-[0.2em] text-[10px] leading-relaxed">
            The database node has rejected the handshake. Please check your Supabase API credentials in services/supabaseClient.ts.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-primary text-black px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 active:scale-95 transition-all"
        >
          ATTEMPT RE-SYNCHRONIZATION
        </button>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <MasterGuard>
            <Gatekeeper>
              <Layout>
                <Routes>
                  {/* Public Entry */}
                  <Route path="/" element={<LandingPage />} />
                  
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
