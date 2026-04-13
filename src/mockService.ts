import { User, Pump, Report, OwnerClaim, FuelTypes, FuelStatus, VerificationStatus, ActivityLog, AggregatedStatus, Notice, PopupBanner, LocationData, SystemStats } from './types';
import { DEFAULT_INVENTORY, DIVISIONS, DISTRICTS, UPAZILAS } from './constants';

// Initial Mock Data

const INITIAL_PUMPS: Pump[] = [
  {
    id: '1',
    name: 'Trust Filling Station',
    division: 'Dhaka',
    district: 'Dhaka',
    upazila: 'Dhanmondi',
    address: 'Road 27, Dhanmondi, Dhaka',
    fuel_types: { octane: 'available', petrol: 'low', diesel: 'out_of_stock', cng: 'available', lpg: 'available' },
    inventory: DEFAULT_INVENTORY,
    last_updated: new Date().toISOString(),
    trust_score: 95,
    status: 'approved'
  },
  {
    id: '2',
    name: 'Padma Oil Company',
    division: 'Chattogram',
    district: 'Chattogram',
    upazila: 'Kotwali',
    address: 'Agrabad, Chattogram',
    fuel_types: { octane: 'available', petrol: 'available', diesel: 'available', cng: 'available', lpg: 'available' },
    inventory: DEFAULT_INVENTORY,
    last_updated: new Date().toISOString(),
    trust_score: 100,
    verified_owner_id: 'owner1',
    status: 'approved'
  }
];

class MockService {
  private pumps: Pump[] = [...INITIAL_PUMPS];
  private users: User[] = [
    { 
      id: 'admin1', 
      name: 'Super Admin', 
      username: 'admin',
      email: 'admin@fuelbd.com', 
      mobile: '01700000000',
      role: 'admin', 
      status: 'approved',
      createdAt: new Date().toISOString()
    },
    { 
      id: 'owner1', 
      name: 'Pump Owner', 
      username: 'owner',
      email: 'owner@example.com', 
      mobile: '01711111111',
      role: 'owner', 
      status: 'approved',
      createdAt: new Date().toISOString()
    }
  ];
  private reports: Report[] = [];
  private claims: OwnerClaim[] = [];
  private activityLogs: ActivityLog[] = [];
  private notices: Notice[] = [];
  private popupBanner: PopupBanner = { image_url: 'https://picsum.photos/seed/fuel/800/400', is_active: false };
  private locations: LocationData[] = DIVISIONS.map((division, idx) => ({
    id: (idx + 1).toString(),
    division,
    districts: (DISTRICTS[division] || []).map(district => ({
      name: district,
      upazilas: UPAZILAS[district] || []
    }))
  }));
  private currentUser: User | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    // Load from localStorage if available
    const savedPumps = localStorage.getItem('fuelbd_pumps');
    if (savedPumps) {
      const parsed = JSON.parse(savedPumps);
      // Migration: Ensure all pumps have inventory and fuel_types
      this.pumps = parsed.map((p: any) => ({
        ...p,
        inventory: p.inventory || DEFAULT_INVENTORY,
        fuel_types: p.fuel_types || { octane: 'available', petrol: 'available', diesel: 'available', cng: 'available', lpg: 'available' }
      }));
    }
    
    const savedReports = localStorage.getItem('fuelbd_reports');
    if (savedReports) this.reports = JSON.parse(savedReports);

    const savedUser = localStorage.getItem('fuelbd_user');
    if (savedUser) this.currentUser = JSON.parse(savedUser);

    const savedUsers = localStorage.getItem('fuelbd_users');
    if (savedUsers) this.users = JSON.parse(savedUsers);

    const savedLogs = localStorage.getItem('fuelbd_logs');
    if (savedLogs) this.activityLogs = JSON.parse(savedLogs);

    const savedNotices = localStorage.getItem('fuelbd_notices');
    if (savedNotices) this.notices = JSON.parse(savedNotices);

    const savedPopup = localStorage.getItem('fuelbd_popup');
    if (savedPopup) this.popupBanner = JSON.parse(savedPopup);

