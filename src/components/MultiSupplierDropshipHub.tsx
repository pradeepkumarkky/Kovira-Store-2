import React, { useState, useEffect } from 'react';
import {
  DROPSHIP_PLATFORMS,
  DROPSHIP_CATALOG_ITEMS,
  BRAND_AND_TAGLINE_SUGGESTIONS,
} from '../data/dropshipSuppliersData';
import { DropshipPlatformName, DropshipCatalogItem, Product, CurrencyCode } from '../types';
import { formatPrice, CURRENCIES } from '../utils/currency';
import {
  Globe,
  Package,
  Zap,
  Layers,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Percent,
  Truck,
  ShieldCheck,
  Search,
  ExternalLink,
  Plus,
  RefreshCw,
  Copy,
  Sliders,
  DollarSign,
  Boxes,
  HelpCircle,
  Settings,
  Key,
  Link,
  Save,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Server,
  Activity,
  Warehouse,
} from 'lucide-react';

interface MultiSupplierDropshipHubProps {
  onProductImported: (product: Product) => void;
  onNavigateToInventory?: () => void;
  currency?: CurrencyCode;
}

interface PlatformSettingsState {
  apiKey: string;
  apiSecret?: string;
  partnerId?: string;
  endpointUrl: string;
  webhookUrl: string;
  syncPricing: boolean;
  syncInventory: boolean;
  autoPushOrders: boolean;
  pricingMarkupMultiplier: number;
  defaultShippingCarrier: string;
  fulfillmentWarehouse: string;
  connected?: boolean;
  lastSyncTimestamp?: string;
}

