import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mockService } from '../mockService';
import { Pump, User, FuelTypes } from '../types';
import { 
  Fuel, 
  ArrowLeft, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  User as UserIcon,
  Droplets,
  MapPin,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CheckoutPage({ user }: { user: User | null }) {
  const { pumpId } = useParams<{ pumpId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [pump, setPump] = useState<Pump | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const queryParams = new URLSearchParams(location.search);
  const initialFuel = (queryParams.get('fuel') as keyof FuelTypes) || 'octane';
  
  const [fuelType, setFuelType] = useState<keyof FuelTypes>(initialFuel);
  const [amount, setAmount] = useState<number>(10);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.mobile || '');

  const fuelPrices: Record<keyof FuelTypes, number> = {
    octane: 135,
    petrol: 130,
    diesel: 115,
    cng: 60,
    lpg: 120
  };

  useEffect(() => {
    if (!pumpId) return;
    const p = mockService.getPump(pumpId);
    if (p) {
      setPump(p);
    } else {
      navigate('/');
    }
    setLoading(false);
  }, [pumpId, navigate]);

  const totalPrice = amount * (fuelPrices[fuelType] || 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pump) return;

    setSubmitting(true);
    setError(null);

    try {
      const { data, error: sbError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user.id,
            pump_id: pump.id,
            fuel_type: fuelType,
            amount_liters: amount,
            total_price: totalPrice,
            status: 'pending',
            customer_name: name,
            customer_phone: phone,
          }
        ]);

      if (sbError) throw sbError;

      setSuccess(true);
      // Log activity in mock service too for consistency in UI
      await mockService.logActivity({
        user_id: user.id,
        pump_id: pump.id,
        action: 'order_placed',
        details: `Placed order for ${amount}L of ${fuelType}`,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process order. Please ensure the "orders" table exists in your Supabase project.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-none h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!pump) return null;

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-none border-2 border-emerald-500 shadow-2xl"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tight">Order Confirmed!</h1>
          <p className="text-gray-600 mb-10 font-medium text-lg">
            Your pre-order for <span className="text-primary font-black">{amount}L of {fuelType}</span> at <span className="text-primary font-black">{pump.name}</span> has been placed.
          </p>
          <div className="bg-gray-50 p-6 rounded-none border border-gray-100 mb-10 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Order ID</span>
              <span className="font-mono font-bold text-sm">#ORD-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Paid</span>
              <span className="font-black text-primary">৳{totalPrice}</span>
            </div>
          </div>
          <button 
            onClick={() => navigate(`/pump/${pump.id}`)}
            className="w-full bg-primary text-white py-5 rounded-none font-black text-lg hover:bg-primary-hover transition-all shadow-xl shadow-primary/20"
          >
            Return to Station Details
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 pt-24">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-primary font-black uppercase tracking-widest text-xs mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Station
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-10 rounded-none border border-gray-100 shadow-sm">
            <h1 className="text-3xl font-black text-gray-900 mb-10 flex items-center gap-4">
              <CreditCard className="w-10 h-10 text-primary" />
              Pre-order Fuel
            </h1>

            <form onSubmit={handleCheckout} className="space-y-10">
              {/* Fuel Selection */}
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Select Fuel Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {(Object.keys(fuelPrices) as Array<keyof FuelTypes>).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFuelType(type)}
                      className={`py-4 rounded-none border-2 font-black text-xs transition-all flex flex-col items-center gap-2 ${
                        fuelType === type 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      <Droplets className="w-5 h-5" />
                      {type.toUpperCase()}
                      <span className="text-[10px] opacity-60">৳{fuelPrices[type]}/L</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Amount (Liters)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value))}
                    className="flex-grow h-2 bg-gray-100 rounded-none appearance-none cursor-pointer accent-primary"
                  />
                  <div className="min-w-[100px] text-center bg-primary/5 p-3 border-2 border-primary/10 font-black text-primary">
                    {amount} L
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 20, 50].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(v)}
                      className="py-2 bg-gray-50 text-gray-500 font-bold text-xs hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      {v}L
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <UserIcon className="w-3 h-3" /> Full Name
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-none focus:ring-2 focus:ring-primary outline-none font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Phone className="w-3 h-3" /> Mobile Number
                  </label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-none focus:ring-2 focus:ring-primary outline-none font-bold"
                  />
                </div>
              </div>

              {error && (
                <div className="p-5 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-white py-6 rounded-none font-black text-xl hover:bg-primary-hover transition-all shadow-2xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm & Pay ৳{totalPrice}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-8">
          <div className="bg-primary text-white p-10 rounded-none shadow-xl">
            <h2 className="text-xl font-black uppercase tracking-widest mb-8 border-b border-white/10 pb-4">Order Summary</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-white/60 mt-1" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Station</div>
                  <div className="font-bold text-lg">{pump.name}</div>
                  <div className="text-xs opacity-80">{pump.address}</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Droplets className="w-5 h-5 text-white/60 mt-1" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Fuel & Quantity</div>
                  <div className="font-bold text-lg">{fuelType.toUpperCase()} - {amount}L</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Calendar className="w-5 h-5 text-white/60 mt-1" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Pickup Window</div>
                  <div className="font-bold text-lg">Within 24 Hours</div>
                </div>
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-white/10">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black uppercase tracking-widest opacity-60">Total Amount</span>
                <span className="text-4xl font-black">৳{totalPrice}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-none border border-gray-100 shadow-sm">
            <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              Important Note
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Pre-orders are valid for 24 hours. Please show your order confirmation at the station to collect your fuel. Availability is subject to real-time stock changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
