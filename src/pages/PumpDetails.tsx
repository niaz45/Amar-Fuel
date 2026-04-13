import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Pump, User, Report, FuelTypes, FuelStatus } from '../types';
import { STATUS_COLORS, STATUS_LABELS, FUEL_TYPES } from '../constants';
import { 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Users, 
  User as UserIcon, 
  AlertCircle, 
  Send, 
  History, 
  ChevronRight, 
  Fuel,
  AlertTriangle,
  TrendingUp,
  Info,
  MessageSquare,
  Droplets,
  CheckCircle2,
  BarChart3,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PumpDetails({ user }: { user: User | null }) {
  const { id } = useParams<{ id: string }>();
  const [pump, setPump] = useState<Pump | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFuel, setSelectedFuel] = useState<keyof FuelTypes>('octane');
  const [selectedStatus, setSelectedStatus] = useState<FuelStatus>('available');
  const [comment, setComment] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: pumpData, error: pumpError } = await supabase
        .from('pumps')
        .select('*')
        .eq('id', id)
        .single();

      if (pumpError) throw pumpError;
      setPump(pumpData);

      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .eq('pump_id', id)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;
      setReports(reportsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !pump) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        pump_id: id,
        user_id: user.id,
        fuel_type: selectedFuel,
        status: selectedStatus,
        comment: comment || null,
      });

      if (error) throw error;

      // Update pump status as well for immediate feedback
      const { error: updateError } = await supabase
        .from('pumps')
        .update({ [selectedFuel]: selectedStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;

      setShowReportForm(false);
      setComment('');
      fetchData();
      alert('Report submitted successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error submitting report');
    } finally {
      setSubmitting(false);
    }
  };

  const FuelStatusCard = ({ type }: { type: keyof FuelTypes }) => {
    if (!pump) return null;
    const status = pump[type as keyof Pump] as FuelStatus;
    
    return (
      <div className={`p-5 rounded-none border-2 transition-all ${STATUS_COLORS[status] || 'bg-gray-50 border-gray-100'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/80 p-2.5 rounded-none shadow-sm">
              <Fuel className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest opacity-60 block mb-0.5">{type}</span>
              <span className="font-black text-lg leading-none">{STATUS_LABELS[status]}</span>
            </div>
          </div>
          <div className="text-right">
            {pump.is_verified ? (
              <div className="bg-emerald-600 text-white px-2.5 py-1 rounded-none text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-emerald-100">
                <ShieldCheck className="w-3 h-3" />
                Highly Reliable
              </div>
            ) : (
              <div className="bg-white/80 px-2.5 py-1 rounded-none text-[10px] font-black uppercase tracking-wider text-gray-600 shadow-sm">
                Community Reported
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest pt-3 border-t border-black/5">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            Active Tracking
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(pump.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-none h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!pump) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
      {/* Emergency Alert */}
      {pump.emergency_alert && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-600 text-white p-6 rounded-none shadow-lg mb-8 flex items-center gap-4"
        >
          <AlertTriangle className="w-8 h-8 animate-pulse" />
          <div>
            <div className="font-black uppercase text-xs tracking-widest opacity-80">Emergency Notice</div>
            <div className="text-xl font-bold">{pump.emergency_alert}</div>
          </div>
        </motion.div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-none shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="bg-primary p-10 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl font-black tracking-tight">{pump.name}</h1>
                {pump.is_verified && (
                  <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-none flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" />
                    Verified
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-white/80 font-medium">
                <MapPin className="w-5 h-5" />
                <span>{pump.address}</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-none border border-white/10 min-w-[140px]">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1 text-center">Trust Score</div>
              <div className="text-4xl font-black text-center">{pump.trust_score}%</div>
            </div>
          </div>
        </div>

        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Availability Section */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                  <Droplets className="w-7 h-7 text-primary" />
                  Real-Time Fuel Status
                </h2>
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <BarChart3 className="w-5 h-5" />
                  Aggregated Data
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {FUEL_TYPES.map(type => (
                  <FuelStatusCard key={type} type={type} />
                ))}
              </div>
            </div>

            {/* Station Details */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                  <Info className="w-6 h-6 text-primary" />
                  Station Information
                </h2>
                <div className="bg-gray-50 p-8 rounded-none space-y-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Operating Hours</span>
                    <span className="font-bold text-gray-900">{pump.operating_hours || '24/7'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Storage Capacity</span>
                    <span className="font-bold text-gray-900">{pump.storage_capacity || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Last Updated</span>
                    <span className="font-bold text-gray-900 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(pump.last_updated).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  Insights & Predictions
                </h2>
                {/* AI Prediction */}
                {pump.is_verified ? (
                  <div className="bg-primary/5 p-8 rounded-none border border-primary/10">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-6 h-6 text-primary" />
                      <h3 className="font-black text-primary uppercase tracking-widest text-xs">Stock Prediction</h3>
                    </div>
                    <p className="text-sm text-primary/80 leading-relaxed font-medium">
                      Based on current usage, fuel is expected to last for approximately 
                      <span className="font-black mx-1 text-primary">3-5 days</span>. 
                      Refill scheduled soon.
                    </p>
                  </div>
                ) : (
                  <div className="bg-primary/5 p-8 rounded-none border border-primary/10">
                    <p className="text-sm text-primary/80 leading-relaxed font-medium">
                      This station is community-managed. Updates are based on recent user reports. 
                      <span className="font-black block mt-3 text-primary uppercase tracking-widest text-[10px]">Help others by reporting the status!</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-gray-50 rounded-none border border-gray-100">
            <div className="flex items-center gap-3 text-gray-400 font-bold text-sm">
              <Users className="w-5 h-5" />
              <span>Community-driven tracking</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              {user ? (
                <>
                  <Link 
                    to={`/checkout/${pump.id}?fuel=${selectedFuel}`}
                    className="w-full sm:w-auto bg-emerald-600 text-white px-10 py-4 rounded-none font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Pre-order Fuel
                  </Link>
                  <button 
                    onClick={() => setShowReportForm(!showReportForm)}
                    className="w-full sm:w-auto bg-primary text-white px-10 py-4 rounded-none font-black hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Submit Status Report
                  </button>
                </>
              ) : (
                <Link to="/login" className="text-sm font-black text-primary hover:underline uppercase tracking-widest">
                  Login to pre-order or submit a report
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Form */}
      <AnimatePresence>
        {showReportForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-white p-10 rounded-none border-2 border-primary/10 shadow-2xl shadow-primary/5">
              <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                <AlertCircle className="text-primary w-7 h-7" />
                Report Fuel Status
              </h3>
              <form onSubmit={handleSubmitReport} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Fuel Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {FUEL_TYPES.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSelectedFuel(type)}
                          className={`py-4 rounded-none border-2 font-black text-sm transition-all ${
                            selectedFuel === type 
                              ? 'border-primary bg-primary/5 text-primary' 
                              : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                          }`}
                        >
                          {type.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Current Status</label>
                    <div className="space-y-3">
                      {(['available', 'low', 'out_of_stock'] as FuelStatus[]).map(status => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setSelectedStatus(status)}
                          className={`w-full py-4 px-5 rounded-none border-2 font-black text-sm text-left flex items-center justify-between transition-all ${
                            selectedStatus === status 
                              ? 'border-primary bg-primary/5 text-primary' 
                              : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                          }`}
                        >
                          {STATUS_LABELS[status]}
                          {selectedStatus === status && <div className="w-2.5 h-2.5 rounded-none bg-primary"></div>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Optional Comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Any additional details..."
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-none focus:ring-2 focus:ring-primary outline-none h-28 resize-none font-bold"
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="px-8 py-4 rounded-none font-black text-gray-400 hover:bg-gray-100 transition-all uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="bg-primary text-white px-10 py-4 rounded-none font-black hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Confirm Report'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Community Feedback */}
      <div className="bg-white rounded-none shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-primary" />
            Recent Community Reports
          </h2>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {reports.length} Reports
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          {reports.length === 0 ? (
            <div className="p-16 text-center text-gray-400 italic font-medium">No community reports yet.</div>
          ) : (
            reports.map(report => (
              <div key={report.id} className="p-8 hover:bg-gray-50 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-none bg-gray-100 flex items-center justify-center text-gray-400">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-gray-900">Community Member</div>
                      <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                        {new Date(report.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-none text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[report.status]}`}>
                    {report.fuel_type}: {report.status.replace('_', ' ')}
                  </div>
                </div>
                {report.comment && (
                  <p className="text-sm text-gray-600 font-medium italic mt-2 pl-13">"{report.comment}"</p>
                )}
                {report.owner_response && (
                  <div className="mt-6 ml-13 bg-primary/5 p-5 rounded-none border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Owner Response</span>
                    </div>
                    <p className="text-sm text-primary/80 font-medium">{report.owner_response}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
