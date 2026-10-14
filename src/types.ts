export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD' | 'JPY';

export interface CurrencyRate {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number; // relative to USD base
  shippingBase: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  leadTimeDays: number;
  rating: number;
  activeProductsCount: number;
  fulfillmentMethod: 'Automated EDI' | 'Direct Email PO' | 'API Webhook';
}

export interface SupplierLiveSyncInfo {
  destinationCountry: string;
  stock: number;
  leadDaysMin: number;
  leadDaysMax: number;
  deliveryEstimate: string; // e.g., "Sept 23 - Sept 26"
  leadDaysLabel: string; // e.g., "2-4 business days"
  warehouseOrigin: string; // e.g., "US West Fulfillment Depot (Chino, CA)"
  carrier: string; // e.g., "USPS Priority Commercial"
  shippingFeeUSD: number;
  supplierLink: string;
  supplierPlatform: string;
  syncedAt: string;
  status: 'Verified Live' | 'Cached Sync' | 'Syncing';
}

export interface CustomerLocation {
  country: string;
  countryCode: string;
  city?: string;
  pincode?: string;
  flag: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
  photos?: string[];
}

export interface SavedAddress {
  id: string;
  label: string; // 'Home', 'Office'
  recipientName: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  isDefault?: boolean;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  savedAddresses?: SavedAddress[];
  ordersCount?: number;
  membershipTier?: 'Kovira Member' | 'Kovira VIP' | 'Kovira Platinum';
}

export interface DropshipDeliveryQuote {
  supplierPlatform: 'DeoDap' | 'Baapstore' | 'Multi-Supplier' | string;
  originHub: string;
  destinationCity: string;
  destinationPincode: string;
  destinationCountry: string;
  dispatchTimeHours: number;
  dispatchLabel: string;
  transitDaysMin: number;
  transitDaysMax: number;
  deliveryDateRange: string;
  carrier: string;
  shippingFeeUSD: number;
  isFreeShipping: boolean;
  status: 'Direct Linked to Dropship Hub' | 'Live Calculated';
  leadDaysMin?: number;
  leadDaysMax?: number;
  estimatedDeliveryWindow?: string;
  warehouseOrigin?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  priceUSD: number;
  costUSD: number; // supplier dropship cost
  stock: number;
  reorderPoint: number;
  reorderQuantity: number;
  sku: string;
  supplierId: string;
  supplierName: string;
  supplierLeadDays: number;
  images: string[];
  rating: number;
  reviewsCount: number;
  reviews?: ProductReview[];
  tags: string[];
  weightKg: number;
  isDropshipped: boolean;
  featured?: boolean;
  supplierLink?: string;
  supplierPlatform?: string;
  liveSync?: SupplierLiveSyncInfo;
  regionalStock?: Record<string, number>;
  isPublished?: boolean; // false = In Admin Staging Review; true = Published to Public Store
  marginPercent?: number; // e.g. 40 for 40% margin
  wholesaleINR?: number; // Supplier wholesale price in INR
  deliveryChargeINR?: number; // Additional delivery charges in INR
}

export interface RestockNotification {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  sku: string;
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  currentStock: number;
  orderedUnits: number;
  status: 'Dispatched' | 'Acknowledged' | 'In Transit' | 'Fulfilled';
  purchaseOrderNumber: string;
  estimatedArrival: string;
  autoTriggered: boolean;
}

export interface OrderItem {
  productId: string;
  title: string;
  sku: string;
  price: number;
  currency: CurrencyCode;
  quantity: number;
  supplierId: string;
  supplierName: string;
  image: string;
  supplierPlatform?: string;
  selectedSize?: string;
  isDress?: boolean;
  deliveryChargeINR?: number;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  items: OrderItem[];
  customer: CustomerDetails;
  currency: CurrencyCode;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: 'UPI' | 'UPI - QR Scanner' | 'UPI - App Deeplink' | 'UPI - ID Collect' | 'Stripe Credit Card' | 'Cash on Delivery' | string;
  paymentStatus: 'Paid' | 'Processing' | 'Refunded';
  stripePaymentIntentId?: string;
  upiReferenceNumber?: string;
  upiVpa?: string;
  fulfillmentStatus: 'Order Placed with Supplier' | 'Supplier Processing' | 'Shipped via Express' | 'Delivered' | string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedDelivery?: string;
  originWarehouse?: string;
}

export interface DaySales {
  day: string; // e.g., Mon, Tue, etc.
  date: string;
  revenueUSD: number;
  orders: number;
}

