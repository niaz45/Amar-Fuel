import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Fuel, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('Connection error: Please check your Supabase URL in environment variables. It might have a typo.');
      } else {
        setError('Email or password is incorrect');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 pt-20">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-none shadow-xl shadow-primary/20 mb-6"
          >
            <Fuel className="text-white w-8 h-8" />
          </motion.div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Welcome Back</h1>
          <p className="text-gray-500 font-medium">Log in to manage your fuel reports and stations</p>
        </div>

        {/* Login Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-none shadow-2xl shadow-gray-200/50 border border-gray-100 p-10 relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
          
          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            {error && (
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-none text-sm font-bold flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email or Username</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                  <input
                    type="text"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary focus:bg-white outline-none font-bold transition-all"
                    placeholder="admin@fuelbd.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Password</label>
                  <button type="button" className="text-xs font-bold text-primary hover:underline">Forgot Password?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                  <input
                    type="password"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary focus:bg-white outline-none font-bold transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-5 rounded-none font-black text-lg hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group disabled:opacity-70"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-none animate-spin" />
              ) : (
                <>
                  Login to Dashboard
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-50 text-center">
            <p className="text-gray-500 font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-black hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Trust Footer */}
        <div className="mt-10 flex items-center justify-center gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500">
            <ShieldCheck className="w-4 h-4" />
            Secure Access
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-none" />
          <div className="text-xs font-black uppercase tracking-widest text-gray-500">
            FuelBD v2.0
          </div>
        </div>
      </div>
    </div>
  );
}
