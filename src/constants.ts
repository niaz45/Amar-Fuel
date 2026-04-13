export const DIVISIONS = [
  "Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh"
];

export const DISTRICTS: Record<string, string[]> = {
  "Dhaka": ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Manikganj", "Munshiganj", "Narsingdi", "Faridpur", "Gopalganj", "Madaripur", "Rajbari", "Shariatpur", "Kishoreganj"],
  "Chattogram": ["Chattogram", "Cox's Bazar", "Cumilla", "Feni", "Brahmanbaria", "Chandpur", "Lakshmipur", "Noakhali", "Khagrachhari", "Rangamati", "Bandarban"],
  "Rajshahi": ["Rajshahi", "Bogura", "Pabna", "Sirajganj", "Joypurhat", "Naogaon", "Natore", "Chapai Nawabganj"],
  "Khulna": ["Khulna", "Jashore", "Kushtia", "Satkhira", "Bagerhat", "Chuadanga", "Jhenaidah", "Magura", "Meherpur", "Narail"],
  "Barishal": ["Barishal", "Bhola", "Patuakhali", "Pirojpur", "Barguna", "Jhalokati"],
  "Sylhet": ["Sylhet", "Habiganj", "Moulvibazar", "Sunamganj"],
  "Rangpur": ["Rangpur", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Thakurgaon"],
  "Mymensingh": ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"]
};

export const UPAZILAS: Record<string, string[]> = {
  "Dhaka": ["Dhanmondi", "Gulshan", "Uttara", "Mirpur", "Savar", "Keraniganj", "Tejgaon", "Mohammadpur", "Badda", "Ramna", "Motijheel", "Dhamrai", "Dohar", "Nawabganj"],
  "Gazipur": ["Gazipur Sadar", "Kaliakair", "Sreepur", "Kaliganj", "Kapasia"],
  "Narayanganj": ["Narayanganj Sadar", "Bandar", "Araihazar", "Rupganj", "Sonargaon"],
  "Chattogram": ["Panchlaish", "Double Mooring", "Kotwali", "Hathazari", "Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Fatikchhari", "Lohagara", "Mirsharai", "Patiya", "Rangunia", "Raozan", "Sandwip", "Satkania", "Sitakunda"],
  "Cox's Bazar": ["Cox's Bazar Sadar", "Chakaria", "Maheshkhali", "Ramu", "Teknaf", "Ukhia", "Pekua", "Kutubdia"],
  "Rajshahi": ["Boalia", "Rajpara", "Motihar", "Shah Makhdum", "Paba", "Bagmara", "Charghat", "Durgapur", "Godagari", "Mohanpur", "Puthia", "Tanore"],
  "Bogura": ["Bogura Sadar", "Adamdighi", "Dhunat", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur", "Sherpur", "Shibganj", "Sonatola"],
  "Khulna": ["Khulna Sadar", "Daulatpur", "Khalishpur", "Khan Jahan Ali", "Sonadanga", "Batiaghata", "Dacope", "Dumuria", "Dighalia", "Koyra", "Paikgachha", "Phultala", "Rupsha", "Terokhada"],
  "Sylhet": ["Sylhet Sadar", "Balaganj", "Beanibazar", "Bishwanath", "Companiganj", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Dakshin Surma", "Zakiganj"],
  "Barishal": ["Barishal Sadar", "Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Gaurnadi", "Hizla", "Mehendiganj", "Muladi", "Wazirpur"],
  "Rangpur": ["Rangpur Sadar", "Badarganj", "Gangachara", "Kaunia", "Mithapukur", "Pirgachha", "Pirganj", "Taraganj"],
  "Mymensingh": ["Mymensingh Sadar", "Bhaluka", "Dhobaura", "Fulbaria", "Gaffargaon", "Gauripur", "Haluaghat", "Ishwarganj", "Muktagachha", "Nandail", "Phulpur", "Trishal"]
};

export const FUEL_TYPES = ["octane", "petrol", "diesel", "cng"] as const;

export const STATUS_COLORS: Record<string, string> = {
  "available": "bg-status-available-bg text-status-available-text border-transparent",
  "low": "bg-status-low-bg text-status-low-text border-transparent",
  "out_of_stock": "bg-status-out-bg text-status-out-text border-transparent"
};

export const STATUS_LABELS: Record<string, string> = {
  "available": "Available ✅",
  "low": "Low ⚠️",
  "out_of_stock": "Out of Stock ❌"
};

export const DEFAULT_INVENTORY = {
  octane: { current_liters: 5000, capacity: 10000, daily_usage_avg: 450, last_refill_date: '', last_refill_amount: 0 },
  petrol: { current_liters: 2000, capacity: 10000, daily_usage_avg: 600, last_refill_date: '', last_refill_amount: 0 },
  diesel: { current_liters: 0, capacity: 15000, daily_usage_avg: 800, last_refill_date: '', last_refill_amount: 0 },
  cng: { current_liters: 8000, capacity: 10000, daily_usage_avg: 1200, last_refill_date: '', last_refill_amount: 0 },
  lpg: { current_liters: 4000, capacity: 5000, daily_usage_avg: 200, last_refill_date: '', last_refill_amount: 0 }
};
