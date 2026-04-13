import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Pump, Notice, PopupBanner, LocationData, SystemStats } from '../types';
import { 
  Users, 
  Fuel, 
  ShieldCheck, 
  AlertCircle, 
  Star, 
  Bell, 
  Image as ImageIcon, 
  MapPin, 
  Plus, 
  Trash2, 
  Save, 
  LayoutDashboard,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard({ user }: { user: User | null }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'featured' | 'notices' | 'popup' | 'locations'>('overview');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [popup, setPopup] = useState<PopupBanner | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  
  // Form states
  const [newNotice, setNewNotice] = useState({ title: '', description: '' });
  const [newDivisionName, setNewDivisionName] = useState('');
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newUpazilaName, setNewUpazilaName] = useState('');
  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [selectedDistrictName, setSelectedDistrictName] = useState('');
  const [popupForm, setPopupForm] = useState<PopupBanner>({ image_url: '', link: '', is_active: false });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch stats
      const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: pumpCount } = await supabase.from('pumps').select('*', { count: 'exact', head: true });
      const { count: reportCount } = await supabase.from('reports').select('*', { count: 'exact', head: true });
      
      setStats({
        totalUsers: userCount || 0,
        totalPumps: pumpCount || 0,
        totalOwners: 0, // Simplified for now
        totalReports: reportCount || 0
      });

      // Fetch pumps
      const { data: pumpsData } = await supabase.from('pumps').select('*');
      setPumps(pumpsData || []);

      // Fetch users
      const { data: usersData } = await supabase.from('users').select('*');
      setUsers(usersData || []);

      // Fetch notices
      const { data: noticesData } = await supabase.from('notices').select('*');
      setNotices(noticesData || []);

      // Fetch popup
      const { data: popupData } = await supabase.from('popup_banner').select('*').single();
      if (popupData) {
        setPopup(popupData);
        setPopupForm(popupData);
      }

      // Fetch locations
      const { data: locationsData } = await supabase.from('locations').select('*');
      setLocations(locationsData || []);

    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-500">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const handleApprovePump = async (pumpId: string) => {
    try {
      const { error } = await supabase
        .from('pumps')
        .update({ is_verified: true })
        .eq('id', pumpId);
      if (error) throw error;
      loadData();
    } catch (err) {
      alert('Error approving pump');
    }
  };

  const handleDeletePump = async (pumpId: string) => {
    if (!window.confirm('Are you sure you want to delete this pump?')) return;
    try {
      const { error } = await supabase.from('pumps').delete().eq('id', pumpId);
      if (error) throw error;
      loadData();
    } catch (err) {
      alert('Error deleting pump');
    }
  };

  const handleToggleFeatured = async (pumpId: string) => {
    const pump = pumps.find(p => p.id === pumpId);
    if (!pump) return;
    try {
      const { error } = await supabase
        .from('pumps')
        .update({ is_featured: !pump.is_featured })
        .eq('id', pumpId);
      if (error) throw error;
      loadData();
    } catch (err) {
      alert('Error toggling featured status');
    }
  };

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('notices').insert([newNotice]);
      if (error) throw error;
      setNewNotice({ title: '', description: '' });
      loadData();
    } catch (err) {
      alert('Error adding notice');
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      const { error } = await supabase.from('notices').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err) {
      alert('Error deleting notice');
    }
  };

  const handleUpdatePopup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('popup_banner').upsert([popupForm]);
      if (error) throw error;
      alert('Popup banner updated!');
      loadData();
    } catch (err) {
      alert('Error updating popup');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to Supabase Storage
      // For now, we'll just alert or use a placeholder
      alert('Image upload to Supabase Storage will be integrated soon. Please use a URL for now.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-none font-bold transition-all ${activeTab === 'overview' ? 'bg-primary text-white shadow-lg shadow-primary/10' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('approvals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-none font-bold transition-all ${activeTab === 'approvals' ? 'bg-primary text-white shadow-lg shadow-primary/10' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <ShieldCheck className="w-5 h-5" />
            Approvals
            {(users.filter(u => u.status === 'pending').length + pumps.filter(p => p.status === 'pending').length + claims.filter(c => c.verification_status === 'pending').length) > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                {users.filter(u => u.status === 'pending').length + pumps.filter(p => p.status === 'pending').length + claims.filter(c => c.verification_status === 'pending').length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('featured')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-none font-bold transition-all ${activeTab === 'featured' ? 'bg-primary text-white shadow-lg shadow-primary/10' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Star className="w-5 h-5" />
            Featured Pumps
          </button>
          <button 
            onClick={() => setActiveTab('notices')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-none font-bold transition-all ${activeTab === 'notices' ? 'bg-primary text-white shadow-lg shadow-primary/10' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Bell className="w-5 h-5" />
            Notices
          </button>
          <button 
            onClick={() => setActiveTab('popup')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-none font-bold transition-all ${activeTab === 'popup' ? 'bg-primary text-white shadow-lg shadow-primary/10' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <ImageIcon className="w-5 h-5" />
            Popup Banner
          </button>
          <button 
            onClick={() => setActiveTab('locations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-none font-bold transition-all ${activeTab === 'locations' ? 'bg-primary text-white shadow-lg shadow-primary/10' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <MapPin className="w-5 h-5" />
            Locations
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <h2 className="text-2xl font-black text-gray-900">System Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="bg-blue-50 w-12 h-12 rounded-none flex items-center justify-center mb-4">
                      <Users className="text-blue-600 w-6 h-6" />
                    </div>
                    <div className="text-3xl font-black text-gray-900">{stats?.totalUsers}</div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Users</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="bg-primary/5 w-12 h-12 rounded-none flex items-center justify-center mb-4">
                      <Fuel className="text-primary w-6 h-6" />
                    </div>
                    <div className="text-3xl font-black text-gray-900">{stats?.totalPumps}</div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Pumps</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="bg-emerald-50 w-12 h-12 rounded-none flex items-center justify-center mb-4">
                      <ShieldCheck className="text-emerald-600 w-6 h-6" />
                    </div>
                    <div className="text-3xl font-black text-gray-900">{stats?.totalOwners}</div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Pump Owners</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="bg-purple-50 w-12 h-12 rounded-none flex items-center justify-center mb-4">
                      <AlertCircle className="text-purple-600 w-6 h-6" />
                    </div>
                    <div className="text-3xl font-black text-gray-900">{stats?.totalReports}</div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Active Reports</div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'approvals' && (
              <motion.div 
                key="approvals"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <h2 className="text-2xl font-black text-gray-900">Pending Approvals</h2>
                
                {/* User Approvals */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Pending User Registrations
                  </h3>
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Name</th>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Role</th>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Contact</th>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.filter(u => u.status === 'pending').length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-medium">No pending user registrations</td>
                          </tr>
                        ) : (
                          users.filter(u => u.status === 'pending').map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-all">
                              <td className="px-6 py-4">
                                <div className="font-bold text-gray-900">{u.name}</div>
                                <div className="text-xs text-gray-400">ID: {u.id}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-wider ${u.role === 'owner' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                <div>{u.email}</div>
                                <div>{u.mobile}</div>
                              </td>
                              <td className="px-6 py-4 text-right space-x-2">
                                <button 
                                  onClick={async () => {
                                    const { error } = await supabase.from('users').update({ status: 'approved' }).eq('id', u.id);
                                    if (!error) loadData();
                                  }}
                                  className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={async () => {
                                    const { error } = await supabase.from('users').update({ status: 'rejected' }).eq('id', u.id);
                                    if (!error) loadData();
                                  }}
                                  className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                                  title="Reject"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pump Approvals */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-primary" />
                    Pending Pump Registrations
                  </h3>
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Pump Name</th>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Location</th>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Owner ID</th>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pumps.filter(p => !p.is_verified).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-medium">No pending pump registrations</td>
                          </tr>
                        ) : (
                          pumps.filter(p => !p.is_verified).map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-all">
                              <td className="px-6 py-4 font-bold text-gray-900">{p.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{p.upazila}, {p.district}</td>
                              <td className="px-6 py-4 text-xs font-mono text-gray-400">{p.owner_id || 'N/A'}</td>
                              <td className="px-6 py-4 text-right space-x-2">
                                <button 
                                  onClick={() => handleApprovePump(p.id)}
                                  className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleDeletePump(p.id)}
                                  className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Claim Approvals (Simplified) */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-primary" />
                    Pending Ownership Claims
                  </h3>
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-8 text-center text-gray-400 italic">
                    Claim management will be integrated with Supabase soon.
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'featured' && (
              <motion.div 
                key="featured"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-black text-gray-900">Manage Featured Pumps</h2>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Pump Name</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Location</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Featured</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pumps.map(pump => (
                        <tr key={pump.id} className="hover:bg-gray-50 transition-all">
                          <td className="px-6 py-4 font-bold text-gray-900">{pump.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{pump.district}, {pump.division}</td>
                          <td className="px-6 py-4">
                            {pump.is_featured ? (
                              <span className="bg-primary/10 text-primary px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit">
                                <Star className="w-3 h-3 fill-primary" />
                                Featured
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Standard</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleToggleFeatured(pump.id)}
                              className={`px-4 py-2 rounded-none font-bold text-xs transition-all ${pump.is_featured ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/10'}`}
                            >
                              {pump.is_featured ? 'Remove' : 'Feature'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'notices' && (
              <motion.div 
                key="notices"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900">Notice Management</h2>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Add New Notice</h3>
                  <form onSubmit={handleAddNotice} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
                        <input 
                          type="text"
                          required
                          value={newNotice.title}
                          onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold"
                          placeholder="Notice Title"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                        <textarea 
                          required
                          value={newNotice.description}
                          onChange={e => setNewNotice({...newNotice, description: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold h-32 resize-none"
                          placeholder="Notice Description"
                        />
                      </div>
                      <button type="submit" className="bg-primary text-white px-8 py-3 rounded-none font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/10 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Publish Notice
                      </button>
                  </form>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Active Notices</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {notices.map(notice => (
                      <div key={notice.id} className="bg-white p-6 rounded-none border border-gray-100 shadow-sm flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-black text-primary uppercase tracking-widest mb-1">
                            {new Date(notice.created_at).toLocaleDateString()}
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 mb-2">{notice.title}</h4>
                          <p className="text-gray-500 text-sm leading-relaxed">{notice.description}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteNotice(notice.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-none transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'popup' && (
              <motion.div 
                key="popup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <h2 className="text-2xl font-black text-gray-900">Popup Banner Settings</h2>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <form onSubmit={handleUpdatePopup} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Banner Image</label>
                          <div className="flex gap-2">
                            <input 
                              type="url"
                              required
                              value={popupForm.image_url}
                              onChange={e => setPopupForm({...popupForm, image_url: e.target.value})}
                              className="flex-grow px-4 py-3 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary outline-none font-bold"
                              placeholder="https://example.com/image.jpg"
                            />
                            <label className="cursor-pointer bg-gray-100 p-3 rounded-none hover:bg-gray-200 transition-all flex items-center justify-center">
                              <Upload className="w-5 h-5 text-gray-600" />
                              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1">Paste URL or upload from device</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Redirect Link (Optional)</label>
                          <input 
                            type="url"
                            value={popupForm.link}
                            onChange={e => setPopupForm({...popupForm, link: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold"
                            placeholder="https://example.com"
                          />
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-none border border-gray-100">
                          <input 
                            type="checkbox"
                            id="popup-active"
                            checked={popupForm.is_active}
                            onChange={e => setPopupForm({...popupForm, is_active: e.target.checked})}
                            className="w-5 h-5 rounded-lg border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="popup-active" className="font-bold text-gray-700">Enable Popup Banner</label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Preview</label>
                        <div className="aspect-video bg-gray-100 rounded-none border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                          {popupForm.image_url ? (
                            <img src={popupForm.image_url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="text-center text-gray-400">
                              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                              <p className="text-xs font-bold uppercase tracking-widest">Image Preview</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button type="submit" className="bg-primary text-white px-8 py-3 rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/10 flex items-center gap-2">
                      <Save className="w-5 h-5" />
                      Save Settings
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'locations' && (
              <motion.div 
                key="locations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <h2 className="text-2xl font-black text-gray-900">Location Management</h2>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-8 text-center text-gray-400 italic">
                  Location management will be integrated with Supabase soon.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
