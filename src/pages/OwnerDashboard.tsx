import { useState, useEffect, useMemo } from 'react';
import { mockService } from '../mockService';
import { supabase } from '../lib/supabase';
import { Pump, User, FuelTypes, FuelStatus, OwnerClaim, Report, ActivityLog, Order } from '../types';
import { STATUS_COLORS, STATUS_LABELS, FUEL_TYPES, DEFAULT_INVENTORY } from '../constants';
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
  Mail, 
  Droplets, 
  Hash,
  TrendingUp,
  History,
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Activity,
  Building2,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function OwnerDashboard({ user }: { user: User | null }) {
  const [ownedPumps, setOwnedPumps] = useState<Pump[]>([]);
  const [selectedPumpId, setSelectedPumpId] = useState<string | null>(null);
  const [allPumps, setAllPumps] = useState<Pump[]>(mockService.getPumps());
  const [claims, setClaims] = useState<OwnerClaim[]>(mockService.getClaims());
  const [reports, setReports] = useState<Report[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'analytics' | 'reports' | 'orders' | 'activity' | 'profile' | 'claim'>('overview');
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Inventory Update State
  const [litersInput, setLitersInput] = useState<Record<string, string>>({});
  const [reportResponse, setReportResponse] = useState<Record<string, string>>({});

  const selectedPump = useMemo(() => 
    ownedPumps.find(p => p.id === selectedPumpId) || ownedPumps[0], 
    [ownedPumps, selectedPumpId]
  );

  useEffect(() => {
    if (!user) return;

    const updateData = () => {
      const all = mockService.getPumps();
      setAllPumps(all);
      const myPumps = all.filter(p => p.verified_owner_id === user.id);
      setOwnedPumps(myPumps);
      setClaims(mockService.getClaims().filter(c => c.user_id === user.id));
      
      if (myPumps.length > 0) {
        const currentPumpId = selectedPumpId || myPumps[0].id;
        setReports(mockService.getAllReports(currentPumpId));
        setLogs(mockService.getActivityLogs(currentPumpId));
      }
    };

    updateData();
    const unsubscribe = mockService.subscribe(updateData);
    return () => unsubscribe();
  }, [user, selectedPumpId]);

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

  const handleUpdateInventory = async (fuelType: keyof FuelTypes, liters: number, isRefill: boolean) => {
    if (!selectedPump) return;

    const currentInv = selectedPump.inventory?.[fuelType] || DEFAULT_INVENTORY[fuelType];
    let newLiters = isRefill ? currentInv.current_liters + liters : liters;
    
    // Auto status logic
    let newStatus: FuelStatus = 'available';
    const percentage = (newLiters / currentInv.capacity) * 100;
    if (percentage <= 0) newStatus = 'out_of_stock';
    else if (percentage < 20) newStatus = 'low';

    const updatedInventory = {
      ...selectedPump.inventory,
      [fuelType]: {
        ...currentInv,
        current_liters: newLiters,
        last_refill_date: isRefill ? new Date().toISOString() : currentInv.last_refill_date,
        last_refill_amount: isRefill ? liters : currentInv.last_refill_amount
      }
    };

    const updatedFuelTypes = {
      ...selectedPump.fuel_types,
      [fuelType]: newStatus
    };

    try {
      await mockService.updatePump(selectedPump.id, {
        inventory: updatedInventory,
        fuel_types: updatedFuelTypes,
        last_updated: new Date().toISOString()
      });

      await mockService.logActivity({
        user_id: user!.id,
        pump_id: selectedPump.id,
        action: isRefill ? 'Refill' : 'Stock Update',
        details: `${isRefill ? 'Added' : 'Set'} ${liters}L of ${fuelType}. New status: ${newStatus}`,
        timestamp: new Date().toISOString()
      });

      setLitersInput(prev => ({ ...prev, [fuelType]: '' }));
    } catch (err) {
      console.error('Error updating inventory:', err);
    }
  };

  const handleEmergencyAlert = async () => {
    if (!selectedPump) return;
    const message = window.prompt("Enter emergency message (or leave empty to clear):");
    try {
      await mockService.setEmergencyAlert(selectedPump.id, message || undefined);
      await mockService.logActivity({
        user_id: user!.id,
        pump_id: selectedPump.id,
        action: 'Emergency Alert',
        details: message ? `Alert set: ${message}` : 'Alert cleared',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error setting alert:', err);
    }
  };

  const handleUpdateAllFuel = async (status: FuelStatus) => {
    if (!selectedPump) return;
    const newFuelTypes = { ...selectedPump.fuel_types };
    FUEL_TYPES.forEach(type => {
      newFuelTypes[type] = status;
    });

    try {
      await mockService.updatePump(selectedPump.id, {
        fuel_types: newFuelTypes,
        last_updated: new Date().toISOString()
      });
      await mockService.logActivity({
        user_id: user!.id,
        pump_id: selectedPump.id,
        action: 'Bulk Update',
        details: `All fuel types set to ${status}`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error bulk updating:', err);
    }
  };

  const handleRespondToReport = async (reportId: string) => {
    const response = reportResponse[reportId];
    if (!response) return;
    try {
      await mockService.respondToReport(reportId, response);
      setReportResponse(prev => ({ ...prev, [reportId]: '' }));
    } catch (err) {
      console.error('Error responding to report:', err);
    }
  };

  const handleClaimPump = async (pumpId: string) => {
    if (!user) return;
    try {
      await mockService.addClaim(user.id, pumpId);
      alert('Claim submitted! Admin will review it.');
    } catch (err) {
      console.error('Error claiming pump:', err);
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
            { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
            { id: 'reports', icon: MessageSquare, label: 'Reports' },
            { id: 'orders', icon: ShoppingBag, label: 'Orders' },
            { id: 'activity', icon: Activity, label: 'Activity' },
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
                    onClick={() => mockService.setEmergencyAlert(selectedPump.id, undefined)}
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
                  const inv = selectedPump.inventory?.[type] || DEFAULT_INVENTORY[type];
                  const percentage = (inv.current_liters / inv.capacity) * 100;
                  const status = selectedPump.fuel_types?.[type] || 'available';

                  return (
                    <div key={type} className="bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
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
                        <div className="mb-6">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500 font-medium">Current Stock</span>
                            <span className="font-bold text-gray-900">{inv.current_liters.toLocaleString()} / {inv.capacity.toLocaleString()} L</span>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-none overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className={`h-full rounded-none ${
                                percentage < 20 ? 'bg-red-500' : percentage < 50 ? 'bg-yellow-500' : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="p-3 bg-gray-50 rounded-none">
                            <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Daily Usage</div>
                            <div className="font-bold text-gray-900 flex items-center gap-1">
                              {inv.daily_usage_avg}L
                              <ArrowDownRight className="w-3 h-3 text-red-500" />
                            </div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-none">
                            <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Last Refill</div>
                            <div className="font-bold text-gray-900">
                              {inv.last_refill_amount ? `${inv.last_refill_amount}L` : 'N/A'}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Liters..."
                              value={litersInput[type] || ''}
                              onChange={(e) => setLitersInput(prev => ({ ...prev, [type]: e.target.value }))}
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary font-bold"
                            />
                            <button
                              onClick={() => handleUpdateInventory(type, parseInt(litersInput[type]), true)}
                              disabled={!litersInput[type]}
                              className="bg-primary text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all disabled:opacity-50"
                            >
                              Refill
                            </button>
                            <button
                              onClick={() => handleUpdateInventory(type, parseInt(litersInput[type]), false)}
                              disabled={!litersInput[type]}
                              className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
                            >
                              Set
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && selectedPump && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-none border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Fuel Depletion Prediction</h3>
                    <p className="text-sm text-gray-500">AI-powered estimates based on current usage trends</p>
                  </div>
                  <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-none text-xs font-black uppercase flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    AI Prediction Enabled
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {FUEL_TYPES.map(type => {
                    const inv = selectedPump.inventory?.[type] || DEFAULT_INVENTORY[type];
                    const daysLeft = Math.floor(inv.current_liters / inv.daily_usage_avg);
                    
                    return (
                      <div key={type} className="p-6 rounded-none border border-gray-100 bg-gray-50/50">
                        <div className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">{type}</div>
                        <div className="text-4xl font-black text-gray-900 mb-2">
                          {daysLeft > 0 ? daysLeft : '0'} 
                          <span className="text-sm font-bold text-gray-400 ml-1">Days</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-none ${daysLeft < 2 ? 'bg-red-500' : daysLeft < 5 ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                          <span className="text-xs font-bold text-gray-500">
                            {daysLeft < 2 ? 'Critical Refill' : daysLeft < 5 ? 'Refill Soon' : 'Stock Healthy'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white p-8 rounded-none border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-8">Usage Trends (Last 7 Days)</h3>
                <div className="h-64 flex items-end gap-4 px-4">
                  {[65, 45, 75, 55, 85, 40, 90].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${val}%` }}
                        className="w-full bg-primary/20 rounded-t-none relative group"
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {val * 10}L
                        </div>
                      </motion.div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Day {i+1}</span>
                    </div>
                  ))}
                </div>
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

          {activeTab === 'activity' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Activity Timeline</h3>
              </div>
              <div className="p-6 space-y-8">
                {logs.length === 0 ? (
                  <div className="text-center text-gray-400 italic py-8">No recent activity logged.</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={log.id} className="relative flex gap-4">
                      {i !== logs.length - 1 && (
                        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-100" />
                      )}
                      <div className={`w-10 h-10 rounded-none flex items-center justify-center flex-shrink-0 z-10 ${
                        log.action.includes('Refill') ? 'bg-emerald-100 text-emerald-600' : 
                        log.action.includes('Alert') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <History className="w-5 h-5" />
                      </div>
                      <div className="pb-8">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{log.action}</span>
                          <span className="text-xs text-gray-400">• {new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-gray-500">{log.details}</p>
                      </div>
                    </div>
                  ))
                )}
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
                    !p.verified_owner_id && 
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
