import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Percent,
  RefreshCw,
  Eye,
  Tag,
  Plus,
  Trash2,
  Calendar,
  Gift,
  ShieldCheck,
  Search,
  Check,
} from 'lucide-react';
import { Product } from '../types';
import {
  getActiveDiscountConfig,
  saveActiveDiscountConfig,
  DiscountBannerSettings,
} from '../utils/discountBanner';

export interface StoreOfferItem {
  id: string;
  title: string;
  offerType: 'seasonal' | 'product' | 'flash_sale' | 'clearance';
  promoCode?: string;
  discountPercent: number;
  minimumOrderINR: number;
  applicableCategory?: string;
  applicableProductId?: string | null;
  bannerText?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

interface AnnouncementConfig {
  tag: string;
  message: string;
  freeShippingThresholdUSD: number;
  freeShippingThresholdINR: number;
  promoCode?: string;
  discountPercent?: number;
  enabled: boolean;
}

interface AdminAnnouncementManagerProps {
  products?: Product[];
  onRefreshData?: () => void;
}

export const AdminAnnouncementManager: React.FC<AdminAnnouncementManagerProps> = ({
  products = [],
  onRefreshData,
}) => {
  // Navigation sub-tabs within Store Offers
  const [subTab, setSubTab] = useState<'seasonal' | 'product_offers' | 'announcement' | 'random_banners'>('seasonal');

  // Announcement Config state
  const [announcementConfig, setAnnouncementConfig] = useState<AnnouncementConfig>({
    tag: '✨ SPRING SALE:',
    message: 'Free Worldwide Express Shipping on orders over ₹999 / $50',
    freeShippingThresholdUSD: 50,
    freeShippingThresholdINR: 999,
    promoCode: 'KOVIRA10',
    discountPercent: 10,
    enabled: true,
  });

  // Random 10-15% Discount Banner Settings
  const [discountBannerSettings, setDiscountBannerSettings] = useState<DiscountBannerSettings>(getActiveDiscountConfig);
  const [isSavingDiscountBanner, setIsSavingDiscountBanner] = useState(false);
  const [discountBannerSuccess, setDiscountBannerSuccess] = useState(false);

  // Store Offers state (from /api/store-offers)
  const [offersList, setOffersList] = useState<StoreOfferItem[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [offersNotice, setOffersNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states: Seasonal Offer
  const [seasonalTitle, setSeasonalTitle] = useState('Festive Season Mega Deal');
  const [seasonalCode, setSeasonalCode] = useState('FESTIVE25');
  const [seasonalDiscount, setSeasonalDiscount] = useState(25);
  const [seasonalMinOrder, setSeasonalMinOrder] = useState(999);
  const [seasonalCategory, setSeasonalCategory] = useState('All');
  const [seasonalBanner, setSeasonalBanner] = useState('Flat 25% OFF Festive Offer');
  const [seasonalStartDate, setSeasonalStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [seasonalEndDate, setSeasonalEndDate] = useState(() => new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]);
  const [isSubmittingSeasonal, setIsSubmittingSeasonal] = useState(false);

  // Form states: Individual Product Offer
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productDiscount, setProductDiscount] = useState<number>(20);
  const [productBannerText, setProductBannerText] = useState('HOT DEAL 20% OFF');
  const [productStartDate, setProductStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [productEndDate, setProductEndDate] = useState(() => new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0]);
  const [isSubmittingProductOffer, setIsSubmittingProductOffer] = useState(false);

  // General loading & feedback
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);
  const [announcementError, setAnnouncementError] = useState('');

  // 1. Fetch Announcement from API
  const loadAnnouncement = async () => {
    try {
      const res = await fetch('/api/announcement');
      const data = await res.json();
      if (data.success && data.announcement) {
        const a = data.announcement;
        setAnnouncementConfig({
          tag: a.tag || a.badge || '✨ SPRING SALE:',
          message: a.message || a.headline || 'Free Worldwide Express Shipping on orders over ₹999 / $50',
          freeShippingThresholdUSD: Number(a.freeShippingThresholdUSD ?? 50),
          freeShippingThresholdINR: Number(a.freeShippingThresholdINR ?? 999),
          promoCode: a.promoCode || 'KOVIRA10',
          discountPercent: Number(a.discountPercent ?? 10),
          enabled: Boolean(a.enabled ?? a.isEnabled ?? true),
        });
      }
    } catch (err) {
      console.error('Failed to fetch announcement:', err);
    }
  };

  // 2. Fetch Store Offers list from /api/store-offers
  const loadStoreOffers = async () => {
    setIsLoadingOffers(true);
    try {
      const res = await fetch('/api/store-offers');
      const data = await res.json();
      if (data.success && Array.isArray(data.offers)) {
        setOffersList(data.offers);
      }
    } catch (err) {
      console.error('Failed to fetch store offers:', err);
    } finally {
      setIsLoadingOffers(false);
    }
  };

  useEffect(() => {
    loadAnnouncement();
    loadStoreOffers();
  }, []);

  // Save Announcement
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAnnouncement(true);
    setAnnouncementError('');
    setAnnouncementSuccess(false);

    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...announcementConfig,
          badge: announcementConfig.tag,
          headline: announcementConfig.message,
          isEnabled: announcementConfig.enabled,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update store announcement');
      }
      setAnnouncementSuccess(true);
      setTimeout(() => setAnnouncementSuccess(false), 3500);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setAnnouncementError(err.message || 'Error saving announcement settings');
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  // Save Random Discount Banner
  const handleSaveDiscountBanner = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDiscountBanner(true);
    try {
      saveActiveDiscountConfig(discountBannerSettings);
      fetch('/api/settings/discount-banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discountBannerSettings),
      }).catch(() => {});
      setDiscountBannerSuccess(true);
      setTimeout(() => setDiscountBannerSuccess(false), 3500);
      if (onRefreshData) onRefreshData();
    } catch {
    } finally {
      setIsSavingDiscountBanner(false);
    }
  };

  // Preset seasonal campaigns
  const applySeasonalPreset = (presetKey: string) => {
    if (presetKey === 'diwali') {
      setSeasonalTitle('Diwali Grand Festive Dhamaka');
      setSeasonalCode('DIWALI30');
      setSeasonalDiscount(30);
      setSeasonalMinOrder(999);
      setSeasonalCategory('All');
      setSeasonalBanner('Diwali Special: Flat 30% OFF on Orders Over ₹999');
    } else if (presetKey === 'summer') {
      setSeasonalTitle('Summer Lifestyle & Coolers Sale');
      setSeasonalCode('SUMMER20');
      setSeasonalDiscount(20);
      setSeasonalMinOrder(699);
      setSeasonalCategory('All');
      setSeasonalBanner('Summer Breeze: 20% OFF Lifestyle Gear');
    } else if (presetKey === 'monsoon') {
      setSeasonalTitle('Monsoon Mega Bonanza');
      setSeasonalCode('MONSOON15');
      setSeasonalDiscount(15);
      setSeasonalMinOrder(499);
      setSeasonalCategory('Gadgets');
      setSeasonalBanner('Monsoon Special: 15% OFF Tech & Gadgets');
    } else if (presetKey === 'clearance') {
      setSeasonalTitle('End of Season Clearance Blowout');
      setSeasonalCode('CLEAR35');
      setSeasonalDiscount(35);
      setSeasonalMinOrder(1299);
      setSeasonalCategory('All');
      setSeasonalBanner('Clearance Blowout: Up to 35% OFF Storewide');
    } else if (presetKey === 'newyear') {
      setSeasonalTitle('New Year Kickoff Celebration');
      setSeasonalCode('NEWYEAR20');
      setSeasonalDiscount(20);
      setSeasonalMinOrder(799);
      setSeasonalCategory('All');
      setSeasonalBanner('Happy New Year: Flat 20% OFF on Everything');
    }
  };

  // Create Seasonal Offer
  const handleCreateSeasonalOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSeasonal(true);
    setOffersNotice(null);

    try {
      const res = await fetch('/api/store-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: seasonalTitle.trim(),
          offerType: 'seasonal',
          promoCode: seasonalCode.trim().toUpperCase(),
          discountPercent: seasonalDiscount,
          minimumOrderINR: seasonalMinOrder,
          applicableCategory: seasonalCategory,
          applicableProductId: null,
          bannerText: seasonalBanner.trim() || `Flat ${seasonalDiscount}% OFF`,
          description: `${seasonalTitle} - ${seasonalDiscount}% discount with code ${seasonalCode}`,
          startDate: seasonalStartDate,
          endDate: seasonalEndDate,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create seasonal offer');
      }

      setOffersNotice({ type: 'success', text: `✓ Seasonal offer "${seasonalTitle}" created and activated live!` });
      loadStoreOffers();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setOffersNotice({ type: 'error', text: err.message || 'Error creating seasonal offer' });
    } finally {
      setIsSubmittingSeasonal(false);
    }
  };

  // Selected product details for individual offer
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Filtered product list for selector
  const selectableProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 30);
    const q = productSearch.toLowerCase();
    return products.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [products, productSearch]);

  // Cost price protection calculation for selected product
  const costProtectionInfo = useMemo(() => {
    if (!selectedProduct) return null;
    const retailINR = Math.round(selectedProduct.priceUSD * 86.5);
    const wholesaleINR = (selectedProduct as any).wholesaleINR
      ? Math.round((selectedProduct as any).wholesaleINR)
      : Math.round(selectedProduct.costUSD * 86.5);
    const maxSafeDiscountPct = retailINR > wholesaleINR
      ? Math.max(0, Math.floor(((retailINR - wholesaleINR) / retailINR) * 100))
      : 0;
    const isExceeding = productDiscount > maxSafeDiscountPct;
    const effectiveDiscount = isExceeding ? maxSafeDiscountPct : productDiscount;
    const discountedRetailINR = Math.round(retailINR * (1 - effectiveDiscount / 100));

    return {
      retailINR,
      wholesaleINR,
      maxSafeDiscountPct,
      isExceeding,
      effectiveDiscount,
      discountedRetailINR,
    };
  }, [selectedProduct, productDiscount]);

  // Create Individual Product Offer
  const handleCreateProductOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setOffersNotice({ type: 'error', text: 'Please select a product from your catalog first.' });
      return;
    }

    setIsSubmittingProductOffer(true);
    setOffersNotice(null);

    try {
      const res = await fetch('/api/store-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Special Offer: ${selectedProduct.title}`,
          offerType: 'product',
          promoCode: '',
          discountPercent: productDiscount,
          minimumOrderINR: 0,
          applicableCategory: selectedProduct.category,
          applicableProductId: selectedProduct.id,
          bannerText: productBannerText.trim() || `${productDiscount}% OFF`,
          description: `Direct product discount on ${selectedProduct.title}`,
          startDate: productStartDate,
          endDate: productEndDate,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create product offer');
      }

      setOffersNotice({
        type: 'success',
        text: `✓ Product offer activated for "${selectedProduct.title.slice(0, 30)}..." with ${costProtectionInfo?.effectiveDiscount}% OFF & banner "${productBannerText}"!`,
      });
      loadStoreOffers();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setOffersNotice({ type: 'error', text: err.message || 'Error creating product offer' });
    } finally {
      setIsSubmittingProductOffer(false);
    }
  };

  // Toggle Offer Active/Inactive
  const handleToggleOffer = async (offer: StoreOfferItem) => {
    try {
      const res = await fetch(`/api/store-offers/${offer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !offer.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setOffersList((prev) =>
          prev.map((o) => (o.id === offer.id ? { ...o, isActive: !offer.isActive } : o))
        );
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      alert(`Error toggling offer: ${err.message}`);
    }
  };

  // Delete Offer
  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to remove this store offer?')) return;
    try {
      const res = await fetch(`/api/store-offers/${offerId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setOffersList((prev) => prev.filter((o) => o.id !== offerId));
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      alert(`Error deleting offer: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Banner Title & Sub-Tabs Switcher */}
      <div className="bg-[#111827] border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Megaphone className="w-5 h-5" />
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Store Offers & Campaigns Hub
              </h3>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase font-mono">
                {offersList.filter((o) => o.isActive).length} Active Offers
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Configure seasonal festival offers, select individual product discounts with cost price protection, and manage top announcement banners.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              loadStoreOffers();
              loadAnnouncement();
            }}
            disabled={isLoadingOffers}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoadingOffers ? 'animate-spin' : ''}`} />
            <span>Refresh Offers</span>
          </button>
        </div>

        {/* 4 Interactive Sub-Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
          <button
            type="button"
            onClick={() => setSubTab('seasonal')}
            className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-start gap-1 border transition-all cursor-pointer ${
              subTab === 'seasonal'
                ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-lg font-black'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-amber-400" />
              <span>1. Seasonal Offers</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">Diwali, Summer & Festive</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('product_offers')}
            className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-start gap-1 border transition-all cursor-pointer ${
              subTab === 'product_offers'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-lg font-black'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-cyan-400" />
              <span>2. Individual Product Offers</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">Select SKU + Cost Protection</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('announcement')}
            className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-start gap-1 border transition-all cursor-pointer ${
              subTab === 'announcement'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-lg font-black'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-emerald-400" />
              <span>3. Top Bar Announcement</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">Free shipping & coupon code</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('random_banners')}
            className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-start gap-1 border transition-all cursor-pointer ${
              subTab === 'random_banners'
                ? 'bg-rose-500/20 text-rose-300 border-rose-400 shadow-lg font-black'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-rose-400" />
              <span>4. Random Banners (10–15%)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">Catalog-wide badges</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {offersNotice && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 animate-in fade-in ${
            offersNotice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/80 border-rose-700 text-rose-200'
          }`}
        >
          {offersNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{offersNotice.text}</span>
        </div>
      )}

      {/* SUB-TAB 1: SEASONAL OFFERS PROVISION */}
      {subTab === 'seasonal' && (
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-400" />
                <span>Seasonal Offers Provision</span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Create seasonal and festive campaign discounts with promo codes, validity dates, and min order thresholds.
              </p>
            </div>

            {/* Quick Presets Picker */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-bold">1-Click Presets:</span>
              <button
                type="button"
                onClick={() => applySeasonalPreset('diwali')}
                className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 text-[11px] font-bold rounded-lg cursor-pointer transition-all"
              >
                🪔 Diwali Sale
              </button>
              <button
                type="button"
                onClick={() => applySeasonalPreset('summer')}
                className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[11px] font-bold rounded-lg cursor-pointer transition-all"
              >
                ☀️ Summer Sale
              </button>
              <button
                type="button"
                onClick={() => applySeasonalPreset('monsoon')}
                className="px-2.5 py-1 bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 text-[11px] font-bold rounded-lg cursor-pointer transition-all"
              >
                🌧️ Monsoon
              </button>
              <button
                type="button"
                onClick={() => applySeasonalPreset('clearance')}
                className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] font-bold rounded-lg cursor-pointer transition-all"
              >
                🏷️ Clearance
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateSeasonalOffer} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Campaign Title:</label>
                <input
                  type="text"
                  required
                  value={seasonalTitle}
                  onChange={(e) => setSeasonalTitle(e.target.value)}
                  placeholder="e.g. Festive Season Mega Deal"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Coupon / Promo Code:</label>
                <input
                  type="text"
                  required
                  value={seasonalCode}
                  onChange={(e) => setSeasonalCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE25"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-black uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Discount Percentage (%):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={75}
                    required
                    value={seasonalDiscount}
                    onChange={(e) => setSeasonalDiscount(Number(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300 font-mono font-bold"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Min Order Value (INR ₹):</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={seasonalMinOrder}
                    onChange={(e) => setSeasonalMinOrder(Number(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Applicable Category:</label>
                <select
                  value={seasonalCategory}
                  onChange={(e) => setSeasonalCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium cursor-pointer"
                >
                  <option value="All">All Categories (Storewide)</option>
                  <option value="Smart Lifestyle Gear">Smart Lifestyle Gear</option>
                  <option value="Premium Audio">Premium Audio</option>
                  <option value="Gadgets">Gadgets</option>
                  <option value="Kitchen & Dining">Kitchen & Dining</option>
                  <option value="Shivora Boutique">Shivora Collections Dresses</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Banner Display Headline:</label>
                <input
                  type="text"
                  value={seasonalBanner}
                  onChange={(e) => setSeasonalBanner(e.target.value)}
                  placeholder="e.g. Flat 25% OFF Festive Offer"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Valid From Date:</label>
                <input
                  type="date"
                  value={seasonalStartDate}
                  onChange={(e) => setSeasonalStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Valid Until Date:</label>
                <input
                  type="date"
                  value={seasonalEndDate}
                  onChange={(e) => setSeasonalEndDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Customers can apply promo code at checkout for immediate discount deduction.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmittingSeasonal}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingSeasonal ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Publishing Seasonal Offer...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>Create & Activate Seasonal Offer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 2: INDIVIDUAL PRODUCT OFFERS PROVISION */}
      {subTab === 'product_offers' && (
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-cyan-400" />
              <span>Individual Product Offers Provision</span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Select specific products from your catalog, assign special discount percentages, and display promotional banners directly on the product thumbnail with automated cost price protection.
            </p>
          </div>

          <form onSubmit={handleCreateProductOffer} className="space-y-5 text-xs">
            {/* Step 1: Select Product */}
            <div className="space-y-2">
              <label className="text-slate-300 font-bold block">
                1. Select Target Product from Catalog:
              </label>

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search catalog by title, category, or SKU..."
                  className="w-full bg-transparent text-white text-xs placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Product Select dropdown grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-800 rounded-2xl bg-slate-950/60 scrollbar-thin">
                {selectableProducts.map((p) => {
                  const isSelected = selectedProductId === p.id;
                  const retailINR = Math.round(p.priceUSD * 86.5);
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setProductBannerText(`HOT DEAL ${productDiscount}% OFF`);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-md ring-1 ring-cyan-400'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      <img
                        src={p.images[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=80'}
                        alt=""
                        className="w-11 h-11 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-xs truncate" title={p.title}>
                          {p.title}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
                          <span>{p.category}</span>
                          <span className="font-mono text-cyan-300 font-bold">₹{retailINR}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Product Specs & Cost Protection Alert */}
            {selectedProduct && costProtectionInfo && (
              <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="font-black text-white text-sm flex items-center gap-2">
                    <span className="text-cyan-400">Selected Product:</span>
                    <span>{selectedProduct.title}</span>
                  </div>
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-md">
                    SKU: {selectedProduct.sku}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Current Retail Price:</span>
                    <span className="text-white font-mono font-black text-sm">₹{costProtectionInfo.retailINR}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Supplier Wholesale Cost:</span>
                    <span className="text-amber-300 font-mono font-bold text-sm">₹{costProtectionInfo.wholesaleINR}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Max Safe Discount:</span>
                    <span className="text-emerald-300 font-mono font-bold text-sm">{costProtectionInfo.maxSafeDiscountPct}%</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Discounted Price:</span>
                    <span className="text-cyan-300 font-mono font-black text-sm">₹{costProtectionInfo.discountedRetailINR}</span>
                  </div>
                </div>

                {costProtectionInfo.isExceeding && (
                  <div className="p-3 bg-amber-950/80 border border-amber-700/80 rounded-xl text-amber-200 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Cost Price Protection Active:</strong> Requested discount ({productDiscount}%) would push the price below supplier wholesale cost (₹{costProtectionInfo.wholesaleINR}). It has been automatically capped at <strong>{costProtectionInfo.maxSafeDiscountPct}%</strong>.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Configure Discount & Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Product Discount (%):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={70}
                    value={productDiscount}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setProductDiscount(val);
                      setProductBannerText(`HOT DEAL ${val}% OFF`);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Thumbnail Banner Label:</label>
                <input
                  type="text"
                  value={productBannerText}
                  onChange={(e) => setProductBannerText(e.target.value)}
                  placeholder="e.g. HOT DEAL 20% OFF"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Start Date:</label>
                <input
                  type="date"
                  value={productStartDate}
                  onChange={(e) => setProductStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">End Date:</label>
                <input
                  type="date"
                  value={productEndDate}
                  onChange={(e) => setProductEndDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSubmittingProductOffer || !selectedProductId}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingProductOffer ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Applying Offer to Product...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>Publish Individual Product Offer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: TOP BAR ANNOUNCEMENT CONFIG */}
      {subTab === 'announcement' && (
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-400" />
                <span>Top Announcement Bar & Free Delivery</span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Displays the pinned top notice banner across all store pages with coupon codes and threshold rules.
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
              <span>Enable Announcement Bar</span>
              <input
                type="checkbox"
                checked={announcementConfig.enabled}
                onChange={(e) => setAnnouncementConfig({ ...announcementConfig, enabled: e.target.checked })}
                className="w-4 h-4 rounded accent-cyan-400 cursor-pointer"
              />
            </label>
          </div>

          {/* Live Preview */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-cyan-400" /> Customer Storefront Live Preview:
            </span>
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-xs">
              {announcementConfig.enabled ? (
                <>
                  <span className="text-amber-300 font-bold">{announcementConfig.tag}</span>
                  <span className="text-slate-200">{announcementConfig.message}</span>
                  {announcementConfig.promoCode && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                      Code: {announcementConfig.promoCode} ({announcementConfig.discountPercent}% OFF)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-500 italic text-[11px]">
                  (Banner is currently paused / hidden from customer storefront)
                </span>
              )}
            </div>
          </div>

          {announcementSuccess && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Announcement settings saved successfully!</span>
            </div>
          )}

          {announcementError && (
            <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{announcementError}</span>
            </div>
          )}

          <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Campaign Tag / Eyebrow:</label>
                <input
                  type="text"
                  value={announcementConfig.tag}
                  onChange={(e) => setAnnouncementConfig({ ...announcementConfig, tag: e.target.value })}
                  placeholder="✨ SPRING SALE: or 🪔 DIWALI DEAL:"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Offer Message Text:</label>
                <input
                  type="text"
                  value={announcementConfig.message}
                  onChange={(e) => setAnnouncementConfig({ ...announcementConfig, message: e.target.value })}
                  placeholder="Free Worldwide Express Shipping on orders over ₹999 / $50"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Free Delivery Threshold (INR ₹):</label>
                <input
                  type="number"
                  value={announcementConfig.freeShippingThresholdINR}
                  onChange={(e) => setAnnouncementConfig({ ...announcementConfig, freeShippingThresholdINR: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Discount Promo Code:</label>
                <input
                  type="text"
                  value={announcementConfig.promoCode}
                  onChange={(e) => setAnnouncementConfig({ ...announcementConfig, promoCode: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Discount Value (%):</label>
                <input
                  type="number"
                  min={1}
                  max={70}
                  value={announcementConfig.discountPercent}
                  onChange={(e) => setAnnouncementConfig({ ...announcementConfig, discountPercent: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSavingAnnouncement}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingAnnouncement ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Saving Announcement...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-slate-950" />
                    <span>Publish Announcement Bar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 4: RANDOM 10-15% DISCOUNT BANNERS */}
      {subTab === 'random_banners' && (
        <form onSubmit={handleSaveDiscountBanner} className="bg-[#111827] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Percent className="w-4 h-4" />
                </span>
                <h4 className="font-black text-base text-white">
                  Catalog Random Product Discount Banners (10–15% Default)
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Displays promotional badges on storefront products with fully editable percentage ranges and banner copy.
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
              <span>Enable Badges</span>
              <input
                type="checkbox"
                checked={discountBannerSettings.enabled}
                onChange={(e) =>
                  setDiscountBannerSettings({
                    ...discountBannerSettings,
                    enabled: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded accent-rose-400 cursor-pointer"
              />
            </label>
          </div>

          {discountBannerSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Discount banner settings saved! Storefront products now dynamically display updated badges.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Minimum Discount % (Default: 10%):</label>
              <input
                type="number"
                min={1}
                max={80}
                value={discountBannerSettings.minPercent}
                onChange={(e) =>
                  setDiscountBannerSettings({
                    ...discountBannerSettings,
                    minPercent: Number(e.target.value) || 10,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Maximum Discount % (Default: 15%):</label>
              <input
                type="number"
                min={1}
                max={90}
                value={discountBannerSettings.maxPercent}
                onChange={(e) =>
                  setDiscountBannerSettings({
                    ...discountBannerSettings,
                    maxPercent: Number(e.target.value) || 15,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Banner Text Template:</label>
              <input
                type="text"
                value={discountBannerSettings.bannerText}
                onChange={(e) =>
                  setDiscountBannerSettings({
                    ...discountBannerSettings,
                    bannerText: e.target.value,
                  })
                }
                placeholder="SPECIAL {pct}% OFF"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Catalog Coverage Ratio %:</label>
              <input
                type="number"
                min={10}
                max={100}
                value={discountBannerSettings.productCoveragePercent}
                onChange={(e) =>
                  setDiscountBannerSettings({
                    ...discountBannerSettings,
                    productCoveragePercent: Number(e.target.value) || 70,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSavingDiscountBanner}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-black rounded-xl cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isSavingDiscountBanner ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>Save & Apply Random Banners</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* MASTER ACTIVE STORE OFFERS TABLE (SEASONAL + PRODUCT OFFERS) */}
      <div className="bg-[#111827] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Active Store Offers & Campaigns List</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Live list of all seasonal and individual product promotions active on your store.
            </p>
          </div>

          <span className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs font-bold px-3 py-1 rounded-xl self-start sm:self-auto">
            Total {offersList.length} Campaigns
          </span>
        </div>

        {offersList.length === 0 ? (
          <div className="p-8 text-center bg-[#0a0f1d] border border-slate-800 rounded-2xl space-y-2">
            <Gift className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="font-bold text-slate-300 text-sm">No Store Offers Created Yet</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Use the tabs above to create your first Seasonal festival offer or Individual product discount.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0a0f1d]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0f172a] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-extrabold">
                  <th className="p-3">Offer Title / Scope</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-center">Discount</th>
                  <th className="p-3">Coupon Code</th>
                  <th className="p-3">Validity Window</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {offersList.map((off) => (
                  <tr key={off.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="space-y-0.5 max-w-[220px]">
                        <div className="font-bold text-white truncate" title={off.title}>
                          {off.title}
                        </div>
                        {off.bannerText && (
                          <div className="text-[10px] text-amber-300/90 font-mono truncate">
                            Banner: "{off.bannerText}"
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                          off.offerType === 'product'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {off.offerType === 'product' ? '🏷️ Product' : '🪔 Seasonal'}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <span className="font-mono font-black text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full text-[11px]">
                        {off.discountPercent}% OFF
                      </span>
                    </td>

                    <td className="p-3 font-mono text-[11px]">
                      {off.promoCode ? (
                        <span className="text-amber-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {off.promoCode}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Auto-applied</span>
                      )}
                    </td>

                    <td className="p-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{off.startDate} to {off.endDate}</span>
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleOffer(off)}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full cursor-pointer transition-all border ${
                          off.isActive
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                        title="Click to toggle active status"
                      >
                        {off.isActive ? '● Live' : '○ Paused'}
                      </button>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteOffer(off.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Remove offer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
