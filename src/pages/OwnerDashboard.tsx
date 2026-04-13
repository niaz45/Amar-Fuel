import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Pump, User, FuelTypes, FuelStatus, Report, Order } from '../types';
import { STATUS_COLORS, STATUS_LABELS, FUEL_TYPES } from '../constants';
import { 
  Fuel, 
  ShieldCheck, 
  Clock, 
  LayoutDashboard, 
  MapPin, 
  Search, 
  PlusCircle, 
  User as UserIcon, 
  Calendar, 
  CreditCard, 
  Phone, 
  Droplets, 
  TrendingUp,
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ExternalLink,
  Zap,
  Building2,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function OwnerDashboard({ user }: { user: User | null }) {
  const [ownedPumps, setOwnedPumps] = useState<Pump[]>([]);
  const [allPumps, setAllPumps] = useState<Pump[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [selectedPumpId, setSelectedPumpId] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'reports' | 'orders' | 'profile' | 'claim'>('overview');
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [reportResponse, setReportResponse] = useState<Record<string, string>>({});

  const selectedPump = useMemo(() => 
    ownedPumps.find(p => p.id === selectedPumpId) || ownedPumps[0], 
    [ownedPumps, selectedPumpId]
  );

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch owned pumps
        const { data: ownedData, error: ownedError } = await supabase
          .from('pumps')
          .select('*')
          .eq('owner_id', user.id);

        if (ownedError) throw ownedError;
        setOwnedPumps(ownedData || []);
        if (ownedData && ownedData.length > 0 && !selectedPumpId) {
          setSelectedPumpId(ownedData[0].id);
        }

        // Fetch all pumps for claiming
        const { data: allData } = await supabase.from('pumps').select('*').is('owner_id', null);
        setAllPumps(allData || []);

        // Fetch user's claims
        const { data: claimsData } = await supabase
          .from('owner_claims')
          .select('*')
          .eq('user_id', user.id);
        setClaims(claimsData || []);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (!selectedPumpId) return;

    const fetchPumpData = async () => {
      try {
        const { data: reportsData, error: reportsError } = await supabase
          .from('reports')
          .select('*')
          .eq('pump_id', selectedPumpId)
          .order('created_at', { ascending: false });

        if (reportsError) throw reportsError;
        setReports(reportsData || []);

        // Orders are fetched in a separate useEffect when the tab changes
      } catch (err) {
        console.error('Error fetching pump data:', err);
      }
    };

    fetchPumpData();
  }, [selectedPumpId]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!selectedPumpId) return;
      setLoadingOrders(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('pump_id', selectedPumpId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, selectedPumpId]);

  const handleUpdateInventory = async (fuelType: keyof FuelTypes, status: FuelStatus) => {
    if (!selectedPump) return;

    try {
      const { error } = await supabase
        .from('pumps')
        .update({ 
          [fuelType]: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPump.id);

      if (error) throw error;

      // Refresh data
      const { data: updatedPump, error: fetchError } = await supabase
        .from('pumps')
        .select('*')
        .eq('id', selectedPump.id)
        .single();
      
      if (!fetchError && updatedPump) {
        setOwnedPumps(prev => prev.map(p => p.id === updatedPump.id ? updatedPump : p));
      }

      alert(`${fuelType.toUpperCase()} status updated to ${status}`);
    } catch (err) {
      console.error('Error updating inventory:', err);
    }
  };

  const handleEmergencyAlert = async () => {
    if (!selectedPump) return;
    const message = window.prompt("Enter emergency message (or leave empty to clear):");
    try {
      const { error } = await supabase
        .from('pumps')
        .update({ 
          emergency_alert: message || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPump.id);

      if (error) throw error;
      
      // Refresh data
      const { data: updatedPump, error: fetchError } = await supabase
        .from('pumps')
        .select('*')
        .eq('id', selectedPump.id)
        .single();
      
      if (!fetchError && updatedPump) {
        setOwnedPumps(prev => prev.map(p => p.id === updatedPump.id ? updatedPump : p));
      }
    } catch (err) {
      console.error('Error setting alert:', err);
    }
  };

  const handleUpdateAllFuel = async (status: FuelStatus) => {
    if (!selectedPump) return;
    
    try {
      const { error } = await supabase
        .from('pumps')
        .update({ 
          octane: status,
          petrol: status,
          diesel: status,
          cng: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPump.id);

      if (error) throw error;
      
      // Refresh data
      const { data: updatedPump, error: fetchError } = await supabase
        .from('pumps')
        .select('*')
        .eq('id', selectedPump.id)
        .single();
      
      if (!fetchError && updatedPump) {
        setOwnedPumps(prev => prev.map(p => p.id === updatedPump.id ? updatedPump : p));
      }
      alert(`All fuel types set to ${status}`);
    } catch (err) {
      console.error('Error bulk updating:', err);
    }
  };

  const handleRespondToReport = async (reportId: string) => {
    const response = reportResponse[reportId];
    if (!response) return;
    try {
      const { error } = await supabase
        .from('reports')
        .update({ owner_response: response })
        .eq('id', reportId);

      if (error) throw error;
      
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, owner_response: response } : r));
      setReportResponse(prev => ({ ...prev, [reportId]: '' }));
    } catch (err) {
      console.error('Error responding to report:', err);
    }
  };

  const handleClaimPump = async (pumpId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('owner_claims')
        .insert([{
          user_id: user.id,
          pump_id: pumpId,
          verification_status: 'pending',
          timestamp: new Date().toISOString()
        }]);

      if (error) throw error;

      // Refresh claims
      const { data: claimsData } = await supabase
        .from('owner_claims')
        .select('*')
        .eq('user_id', user.id);
      setClaims(claimsData || []);
      
      alert('Claim request submitted successfully. Admin will review your request.');
    } catch (err) {
      console.error('Error claiming pump:', err);
      alert('Error submitting claim. You may have already claimed this station.');
    }
  };

  const isClaimed = (pumpId: string) => {
    return claims.some(c => c.pump_id === pumpId) || ownedPumps.some(p => p.id === pumpId);
  };

  if (!user) return <div className="p-8 text-center">Please login to access dashboard.</div>;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary p-2 rounded-none">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-black text-gray-900">Management System</h1>
            </div>
            <p className="text-gray-500 font-medium">Welcome back, {user.name}. Monitor and manage your fuel operations.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {ownedPumps.length > 1 && (
              <select 
                value={selectedPumpId || ''} 
                onChange={(e) => setSelectedPumpId(e.target.value)}
                className="bg-white border border-gray-200 rounded-none px-4 py-2.5 font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
              >
                {ownedPumps.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            {selectedPump && (
              <Link 
                to={`/pump/${selectedPump.id}`}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-none font-bold text-sm hover:bg-gray-50 transition-all shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Public Profile
              </Link>
            )}
            <button 
              onClick={handleEmergencyAlert}
              className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 px-4 py-2.5 rounded-none font-bold text-sm hover:bg-red-100 transition-all shadow-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              Emergency Alert
            </button>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-8 bg-white p-1.5 rounded-none shadow-sm border border-gray-100 no-scrollbar">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
            { id: 'inventory', icon: Droplets, label: 'Inventory' },
            { id: 'reports', icon: MessageSquare, label: 'Reports' },
            { id: 'orders', icon: ShoppingBag, label: 'Orders' },
            { id: 'profile', icon: UserIcon, label: 'Verification' },
            { id: 'claim', icon: PlusCircle, label: 'Claim Station' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-none font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/10' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8">
          {activeTab === 'overview' && selectedPump && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-50 p-3 rounded-none text-blue-600">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-none uppercase">Trust Score</span>
                  </div>
                  <div className="text-3xl font-black text-gray-900 mb-1">{selectedPump.trust_score}%</div>
                  <div className="text-xs text-gray-400">Based on update accuracy</div>
                </div>

                <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-primary/5 p-3 rounded-none text-primary">
                      <Bell className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-primary bg-primary/5 px-2 py-1 rounded-none uppercase">Reports</span>
                  </div>
                  <div className="text-3xl font-black text-gray-900 mb-1">{reports.filter(r => !r.is_resolved).length}</div>
                  <div className="text-xs text-gray-400">Unresolved user reports</div>
                </div>

                <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-emerald-50 p-3 rounded-none text-emerald-600">
                      <Zap className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-none uppercase">Status</span>
                  </div>
                  <div className="text-3xl font-black text-gray-900 mb-1">Active</div>
                  <div className="text-xs text-gray-400">System online</div>
                </div>

                <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-purple-50 p-3 rounded-none text-purple-600">
                      <Clock className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-none uppercase">Last Sync</span>
                  </div>
                  <div className="text-lg font-black text-gray-900 mb-1">
                    {new Date(selectedPump.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs text-gray-400">Real-time update</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-8 rounded-none border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Quick Management
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button 
                    onClick={() => handleUpdateAllFuel('available')}
                    className="p-4 bg-emerald-50 border border-emerald-100 rounded-none text-emerald-700 font-bold hover:bg-emerald-100 transition-all flex flex-col items-center gap-2"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    Set All Available
                  </button>
                  <button 
                    onClick={() => handleUpdateAllFuel('low')}
                    className="p-4 bg-yellow-50 border border-yellow-100 rounded-none text-yellow-700 font-bold hover:bg-yellow-100 transition-all flex flex-col items-center gap-2"
                  >
                    <AlertTriangle className="w-6 h-6" />
                    Set All Low
                  </button>
                  <button 
                    onClick={() => handleUpdateAllFuel('out_of_stock')}
                    className="p-4 bg-red-50 border border-red-100 rounded-none text-red-700 font-bold hover:bg-red-100 transition-all flex flex-col items-center gap-2"
                  >
                    <XCircle className="w-6 h-6" />
                    Set All Out
                  </button>
                  <button 
                    onClick={() => setActiveTab('inventory')}
                    className="p-4 bg-primary/5 border border-primary/10 rounded-none text-primary font-bold hover:bg-primary/10 transition-all flex flex-col items-center gap-2"
                  >
                    <Droplets className="w-6 h-6" />
                    Manage Inventory
                  </button>
                </div>
              </div>

              {/* Emergency Alert Banner */}
              {selectedPump.emergency_alert && (
                <div className="bg-red-600 text-white p-6 rounded-none shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <AlertTriangle className="w-8 h-8 animate-pulse" />
                    <div>
                      <div className="font-black uppercase text-xs tracking-widest opacity-80">Emergency Alert Active</div>
                      <div className="text-xl font-bold">{selectedPump.emergency_alert}</div>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      const { error } = await supabase
                        .from('pumps')
                        .update({ emergency_alert: null })
                        .eq('id', selectedPump.id);
                      if (!error) {
                        setOwnedPumps(prev => prev.map(p => p.id === selectedPump.id ? { ...p, emergency_alert: null } : p));
                      }
                    }}
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-none font-bold text-sm transition-all"
                  >
                    Clear Alert
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inventory' && selectedPump && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {FUEL_TYPES.map(type => {
                  const status = selectedPump[type as keyof Pump] as FuelStatus;

                  return (
                    <div key={type} className="bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-none shadow-sm">
                            <Fuel className="w-5 h-5 text-primary" />
                          </div>
                          <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">{type}</h3>
                        </div>
                        <div className={`px-3 py-1 rounded-none text-[10px] font-black uppercase ${STATUS_COLORS[status]}`}>
                          {STATUS_LABELS[status]}
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="grid grid-cols-3 gap-3">
                          {(['available', 'low', 'out_of_stock'] as FuelStatus[]).map(s => (
                            <button
                              key={s}
                              onClick={() => handleUpdateInventory(type, s)}
                              className={`py-3 rounded-none font-black text-[10px] uppercase tracking-widest transition-all border-2 ${
                                status === s 
                                  ? 'bg-primary text-white border-primary' 
                                  : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              {s.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">User Reports & Feedback</h3>
                <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-none uppercase tracking-widest">
                  {reports.length} Total Reports
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {reports.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 italic">No reports received yet.</div>
                ) : (
                  reports.map(report => (
                    <div key={report.id} className="p-6 hover:bg-gray-50 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-none bg-gray-100 flex items-center justify-center text-gray-500">
                            <UserIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">User Report</div>
                            <div className="text-xs text-gray-400">{new Date(report.timestamp).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-none text-[10px] font-black uppercase ${STATUS_COLORS[report.status]}`}>
                          {report.fuel_type}: {report.status}
                        </div>
                      </div>
                      
                      {report.comment && (
                        <div className="bg-gray-50 p-4 rounded-none text-sm text-gray-600 mb-4 border border-gray-100 italic">
                          "{report.comment}"
                        </div>
                      )}

                      {report.owner_response ? (
                        <div className="bg-emerald-50 p-4 rounded-none text-sm text-emerald-700 border border-emerald-100">
                          <div className="font-black uppercase text-[10px] mb-1">Your Response</div>
                          {report.owner_response}
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Type your response..."
                            value={reportResponse[report.id] || ''}
                            onChange={(e) => setReportResponse(prev => ({ ...prev, [report.id]: e.target.value }))}
                            className="flex-1 bg-white border border-gray-200 rounded-none px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary font-bold"
                          />
                          <button
                            onClick={() => handleRespondToReport(report.id)}
                            disabled={!reportResponse[report.id]}
                            className="bg-primary text-white px-6 py-2 rounded-none font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all disabled:opacity-50"
                          >
                            Respond
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Pre-order Management</h3>
                <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-none uppercase tracking-widest">
                  {orders.length} Total Orders
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fuel Type</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Price</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingOrders ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center">
                          <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-gray-400 italic">No orders found for this station.</td>
                      </tr>
                    ) : (
                      orders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-all">
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{order.customer_name}</div>
                            <div className="text-xs text-gray-400">{order.customer_phone}</div>
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-black uppercase tracking-widest text-primary">{order.fuel_type}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-gray-900">{order.amount_liters} L</span>
                          </td>
                          <td className="p-4">
                            <span className="font-black text-primary">৳{order.total_price}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-none text-[10px] font-black uppercase tracking-widest ${
                              order.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 
                              order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-xs text-gray-400 font-medium">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div className="bg-white rounded-none shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-10 bg-primary text-white flex items-center gap-8">
                  <div className="w-24 h-24 bg-white/20 rounded-none flex items-center justify-center border-4 border-white/30 backdrop-blur-md">
                    <UserIcon className="w-12 h-12" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black tracking-tight">{user.name}</h2>
                    <p className="text-white/80 flex items-center gap-2 mt-2 font-bold">
                      <ShieldCheck className="w-5 h-5" />
                      Verified {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </p>
                    <p className="text-[10px] text-white/60 mt-2 font-black uppercase tracking-widest">User ID: {user.id}</p>
                  </div>
                </div>
                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <h3 className="text-xl font-black text-gray-900 border-b border-gray-100 pb-4 flex items-center gap-3">
                      <ShieldCheck className="w-6 h-6 text-primary" />
                      Verification Details
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 text-gray-600">
                        <div className="bg-gray-50 p-3 rounded-none">
                          <CreditCard className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">NID Number</p>
                          <p className="font-bold text-gray-900">{user.nid || 'Not Provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-gray-600">
                        <div className="bg-gray-50 p-3 rounded-none">
                          <Phone className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</p>
                          <p className="font-bold text-gray-900">{user.mobile}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-gray-600">
                        <div className="bg-gray-50 p-3 rounded-none">
                          <Calendar className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date of Birth</p>
                          <p className="font-bold text-gray-900">{user.dob || 'Not Provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <h3 className="text-xl font-black text-gray-900 border-b border-gray-100 pb-4 flex items-center gap-3">
                      <Building2 className="w-6 h-6 text-primary" />
                      Ownership Proof
                    </h3>
                    <div className="p-8 bg-gray-50 rounded-none border-2 border-dashed border-gray-200 text-center">
                      <ShieldCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                      <p className="text-sm text-gray-500 font-medium leading-relaxed">Ownership documents verified by admin on <br/><span className="font-black text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'claim' && (
            <div className="bg-white rounded-none shadow-xl border border-gray-100 p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Claim Your Station</h2>
                <p className="text-gray-500 mt-1">Search for your fuel station and submit a verification request.</p>
              </div>

              <div className="relative mb-8">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Search by station name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-200 rounded-none focus:ring-2 focus:ring-primary outline-none transition-all font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allPumps
                  .filter(p => 
                    !p.owner_id && 
                    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     p.upazila.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map(pump => (
                    <div key={pump.id} className="p-8 border border-gray-100 rounded-none hover:bg-gray-50 transition-all flex items-center justify-between gap-6 group">
                      <div>
                        <h3 className="text-lg font-black text-gray-900 mb-1">{pump.name}</h3>
                        <p className="text-sm text-gray-400 font-bold flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> {pump.upazila}, {pump.district}
                        </p>
                      </div>
                      <button
                        onClick={() => handleClaimPump(pump.id)}
                        disabled={isClaimed(pump.id)}
                        className="px-8 py-3 bg-primary text-white rounded-none font-black text-xs uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/10 disabled:opacity-50 transition-all"
                      >
                        {isClaimed(pump.id) ? 'Pending' : 'Claim'}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
