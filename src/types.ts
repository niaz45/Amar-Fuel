export type FuelStatus = 'available' | 'low' | 'out_of_stock';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface FuelTypes {
  octane: FuelStatus;
  petrol: FuelStatus;
  diesel: FuelStatus;
  cng: FuelStatus;
  lpg: FuelStatus;
}

export interface FuelInventory {
  current_liters: number;
  capacity: number;
  daily_usage_avg: number;
  last_refill_date?: string;
  last_refill_amount?: number;
}

export interface Pump {
  id: string;
  name: string;
  division: string;
  district: string;
  upazila: string;
  address: string;
  fuel_types: FuelTypes;
  inventory: Record<keyof FuelTypes, FuelInventory>;
  verified_owner_id?: string;
  last_updated: string;
  trust_score: number;
  status: VerificationStatus;
  is_featured?: boolean;
  featured_expiry?: string;
  // Operational Info
  opening_date?: string;
  operating_hours?: string;
  storage_capacity?: string;
  dispensers_count?: number;
  station_type?: string[];
  emergency_alert?: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  mobile: string;
  role: 'user' | 'owner' | 'admin';
  status: VerificationStatus;
  // Owner specific info
  dob?: string;
  nid?: string;
  photo?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  user_id: string;
  pump_id: string;
  fuel_type: keyof FuelTypes;
  status: FuelStatus;
  timestamp: string;
  is_owner?: boolean;
  comment?: string;
  owner_response?: string;
  is_resolved?: boolean;
}

export interface AggregatedStatus {
  status: FuelStatus;
  confidence: number;
  total_reports: number;
  last_updated: string;
  is_owner_verified: boolean;
  breakdown: Record<FuelStatus, number>;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  pump_id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface OwnerClaim {
  id: string;
  user_id: string;
  pump_id: string;
  verification_status: VerificationStatus;
  timestamp: string;
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

export interface PopupBanner {
  image_url: string;
  link?: string;
  is_active: boolean;
}

export interface LocationData {
  id: string;
  division: string;
  districts: {
    name: string;
    upazilas: string[];
  }[];
}

export interface SystemStats {
  totalUsers: number;
  totalPumps: number;
  totalOwners: number;
  totalReports: number;
}

export interface Order {
  id?: string;
  user_id: string;
  pump_id: string;
  fuel_type: keyof FuelTypes;
  amount_liters: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  customer_name: string;
  customer_phone: string;
}
