import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Fuel, Mail, Lock, UserPlus, AlertCircle, User as UserIcon, Briefcase, Phone, Calendar, CreditCard, MapPin, Clock, Hash, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DIVISIONS, DISTRICTS, UPAZILAS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

export default function RegisterPage() {
  const [role, setRole] = useState<'user' | 'owner'>('user');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Common Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Owner Specific Fields
  const [dob, setDob] = useState('');
  const [nid, setNid] = useState('');
  const [stationName, setStationName] = useState('');
  const [stationTypes, setStationTypes] = useState<string[]>([]);
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');
  const [address, setAddress] = useState('');
  const [openingDate, setOpeningDate] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [storageCapacity, setStorageCapacity] = useState('');
  const [availableFuels, setAvailableFuels] = useState<string[]>([]);
  const [dispensersCount, setDispensersCount] = useState('');

  const fuelOptions = ['Octane', 'Petrol', 'Diesel', 'LPG', 'CNG'];

  const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            username,
            mobile,
            role,
            dob,
            nid,
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('User already exists. Please login');
        } else {
          throw signUpError;
        }
        return;
      }

      if (role === 'owner' && data.user) {
        const { error: pumpError } = await supabase.from('pumps').insert({
          name: stationName,
          division,
          district,
          upazila,
          octane: availableFuels.includes('Octane') ? 'available' : 'out_of_stock',
          petrol: availableFuels.includes('Petrol') ? 'available' : 'out_of_stock',
          diesel: availableFuels.includes('Diesel') ? 'available' : 'out_of_stock',
          cng: availableFuels.includes('CNG') ? 'available' : 'out_of_stock',
          owner_id: data.user.id,
          is_verified: false,
          updated_at: new Date().toISOString(),
        });

        if (pumpError) throw pumpError;
      }

      navigate('/login');
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('Connection error: Please check your Supabase URL in environment variables. It might have a typo.');
      } else {
        setError(err.message || 'Failed to register. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-[#f8fafc]">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-none shadow-xl shadow-primary/20 mb-6"
          >
            <UserPlus className="text-white w-8 h-8" />
          </motion.div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Create Account</h1>
          <p className="text-gray-500 font-medium">Join the largest fuel tracking network in Bangladesh</p>
        </div>

        {/* Main Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-none shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="h-2 bg-gray-50 flex">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: role === 'user' ? `${(step / 2) * 100}%` : `${(step / 4) * 100}%` }}
            />
          </div>

          <div className="p-8 md:p-12">
            {error && (
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="mb-8 bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-none text-sm font-bold flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleRegister} className="space-y-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-8"
                  >
                    <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">I am a...</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setRole('user')}
                          className={`p-6 rounded-none border-2 transition-all text-left group ${
                            role === 'user' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-none flex items-center justify-center mb-4 transition-colors ${
                            role === 'user' ? 'bg-primary text-white' : 'bg-white text-gray-400'
                          }`}>
                            <UserIcon className="w-6 h-6" />
                          </div>
                          <h3 className={`font-black text-lg ${role === 'user' ? 'text-primary' : 'text-gray-900'}`}>General User</h3>
                          <p className="text-sm text-gray-500 font-medium">I want to find fuel stations and reports</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('owner')}
                          className={`p-6 rounded-none border-2 transition-all text-left group ${
                            role === 'owner' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-none flex items-center justify-center mb-4 transition-colors ${
                            role === 'owner' ? 'bg-primary text-white' : 'bg-white text-gray-400'
                          }`}>
                            <Briefcase className="w-6 h-6" />
                          </div>
                          <h3 className={`font-black text-lg ${role === 'owner' ? 'text-primary' : 'text-gray-900'}`}>Station Owner</h3>
                          <p className="text-sm text-gray-500 font-medium">I want to manage my fuel station inventory</p>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative group">
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                          <input
                            type="text"
                            required
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary focus:bg-white outline-none font-bold transition-all"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                          <input
                            type="tel"
                            required
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary focus:bg-white outline-none font-bold transition-all"
                            placeholder="01700000000"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={nextStep}
                      className="w-full bg-primary text-white py-5 rounded-none font-black text-lg hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group"
                    >
                      Next Step
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                )}

                {step === 2 && role === 'owner' && (
                  <motion.div
                    key="step2-owner"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Date of Birth</label>
                        <div className="relative group">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                          <input
                            type="date"
                            required
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary focus:bg-white outline-none font-bold transition-all"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">NID Number</label>
                        <div className="relative group">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                          <input
                            type="text"
                            required
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary focus:bg-white outline-none font-bold transition-all"
                            placeholder="1234567890"
                            value={nid}
                            onChange={(e) => setNid(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Station Name</label>
                      <div className="relative group">
                        <Fuel className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                        <input
                          type="text"
                          required
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary focus:bg-white outline-none font-bold transition-all"
                          placeholder="e.g. Trust Filling Station"
                          value={stationName}
                          onChange={(e) => setStationName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 bg-gray-100 text-gray-600 py-5 rounded-none font-black text-lg hover:bg-gray-200 transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        className="flex-[2] bg-primary text-white py-5 rounded-none font-black text-lg hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group"
                      >
                        Next Step
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && role === 'owner' && (
                  <motion.div
                    key="step3-owner"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Division</label>
                        <select
                          required
                          className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary outline-none font-bold"
                          value={division}
                          onChange={(e) => {
                            setDivision(e.target.value);
                            setDistrict('');
                            setUpazila('');
                          }}
                        >
                          <option value="">Select</option>
                          {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">District</label>
                        <select
                          required
                          disabled={!division}
                          className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary outline-none font-bold disabled:opacity-50"
                          value={district}
                          onChange={(e) => {
                            setDistrict(e.target.value);
                            setUpazila('');
                          }}
                        >
                          <option value="">Select</option>
                          {division && DISTRICTS[division]?.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Upazila</label>
                        <select
                          required
                          disabled={!district}
                          className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary outline-none font-bold disabled:opacity-50"
                          value={upazila}
                          onChange={(e) => setUpazila(e.target.value)}
                        >
                          <option value="">Select</option>
                          {district && UPAZILAS[district]?.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Address</label>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                        <textarea
                          required
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary focus:bg-white outline-none font-bold transition-all resize-none"
                          placeholder="House/Plot, Road, Area..."
                          rows={3}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 bg-gray-100 text-gray-600 py-5 rounded-none font-black text-lg hover:bg-gray-200 transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        className="flex-[2] bg-primary text-white py-5 rounded-none font-black text-lg hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group"
                      >
                        Next Step
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {((step === 2 && role === 'user') || (step === 4 && role === 'owner')) && (
                  <motion.div
                    key="step-final"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-8"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                        <input
                          type="email"
                          required
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary focus:bg-white outline-none font-bold transition-all"
                          placeholder="john@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
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
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                          <input
                            type="password"
                            required
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary focus:bg-white outline-none font-bold transition-all"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 bg-gray-100 text-gray-600 py-5 rounded-none font-black text-lg hover:bg-gray-200 transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] bg-primary text-white py-5 rounded-none font-black text-lg hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group disabled:opacity-70"
                      >
                        {loading ? (
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-none animate-spin" />
                        ) : (
                          <>
                            Complete Registration
                            <CheckCircle2 className="w-6 h-6" />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <div className="mt-12 pt-8 border-t border-gray-50 text-center">
              <p className="text-gray-500 font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-black hover:underline">
                  Log In
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
