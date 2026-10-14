export interface PostalLocationResult {
  city: string;
  state: string;
  country: string;
  couriers: string[];
  hub: string;
}

// Extensive intelligent dictionary of regional pin/zip codes
const PINCODE_MAP: Record<string, PostalLocationResult> = {
  // INDIA - Major Metro & Tier 1/2 Distribution Hubs
  '11': { city: 'New Delhi', state: 'Delhi NCR', country: 'India', couriers: ['Blue Dart Air', 'Delhivery Express'], hub: 'Delhi Central Airport Cargo' },
  '12': { city: 'Gurugram', state: 'Haryana', country: 'India', couriers: ['Delhivery Prime', 'Blue Dart'], hub: 'North India Express Gateway' },
  '13': { city: 'Ambala / Karnal', state: 'Haryana', country: 'India', couriers: ['Delhivery Surface', 'Blue Dart'], hub: 'Haryana Regional Logistics' },
  '14': { city: 'Ludhiana / Jalandhar', state: 'Punjab', country: 'India', couriers: ['Delhivery', 'Blue Dart'], hub: 'Punjab Central Hub' },
  '16': { city: 'Chandigarh', state: 'Chandigarh', country: 'India', couriers: ['Blue Dart', 'Delhivery Priority'], hub: 'Chandigarh Air Cargo' },
  '20': { city: 'Noida / Greater Noida', state: 'Uttar Pradesh', country: 'India', couriers: ['Delhivery Air', 'Blue Dart'], hub: 'NCR East Logistics Park' },
  '22': { city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', couriers: ['Blue Dart', 'Delhivery'], hub: 'Lucknow Hub' },
  '30': { city: 'Jaipur', state: 'Rajasthan', country: 'India', couriers: ['Delhivery', 'Blue Dart Express'], hub: 'Jaipur Logistics Terminal' },
  '36': { city: 'Rajkot', state: 'Gujarat', country: 'India', couriers: ['Delhivery Surface & Air', 'Trackon'], hub: 'National Central Hub (Rajkot)' },
  '38': { city: 'Ahmedabad', state: 'Gujarat', country: 'India', couriers: ['Blue Dart', 'Delhivery Express'], hub: 'Ahmedabad Air Cargo' },
  '39': { city: 'Surat / Vadodara', state: 'Gujarat', country: 'India', couriers: ['Blue Dart Express', 'Delhivery'], hub: 'South Gujarat Industrial Corridor' },
  '40': { city: 'Mumbai', state: 'Maharashtra', country: 'India', couriers: ['Blue Dart Priority', 'Delhivery Air'], hub: 'Mumbai Chhatrapati Shivaji Cargo' },
  '41': { city: 'Pune', state: 'Maharashtra', country: 'India', couriers: ['Blue Dart Express', 'Delhivery'], hub: 'Pune Logistics Terminal' },
  '42': { city: 'Nashik / Thane', state: 'Maharashtra', country: 'India', couriers: ['Delhivery', 'Blue Dart'], hub: 'Maharashtra Industrial Hub' },
  '44': { city: 'Nagpur', state: 'Maharashtra', country: 'India', couriers: ['Delhivery', 'Blue Dart Express'], hub: 'Central India Multimodal Hub' },
  '45': { city: 'Indore', state: 'Madhya Pradesh', country: 'India', couriers: ['Blue Dart', 'Delhivery'], hub: 'Indore Cargo Complex' },
  '50': { city: 'Hyderabad', state: 'Telangana', country: 'India', couriers: ['Blue Dart Apex', 'Delhivery Air'], hub: 'Hyderabad Rajiv Gandhi Airport Cargo' },
  '56': { city: 'Bengaluru', state: 'Karnataka', country: 'India', couriers: ['Blue Dart Priority', 'Delhivery Prime'], hub: 'Bengaluru Kempegowda Logistics Park' },
  '60': { city: 'Chennai', state: 'Tamil Nadu', country: 'India', couriers: ['Blue Dart', 'Delhivery Air'], hub: 'Baapstore Express South Gateway (Chennai)' },
  '64': { city: 'Coimbatore', state: 'Tamil Nadu', country: 'India', couriers: ['Delhivery', 'Blue Dart'], hub: 'Tamil Nadu Western Terminal' },
  '68': { city: 'Kochi / Ernakulam', state: 'Kerala', country: 'India', couriers: ['Blue Dart', 'Delhivery Air'], hub: 'Cochin International Cargo' },
  '69': { city: 'Thiruvananthapuram', state: 'Kerala', country: 'India', couriers: ['Blue Dart', 'Delhivery'], hub: 'Kerala South Hub' },
  '70': { city: 'Kolkata', state: 'West Bengal', country: 'India', couriers: ['Blue Dart Air', 'Delhivery Priority'], hub: 'Kolkata Netaji Subhash Cargo' },
  '80': { city: 'Patna', state: 'Bihar', country: 'India', couriers: ['Delhivery', 'Blue Dart'], hub: 'Eastern Logistics Hub' },

  // UNITED STATES - Major Hubs
  '100': { city: 'New York', state: 'NY', country: 'United States', couriers: ['USPS Priority', 'FedEx Home'], hub: 'JFK Air Cargo Terminal' },
  '101': { city: 'New York', state: 'NY', country: 'United States', couriers: ['USPS Priority', 'FedEx'], hub: 'New York Metro Depot' },
  '900': { city: 'Los Angeles', state: 'CA', country: 'United States', couriers: ['USPS Commercial', 'FedEx Ground'], hub: 'LAX International Air Freight' },
  '902': { city: 'Beverly Hills / Los Angeles', state: 'CA', country: 'United States', couriers: ['FedEx Express', 'USPS'], hub: 'Southern California Hub' },
  '917': { city: 'Chino / Ontario', state: 'CA', country: 'United States', couriers: ['FedEx Home', 'USPS Priority'], hub: 'CJ US West Central Depot (Chino, CA)' },
  '941': { city: 'San Francisco', state: 'CA', country: 'United States', couriers: ['USPS Priority', 'FedEx Express'], hub: 'Bay Area Cargo Terminal' },
  '981': { city: 'Seattle', state: 'WA', country: 'United States', couriers: ['USPS Priority', 'UPS Next Day'], hub: 'Pacific Northwest Logistics' },
  '606': { city: 'Chicago', state: 'IL', country: 'United States', couriers: ['USPS Priority', 'FedEx Express'], hub: 'O Hare International Cargo' },
  '750': { city: 'Dallas / Fort Worth', state: 'TX', country: 'United States', couriers: ['FedEx Ground', 'USPS'], hub: 'DFW Central Hub' },
  '770': { city: 'Houston', state: 'TX', country: 'United States', couriers: ['USPS Commercial', 'FedEx'], hub: 'Texas Gulf Logistics' },
  '331': { city: 'Miami', state: 'FL', country: 'United States', couriers: ['USPS Priority', 'DHL Express'], hub: 'Miami Gateway Hub' },
  '021': { city: 'Boston', state: 'MA', country: 'United States', couriers: ['USPS Priority', 'FedEx'], hub: 'New England Hub' },
};

export function lookupPostalCode(code: string, currentCountry = 'India'): PostalLocationResult | null {
  if (!code) return null;
  const clean = code.trim().replace(/\s+/g, '');

  // Exact 6-digit or 2-digit prefix match for India
  if (currentCountry.toLowerCase().includes('india') || /^\d{6}$/.test(clean)) {
    const prefix2 = clean.slice(0, 2);
    if (PINCODE_MAP[prefix2]) {
      return PINCODE_MAP[prefix2];
    }
  }

  // Exact 5-digit or 3-digit prefix match for US
  if (currentCountry.toLowerCase().includes('united states') || currentCountry.toLowerCase() === 'us' || /^\d{5}$/.test(clean)) {
    const prefix3 = clean.slice(0, 3);
    if (PINCODE_MAP[prefix3]) {
      return PINCODE_MAP[prefix3];
    }
  }

  // Fallback for 2-digit match across dictionary
  const p2 = clean.slice(0, 2);
  if (PINCODE_MAP[p2]) {
    return PINCODE_MAP[p2];
  }

  return null;
}