export const MultiSupplierDropshipHub: React.FC<MultiSupplierDropshipHubProps> = ({
  onProductImported,
  onNavigateToInventory,
  currency = 'INR',
}) => {
  const curSymbol = CURRENCIES[currency]?.symbol || '₹';
  const [selectedPlatform, setSelectedPlatform] = useState<DropshipPlatformName | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'catalog' | 'platforms' | 'brand_taglines' | 'guide'>('settings');

  // Custom margin state per item
  const [customMargins, setCustomMargins] = useState<{ [itemId: string]: number }>({});
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<{ [itemId: string]: boolean }>({});
  const [bulkImporting, setBulkImporting] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [copiedTagline, setCopiedTagline] = useState<string | null>(null);

  // Settings State for DeoDap & Baapstore
  const [settings, setSettings] = useState<{ [key: string]: PlatformSettingsState }>({
    DeoDap: {
      apiKey: 'DEODAP_LIVE_KEY_8492048',
      partnerId: 'DEODAP_PARTNER_RAJKOT_01',
      endpointUrl: 'https://api.deodap.com/v2/catalog',
      webhookUrl: 'https://kovira.app/api/dropship/webhook/deodap',
      syncPricing: true,
      syncInventory: true,
      autoPushOrders: true,
      pricingMarkupMultiplier: 2.2,
      defaultShippingCarrier: 'Delhivery Express / Xpressbees',
      fulfillmentWarehouse: 'DeoDap Central Logistics (Rajkot, Gujarat)',
      connected: true,
    },
    Baapstore: {
      apiKey: 'BAAP_LIVE_KEY_9381023',
      partnerId: 'BAAP_PARTNER_CHENNAI_88',
      endpointUrl: 'https://catalog.baapstore.com/api/v1/sync',
      webhookUrl: 'https://kovira.app/api/dropship/webhook/baapstore',
      syncPricing: true,
      syncInventory: true,
      autoPushOrders: true,
      pricingMarkupMultiplier: 2.0,
      defaultShippingCarrier: 'Blue Dart / Ecom Express',
      fulfillmentWarehouse: 'Baapstore Express Hub (Chennai, Tamil Nadu)',
      connected: true,
    },
    CJdropshipping: {
      apiKey: 'CJ_LIVE_KEY_8829401b',
      partnerId: 'CJ-PARTNER-79124',
      endpointUrl: 'https://developers.cjdropshipping.com/api2.0/v1',
      webhookUrl: 'https://kovira.app/api/dropship/webhook/cjdropshipping',
      syncPricing: true,
      syncInventory: true,
      autoPushOrders: true,
      pricingMarkupMultiplier: 2.4,
      defaultShippingCarrier: 'CJPacket Fast Line / USPS Priority Direct',
      fulfillmentWarehouse: 'CJ US West Warehouse (Chino, CA)',
      connected: true,
    },
  });

  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({
    DeoDap: false,
    Baapstore: false,
    CJdropshipping: false,
  });

  const [testingConnection, setTestingConnection] = useState<{ [key: string]: boolean }>({});
  const [savingSettings, setSavingSettings] = useState<{ [key: string]: boolean }>({});
  const [syncingCatalog, setSyncingCatalog] = useState<{ [key: string]: boolean }>({});
  const [connectionTestResult, setConnectionTestResult] = useState<{
    [key: string]: { success: boolean; message: string; latencyMs?: number; activeSKUs?: number };
  }>({});

  // Fetch persisted settings from backend on mount
  useEffect(() => {
    fetch('/api/dropship/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => console.error('Failed to load dropship settings:', err));
  }, []);

  // Filtered catalog items
  const filteredCatalog = DROPSHIP_CATALOG_ITEMS.filter((item) => {
    const matchesPlatform = selectedPlatform === 'all' || item.platform === selectedPlatform;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.platform.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesCategory && matchesSearch;
  });

  const getRetailPrice = (item: DropshipCatalogItem) => {
    const customMarkup = customMargins[item.id];
    if (customMarkup !== undefined) {
      return customMarkup;
    }
    return item.suggestedRetailUSD;
  };

  const handlePriceChange = (itemId: string, newPrice: number) => {
    setCustomMargins((prev) => ({
      ...prev,
      [itemId]: Math.max(1, newPrice),
    }));
  };

  // Import single product into Kovira live inventory
  const handleImportProduct = async (item: DropshipCatalogItem) => {
    setImportingId(item.id);
    setStatusNotification(null);

    const finalPrice = getRetailPrice(item);

    try {
      const response = await fetch('/api/dropship/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          priceUSD: finalPrice,
        }),
      });

      const data = await response.json();
      if (data.success && data.product) {
        setImportedIds((prev) => ({ ...prev, [item.id]: true }));
        onProductImported(data.product);
        setStatusNotification(`"${item.title}" successfully linked and imported into Kovira live inventory!`);
        setTimeout(() => setStatusNotification(null), 5000);
      } else {
        alert(data.error || 'Failed to import product');
      }
    } catch (err) {
      console.error('Import error:', err);
      // Fallback local addition
      const mockProduct: Product = {
        id: `prod_ds_${Date.now()}`,
        title: item.title,
        description: item.description,
        category: item.category,
        priceUSD: finalPrice,
        costUSD: item.costUSD,
        stock: item.stock,
        reorderPoint: 8,
        reorderQuantity: 30,
        sku: item.sku,
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        supplierLeadDays: item.leadDays,
        images: item.images,
        rating: item.rating,
        reviewsCount: 35,
        tags: [...item.tags, item.platform],
        weightKg: 0.5,
        isDropshipped: true,
        featured: true,
      };
      setImportedIds((prev) => ({ ...prev, [item.id]: true }));
      onProductImported(mockProduct);
      setStatusNotification(`Imported "${item.title}" into Kovira catalog.`);
      setTimeout(() => setStatusNotification(null), 5000);
    } finally {
      setImportingId(null);
    }
  };

  // Bulk import all products from current selection
  const handleBulkImport = async () => {
    setBulkImporting(true);
    setStatusNotification(null);

    try {
      const response = await fetch('/api/dropship/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const newImported: { [k: string]: boolean } = {};
        filteredCatalog.forEach((item) => {
          newImported[item.id] = true;
          if (data.products) {
            const matched = data.products.find((p: any) => p.title === item.title);
            if (matched) onProductImported(matched);
          }
        });
        setImportedIds((prev) => ({ ...prev, ...newImported }));
        setStatusNotification(data.message || `Imported ${data.importedCount || filteredCatalog.length} items!`);
        setTimeout(() => setStatusNotification(null), 6000);
      }
    } catch (err) {
      console.error('Bulk import error:', err);
      filteredCatalog.forEach((item) => {
        handleImportProduct(item);
      });
    } finally {
      setBulkImporting(false);
    }
  };

  // Test live connection to DeoDap, Baapstore, or CJdropshipping
  const handleTestConnection = async (platformName: DropshipPlatformName) => {
    setTestingConnection((prev) => ({ ...prev, [platformName]: true }));
    setConnectionTestResult((prev) => {
      const copy = { ...prev };
      delete copy[platformName];
      return copy;
    });

    try {
      const response = await fetch('/api/dropship/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformName }),
      });
      const data = await response.json();

      setConnectionTestResult((prev) => ({
        ...prev,
        [platformName]: {
          success: data.connected,
          message: data.message,
          latencyMs: data.latencyMs,
          activeSKUs: data.activeSKUsAvailable,
        },
      }));

      if (data.connected) {
        setSettings((prev) => ({
          ...prev,
          [platformName]: {
            ...prev[platformName],
            connected: true,
          },
        }));
      }
    } catch (err) {
      setConnectionTestResult((prev) => ({
        ...prev,
        [platformName]: {
          success: false,
          message: `Network error reaching ${platformName} server.`,
        },
      }));
    } finally {
      setTestingConnection((prev) => ({ ...prev, [platformName]: false }));
    }
  };

  // Save Settings for DeoDap, Baapstore, or CJdropshipping
  const handleSaveSettings = async (platformName: DropshipPlatformName) => {
    setSavingSettings((prev) => ({ ...prev, [platformName]: true }));
    setStatusNotification(null);

    try {
      const response = await fetch('/api/dropship/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platformName,
          settings: settings[platformName],
        }),
      });
      const data = await response.json();

      if (data.success) {
        setStatusNotification(`Catalog linking settings saved for ${platformName}!`);
        setTimeout(() => setStatusNotification(null), 4000);
      } else {
        setStatusNotification(data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSavingSettings((prev) => ({ ...prev, [platformName]: false }));
    }
  };

  // Synchronize Live Catalog & Pricing/Inventory
  const handleSyncCatalog = async (platformName: DropshipPlatformName | 'all') => {
    const key = platformName;
    setSyncingCatalog((prev) => ({ ...prev, [key]: true }));
    setStatusNotification(null);

    try {
      const response = await fetch('/api/dropship/sync-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformName }),
      });
      const data = await response.json();

      if (data.success) {
        setStatusNotification(data.message);
        setTimeout(() => setStatusNotification(null), 6000);
      } else {
        alert(data.error || 'Failed to synchronize catalog');
      }
    } catch (err) {
      console.error('Error syncing catalog:', err);
    } finally {
      setSyncingCatalog((prev) => ({ ...prev, [key]: false }));
    }
  };

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTagline(identifier);
    setTimeout(() => setCopiedTagline(null), 2500);
  };

  const categories = ['all', 'Smart Gadgets', 'Lifestyle & Organizers', 'Home & Living', 'Electronics & Audio', 'Fitness & Kitchen'];

  return (
    <div className="space-y-6">
      {/* Top Banner & Hub Header */}
      <div className="bg-gradient-to-r from-[#111827] via-[#0F172A] to-[#151D30] border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-48 h-48 bg-[#FF5A43]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#0B1120] border border-slate-700 px-3 py-1 rounded-full text-xs font-semibold text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Direct Dropship Catalog Integration Active • DeoDap & Baapstore
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              DeoDap & Baapstore Catalog Linking & Dropship Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Seamlessly link live product catalogs from <strong className="text-amber-400">DeoDap</strong> (Rajkot Central Logistics, Gujarat) and{' '}
              <strong className="text-blue-400">Baapstore</strong> (Chennai Express Hub, Tamil Nadu) directly to your Kovira storefront for selling.
              Automate wholesale cost syncing, markups, real-time inventory levels, and one-click dispatch order forwarding.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <button
              onClick={() => handleSyncCatalog('all')}
              disabled={syncingCatalog['all']}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${syncingCatalog['all'] ? 'animate-spin' : ''}`} />
              {syncingCatalog['all'] ? 'Syncing Storefront...' : 'Sync All Live Catalogs'}
            </button>

            <button
              onClick={handleBulkImport}
              disabled={bulkImporting || filteredCatalog.length === 0}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/20 transition-all active:scale-95"
            >
              {bulkImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Importing Catalogs...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  1-Click Import {selectedPlatform === 'all' ? 'All' : selectedPlatform} Catalog
                </>
              )}
            </button>

            {onNavigateToInventory && (
              <button
                onClick={onNavigateToInventory}
                className="bg-[#1E293B] hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <Boxes className="w-4 h-4 text-cyan-400" />
                View In Inventory Tab
              </button>
            )}
          </div>
        </div>

        {/* Status Notification */}
        {statusNotification && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{statusNotification}</span>
          </div>
        )}
      </div>

      {/* Sub Tabs: Settings | Catalog | Platforms | Brand & Tagline Studio | Integration Guide */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'settings'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/20 font-black'
              : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Catalog Linking Settings (DeoDap & Baapstore)
        </button>

        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'catalog'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/20 font-black'
              : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          Ready-to-Sell Products ({filteredCatalog.length})
        </button>

        <button
          onClick={() => setActiveSubTab('platforms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'platforms'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/20 font-black'
              : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Suppliers Logistics Network ({DROPSHIP_PLATFORMS.length})
        </button>

        <button
          onClick={() => setActiveSubTab('brand_taglines')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'brand_taglines'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/20 font-black'
              : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Brand Names & Taglines
        </button>

        <button
          onClick={() => setActiveSubTab('guide')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'guide'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/20 font-black'
              : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Catalog Linking Guide
        </button>
      </div>

      {/* VIEW 0: CATALOG LINKING SETTINGS (Primary User Request) */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Link className="w-4 h-4 text-cyan-400" />
                  Direct Catalog Linking & Automated Sales Integration
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configure API keys, webhooks, and automatic margin multipliers to link DeoDap and Baapstore products into your Kovira storefront for immediate selling.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Auto-Sync Active (15 Min Interval)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PLATFORM 1: DeoDap Configuration Card */}
            <div className="bg-[#111827] border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 sm:p-6 space-y-5 transition-all shadow-xl">
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-lg">
                    DD
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-extrabold text-white">DeoDap Dropship Link</h4>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                        B2B #1 Direct
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Rajkot Central Logistics Hub, Gujarat • 40,000+ Viral SKUs
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                    settings.DeoDap?.connected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${settings.DeoDap?.connected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    {settings.DeoDap?.connected ? 'Linked & Active' : 'Disconnected'}
                  </span>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    DeoDap API Key / Secret Token
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys.DeoDap ? 'text' : 'password'}
                      value={settings.DeoDap?.apiKey || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          DeoDap: { ...prev.DeoDap, apiKey: e.target.value },
                        }))
                      }
                      placeholder="Enter DeoDap Partner API Key..."
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-slate-200 font-mono focus:outline-none focus:border-[#FF5A43]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys((prev) => ({ ...prev, DeoDap: !prev.DeoDap }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showKeys.DeoDap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1.5">
                      Partner / Vendor ID
                    </label>
                    <input
                      type="text"
                      value={settings.DeoDap?.partnerId || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          DeoDap: { ...prev.DeoDap, partnerId: e.target.value },
                        }))
                      }
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-[#FF5A43]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1.5">
                      Wholesale Markup Multiplier
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="1.1"
                        max="5.0"
                        value={settings.DeoDap?.pricingMarkupMultiplier || 2.2}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            DeoDap: {
                              ...prev.DeoDap,
                              pricingMarkupMultiplier: parseFloat(e.target.value) || 2.2,
                            },
                          }))
                        }
                        className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-bold focus:outline-none focus:border-[#FF5A43]"
                      />
                      <span className="text-slate-400 font-bold shrink-0">x Cost</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    Catalog Feed API Endpoint
                  </label>
                  <input
                    type="text"
                    value={settings.DeoDap?.endpointUrl || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        DeoDap: { ...prev.DeoDap, endpointUrl: e.target.value },
                      }))
                    }
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-[#FF5A43]"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    Store Order Push Webhook URL
                  </label>
                  <input
                    type="text"
                    value={settings.DeoDap?.webhookUrl || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        DeoDap: { ...prev.DeoDap, webhookUrl: e.target.value },
                      }))
                    }
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-[#FF5A43]"
                  />
                </div>

                {/* Automation Toggles */}
                <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Automated Catalog Sync Rules
                  </div>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Auto-Push Orders to DeoDap upon payment</span>
                    <input
                      type="checkbox"
                      checked={settings.DeoDap?.autoPushOrders ?? true}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          DeoDap: { ...prev.DeoDap, autoPushOrders: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-[#FF5A43] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Live Inventory Stock Level Sync</span>
                    <input
                      type="checkbox"
                      checked={settings.DeoDap?.syncInventory ?? true}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          DeoDap: { ...prev.DeoDap, syncInventory: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-[#FF5A43] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Dynamic Pricing Markup Sync</span>
                    <input
                      type="checkbox"
                      checked={settings.DeoDap?.syncPricing ?? true}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          DeoDap: { ...prev.DeoDap, syncPricing: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-[#FF5A43] rounded"
                    />
                  </label>
                </div>

                {/* Connection Test Status Output */}
                {connectionTestResult.DeoDap && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      connectionTestResult.DeoDap.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {connectionTestResult.DeoDap.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold">{connectionTestResult.DeoDap.message}</div>
                      {connectionTestResult.DeoDap.latencyMs && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          Latency: {connectionTestResult.DeoDap.latencyMs}ms • Active SKUs Verified:{' '}
                          {connectionTestResult.DeoDap.activeSKUs?.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleTestConnection('DeoDap')}
                    disabled={testingConnection.DeoDap}
                    className="flex-1 bg-[#1E293B] hover:bg-slate-700 text-slate-200 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Activity className={`w-3.5 h-3.5 text-amber-400 ${testingConnection.DeoDap ? 'animate-spin' : ''}`} />
                    {testingConnection.DeoDap ? 'Testing...' : 'Test Live Connection'}
                  </button>

                  <button
                    onClick={() => handleSyncCatalog('DeoDap')}
                    disabled={syncingCatalog.DeoDap}
                    className="bg-[#1E293B] hover:bg-slate-700 text-emerald-400 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingCatalog.DeoDap ? 'animate-spin' : ''}`} />
                    Sync DeoDap
                  </button>

                  <button
                    onClick={() => handleSaveSettings('DeoDap')}
                    disabled={savingSettings.DeoDap}
                    className="bg-[#FF5A43] hover:bg-[#e04b36] text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-[#FF5A43]/20 transition-all active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingSettings.DeoDap ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>

            {/* PLATFORM 2: Baapstore Configuration Card */}
            <div className="bg-[#111827] border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 sm:p-6 space-y-5 transition-all shadow-xl">
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-extrabold text-lg">
                    BS
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-extrabold text-white">Baapstore Dropship Link</h4>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                        100k+ SKUs Fast Dispatch
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Chennai Express Hub & Surat Hub • Next-Day Shipping
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                    settings.Baapstore?.connected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${settings.Baapstore?.connected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    {settings.Baapstore?.connected ? 'Linked & Active' : 'Disconnected'}
                  </span>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    Baapstore API Key / Secret Token
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys.Baapstore ? 'text' : 'password'}
                      value={settings.Baapstore?.apiKey || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          Baapstore: { ...prev.Baapstore, apiKey: e.target.value },
                        }))
                      }
                      placeholder="Enter Baapstore Secret API Key..."
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-slate-200 font-mono focus:outline-none focus:border-[#FF5A43]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys((prev) => ({ ...prev, Baapstore: !prev.Baapstore }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showKeys.Baapstore ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1.5">
                      Partner / Vendor ID
                    </label>
                    <input
                      type="text"
                      value={settings.Baapstore?.partnerId || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          Baapstore: { ...prev.Baapstore, partnerId: e.target.value },
                        }))
                      }
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-[#FF5A43]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1.5">
                      Wholesale Markup Multiplier
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="1.1"
                        max="5.0"
                        value={settings.Baapstore?.pricingMarkupMultiplier || 2.0}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            Baapstore: {
                              ...prev.Baapstore,
                              pricingMarkupMultiplier: parseFloat(e.target.value) || 2.0,
                            },
                          }))
                        }
                        className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-bold focus:outline-none focus:border-[#FF5A43]"
                      />
                      <span className="text-slate-400 font-bold shrink-0">x Cost</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    Catalog Feed API Endpoint
                  </label>
                  <input
                    type="text"
                    value={settings.Baapstore?.endpointUrl || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        Baapstore: { ...prev.Baapstore, endpointUrl: e.target.value },
                      }))
                    }
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-[#FF5A43]"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    Store Order Push Webhook URL
                  </label>
                  <input
                    type="text"
                    value={settings.Baapstore?.webhookUrl || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        Baapstore: { ...prev.Baapstore, webhookUrl: e.target.value },
                      }))
                    }
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-[#FF5A43]"
                  />
                </div>

                {/* Automation Toggles */}
                <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Automated Catalog Sync Rules
                  </div>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Auto-Push Orders to Baapstore upon payment</span>
                    <input
                      type="checkbox"
                      checked={settings.Baapstore?.autoPushOrders ?? true}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          Baapstore: { ...prev.Baapstore, autoPushOrders: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-[#FF5A43] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Live Inventory Stock Level Sync</span>
                    <input
                      type="checkbox"
                      checked={settings.Baapstore?.syncInventory ?? true}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          Baapstore: { ...prev.Baapstore, syncInventory: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-[#FF5A43] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Dynamic Pricing Markup Sync</span>
                    <input
                      type="checkbox"
                      checked={settings.Baapstore?.syncPricing ?? true}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          Baapstore: { ...prev.Baapstore, syncPricing: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-[#FF5A43] rounded"
                    />
                  </label>
                </div>

                {/* Connection Test Status Output */}
                {connectionTestResult.Baapstore && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      connectionTestResult.Baapstore.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {connectionTestResult.Baapstore.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold">{connectionTestResult.Baapstore.message}</div>
                      {connectionTestResult.Baapstore.latencyMs && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          Latency: {connectionTestResult.Baapstore.latencyMs}ms • Active SKUs Verified:{' '}
                          {connectionTestResult.Baapstore.activeSKUs?.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleTestConnection('Baapstore')}
                    disabled={testingConnection.Baapstore}
                    className="flex-1 bg-[#1E293B] hover:bg-slate-700 text-slate-200 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Activity className={`w-3.5 h-3.5 text-blue-400 ${testingConnection.Baapstore ? 'animate-spin' : ''}`} />
                    {testingConnection.Baapstore ? 'Testing...' : 'Test Live Connection'}
                  </button>

                  <button
                    onClick={() => handleSyncCatalog('Baapstore')}
                    disabled={syncingCatalog.Baapstore}
                    className="bg-[#1E293B] hover:bg-slate-700 text-emerald-400 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingCatalog.Baapstore ? 'animate-spin' : ''}`} />
                    Sync Baapstore
                  </button>

                  <button
                    onClick={() => handleSaveSettings('Baapstore')}
                    disabled={savingSettings.Baapstore}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingSettings.Baapstore ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>

            {/* PLATFORM 3: CJdropshipping Configuration Card */}
            <div className="bg-[#111827] border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 sm:p-6 space-y-5 transition-all shadow-xl">
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold text-lg">
                    CJ
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-extrabold text-white">CJdropshipping Direct Link</h4>
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                        Global #1 Direct
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      US East/West &amp; Germany Warehouses • 500k+ SKUs • CJPacket Express
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                    settings.CJdropshipping?.connected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${settings.CJdropshipping?.connected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    {settings.CJdropshipping?.connected ? 'Linked & Active' : 'Disconnected'}
                  </span>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    CJdropshipping API Key / Access Token
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys.CJdropshipping ? 'text' : 'password'}
                      value={settings.CJdropshipping?.apiKey || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          CJdropshipping: { ...prev.CJdropshipping, apiKey: e.target.value },
                        }))
                      }
                      placeholder="Enter CJdropshipping Access Token..."
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys((prev) => ({ ...prev, CJdropshipping: !prev.CJdropshipping }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showKeys.CJdropshipping ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1.5">
                      CJ Account / Partner ID
                    </label>
                    <input
                      type="text"
                      value={settings.CJdropshipping?.partnerId || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          CJdropshipping: { ...prev.CJdropshipping, partnerId: e.target.value },
                        }))
                      }
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1.5">
                      Wholesale Markup Multiplier
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="1.2"
                        max="5.0"
                        value={settings.CJdropshipping?.pricingMarkupMultiplier || 2.4}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            CJdropshipping: {
                              ...prev.CJdropshipping,
                              pricingMarkupMultiplier: parseFloat(e.target.value) || 2.4,
                            },
                          }))
                        }
                        className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                      />
                      <span className="text-slate-400 text-xs font-bold">x Cost</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1.5">
                      Primary CJ Warehouse
                    </label>
                    <select
                      value={settings.CJdropshipping?.fulfillmentWarehouse || 'CJ US West Warehouse (Chino, CA)'}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          CJdropshipping: { ...prev.CJdropshipping, fulfillmentWarehouse: e.target.value },
                        }))
                      }
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="CJ US West Warehouse (Chino, CA)">CJ US West Warehouse (Chino, CA)</option>
                      <option value="CJ US East Hub (New Jersey)">CJ US East Hub (New Jersey)</option>
                      <option value="CJ Germany Hub (Frankfurt, EU)">CJ Germany Hub (Frankfurt, EU)</option>
                      <option value="CJ Shenzhen Central Logistics Hub">CJ Shenzhen Central Logistics Hub</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1.5">
                      Default Courier Line
                    </label>
                    <input
                      type="text"
                      value={settings.CJdropshipping?.defaultShippingCarrier || 'CJPacket Fast Line / USPS Priority Direct'}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          CJdropshipping: { ...prev.CJdropshipping, defaultShippingCarrier: e.target.value },
                        }))
                      }
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Live Test Status Feedback */}
                {connectionTestResult.CJdropshipping && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      connectionTestResult.CJdropshipping.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {connectionTestResult.CJdropshipping.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold">{connectionTestResult.CJdropshipping.message}</div>
                      {connectionTestResult.CJdropshipping.latencyMs && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          Latency: {connectionTestResult.CJdropshipping.latencyMs}ms • Active SKUs Verified:{' '}
                          {connectionTestResult.CJdropshipping.activeSKUs?.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleTestConnection('CJdropshipping')}
                    disabled={testingConnection.CJdropshipping}
                    className="flex-1 bg-[#1E293B] hover:bg-slate-700 text-slate-200 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Activity className={`w-3.5 h-3.5 text-cyan-400 ${testingConnection.CJdropshipping ? 'animate-spin' : ''}`} />
                    {testingConnection.CJdropshipping ? 'Testing...' : 'Test Live Connection'}
                  </button>

                  <button
                    onClick={() => handleSyncCatalog('CJdropshipping')}
                    disabled={syncingCatalog.CJdropshipping}
                    className="bg-[#1E293B] hover:bg-slate-700 text-cyan-400 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingCatalog.CJdropshipping ? 'animate-spin' : ''}`} />
                    Sync CJ Catalog
                  </button>

                  <button
                    onClick={() => handleSaveSettings('CJdropshipping')}
                    disabled={savingSettings.CJdropshipping}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingSettings.CJdropshipping ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: READY-TO-SELL CATALOG BROWSER & IMPORTER */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-6">
          {/* Supplier Filters & Search */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Platform Selector Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400 mr-1 font-medium">Catalog Feed:</span>
                <button
                  onClick={() => setSelectedPlatform('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedPlatform === 'all'
                      ? 'bg-white text-slate-900 font-bold'
                      : 'bg-[#1E293B] text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  All Catalogs ({DROPSHIP_CATALOG_ITEMS.length})
                </button>

                {DROPSHIP_PLATFORMS.map((p) => {
                  const isSelected = selectedPlatform === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlatform(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-[#FF5A43] text-white shadow-sm'
                          : 'bg-[#1E293B] text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {p.name}
                    </button>
                  );
                })}
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#FF5A43]"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by title, DeoDap/Baapstore catalog, SKU, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0B1120] border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF5A43]"
              />
            </div>
          </div>

          {/* Catalog Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {filteredCatalog.map((item) => {
              const currentRetail = getRetailPrice(item);
              const estProfit = Math.max(0, currentRetail - item.costUSD - item.shippingCostUSD);
              const marginCalc = Math.round((estProfit / currentRetail) * 100);
              const isImported = importedIds[item.id];
              const isImporting = importingId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col shadow-lg"
                >
                  <div className="relative aspect-video sm:aspect-[16/10] bg-slate-900 overflow-hidden group">
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 ${
                        item.platform === 'DeoDap'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-blue-600 text-white'
                      }`}>
                        {item.platform} Catalog
                      </span>
                      {item.badge && (
                        <span className="bg-[#FF5A43] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-white border border-white/10">
                      Stock: {item.stock} units
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                      <span className="font-mono text-[11px] text-slate-300">{item.sku}</span>
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        {item.leadDays} Day Fast Dispatch
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-extrabold text-white text-sm sm:text-base line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                        {item.supplierLink && (
                          <a
                            href={item.supplierLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-[#FF5A43] p-1 rounded transition-colors shrink-0"
                            title={`Open product page on ${item.platform}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <Warehouse className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[11px] text-slate-300">{item.warehouseLocation}</span>
                      </div>
                    </div>

                    {/* Price & Margin Matrix */}
                    <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-3 space-y-2.5">
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Wholesale Cost</span>
                          <span className="font-extrabold text-slate-200 block text-sm">
                            {formatPrice(item.costUSD, currency)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Net Profit</span>
                          <span className="font-extrabold text-emerald-400 block text-sm">
                            +{formatPrice(estProfit, currency)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Profit Margin</span>
                          <span className="font-extrabold text-amber-400 block text-sm">
                            {marginCalc}%
                          </span>
                        </div>
                      </div>

                      {/* Retail Price Adjustment */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Selling Retail Price ({curSymbol}):</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">{curSymbol}</span>
                          <input
                            type="number"
                            step="0.5"
                            value={currentRetail ?? item.suggestedRetailUSD ?? 0}
                            onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || item.costUSD + 2)}
                            className="w-20 bg-[#111827] border border-slate-600 rounded-lg px-2 py-1 text-xs font-bold text-white text-right focus:outline-none focus:border-[#FF5A43]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Import Button */}
                    <button
                      onClick={() => handleImportProduct(item)}
                      disabled={isImporting || isImported}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        isImported
                          ? 'bg-emerald-600/30 border border-emerald-500 text-emerald-300 cursor-default'
                          : 'bg-[#FF5A43] hover:bg-[#e04b36] active:scale-95 text-white shadow-lg shadow-[#FF5A43]/20'
                      }`}
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Linking & Importing...
                        </>
                      ) : isImported ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Imported to Live Storefront
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          1-Click Import from {item.platform} (${currentRetail})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCatalog.length === 0 && (
            <div className="text-center py-12 bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-3">
              <Boxes className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-white font-bold text-base">No items match your filter criteria</h4>
              <p className="text-xs text-slate-400">
                Try switching the platform selector to "All Catalogs" or clearing your search query.
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SUPPLIERS LOGISTICS NETWORK PROFILES */}
      {activeSubTab === 'platforms' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {DROPSHIP_PLATFORMS.map((platform) => (
              <div
                key={platform.id}
                className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-colors shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-extrabold text-sm ${
                      platform.id === 'DeoDap'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    }`}>
                      {platform.id === 'DeoDap' ? 'DD' : 'BS'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-base">{platform.name}</h3>
                      <p className="text-xs text-slate-400">{platform.tagline}</p>
                    </div>
                  </div>

                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {platform.apiStatus}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{platform.description}</p>

                {/* Specs Box */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#0B1120] p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400">Dispatch Speed:</span>
                    <div className="font-semibold text-slate-200 mt-0.5">{platform.deliverySpeed}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Warehouses:</span>
                    <div className="font-semibold text-slate-200 mt-0.5">{platform.warehouseHubs}</div>
                  </div>
                  <div className="mt-2">
                    <span className="text-slate-400">MOQ:</span>
                    <div className="font-semibold text-emerald-400 mt-0.5">{platform.moq}</div>
                  </div>
                  <div className="mt-2">
                    <span className="text-slate-400">Fulfillment Method:</span>
                    <div className="font-semibold text-slate-200 mt-0.5">{platform.fulfillmentMethod}</div>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Key Advantages:</div>
                  <ul className="space-y-1 text-xs text-slate-400">
                    {platform.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Direct Action */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedPlatform(platform.id);
                      setActiveSubTab('catalog');
                    }}
                    className="text-xs font-bold text-[#FF5A43] hover:text-[#e04b36] flex items-center gap-1.5 transition-colors"
                  >
                    Browse & Import {platform.name} Items ({platform.itemCount})
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: BRAND NAMES & TAGLINE SUGGESTIONS STUDIO */}
      {activeSubTab === 'brand_taglines' && (
        <div className="space-y-6">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="max-w-2xl space-y-2">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Storefront Tagline & Brand Identity Assistant
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Kovira's brand subtitle highlights direct catalog links with DeoDap and Baapstore:
                <br />
                <span className="inline-block mt-2 font-mono text-sm font-bold text-white bg-[#0B1120] border border-slate-700 px-3 py-1.5 rounded-lg">
                  KOVIRA • "Direct Dropship Link • DeoDap & Baapstore Certified"
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
              {BRAND_AND_TAGLINE_SUGGESTIONS.map((item, idx) => {
                const isCopied = copiedTagline === item.name;
                return (
                  <div
                    key={idx}
                    className="bg-[#0B1120] border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-[#FF5A43] uppercase tracking-wider">{item.niche}</div>
                        <h4 className="text-base font-extrabold text-white mt-1">{item.name}</h4>
                      </div>
                      <button
                        onClick={() => copyToClipboard(`"${item.tagline}"`, item.name)}
                        className="p-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Copy Tagline"
                      >
                        {isCopied ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#151D30] border border-slate-700/80 text-xs text-amber-300 font-medium">
                      Tagline: "{item.tagline}"
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: CATALOG LINKING GUIDE */}
      {activeSubTab === 'guide' && (
        <div className="space-y-6">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#FF5A43]" />
                How to Link DeoDap & Baapstore Catalogs to Kovira
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Follow these simple steps to link your supplier accounts and sell products with automated fulfillment:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* DeoDap Linking Guide */}
              <div className="p-5 rounded-xl bg-[#0B1120] border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-white text-base">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    DD
                  </div>
                  DeoDap Catalog Linking Protocol
                </div>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  <li>Log in to your <strong>DeoDap B2B Dropship Account</strong> at <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded">deodap.in</code>.</li>
                  <li>Navigate to <em>Settings &gt; Developer API & Webhooks</em> and generate your API Key.</li>
                  <li>Paste the API Key and Partner ID in the <strong>Catalog Linking Settings</strong> tab above.</li>
                  <li>Click <strong>Test Live Connection</strong> to verify your Rajkot logistics channel.</li>
                  <li>Browse viral kitchen, smart gadgets, and organizer items in the <em>Ready-to-Sell Products</em> tab and click <strong>1-Click Import</strong>.</li>
                  <li>When customer orders arrive on Kovira, they are automatically forwarded to DeoDap for same-day packing and dispatch via Delhivery Express.</li>
                </ul>
              </div>

              {/* Baapstore Linking Guide */}
              <div className="p-5 rounded-xl bg-[#0B1120] border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-white text-base">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    BS
                  </div>
                  Baapstore Catalog Linking Protocol
                </div>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  <li>Log in to your <strong>Baapstore Dashboard</strong> at <code className="text-blue-400 bg-slate-900 px-1 py-0.5 rounded">baapstore.com</code>.</li>
                  <li>Go to <em>API Integration &gt; WooCommerce / Custom REST Feed</em> and obtain your secret credentials.</li>
                  <li>Configure your desired price markup (e.g., 2.0x wholesale cost) in the settings tab.</li>
                  <li>Click <strong>Sync All Live Catalogs</strong> to pull current stocks directly from Chennai & Surat warehouses.</li>
                  <li>Baapstore handles white-label unbranded packaging with your Kovira brand details included.</li>
                  <li>Tracking numbers from Blue Dart / Ecom Express are automatically linked back to customer chat and order tracking.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
