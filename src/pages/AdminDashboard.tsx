import { useState, useEffect } from 'react';
import { mockService } from '../mockService';
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
    const loadData = () => {
      setStats(mockService.getSystemStats());
      setPumps(mockService.getPumps());
      setUsers(mockService.getUsers());
      setClaims(mockService.getClaims());
      setNotices(mockService.getNotices());
      setPopup(mockService.getPopupBanner());
      setLocations(mockService.getLocations());
      setPopupForm(mockService.getPopupBanner());
    };

    loadData();
    const unsubscribe = mockService.subscribe(loadData);
    return () => unsubscribe();
  }, []);

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

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    await mockService.addNotice(newNotice);
    setNewNotice({ title: '', description: '' });
  };

  const handleUpdatePopup = async (e: React.FormEvent) => {
    e.preventDefault();
    await mockService.updatePopupBanner(popupForm);
    alert('Popup banner updated!');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPopupForm({ ...popupForm, image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleFeatured = async (pumpId: string) => {
    await mockService.toggleFeaturedPump(pumpId);
  };

  const handleAddDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDivisionName) return;
    await mockService.addLocation({ division: newDivisionName, districts: [] });
    setNewDivisionName('');
  };

  const handleAddDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDivisionId || !newDistrictName) return;
    const loc = locations.find(l => l.id === selectedDivisionId);
    if (loc) {
      const updatedDistricts = [...loc.districts, { name: newDistrictName, upazilas: [] }];
      await mockService.updateLocation(selectedDivisionId, { districts: updatedDistricts });
      setNewDistrictName('');
    }
  };

  const handleAddUpazila = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDivisionId || !selectedDistrictName || !newUpazilaName) return;
    const loc = locations.find(l => l.id === selectedDivisionId);
    if (loc) {
      const updatedDistricts = loc.districts.map(d => {
        if (d.name === selectedDistrictName) {
          return { ...d, upazilas: [...d.upazilas, newUpazilaName] };
        }
        return d;
      });
      await mockService.updateLocation(selectedDivisionId, { districts: updatedDistricts });
      setNewUpazilaName('');
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
                                  onClick={() => mockService.approveUser(u.id)}
                                  className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => mockService.rejectUser(u.id)}
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
                        {pumps.filter(p => p.status === 'pending').length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-medium">No pending pump registrations</td>
                          </tr>
                        ) : (
                          pumps.filter(p => p.status === 'pending').map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-all">
                              <td className="px-6 py-4 font-bold text-gray-900">{p.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{p.upazila}, {p.district}</td>
                              <td className="px-6 py-4 text-xs font-mono text-gray-400">{p.verified_owner_id || 'N/A'}</td>
                              <td className="px-6 py-4 text-right space-x-2">
                                <button 
                                  onClick={() => mockService.approvePump(p.id)}
                                  className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => mockService.deletePump(p.id)}
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

                {/* Claim Approvals */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-primary" />
                    Pending Ownership Claims
                  </h3>
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">User ID</th>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Pump ID</th>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {claims.filter(c => c.verification_status === 'pending').length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-medium">No pending ownership claims</td>
                          </tr>
                        ) : (
                          claims.filter(c => c.verification_status === 'pending').map(c => (
                            <tr key={c.id} className="hover:bg-gray-50 transition-all">
                              <td className="px-6 py-4 text-sm font-bold text-gray-900">{c.user_id}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{c.pump_id}</td>
                              <td className="px-6 py-4 text-xs text-gray-400">{new Date(c.timestamp).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-right space-x-2">
                                <button 
                                  onClick={() => mockService.approveClaim(c.id)}
                                  className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => mockService.updateClaim(c.id, 'rejected')}
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
                          onClick={() => mockService.deleteNotice(notice.id)}
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Add Division */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Add Division</h3>
                    <form onSubmit={handleAddDivision} className="space-y-4">
                      <input 
                        type="text"
                        value={newDivisionName}
                        onChange={e => setNewDivisionName(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm"
                        placeholder="Division Name"
                      />
                      <button type="submit" className="w-full bg-primary text-white py-2 rounded-xl font-bold hover:bg-primary-hover transition-all text-sm">
                        Add Division
                      </button>
                    </form>
                  </div>

                  {/* Add District */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Add District</h3>
                    <form onSubmit={handleAddDistrict} className="space-y-4">
                      <select 
                        value={selectedDivisionId}
                        onChange={e => setSelectedDivisionId(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm"
                      >
                        <option value="">Select Division</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.division}</option>)}
                      </select>
                      <input 
                        type="text"
                        value={newDistrictName}
                        onChange={e => setNewDistrictName(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm"
                        placeholder="District Name"
                      />
                      <button type="submit" className="w-full bg-primary text-white py-2 rounded-xl font-bold hover:bg-primary-hover transition-all text-sm">
                        Add District
                      </button>
                    </form>
                  </div>

                  {/* Add Upazila */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Add Upazila</h3>
                    <form onSubmit={handleAddUpazila} className="space-y-4">
                      <select 
                        value={selectedDivisionId}
                        onChange={e => {
                          setSelectedDivisionId(e.target.value);
                          setSelectedDistrictName('');
                        }}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm"
                      >
                        <option value="">Select Division</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.division}</option>)}
                      </select>
                      <select 
                        value={selectedDistrictName}
                        onChange={e => setSelectedDistrictName(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm"
                        disabled={!selectedDivisionId}
                      >
                        <option value="">Select District</option>
                        {locations.find(l => l.id === selectedDivisionId)?.districts.map(d => (
                          <option key={d.name} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                      <input 
                        type="text"
                        value={newUpazilaName}
                        onChange={e => setNewUpazilaName(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm"
                        placeholder="Upazila Name"
                      />
                      <button type="submit" className="w-full bg-primary text-white py-2 rounded-xl font-bold hover:bg-primary-hover transition-all text-sm">
                        Add Upazila
                      </button>
                    </form>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Existing Locations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {locations.map(loc => (
                      <div key={loc.id} className="bg-white p-6 rounded-none border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xl font-black text-gray-900">{loc.division}</h4>
                          <button 
                            onClick={() => mockService.deleteLocation(loc.id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="space-y-4">
                          {loc.districts.map((dist, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-none border border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-gray-700">{dist.name}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{dist.upazilas.length} Upazilas</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {dist.upazilas.map((up, uIdx) => (
                                  <span key={uIdx} className="bg-white px-3 py-1 rounded-none text-xs font-bold text-gray-500 border border-gray-100">
                                    {up}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
