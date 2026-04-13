import { useState, useEffect, useMemo } from 'react';
import { mockService } from '../mockService';
import { Pump, User, Notice, PopupBanner, LocationData } from '../types';
import { DIVISIONS, DISTRICTS, UPAZILAS, STATUS_COLORS, STATUS_LABELS, FUEL_TYPES, DEFAULT_INVENTORY } from '../constants';
import { Search, MapPin, Fuel, Clock, ShieldCheck, Users, User as UserIcon, AlertTriangle, PlusCircle, X, Bell, Star, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function HomePage({ user }: { user: User | null }) {
  const [pumps, setPumps] = useState<Pump[]>(mockService.getPumps());
  const [filteredPumps, setFilteredPumps] = useState<Pump[]>([]);
  const [loading, setLoading] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [popup, setPopup] = useState<PopupBanner | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [locations, setLocations] = useState<LocationData[]>([]);

  // Add Pump Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDivision, setNewDivision] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newUpazila, setNewUpazila] = useState('');
  const [newAddress, setNewAddress] = useState('');

  // Filters
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [limit, setLimit] = useState('10');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    const loadData = () => {
      setPumps(mockService.getPumps());
      setNotices(mockService.getNotices());
      setLocations(mockService.getLocations());
      
      const banner = mockService.getPopupBanner();
      setPopup(banner);
      
      // Show popup once per session
      if (banner.is_active && !sessionStorage.getItem('fuelbd_popup_shown')) {
        setShowPopup(true);
        sessionStorage.setItem('fuelbd_popup_shown', 'true');
      }
    };

    loadData();
    const unsubscribe = mockService.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  const featuredPumps = useMemo(() => pumps.filter(p => p.is_featured && p.status === 'approved'), [pumps]);

  useEffect(() => {
    let result = pumps.filter(p => p.status === 'approved' && !p.is_featured);

    if (division) result = result.filter(p => p.division === division);
    if (district) result = result.filter(p => p.district === district);
    if (upazila) result = result.filter(p => p.upazila === upazila);
    if (fuelType) {
      result = result.filter(p => p.fuel_types?.[fuelType as keyof typeof p.fuel_types] === 'available');
    }
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.upazila.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'newest') {
      result = [...result].sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());
    } else if (sortBy === 'oldest') {
      result = [...result].sort((a, b) => new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime());
    } else if (sortBy === 'trust') {
      result = [...result].sort((a, b) => b.trust_score - a.trust_score);
    }

    // Limit
    result = result.slice(0, parseInt(limit));

    setFilteredPumps(result);
  }, [division, district, upazila, searchQuery, sortBy, limit, pumps]);

  const handleAddPump = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mockService.addPump({
        name: newName,
        division: newDivision,
        district: newDistrict,
        upazila: newUpazila,
        address: newAddress,
        fuel_types: {
          octane: 'available',
          petrol: 'available',
          diesel: 'available',
          cng: 'available',
          lpg: 'available'
        },
        inventory: DEFAULT_INVENTORY,
        last_updated: new Date().toISOString(),
        trust_score: 50,
        status: 'pending'
      });
      alert('Pump added! It will be visible after admin approval.');
      setShowAddModal(false);
      setNewName('');
      setNewDivision('');
      setNewDistrict('');
      setNewUpazila('');
      setNewAddress('');
    } catch (err) {
      console.error('Error adding pump:', err);
    }
  };

  const getTrustIcon = (pump: Pump) => {
    if (pump.verified_owner_id) return <ShieldCheck className="w-4 h-4 text-primary" />;
    if (pump.trust_score > 70) return <Users className="w-4 h-4 text-primary" />;
    return <UserIcon className="w-4 h-4 text-gray-400" />;
  };

  const getTrustLabel = (pump: Pump) => {
    if (pump.verified_owner_id) return "Verified Owner";
    if (pump.trust_score > 70) return "Multiple Users";
    return "Single User";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black text-gray-900 sm:text-5xl tracking-tight mb-4">
          Find Fuel Availability <span className="text-primary">Instantly</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 font-medium">
          Real-time updates on Octane, Petrol, Diesel, and CNG across Bangladesh. 
          Help others by reporting status at your local pump.
        </p>
        
        {user && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-none font-bold text-lg hover:bg-primary-hover transition-all shadow-xl shadow-primary/20"
          >
            <PlusCircle className="w-6 h-6" />
            Add Nearest Fuel Station
          </button>
        )}
      </div>

      {/* Notices Section (Scrolling Marquee) */}
      {notices.length > 0 && (
        <div className="mb-12 bg-primary text-white py-4 rounded-none overflow-hidden relative shadow-lg shadow-primary/10">
          <div className="flex whitespace-nowrap">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ 
                repeat: Infinity, 
                duration: 25, 
                ease: "linear" 
              }}
              className="flex gap-12 items-center"
            >
              {[...notices, ...notices].map((notice, idx) => (
                <div key={`${notice.id}-${idx}`} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span className="font-bold text-sm tracking-wide">
                    {notice.title}: <span className="font-medium opacity-90">{notice.description}</span>
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      )}

      {/* Featured Pumps */}
      {featuredPumps.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 text-primary mb-6">
            <Star className="w-5 h-5 fill-primary" />
            <h2 className="text-xl font-black uppercase tracking-widest">Featured Stations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPumps.map(pump => (
              <PumpCard key={pump.id} pump={pump} isFeatured />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-12 bg-white p-6 rounded-none border border-gray-100 shadow-sm space-y-4">
        {/* Row 1: Selects */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary outline-none font-bold text-sm appearance-none cursor-pointer"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>

          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary outline-none font-bold text-sm appearance-none cursor-pointer"
            value={division}
            onChange={(e) => {
              setDivision(e.target.value);
              setDistrict('');
              setUpazila('');
            }}
          >
            <option value="">All Divisions</option>
            {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary outline-none font-bold text-sm appearance-none cursor-pointer disabled:opacity-50"
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setUpazila('');
            }}
            disabled={!division}
          >
            <option value="">All Districts</option>
            {division && DISTRICTS[division]?.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary outline-none font-bold text-sm appearance-none cursor-pointer disabled:opacity-50"
            value={upazila}
            onChange={(e) => setUpazila(e.target.value)}
            disabled={!district}
          >
            <option value="">All Upazilas</option>
            {district && UPAZILAS[district]?.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary outline-none font-bold text-sm appearance-none cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="trust">Highest Trust</option>
          </select>

          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary outline-none font-bold text-sm appearance-none cursor-pointer"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary outline-none font-bold text-sm appearance-none cursor-pointer"
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
          >
            <option value="">All Fuel Types</option>
            {FUEL_TYPES.map(f => (
              <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Row 2: Search and Buttons */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-grow relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Pump Name, Location, ID..."
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-none focus:ring-2 focus:ring-primary outline-none font-bold text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button 
              className="px-8 py-2.5 bg-[#00c853] text-white rounded-none font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-green-500/10"
              onClick={() => {/* Search is already reactive */}}
            >
              Search
            </button>
            <div className="relative group">
              <button className="px-6 py-2.5 bg-[#40c4ff] text-white rounded-none font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/10">
                Action
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-none shadow-xl border border-gray-100 py-2 hidden group-hover:block z-50">
                <button onClick={() => setShowAddModal(true)} className="w-full text-left px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Add New Pump</button>
                <button className="w-full text-left px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Export Data</button>
              </div>
            </div>
            <button 
              className="px-6 py-2.5 bg-[#ffca28] text-white rounded-none font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-yellow-500/10"
              onClick={() => {
                setDivision('');
                setDistrict('');
                setUpazila('');
                setFuelType('');
                setSearchQuery('');
                setSortBy('newest');
                setLimit('10');
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Nearby Stations</h2>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{filteredPumps.length} Results</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPumps.length > 0 ? (
              filteredPumps.map((pump) => (
                <PumpCard key={pump.id} pump={pump} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                  <div className="bg-gray-100 w-16 h-16 rounded-none flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="text-gray-400 w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No pumps found</h3>
                <p className="text-gray-500">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popup Banner */}
      <AnimatePresence>
        {showPopup && popup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPopup(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-none overflow-hidden shadow-2xl max-w-2xl w-full"
            >
              <button 
                onClick={() => setShowPopup(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-none transition-all backdrop-blur-md"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="aspect-video relative">
                <img 
                  src={popup.image_url} 
                  alt="Special Offer" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-8 text-center">
                <h2 className="text-3xl font-black text-gray-900 mb-4">Special Announcement</h2>
                <p className="text-gray-500 mb-8 font-medium">Don't miss out on our latest updates and features. Stay connected with FuelBD.</p>
                {popup.link && (
                  <a 
                    href={popup.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-primary text-white px-10 py-4 rounded-none font-bold text-lg hover:bg-primary-hover transition-all shadow-xl shadow-primary/20"
                  >
                    Learn More
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AddPumpModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddPump}
        formData={{ name: newName, division: newDivision, district: newDistrict, upazila: newUpazila, address: newAddress }}
        setFormData={(data: any) => {
          setNewName(data.name);
          setNewDivision(data.division);
          setNewDistrict(data.district);
          setNewUpazila(data.upazila);
          setNewAddress(data.address);
        }}
        locations={locations}
      />
    </div>
  );
}

function PumpCard({ pump, isFeatured }: { pump: Pump, isFeatured?: boolean }) {
  const getTrustIcon = (pump: Pump) => {
    if (pump.verified_owner_id) return <ShieldCheck className="w-4 h-4 text-primary" />;
    if (pump.trust_score > 70) return <Users className="w-4 h-4 text-primary" />;
    return <UserIcon className="w-4 h-4 text-gray-400" />;
  };

  const getTrustLabel = (pump: Pump) => {
    if (pump.verified_owner_id) return "Verified Owner";
    if (pump.trust_score > 70) return "Multiple Users";
    return "Single User";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white rounded-none border shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col relative ${isFeatured ? 'border-primary/20 ring-4 ring-primary/5' : 'border-gray-100'}`}
    >
      {isFeatured && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-primary text-white px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-primary/20">
            <Star className="w-3 h-3 fill-white" />
            Featured
          </div>
        </div>
      )}
      <div className="p-8 flex-grow">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-black text-gray-900 leading-tight">{pump.name}</h3>
        </div>
        
        <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-8">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="font-bold">{pump.upazila}, {pump.district}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {Object.entries(pump.fuel_types || {}).map(([type, status]) => (
            <div key={type} className={`p-4 rounded-none border flex flex-col items-center justify-center text-center transition-all ${STATUS_COLORS[status] || 'bg-gray-50 border-gray-100 text-gray-400'}`}>
              <span className="text-[10px] uppercase font-black opacity-60 mb-1 tracking-widest">{type}</span>
              <span className="text-xs font-black">{STATUS_LABELS[status].split(' ')[0]}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-none border border-gray-100">
          <div className="bg-white p-2 rounded-none shadow-sm">
            {getTrustIcon(pump)}
          </div>
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            {getTrustLabel(pump)}
          </div>
        </div>
      </div>

      <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
          <Clock className="w-4 h-4" />
          <span>Updated {new Date(pump.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <Link 
          to={`/pump/${pump.id}`}
          className="bg-primary px-6 py-2.5 rounded-none text-sm font-black text-white hover:bg-primary-hover transition-all shadow-lg shadow-primary/10"
        >
          Details
        </Link>
      </div>
    </motion.div>
  );
}

function AddPumpModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  formData,
  setFormData,
  locations
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: any;
  locations: LocationData[];
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-none shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-primary text-white">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <PlusCircle className="w-8 h-8" />
                Add New Station
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-none transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Station Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Jamuna Oil Filling Station"
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-none focus:ring-2 focus:ring-primary outline-none font-bold"
                />
              </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Division</label>
                    <select
                      required
                      value={formData.division}
                      onChange={(e) => setFormData({ ...formData, division: e.target.value, district: '', upazila: '' })}
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-none focus:ring-2 focus:ring-primary outline-none font-bold"
                    >
                      <option value="">Select</option>
                      {locations.map(l => <option key={l.id} value={l.division}>{l.division}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">District</label>
                    <select
                      required
                      disabled={!formData.division}
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value, upazila: '' })}
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-none focus:ring-2 focus:ring-primary outline-none disabled:opacity-50 font-bold"
                    >
                      <option value="">Select</option>
                      {formData.division && locations.find(l => l.division === formData.division)?.districts.map(d => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Upazila</label>
                  <select
                    required
                    disabled={!formData.district}
                    value={formData.upazila}
                    onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-none focus:ring-2 focus:ring-primary outline-none disabled:opacity-50 font-bold"
                  >
                    <option value="">Select</option>
                    {formData.district && locations.find(l => l.division === formData.division)?.districts.find(d => d.name === formData.district)?.upazilas.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Address</label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, landmark..."
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-none focus:ring-2 focus:ring-primary outline-none h-24 resize-none font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white py-5 rounded-none font-black text-lg hover:bg-primary-hover transition-all shadow-xl shadow-primary/20"
              >
                Submit for Approval
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