export interface AnalyticsSummary {
  weeklySales: DaySales[];
  totalRevenueUSD: number;
  totalOrders: number;
  avgOrderValueUSD: number;
  returningCustomerRate: number;
  inventoryHealthScore: number;
  regionalBreakdown: { country: string; orders: number; share: number }[];
  supplierPerformance: { supplierName: string; onTimeRate: number; activeSKUs: number }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'support' | 'system';
  text: string;
  timestamp: string;
  orderAction?: {
    orderNumber: string;
    status: string;
    carrier?: string;
    trackingNumber?: string;
  };
}

export type DropshipPlatformName = 'DeoDap' | 'Baapstore' | 'CJdropshipping';

export interface DropshipPlatformSettings {
  platform: DropshipPlatformName;
  isEnabled: boolean;
  apiKey: string;
  catalogFeedUrl: string;
  vendorAccountId?: string;
  apiSecret?: string;
  syncIntervalMinutes: number;
  priceMarkupMultiplier: number;
  autoSyncInventory: boolean;
  autoOrderPush: boolean;
  defaultCourier: string;
  originWarehouseHub: string;
  lastSyncedAt?: string;
  syncStatus: 'Active & Linked' | 'Syncing' | 'Needs Configuration' | 'Error';
}

export interface DropshipCatalogItem {
  id: string;
  platform: DropshipPlatformName;
  title: string;
  description: string;
  category: string;
  costUSD: number;
  shippingCostUSD: number;
  suggestedRetailUSD: number;
  marginPercent: number;
  leadDays: number;
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  rating: number;
  ordersCount: number;
  stock: number;
  images: string[];
  tags: string[];
  sku: string;
  badge?: string;
  supplierLink?: string;
  warehouseLocation?: string;
  fulfillmentType?: string;
  isCustomizable?: boolean;
}

export interface SupplierPlatformInfo {
  id: DropshipPlatformName;
  name: string;
  tagline: string;
  badge: string;
  color: string;
  logoIcon: string;
  deliverySpeed: string;
  warehouseHubs: string;
  moq: string;
  fulfillmentMethod: string;
  apiStatus: 'Connected' | 'Ready to Sync' | 'Live Webhook';
  description: string;
  features: string[];
  sampleCategories: string[];
  itemCount: number;
}

export interface StoreAnnouncement {
  id: string;
  isEnabled: boolean;
  headline: string;
  subText: string;
  badge: string;
  promoCode: string;
  discountPercent: number;
  freeShippingThresholdINR: number;
  freeShippingThresholdUSD: number;
  linkUrl: string;
  linkText: string;
  theme: 'slate' | 'indigo' | 'emerald' | 'amber' | 'rose';
  updatedAt: string;
}

export interface AbandonedCartRecord {
  id: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotalUSD: number;
  currency: CurrencyCode;
  lastActive: string;
  status: 'Pending' | 'Recovery Sent' | 'Recovered' | 'Expired';
  recoveryDiscountCode?: string;
  recoverySentAt?: string;
}

export interface CategoryMarginPreset {
  category: string;
  multiplier: number;
  description?: string;
}

export interface DressProduct {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  features: string[];
  sizes: string[];
  baseCostINR: number;
  marginPercent: number; // Default 40% margin
  priceINR: number; // e.g. 460
  priceUSD: number; // For cart/checkout compatibility
  mrpINR: number; // e.g. 769
  discountPercent: number; // e.g. 40% discount
  showDiscount: boolean; // Highlight discount on thumbnail photo
  deliveryChargeINR: number; // 80 (₹80 Pan-India delivery)
  orderPhone?: string;
  instagramHandle?: string;
  tagline: string; // 💖 Trendy Look • Premium Feel • Perfect Style 💖
  images: string[];
  stock: number;
  sku: string;
  designCode?: string;
  material?: string;
  fullDescription?: string;
  specifications?: Record<string, string>;
  daysRemaining?: number;
  rating: number;
  reviewsCount: number;
  createdAt: string;
  isPublished: boolean;
}

export interface UploadedWebLink {
  id: string;
  url: string;
  supplierName: string;
  detectedDomain: string;
  uploadedAt: string;
  marginPercent: number;
  productsCount: number;
  productTitles: string[];
  status: 'Synced' | 'Active in Store';
  sampleImage?: string;
  discountPercent?: number;
  discountBanner?: string;
}

export interface RandomDiscountConfig {
  enabled: boolean;
  minPercent: number;
  maxPercent: number;
  bannerText: string;
  badgeTheme: 'rose' | 'amber' | 'cyan' | 'emerald';
  productCoveragePercent: number;
  lastUpdated?: string;
}

