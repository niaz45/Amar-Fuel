import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { User } from './types';
import { Fuel, MapPin, User as UserIcon, LogOut, LayoutDashboard, Search, Filter, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import PumpDetails from './pages/PumpDetails';
import CheckoutPage from './pages/CheckoutPage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setIsConfigured(false);
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
          username: session.user.user_metadata.username || session.user.email?.split('@')[0] || 'user',
          email: session.user.email || '',
          mobile: session.user.user_metadata.mobile || '',
          role: session.user.email === 'niazmorshed145@gmail.com' ? 'admin' : (session.user.user_metadata.role || 'user'),
          status: 'approved',
          createdAt: session.user.created_at,
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
          username: session.user.user_metadata.username || session.user.email?.split('@')[0] || 'user',
          email: session.user.email || '',
          mobile: session.user.user_metadata.mobile || '',
          role: session.user.email === 'niazmorshed145@gmail.com' ? 'admin' : (session.user.user_metadata.role || 'user'),
          status: 'approved',
          createdAt: session.user.created_at,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 shadow-xl border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-4">Configuration Missing</h1>
          <p className="text-gray-600 font-medium mb-8">
            Supabase environment variables are not set. Please add <code className="bg-gray-100 px-1 rounded text-primary">VITE_SUPABASE_URL</code> and <code className="bg-gray-100 px-1 rounded text-primary">VITE_SUPABASE_ANON_KEY</code> to your Vercel project settings.
          </p>
          <div className="bg-gray-50 p-4 rounded text-left text-xs font-mono text-gray-500 overflow-auto">
            VITE_SUPABASE_URL=https://your-project.supabase.co<br/>
            VITE_SUPABASE_ANON_KEY=your-anon-key
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Navigation */}
        <nav className="bg-primary text-white sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center gap-2">
                  <Fuel className="text-white w-6 h-6" />
                  <span className="text-xl font-bold tracking-tight">
                    FuelBD
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-6">
                {user ? (
                  <>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="text-white/80 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors">
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Super Admin</span>
                      </Link>
                    )}
                    {user.role === 'owner' && (
                      <Link to="/owner" className="text-white/80 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors">
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Admin</span>
                      </Link>
                    )}
                    <div className="flex items-center gap-2 text-white/80">
                      <UserIcon className="w-4 h-4" />
                      <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                      Login
                    </Link>
                    <Link to="/register" className="bg-white text-primary px-4 py-2 rounded-none text-sm font-bold hover:bg-white/90 transition-colors">
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage user={user} />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin" element={<AdminDashboard user={user} />} />
            <Route path="/owner" element={<OwnerDashboard user={user} />} />
            <Route path="/pump/:id" element={<PumpDetails user={user} />} />
            <Route path="/checkout/:pumpId" element={<CheckoutPage user={user} />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-primary text-white/80 py-10">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-medium">
              © 2026 FuelBD - Real-time Fuel Availability Tracker for Bangladesh
            </p>
            <p className="text-xs mt-2 opacity-60">
              Stay informed, save fuel, save time.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
