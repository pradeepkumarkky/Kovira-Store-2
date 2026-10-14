import { CustomerLocation, SupplierLiveSyncInfo, Product } from '../types';

export const SUPPORTED_LOCATIONS: CustomerLocation[] = [
  { country: 'India', countryCode: 'IN', flag: '🇮🇳' },
  { country: 'United States', countryCode: 'US', flag: '🇺🇸' },
  { country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧' },
  { country: 'Canada', countryCode: 'CA', flag: '🇨🇦' },
  { country: 'Australia', countryCode: 'AU', flag: '🇦🇺' },
  { country: 'Germany', countryCode: 'DE', flag: '🇩🇪' },
  { country: 'France', countryCode: 'FR', flag: '🇫🇷' },
  { country: 'Japan', countryCode: 'JP', flag: '🇯🇵' },
  { country: 'Singapore', countryCode: 'SG', flag: '🇸🇬' },
  { country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱' },
  { country: 'Sweden', countryCode: 'SE', flag: '🇸🇪' },
];

export const DEFAULT_LOCATION: CustomerLocation = SUPPORTED_LOCATIONS[0];

// Format date range (e.g., "Sept 23 - Sept 26")
export function calculateDeliveryDateRange(minDays: number, maxDays: number): string {
  const now = new Date();
  
  const minDate = new Date(now.getTime() + minDays * 86400000);
  const maxDate = new Date(now.getTime() + maxDays * 86400000);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const minMonth = months[minDate.getMonth()];
  const minDay = minDate.getDate();
  const maxMonth = months[maxDate.getMonth()];
  const maxDay = maxDate.getDate();

  if (minMonth === maxMonth) {
    return `${minMonth} ${minDay} - ${maxDay}`;
  }
  return `${minMonth} ${minDay} - ${maxMonth} ${maxDay}`;
}

export const getEstimatedDeliveryDate = calculateDeliveryDateRange;

export interface RegionalSupplierRouting {
  warehouse: string;
  originWarehouse: string;
  leadDaysMin: number;
  leadDaysMax: number;
  carrier: string;
  stockRatio: number;
}

export function getRegionalRouting(country: string, supplierName = ''): RegionalSupplierRouting {
  const norm = country.toLowerCase().trim();
  const sLower = supplierName.toLowerCase();
  const isCJ = sLower.includes('cj') || sLower.includes('cjdropshipping');

  if (isCJ) {
    if (norm.includes('united states') || norm.includes('usa') || norm === 'us') {
      return {
        warehouse: 'Kovira US West Logistics Center (Chino, CA)',
        originWarehouse: 'US West Logistics Center (Chino, CA)',
        leadDaysMin: 2,
        leadDaysMax: 4,
        carrier: 'USPS Priority Commercial / FedEx Home',
        stockRatio: 1.0,
      };
    }
    if (norm.includes('germany') || norm.includes('france') || norm.includes('netherlands') || norm.includes('europe') || norm.includes('uk') || norm.includes('kingdom')) {
      return {
        warehouse: 'Kovira European Logistics Depot (Frankfurt, Germany)',
        originWarehouse: 'European Logistics Depot (Frankfurt, Germany)',
        leadDaysMin: 2,
        leadDaysMax: 4,
        carrier: 'DHL Paket Europe / Royal Mail Tracked',
        stockRatio: 1.0,
      };
    }
    return {
      warehouse: 'Kovira Global Aviation Hub (Shenzhen Central Depot)',
      originWarehouse: 'Global Aviation Hub (Shenzhen Central Depot)',
      leadDaysMin: 5,
      leadDaysMax: 8,
      carrier: 'Priority Air Express / DHL Express',
      stockRatio: 0.95,
    };
  }

  if (norm.includes('india') || norm === 'in') {
    const isSouth = supplierName.toLowerCase().includes('baap') || supplierName.toLowerCase().includes('chennai');
    const wh = isSouth
      ? 'Express National Logistics Center (Chennai Hub & Surat Center)'
      : 'National Central Logistics Hub (Rajkot Fulfillment Center)';
    return {
      warehouse: wh,
      originWarehouse: wh,
      leadDaysMin: 2,
      leadDaysMax: 4,
      carrier: 'Delhivery Surface & Air / Blue Dart Express Tracked',
      stockRatio: 1.0,
    };
  }

  if (norm.includes('united states') || norm.includes('usa') || norm === 'us') {
    const wh = 'Cross-Border Air Express (USPS Priority Direct)';
    return {
      warehouse: wh,
      originWarehouse: wh,
      leadDaysMin: 4,
      leadDaysMax: 7,
      carrier: 'DHL Express / FedEx International Connect Plus',
      stockRatio: 0.95,
    };
  }

  if (norm.includes('united kingdom') || norm.includes('uk') || norm.includes('great britain')) {
    const wh = 'UK Air Priority Gateway (Heathrow Cargo Hub)';
    return {
      warehouse: wh,
      originWarehouse: wh,
      leadDaysMin: 4,
      leadDaysMax: 7,
      carrier: 'Royal Mail 48 Tracked / DHL Express',
      stockRatio: 0.9,
    };
  }

  if (norm.includes('canada') || norm === 'ca') {
    const wh = 'North America Air Transit (Toronto Gateway)';
    return {
      warehouse: wh,
      originWarehouse: wh,
      leadDaysMin: 5,
      leadDaysMax: 8,
      carrier: 'Canada Post Tracked / FedEx International',
      stockRatio: 0.85,
    };
  }

  if (norm.includes('australia') || norm === 'au') {
    const wh = 'Oceania Air Link Hub (Sydney Kingsford)';
    return {
      warehouse: wh,
      originWarehouse: wh,
      leadDaysMin: 5,
      leadDaysMax: 8,
      carrier: 'Australia Post eParcel / DHL Global Mail',
      stockRatio: 0.8,
    };
  }

  if (norm.includes('germany') || norm.includes('france') || norm.includes('netherlands') || norm.includes('sweden') || norm.includes('europe')) {
    const wh = 'Euro Air Gateway (Frankfurt Air Logistics)';
    return {
      warehouse: wh,
      originWarehouse: wh,
      leadDaysMin: 4,
      leadDaysMax: 8,
      carrier: 'DHL Express Europe / DPD Tracked',
      stockRatio: 0.85,
    };
  }

  if (norm.includes('united arab emirates') || norm.includes('dubai') || norm.includes('uae')) {
    const wh = 'Middle East Express Air Cargo (Dubai DXB)';
    return {
      warehouse: wh,
      originWarehouse: wh,
      leadDaysMin: 3,
      leadDaysMax: 5,
      carrier: 'Aramex Priority Express / Emirates SkyCargo',
      stockRatio: 0.95,
    };
  }

  // Rest of World / Global Dispatch
  const globalWh = 'International Direct Air Hub (Central Air Cargo)';
  return {
    warehouse: globalWh,
    originWarehouse: globalWh,
    leadDaysMin: 6,
    leadDaysMax: 10,
    carrier: 'DHL International Express / India Post Speed Post EMS',
    stockRatio: 0.9,
  };
}

export function computeProductLiveSync(product: Product, country: string): SupplierLiveSyncInfo {
  const routing = getRegionalRouting(country, product.supplierName);
  
  // Calculate regional stock based on product base stock and regional ratio
  const regionalStock = Math.max(1, Math.round(product.stock * routing.stockRatio));
  const deliveryEstimate = calculateDeliveryDateRange(routing.leadDaysMin, routing.leadDaysMax);

  const defaultPlatform = product.supplierName?.toLowerCase().includes('baap') ? 'Baapstore' : 'DeoDap';
  const defaultLink = defaultPlatform === 'Baapstore'
    ? `https://baapstore.com/product/${product.sku.toLowerCase()}`
    : `https://deodap.in/products/${product.sku.toLowerCase()}`;

  return {
    destinationCountry: country,
    stock: regionalStock,
    leadDaysMin: routing.leadDaysMin,
    leadDaysMax: routing.leadDaysMax,
    leadDaysLabel: `${routing.leadDaysMin}–${routing.leadDaysMax} business days`,
    deliveryEstimate,
    warehouseOrigin: routing.warehouse,
    carrier: routing.carrier,
    shippingFeeUSD: 0,
    supplierLink: product.supplierLink || defaultLink,
    supplierPlatform: product.supplierPlatform || defaultPlatform,
    syncedAt: new Date().toISOString(),
    status: 'Verified Live',
  };
}