    const savedLocations = localStorage.getItem('fuelbd_locations');
    if (savedLocations) {
      const parsed = JSON.parse(savedLocations);
      // If we have fewer locations than divisions, re-initialize to ensure all are present
      if (parsed.length < DIVISIONS.length) {
        this.notify(); // This will save the initial locations
      } else {
        this.locations = parsed;
      }
    } else {
      this.notify(); // Save initial locations
    }
  }

  private notify() {
    this.listeners.forEach(l => l());
    localStorage.setItem('fuelbd_pumps', JSON.stringify(this.pumps));
    localStorage.setItem('fuelbd_reports', JSON.stringify(this.reports));
    localStorage.setItem('fuelbd_user', JSON.stringify(this.currentUser));
    localStorage.setItem('fuelbd_users', JSON.stringify(this.users));
    localStorage.setItem('fuelbd_logs', JSON.stringify(this.activityLogs));
    localStorage.setItem('fuelbd_notices', JSON.stringify(this.notices));
    localStorage.setItem('fuelbd_popup', JSON.stringify(this.popupBanner));
    localStorage.setItem('fuelbd_locations', JSON.stringify(this.locations));
  }

  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Auth
  async login(emailOrUsername: string, password?: string) {
    // Super Admin Check
    if (emailOrUsername === 'admin@fuelbd.com' && password === 'Admin$2026') {
      const admin = this.users.find(u => u.email === 'admin@fuelbd.com');
      this.currentUser = admin || null;
      this.notify();
      return this.currentUser;
    }

    const user = this.users.find(u => u.email === emailOrUsername || u.username === emailOrUsername);
    if (user) {
      if (user.status !== 'approved') {
        throw new Error('Your account is pending approval from admin.');
      }
      this.currentUser = user;
      this.notify();
      return user;
    }
    throw new Error('User not found.');
  }

  async register(userData: Partial<User>) {
    const id = 'USER-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const newUser: User = {
      id,
      name: userData.name || '',
      username: userData.username || '',
      email: userData.email || '',
      mobile: userData.mobile || '',
      role: userData.role || 'user',
      status: 'pending',
      dob: userData.dob,
      nid: userData.nid,
      photo: userData.photo,
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    this.notify();
    return newUser;
  }

  async logout() {
    this.currentUser = null;
    this.notify();
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // Admin
  getUsers() {
    return this.users;
  }

  async approveUser(userId: string) {
    this.users = this.users.map(u => u.id === userId ? { ...u, status: 'approved' } : u);
    this.notify();
  }

  async rejectUser(userId: string) {
    this.users = this.users.map(u => u.id === userId ? { ...u, status: 'rejected' } : u);
    this.notify();
  }

  // Pumps
  getPumps() {
    return this.pumps;
  }

  getPump(id: string) {
    return this.pumps.find(p => p.id === id);
  }

  async addPump(pump: Omit<Pump, 'id'>) {
    const newPump = { ...pump, id: Math.random().toString(36).substr(2, 9), status: 'pending' as VerificationStatus };
    this.pumps.push(newPump);
    this.notify();
    return newPump;
  }

  async approvePump(id: string) {
    this.pumps = this.pumps.map(p => p.id === id ? { ...p, status: 'approved' } : p);
    this.notify();
  }

  async updatePump(id: string, data: Partial<Pump>) {
    this.pumps = this.pumps.map(p => p.id === id ? { ...p, ...data } : p);
    this.notify();
  }

  async logActivity(log: Omit<ActivityLog, 'id'>) {
    const newLog = { ...log, id: Math.random().toString(36).substr(2, 9) };
    this.activityLogs.unshift(newLog);
    if (this.activityLogs.length > 100) this.activityLogs.pop();
    this.notify();
  }

  getActivityLogs(pumpId: string) {
    return this.activityLogs.filter(l => l.pump_id === pumpId);
  }

  async respondToReport(reportId: string, response: string) {
    this.reports = this.reports.map(r => 
      r.id === reportId ? { ...r, owner_response: response, is_resolved: true } : r
    );
    this.notify();
  }

  getAllReports(pumpId: string) {
    return this.reports.filter(r => r.pump_id === pumpId);
  }

  async setEmergencyAlert(pumpId: string, message: string | undefined) {
    this.pumps = this.pumps.map(p => p.id === pumpId ? { ...p, emergency_alert: message } : p);
    this.notify();
  }

  async deletePump(id: string) {
    this.pumps = this.pumps.filter(p => p.id !== id);
    this.notify();
  }

  // Reports
  getReports(pumpId: string) {
    return this.reports.filter(r => r.pump_id === pumpId);
  }

  getAggregatedStatus(pumpId: string, fuelType: keyof FuelTypes): AggregatedStatus {
    const pump = this.getPump(pumpId);
    if (!pump) throw new Error('Pump not found');

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Filter reports for this pump and fuel type within the last 2 hours
    const relevantReports = this.reports.filter(r => 
      r.pump_id === pumpId && 
      r.fuel_type === fuelType && 
      new Date(r.timestamp) >= twoHoursAgo
    );

    // Check for verified owner override
    const ownerReport = relevantReports.find(r => r.is_owner);
    if (ownerReport) {
      return {
        status: ownerReport.status,
        confidence: 100,
        total_reports: relevantReports.length,
        last_updated: ownerReport.timestamp,
        is_owner_verified: true,
        breakdown: {
          available: ownerReport.status === 'available' ? 1 : 0,
          low: ownerReport.status === 'low' ? 1 : 0,
          out_of_stock: ownerReport.status === 'out_of_stock' ? 1 : 0
        }
      };
    }

    // Default breakdown
    const breakdown: Record<FuelStatus, number> = {
      available: 0,
      low: 0,
      out_of_stock: 0
    };

    relevantReports.forEach(r => {
      breakdown[r.status]++;
    });

    const total = relevantReports.length;
    if (total === 0) {
      return {
        status: pump.fuel_types[fuelType],
        confidence: 0,
        total_reports: 0,
        last_updated: pump.last_updated,
        is_owner_verified: false,
        breakdown
      };
    }

    // Determine majority
    let finalStatus: FuelStatus = 'available';
    let maxVotes = -1;

    (Object.keys(breakdown) as FuelStatus[]).forEach(status => {
      if (breakdown[status] > maxVotes) {
        maxVotes = breakdown[status];
        finalStatus = status;
      }
    });

    const confidence = Math.round((maxVotes / total) * 100);
    const lastReport = relevantReports[relevantReports.length - 1];

    return {
      status: finalStatus,
      confidence,
      total_reports: total,
      last_updated: lastReport.timestamp,
      is_owner_verified: false,
      breakdown
    };
  }

  async submitReport(reportData: Omit<Report, 'id' | 'timestamp' | 'user_id' | 'is_owner'>) {
    if (!this.currentUser) throw new Error('Authentication required');

    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    // Rate limit check: 1 report per station per fuel type every 10 minutes
    const recentReport = this.reports.find(r => 
      r.user_id === this.currentUser?.id &&
      r.pump_id === reportData.pump_id &&
      r.fuel_type === reportData.fuel_type &&
      new Date(r.timestamp) >= tenMinutesAgo
    );

    if (recentReport) {
      throw new Error('You can only submit one report per fuel type every 10 minutes.');
    }

    const pump = this.getPump(reportData.pump_id);
    const isOwner = pump?.verified_owner_id === this.currentUser.id;

    const newReport: Report = {
      ...reportData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: now.toISOString(),
      user_id: this.currentUser.id,
      is_owner: isOwner
    };

    this.reports.push(newReport);

    // Update pump status if it's owner or if aggregation changes it
    if (isOwner) {
      const updatedFuelTypes = { ...pump!.fuel_types, [reportData.fuel_type]: reportData.status };
      await this.updatePump(reportData.pump_id, {
        fuel_types: updatedFuelTypes,
        last_updated: newReport.timestamp,
        trust_score: 100
      });
    } else {
      // Re-calculate aggregated status and update pump
      const agg = this.getAggregatedStatus(reportData.pump_id, reportData.fuel_type);
      if (pump) {
        const updatedFuelTypes = { ...pump.fuel_types, [reportData.fuel_type]: agg.status };
        await this.updatePump(reportData.pump_id, {
          fuel_types: updatedFuelTypes,
          last_updated: agg.last_updated,
          trust_score: Math.min(pump.trust_score + 1, 95)
        });
      }
    }

    this.notify();
    return newReport;
  }

  // Claims
  getClaims() {
    return this.claims;
  }

  async addClaim(user_id: string, pump_id: string) {
    const claim: OwnerClaim = { 
      id: Math.random().toString(36).substr(2, 9), 
      user_id, 
      pump_id, 
      verification_status: 'pending' as const,
      timestamp: new Date().toISOString()
    };
    this.claims.push(claim);
    this.notify();
  }

  async updateClaim(id: string, status: VerificationStatus) {
    const claim = this.claims.find(c => c.id === id);
    if (claim) {
      claim.verification_status = status;
      this.notify();
    }
  }

  async approveClaim(claimId: string) {
    const claim = this.claims.find(c => c.id === claimId);
    if (claim) {
      claim.verification_status = 'approved';
      await this.updatePump(claim.pump_id, { verified_owner_id: claim.user_id });
      this.notify();
    }
  }

  // Super Admin Features
  getSystemStats(): SystemStats {
    return {
      totalUsers: this.users.length,
      totalPumps: this.pumps.length,
      totalOwners: this.users.filter(u => u.role === 'owner').length,
      totalReports: this.reports.length
    };
  }

  // Notices
  getNotices() {
    return [...this.notices].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async addNotice(notice: Omit<Notice, 'id' | 'created_at'>) {
    const newNotice: Notice = {
      ...notice,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    this.notices.push(newNotice);
    this.notify();
    return newNotice;
  }

  async deleteNotice(id: string) {
    this.notices = this.notices.filter(n => n.id !== id);
    this.notify();
  }

  // Popup Banner
  getPopupBanner() {
    return this.popupBanner;
  }

  async updatePopupBanner(data: PopupBanner) {
    this.popupBanner = data;
    this.notify();
  }

  // Locations
  getLocations() {
    return this.locations;
  }

  async addLocation(location: Omit<LocationData, 'id'>) {
    const newLoc: LocationData = {
      ...location,
      id: Math.random().toString(36).substr(2, 9)
    };
    this.locations.push(newLoc);
    this.notify();
  }

  async updateLocation(id: string, data: Partial<LocationData>) {
    this.locations = this.locations.map(l => l.id === id ? { ...l, ...data } : l);
    this.notify();
  }

  async deleteLocation(id: string) {
    this.locations = this.locations.filter(l => l.id !== id);
    this.notify();
  }

  // Featured Pumps
  async toggleFeaturedPump(pumpId: string, expiry?: string) {
    this.pumps = this.pumps.map(p => {
      if (p.id === pumpId) {
        return {
          ...p,
          is_featured: !p.is_featured,
          featured_expiry: !p.is_featured ? expiry : undefined
        };
      }
      return p;
    });
    this.notify();
  }

  getFeaturedPumps() {
    return this.pumps.filter(p => p.is_featured);
  }
}

export const mockService = new MockService();
