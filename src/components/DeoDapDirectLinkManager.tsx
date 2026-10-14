import React, { useState, useEffect } from 'react';
import {
  Zap,
  Globe,
  ExternalLink,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Link as LinkIcon,
  Tag,
  Package,
  Layers,
  ShoppingBag,
  Sliders,
  Info,
  Eye,
  EyeOff,
  Check,
  Truck,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Building,
  Trash2,
  Copy,
  Edit,
  Edit2,
  X,
  Database,
} from 'lucide-react';
import { Product, CurrencyCode, UploadedWebLink } from '../types';
import { formatPrice } from '../utils/currency';

interface DeoDapBestsellerItem {
  deodapId: number;
  handle: string;
  title: string;
  cleanDescription: string;
  wholesaleINR: number;
  compareINR: number;
  retailINR: number;
  profitINR: number;
  marginPercent: number;
  deliveryChargeINR: number;
  costUSD: number;
  priceUSD: number;
  sku: string;
  stock: number;
  isAvailable: boolean;
  images: string[];
  primaryImage: string;
  supplierLink: string;
  isLinkedToAdmin: boolean;
  isPublished: boolean;
  alreadyInStore: boolean;
  storeProductId?: string;
  tags: string[];
  vendor: string;
  productType: string;
}

interface DeoDapDirectLinkManagerProps {
  currency: CurrencyCode;
  onRefreshData?: () => void;
  onViewProduct?: (productId: string) => void;
}

export const DeoDapDirectLinkManager: React.FC<DeoDapDirectLinkManagerProps> = ({
  currency,
  onRefreshData,
}) => {
  const [urlInput, setUrlInput] = useState('');
  // Default margin 50% as requested by user (1.50 multiplier)
  const [marginPercent, setMarginPercent] = useState<number>(50);
  const markupMultiplier = 1 + marginPercent / 100;

  // Real-time detected supplier from user input URL
  const getDetectedSupplier = (url: string) => {
    const u = (url || '').toLowerCase();
    if (u.includes('deodap.in') || u.includes('deodap')) return 'DeoDap Direct Dropshipping';
    if (u.includes('meesho.com') || u.includes('meesho')) return 'Meesho Supplier Hub';
    if (u.includes('amazon.')) return 'Amazon Fulfillment Network';
    if (u.includes('flipkart.')) return 'Flipkart Wholesale Desk';
    if (u.includes('indiamart.')) return 'IndiaMART Verified Vendor';
    if (u.includes('baapstore.')) return 'Baapstore Logistics Hub';
    if (u.includes('cjdropshipping.')) return 'CJ Dropshipping Global';
    if (u.includes('aliexpress.')) return 'AliExpress Direct Supply';
    try {
      const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
      const clean = host.split('.')[0];
      return `${clean.charAt(0).toUpperCase() + clean.slice(1)} Supplier Partner`;
    } catch {
      return 'Direct Factory Supplier';
    }
  };

  // Uploaded links list state
  const [uploadedLinks, setUploadedLinks] = useState<UploadedWebLink[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  const loadUploadedLinks = async () => {
    setIsLoadingLinks(true);
    try {
      const res = await fetch('/api/dropship/uploaded-links');
      const data = await res.json();
      if (data.success && Array.isArray(data.links)) {
        setUploadedLinks(data.links);
      }
    } catch (err) {
      console.error('Failed to load uploaded links:', err);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const handleDeleteUploadedLink = async (linkId: string) => {
    if (!window.confirm('Remove this link from your uploaded links list? (Imported products remain in catalog)')) return;
    try {
      const res = await fetch(`/api/dropship/uploaded-links/${linkId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setUploadedLinks((prev) => prev.filter((l) => l.id !== linkId));
      }
    } catch (err) {
      console.error('Error deleting uploaded link:', err);
    }
  };

  // Collection selection: Best Selling Products (270 items) or All Brand Products (262 items) or Custom
  const [activeCollection, setActiveCollection] = useState<'best-selling-products' | 'all-brand' | 'all'>('best-selling-products');
  const [customCollectionHandle, setCustomCollectionHandle] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(24);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUpdatingMargins, setIsUpdatingMargins] = useState<boolean>(false);
  // State for Editing Link & Adding Discount to Products
  const [editingLink, setEditingLink] = useState<UploadedWebLink | null>(null);
  const [editMargin, setEditMargin] = useState<number>(50);
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [editBanner, setEditBanner] = useState<string>('');
  const [isSavingLinkEdit, setIsSavingLinkEdit] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [sqlSchemaText, setSqlSchemaText] = useState<string>('');
  const [isLoadingSql, setIsLoadingSql] = useState<boolean>(false);

  const handleOpenSqlModal = async () => {
    setShowSqlModal(true);
    if (!sqlSchemaText) {
      setIsLoadingSql(true);
      try {
        const res = await fetch('/supabase_schema.sql');
        if (res.ok) {
          const text = await res.text();
          setSqlSchemaText(text);
        }
      } catch (e) {
        console.error('Failed to load SQL schema:', e);
      } finally {
        setIsLoadingSql(false);
      }
    }
  };

  const handleCopySql = () => {
    if (sqlSchemaText) {
      navigator.clipboard.writeText(sqlSchemaText);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  const handleOpenEditLink = (link: UploadedWebLink) => {
    setEditingLink(link);
    setEditMargin(link.marginPercent || 50);
    setEditDiscount(link.discountPercent || 0);
    setEditBanner(link.discountBanner || (link.discountPercent ? `FLAT ${link.discountPercent}% OFF` : ''));
  };

  const handleSaveLinkEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;
    setIsSavingLinkEdit(true);
    try {
      const res = await fetch(`/api/dropship/uploaded-links/${editingLink.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marginPercent: editMargin,
          discountPercent: editDiscount,
          discountBanner: editBanner.trim() || (editDiscount > 0 ? `FLAT ${editDiscount}% OFF` : ''),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusNotice(`✓ Updated link discount (${editDiscount}%) & banner "${editBanner || `FLAT ${editDiscount}% OFF`}" on products!`);
        loadUploadedLinks();
        if (onRefreshData) onRefreshData();
        setEditingLink(null);
      } else {
        throw new Error(data.error || 'Failed to update link');
      }
    } catch (err: any) {
      alert(`Error updating link: ${err.message}`);
    } finally {
      setIsSavingLinkEdit(false);
    }
  };

  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [publishImmediatelyUrl, setPublishImmediatelyUrl] = useState(true);
  const [urlImportResult, setUrlImportResult] = useState<{
    success: boolean;
    message: string;
    type?: 'single' | 'collection';
    count?: number;
    collection?: string;
    product?: any;
    products?: any[];
    wholesaleINR?: number;
    retailINR?: number;
    profitINR?: number;
    isPublished?: boolean;
    supplierName?: string;
  } | null>(null);

  // Live Bestsellers State
  const [bestsellers, setBestsellers] = useState<DeoDapBestsellerItem[]>([]);
  const [isLoadingBestsellers, setIsLoadingBestsellers] = useState(false);
  const [bestsellerError, setBestsellerError] = useState<string | null>(null);
  const [activeViewFilter, setActiveViewFilter] = useState<'all' | 'staged' | 'published'>('all');

  // Action status states
  const [actionLoadingHandle, setActionLoadingHandle] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Fetch Live Products directly from DeoDap with all 270 items and 40% margin rule
  const loadLiveBestsellers = async () => {
    setIsLoadingBestsellers(true);
    setBestsellerError(null);

    let collectionTarget = customCollectionHandle.trim() || activeCollection;
    if (collectionTarget.includes('/collections/')) {
      const match = collectionTarget.match(/\/collections\/([^/?#]+)/i);
      if (match) collectionTarget = match[1];
    }

    try {
      // Fetch all items (up to 270 products for best-selling-products and 262 products for all-brand)
      const res = await fetch(
        `/api/dropship/deodap/direct-bestsellers?collection=${encodeURIComponent(collectionTarget)}&limit=all&markup=${markupMultiplier}`
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.products)) {
        setBestsellers(data.products);
        setCurrentPage(1);
      } else {
        throw new Error(data.error || 'Failed to load live DeoDap catalog.');
      }
    } catch (err: any) {
      setBestsellerError(err.message || 'Network error fetching DeoDap live stream.');
    } finally {
      setIsLoadingBestsellers(false);
    }
  };

  useEffect(() => {
    loadLiveBestsellers();
    loadUploadedLinks();
  }, [marginPercent, activeCollection]);

  // Recalculate and update margins across all DeoDap products
  const handleUpdateAllStoreMargins = async () => {
    setIsUpdatingMargins(true);
    setStatusNotice(null);
    try {
      const res = await fetch('/api/dropship/deodap/update-margins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markupMultiplier,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusNotice(`✓ Updated ${data.updatedCount} store products with new ${marginPercent}% margin!`);
        if (onRefreshData) onRefreshData();
        loadLiveBestsellers();
      } else {
        throw new Error(data.error || 'Failed to update margins');
      }
    } catch (err: any) {
      setStatusNotice(`Margin update error: ${err.message}`);
    } finally {
      setIsUpdatingMargins(false);
    }
  };

  // Import single product or full collection page via direct URL
  const handleImportUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    let rawUrl = urlInput.trim();
    if (!rawUrl) return;

    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = `https://${rawUrl}`;
    }

    setIsImportingUrl(true);
    setUrlImportResult(null);

    try {
      const res = await fetch('/api/dropship/deodap/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: rawUrl,
          markupMultiplier,
          publishImmediately: publishImmediatelyUrl,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setUrlImportResult({
          success: true,
          message: data.message || 'Products uploaded to online store successfully!',
          type: data.type || (data.count && data.count > 1 ? 'collection' : 'single'),
          count: data.count || (data.product ? 1 : 0),
          collection: data.collection,
          product: data.product,
          products: data.products,
          wholesaleINR: data.wholesaleINR,
          retailINR: data.retailINR,
          profitINR: data.profitINR,
          isPublished: data.isPublished,
        });
        setUrlInput('');
        loadUploadedLinks();
        if (onRefreshData) onRefreshData();

        // Update local state if single product
        if (data.product) {
          setBestsellers((prev) =>
            prev.map((item) =>
              data.product?.supplierLink?.includes(item.handle)
                ? {
                    ...item,
                    isLinkedToAdmin: true,
                    isPublished: data.isPublished,
                    alreadyInStore: data.isPublished,
                    storeProductId: data.product?.id,
                  }
                : item
            )
          );
        }
      } else {
        throw new Error(data.error || 'Could not import product link.');
      }
    } catch (err: any) {
      setUrlImportResult({
        success: false,
        message: err.message || 'Direct link upload failed.',
      });
    } finally {
      setIsImportingUrl(false);
    }
  };

  // STEP 1: Link single bestseller to Admin Panel first (Draft / Unpublished)
  const handleLinkToAdmin = async (item: DeoDapBestsellerItem) => {
    setActionLoadingHandle(item.handle);
    setStatusNotice(null);

    try {
      const res = await fetch('/api/dropship/deodap/link-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productsToLink: [item],
          markupMultiplier,
          publishImmediately: false, // Step 1: Admin staging only
        }),
      });
      const data = await res.json();

      if (data.success) {
        const linkedProd = data.products?.[0];
        setBestsellers((prev) =>
          prev.map((i) =>
            i.handle === item.handle
              ? {
                  ...i,
                  isLinkedToAdmin: true,
                  isPublished: false,
                  alreadyInStore: false,
                  storeProductId: linkedProd?.id,
                }
              : i
          )
        );
        setStatusNotice(
          `✓ Linked "${item.title.slice(0, 35)}..." to Admin Panel with ${marginPercent}% margin (₹${item.retailINR}). Ready to publish to public store!`
        );
        if (onRefreshData) onRefreshData();
      } else {
        throw new Error(data.error || 'Linking failed.');
      }
    } catch (err: any) {
      setStatusNotice(`Error linking product: ${err.message}`);
    } finally {
      setActionLoadingHandle(null);
    }
  };

  // STEP 2: Publish an already linked product to the Public Store View
  const handlePublishProduct = async (item: DeoDapBestsellerItem) => {
    setActionLoadingHandle(item.handle);
    setStatusNotice(null);

    try {
      // If not yet in products, link and publish in one shot
      if (!item.isLinkedToAdmin) {
        const res = await fetch('/api/dropship/deodap/link-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productsToLink: [item],
            markupMultiplier,
            publishImmediately: true,
          }),
        });
        const data = await res.json();
        if (data.success) {
          const pub = data.products?.[0];
          setBestsellers((prev) =>
            prev.map((i) =>
              i.handle === item.handle
                ? {
                    ...i,
                    isLinkedToAdmin: true,
                    isPublished: true,
                    alreadyInStore: true,
                    storeProductId: pub?.id,
                  }
                : i
            )
          );
          setStatusNotice(
            `🚀 Published "${item.title.slice(0, 35)}..." to Public Store with ${marginPercent}% margin (₹${item.retailINR}) + ₹${item.deliveryChargeINR} delivery additional!`
          );
          if (onRefreshData) onRefreshData();
          return;
        }
      }

      // If already linked in admin, publish it
      const res = await fetch('/api/dropship/deodap/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: item.storeProductId ? [item.storeProductId] : [],
          handles: [item.handle],
        }),
      });
      const data = await res.json();

      if (data.success) {
        setBestsellers((prev) =>
          prev.map((i) =>
            i.handle === item.handle
              ? { ...i, isLinkedToAdmin: true, isPublished: true, alreadyInStore: true }
              : i
          )
        );
        setStatusNotice(
          `🚀 Published "${item.title.slice(0, 35)}..." to Public Store! Customers can now purchase at ₹${item.retailINR} (+ ₹${item.deliveryChargeINR} delivery additional).`
        );
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      setStatusNotice(`Publish error: ${err.message}`);
    } finally {
      setActionLoadingHandle(null);
    }
  };

  // UNPUBLISH: Revert from Public Store back to Admin Staging (Draft)
  const handleUnpublishProduct = async (item: DeoDapBestsellerItem) => {
    setActionLoadingHandle(item.handle);
    setStatusNotice(null);

    try {
      const res = await fetch('/api/dropship/deodap/unpublish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.storeProductId,
          handle: item.handle,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setBestsellers((prev) =>
          prev.map((i) =>
            i.handle === item.handle
              ? { ...i, isPublished: false, alreadyInStore: false }
              : i
          )
        );
        setStatusNotice(`Hidden "${item.title.slice(0, 35)}..." from public store. Staged in Admin.`);
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      setStatusNotice(`Unpublish error: ${err.message}`);
    } finally {
      setActionLoadingHandle(null);
    }
  };

  // Helper to strip unnecessary heavy data and send lightweight payload
  const toCompactPayloadItem = (item: DeoDapBestsellerItem) => ({
    sku: item.sku,
    handle: item.handle,
    title: item.title,
    cleanDescription: item.cleanDescription?.slice(0, 300) || '',
    wholesaleINR: item.wholesaleINR,
    costUSD: item.costUSD,
    priceUSD: item.priceUSD,
    stock: item.stock,
    supplierLink: item.supplierLink,
    primaryImage: item.primaryImage,
    images: (item.images || []).slice(0, 3),
    tags: (item.tags || []).slice(0, 5),
    vendor: item.vendor || 'DeoDap',
    productType: item.productType || 'Lifestyle Essentials',
  });

  // BATCH 1: Link All Bestsellers to Admin Panel first (Staged Drafts)
  const handleLinkAllToAdmin = async () => {
    const unlinked = bestsellers.filter((b) => !b.isLinkedToAdmin);
    if (unlinked.length === 0) {
      setStatusNotice('All displayed products are already linked into your Admin Panel!');
      return;
    }

    setIsBatchProcessing(true);
    setStatusNotice(null);

    try {
      const compactItems = unlinked.map(toCompactPayloadItem);
      // Chunk into batches of 40 to ensure small request sizes
      const CHUNK_SIZE = 40;
      let totalLinked = 0;

      for (let i = 0; i < compactItems.length; i += CHUNK_SIZE) {
        const batch = compactItems.slice(i, i + CHUNK_SIZE);
        const batchNum = Math.floor(i / CHUNK_SIZE) + 1;
        const totalBatches = Math.ceil(compactItems.length / CHUNK_SIZE);
        setStatusNotice(`Linking products to Admin Panel: batch ${batchNum} of ${totalBatches}...`);

        const res = await fetch('/api/dropship/deodap/link-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productsToLink: batch,
            markupMultiplier,
            publishImmediately: false, // Step 1: Admin staging only
          }),
        });

        const data = await res.json();
        if (data.success) {
          totalLinked += data.count || batch.length;
        } else {
          throw new Error(data.error || 'Failed to link batch.');
        }
      }

      setStatusNotice(
        `✓ Successfully linked ${totalLinked} products into Admin Panel with ${marginPercent}% margin! Review them below and click "Publish All" when ready.`
      );
      setBestsellers((prev) =>
        prev.map((i) => ({ ...i, isLinkedToAdmin: true, isPublished: i.isPublished }))
      );
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setStatusNotice(`Batch link error: ${err.message}`);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // BATCH 2: Publish All Staged Products to Public View with margin
  const handlePublishAllToPublic = async () => {
    setIsBatchProcessing(true);
    setStatusNotice(null);

    try {
      // 1. First ensure all unlinked items in view are linked
      const unlinked = bestsellers.filter((b) => !b.isLinkedToAdmin);
      if (unlinked.length > 0) {
        const compactItems = unlinked.map(toCompactPayloadItem);
        const CHUNK_SIZE = 40;
        for (let i = 0; i < compactItems.length; i += CHUNK_SIZE) {
          const batch = compactItems.slice(i, i + CHUNK_SIZE);
          await fetch('/api/dropship/deodap/link-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productsToLink: batch,
              markupMultiplier,
              publishImmediately: true,
            }),
          });
        }
      }

      // 2. Publish all staged DeoDap items
      const res = await fetch('/api/dropship/deodap/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publishAllStaged: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStatusNotice(
          `🎉 All DeoDap products successfully published to the Public Store with ${marginPercent}% margin! Customers can now view & buy them with delivery charges calculated additionally at checkout.`
        );
        setBestsellers((prev) =>
          prev.map((i) => ({ ...i, isLinkedToAdmin: true, isPublished: true, alreadyInStore: true }))
        );
        if (onRefreshData) onRefreshData();
      } else {
        throw new Error(data.error || 'Failed to publish all items.');
      }
    } catch (err: any) {
      setStatusNotice(`Publish all error: ${err.message}`);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Filtered view items with Search Support across all 270 / 262 items
  const filteredBestsellers = bestsellers.filter((item) => {
    if (activeViewFilter === 'staged' && (!item.isLinkedToAdmin || item.isPublished)) return false;
    if (activeViewFilter === 'published' && !item.isPublished) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = item.title.toLowerCase().includes(q);
      const skuMatch = item.sku.toLowerCase().includes(q);
      const vendorMatch = (item.vendor || '').toLowerCase().includes(q);
      const tagMatch = (item.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!titleMatch && !skuMatch && !vendorMatch && !tagMatch) return false;
    }
    return true;
  });

  const stagedCount = bestsellers.filter((b) => b.isLinkedToAdmin && !b.isPublished).length;
  const publishedCount = bestsellers.filter((b) => b.isPublished).length;

  const totalPages = Math.max(1, Math.ceil(filteredBestsellers.length / (itemsPerPage > 0 ? itemsPerPage : 24)));
  const paginatedBestsellers = itemsPerPage === -1
    ? filteredBestsellers
    : filteredBestsellers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Main Banner: Drop Ship Hub with Margin add dropdowns (default 50%) */}
      <div className="bg-gradient-to-r from-slate-900 via-[#111c33] to-slate-900 border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Globe className="w-5 h-5" />
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Drop Ship Hub
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  Default 50% Margin
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Upload products via web links, single product links, or CSV catalogs. Prices are extracted directly from supplier web links with calibrated margin and discount protection.
              </p>
            </div>

            {/* Action Buttons & Quick Multiplier Pill */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenSqlModal}
                className="bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 rounded-2xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/50"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Supabase SQL Settings</span>
              </button>

              <div className="bg-slate-950/80 border border-slate-700/80 rounded-2xl p-2.5 px-3.5 text-xs flex items-center gap-2.5">
                <span className="text-slate-400 text-[11px]">Margin:</span>
                <span className="font-mono text-cyan-300 font-black text-sm">{(1 + marginPercent / 100).toFixed(2)}x (+{marginPercent}%)</span>
              </div>
            </div>
          </div>

          {/* 3 Margin Add Dropdown Select Menus: 1. Web link upload, 2. Single product link, 3. CSV Catalog (default 50%) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
            {/* 1. Web Link Upload */}
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  1. Web link upload
                </span>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-full font-mono">Full Page</span>
              </div>
              <p className="text-[11px] text-slate-400">Upload entire collection/page web link</p>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-slate-300 font-semibold">Margin:</span>
                <select
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(Number(e.target.value))}
                  className="bg-slate-950 border border-cyan-500/50 rounded-xl px-2.5 py-1 text-xs font-black text-amber-300 font-mono cursor-pointer focus:outline-none"
                >
                  <option value={20}>20% Margin</option>
                  <option value={30}>30% Margin</option>
                  <option value={40}>40% Margin</option>
                  <option value={50}>50% Margin (Default)</option>
                  <option value={60}>60% Margin</option>
                  <option value={75}>75% Margin</option>
                  <option value={100}>100% Margin</option>
                </select>
              </div>
            </div>

            {/* 2. Single Product Link */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <LinkIcon className="w-4 h-4 text-emerald-400" />
                  2. Single product link
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full font-mono">Single SKU</span>
              </div>
              <p className="text-[11px] text-slate-400">Direct product link with auto-detected price</p>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-slate-300 font-semibold">Margin:</span>
                <select
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(Number(e.target.value))}
                  className="bg-slate-950 border border-emerald-500/50 rounded-xl px-2.5 py-1 text-xs font-black text-amber-300 font-mono cursor-pointer focus:outline-none"
                >
                  <option value={20}>20% Margin</option>
                  <option value={30}>30% Margin</option>
                  <option value={40}>40% Margin</option>
                  <option value={50}>50% Margin (Default)</option>
                  <option value={60}>60% Margin</option>
                  <option value={75}>75% Margin</option>
                  <option value={100}>100% Margin</option>
                </select>
              </div>
            </div>

            {/* 3. CSV Catalog */}
            <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 text-purple-300">
                  <Package className="w-4 h-4 text-purple-400" />
                  3. CSV Catalog
                </span>
                <span className="text-[10px] bg-purple-950 text-purple-400 px-2 py-0.5 rounded-full font-mono">Bulk CSV</span>
              </div>
              <p className="text-[11px] text-slate-400">Import bulk products via CSV spreadsheet</p>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-slate-300 font-semibold">Margin:</span>
                <select
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(Number(e.target.value))}
                  className="bg-slate-950 border border-purple-500/50 rounded-xl px-2.5 py-1 text-xs font-black text-amber-300 font-mono cursor-pointer focus:outline-none"
                >
                  <option value={20}>20% Margin</option>
                  <option value={30}>30% Margin</option>
                  <option value={40}>40% Margin</option>
                  <option value={50}>50% Margin (Default)</option>
                  <option value={60}>60% Margin</option>
                  <option value={75}>75% Margin</option>
                  <option value={100}>100% Margin</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification Message */}
      {statusNotice && (
        <div className="p-4 bg-cyan-950/90 border border-cyan-500/80 rounded-2xl text-cyan-100 text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>{statusNotice}</span>
          </div>
          <button
            onClick={() => setStatusNotice(null)}
            className="text-cyan-400 hover:text-white font-bold text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: Link Paste and Upload to Online Store (Full Page & Single Product Link) */}
      <div className="bg-[#111827] border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-cyan-400" />
                <span>Link Paste & Upload to Online Store</span>
              </h4>
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Full Page & Single Product Links
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Paste any web link from <a href="https://deodap.in" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline font-mono">deodap.in</a> — paste a <strong>single product link</strong> (e.g. <code className="text-amber-300 font-mono">/products/...</code>) or a <strong>full page collection link</strong> (e.g. <code className="text-emerald-300 font-mono">/collections/...</code>). Products are automatically extracted, calibrated with your <strong>+{marginPercent}% profit margin</strong>, and displayed in your online store!
            </p>
          </div>

          {/* Provision to change margin % */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-[#172238] border border-slate-700 p-2 rounded-2xl text-xs shrink-0">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Store Margin %:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-2 py-1">
                <input
                  type="number"
                  min={5}
                  max={200}
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(Math.max(1, Number(e.target.value) || 0))}
                  className="w-12 bg-transparent text-amber-300 font-mono font-black text-sm text-center focus:outline-none"
                />
                <span className="text-slate-400 font-bold text-xs">%</span>
              </div>
              <button
                type="button"
                onClick={handleUpdateAllStoreMargins}
                disabled={isUpdatingMargins}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="Recalculate and update margin across all store products"
              >
                {isUpdatingMargins ? 'Applying...' : 'Apply to Store'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Margin Presets Bar */}
        <div className="flex items-center gap-2 flex-wrap text-xs bg-slate-950/70 border border-slate-800/80 p-3 rounded-2xl">
          <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            Active Margin Presets:
          </span>
          {[20, 30, 35, 40, 45, 50, 60].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setMarginPercent(preset)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                marginPercent === preset
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20 font-black'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
              }`}
            >
              {preset}% {preset === 40 && '(Standard)'}
            </button>
          ))}
          <span className="text-[11px] text-slate-400 font-mono ml-auto hidden md:inline">
            Pricing Multiplier: <strong>{(1 + marginPercent / 100).toFixed(2)}x</strong>
          </span>
        </div>

        {/* Input Form */}
        <form onSubmit={handleImportUrl} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste link e.g. deodap.in/products/... or deodap.in/collections/... or amazon, meesho, etc."
                className="w-full bg-[#0a0f1d] border border-slate-700 focus:border-cyan-400 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none font-mono transition-colors shadow-inner"
              />
              {urlInput && (
                <button
                  type="button"
                  onClick={() => setUrlInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold p-1"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isImportingUrl || !urlInput.trim()}
              className="h-12 sm:h-auto px-6 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 active:scale-95 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
            >
              {isImportingUrl ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Uploading to Store...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                  <span>Upload & Display in Online Store</span>
                </>
              )}
            </button>
          </div>

          {/* Quick 1-Click Link Presets */}
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
            <span className="font-semibold text-slate-500">Quick Test Links:</span>
            <button
              type="button"
              onClick={() => setUrlInput('https://deodap.in/products/night-driving-glasses-anti-glare-yellow-lens')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 hover:border-cyan-500 transition-all cursor-pointer font-mono text-[10px]"
            >
              + Single DeoDap Product
            </button>
            <button
              type="button"
              onClick={() => setUrlInput('https://deodap.in/collections/best-selling-products')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer font-mono text-[10px]"
            >
              + Full DeoDap Collection Page
            </button>
            <button
              type="button"
              onClick={() => setUrlInput('https://deodap.in/products/kitchen-storage-box')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-500 transition-all cursor-pointer font-mono text-[10px]"
            >
              + Kitchen Storage Box
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
            {/* Publish Immediately Checkbox */}
            <label className="flex items-center gap-2 text-slate-200 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={publishImmediatelyUrl}
                onChange={(e) => setPublishImmediatelyUrl(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer accent-cyan-500"
              />
              <span>Display and publish directly to Online Storefront immediately</span>
            </label>
          </div>
        </form>

        {/* URL Import Result Notification */}
        {urlImportResult && (
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-3 animate-in fade-in duration-200 ${
              urlImportResult.success
                ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-100 shadow-xl'
                : 'bg-rose-950/70 border-rose-700/70 text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                {urlImportResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span>{urlImportResult.message}</span>
              </div>
              <button
                onClick={() => setUrlImportResult(null)}
                className="text-slate-400 hover:text-white font-bold text-xs p-1"
              >
                ✕
              </button>
            </div>

            {/* Single Product Result Preview */}
            {urlImportResult.product && (
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                <div className="flex items-center gap-3">
                  <div className="relative pt-3.5 shrink-0">
                    <div className="absolute top-0 inset-x-0 bg-slate-950 border border-cyan-500/60 text-[8px] font-black text-cyan-300 rounded px-1 py-0.2 text-center truncate shadow-xs z-10 max-w-[80px]">
                      {urlImportResult.supplierName || 'DeoDap Supplier'}
                    </div>
                    <img
                      src={urlImportResult.product.images[0]}
                      alt={urlImportResult.product.title}
                      className="w-14 h-14 object-cover rounded-xl border border-slate-700 shadow-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-white text-sm line-clamp-1">
                      {urlImportResult.product.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-slate-300 text-xs">
                      <span>Wholesale Cost: <strong className="text-slate-100 font-mono">₹{urlImportResult.wholesaleINR}</strong></span>
                      <span>+{marginPercent}% Margin: <strong className="text-emerald-400 font-mono">+₹{urlImportResult.profitINR}</strong></span>
                      <span>Online Store Price: <strong className="text-cyan-300 font-mono text-sm font-black">₹{urlImportResult.retailINR}</strong></span>
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        ✓ Live in Store
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href="/#shop"
                  onClick={() => {
                    window.location.hash = 'shop';
                    window.location.reload();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-md cursor-pointer transition-all"
                >
                  <Eye className="w-4 h-4 text-slate-950" />
                  <span>View in Online Store</span>
                </a>
              </div>
            )}

            {/* Full Page Collection Result Preview */}
            {urlImportResult.products && urlImportResult.products.length > 0 && (
              <div className="space-y-2 mt-1">
                <div className="text-xs text-slate-300 flex items-center justify-between">
                  <span className="font-bold text-emerald-300">
                    Uploaded {urlImportResult.products.length} Products from Collection Page:
                  </span>
                  <a
                    href="/#shop"
                    onClick={() => {
                      window.location.hash = 'shop';
                      window.location.reload();
                    }}
                    className="text-cyan-400 hover:underline text-xs font-bold flex items-center gap-1"
                  >
                    <span>View All in Online Storefront</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1 scrollbar-thin">
                  {urlImportResult.products.slice(0, 12).map((p: any) => (
                    <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-2 space-y-1">
                      <div className="relative aspect-square">
                        <div className="absolute top-0 inset-x-0 bg-slate-950/95 border-b border-cyan-500/50 text-[7.5px] font-black text-cyan-300 rounded-t-lg px-1 py-0.5 text-center truncate z-10">
                          {urlImportResult.supplierName || 'DeoDap Supplier'}
                        </div>
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="text-[11px] font-bold text-white line-clamp-1">{p.title}</div>
                      <div className="text-[10px] font-mono text-cyan-300 font-black">
                        ₹{p.wholesaleINR ? Math.round(p.wholesaleINR * (1 + marginPercent / 100)) : Math.round(p.costUSD * 86.5 * (1 + marginPercent / 100))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 1b: LIST OF UPLOADED WEB LINKS (Default margin 50%, detected supplier name) */}
      <div className="bg-[#111827] border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <span>Uploaded Web Links List</span>
              </h4>
              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full font-mono">
                {uploadedLinks.length} Uploaded Links
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Direct history of all supplier links pasted and uploaded to your store. Supplier name is detected from the link and displayed on top of product photos. Default margin is 50%.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUploadedLinks}
            disabled={isLoadingLinks}
            className="px-3 py-1.5 bg-[#0B1120] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoadingLinks ? 'animate-spin' : ''}`} />
            <span>Refresh Links</span>
          </button>
        </div>

        {uploadedLinks.length === 0 ? (
          <div className="p-8 text-center bg-[#0a0f1d] border border-slate-800 rounded-2xl space-y-2">
            <LinkIcon className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="font-bold text-slate-300 text-sm">No web links uploaded yet</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Paste a DeoDap or dropship supplier web link above to automatically parse products, apply your 50% profit margin, and track them here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0a0f1d]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0f172a] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-extrabold">
                  <th className="p-3">Product / Preview</th>
                  <th className="p-3">Detected Supplier</th>
                  <th className="p-3">Pasted Web Link</th>
                  <th className="p-3 text-center">Margin</th>
                  <th className="p-3">Uploaded Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {uploadedLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative pt-3 shrink-0">
                          <div className="absolute top-0 inset-x-0 bg-slate-950 border border-cyan-500/60 text-[7px] font-black text-cyan-300 rounded px-0.5 py-0.2 text-center truncate max-w-[50px] shadow-xs">
                            {link.supplierName.split(' ')[0]}
                          </div>
                          <img
                            src={link.sampleImage || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=80'}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-700/60 shrink-0"
                          />
                        </div>
                        <div className="min-w-0 max-w-[160px]">
                          <div className="font-bold text-white truncate text-xs" title={link.productTitles?.[0] || 'Imported Product'}>
                            {link.productTitles?.[0] || 'Imported Product'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {link.productsCount} item{link.productsCount > 1 ? 's' : ''} uploaded
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/80 text-[11px] font-bold text-emerald-300">
                        <Building className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate max-w-[130px]">{link.supplierName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {link.detectedDomain || 'direct supply'}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px] max-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-cyan-300" title={link.url}>
                          {link.url}
                        </span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-cyan-300 p-1 rounded hover:bg-slate-800"
                          title="Open supplier link in new tab"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="bg-amber-950/90 text-amber-300 border border-amber-800/80 font-mono font-black px-2 py-0.5 rounded-full text-[10px]">
                          +{link.marginPercent || 50}%
                        </span>
                        {link.discountPercent && link.discountPercent > 0 && (
                          <span className="bg-rose-950 text-rose-300 border border-rose-700/80 font-black text-[9px] px-1.5 py-0.2 rounded-full font-mono" title={link.discountBanner || `${link.discountPercent}% OFF`}>
                            {link.discountBanner || `${link.discountPercent}% OFF`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap font-mono">
                      {new Date(link.uploadedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/80 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Active in Store</span>
                        </span>
                        {link.discountPercent && link.discountPercent > 0 && (
                          <span className="text-[10px] text-pink-400 font-bold flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" /> Banner Live
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditLink(link)}
                          className="p-1.5 text-slate-300 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-slate-700/60"
                          title="Edit link margin and add product discount banner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(link.url);
                            setStatusNotice(`Copied link to clipboard: ${link.url}`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Copy supplier URL"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUploadedLink(link.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Remove from uploaded links history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: EDIT UPLOADED LINK & ADD DISCOUNT ON PRODUCTS */}
      {editingLink && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-cyan-500/50 rounded-2xl w-full max-w-md p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-cyan-400" />
                <h3 className="font-black text-white text-base">Edit Link & Add Discount</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingLink(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLinkEdit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Pasted Web Link:</span>
                <div className="font-mono text-cyan-300 truncate bg-slate-950 p-2 rounded-xl border border-slate-800 text-[11px]">
                  {editingLink.url}
                </div>
              </div>

              {/* Profit Margin % */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  Profit Margin % (Default 50%):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    max={200}
                    value={editMargin}
                    onChange={(e) => setEditMargin(Number(e.target.value) || 50)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                </div>
              </div>

              {/* Discount % on Products */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  Product Discount % (Shown as Banner on Products):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={editDiscount}
                    onChange={(e) => {
                      const d = Number(e.target.value) || 0;
                      setEditDiscount(d);
                      if (d > 0 && !editBanner) {
                        setEditBanner(`FLAT ${d}% OFF`);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold"
                    placeholder="e.g. 15"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Tip: Controls discount percentage so small priced products do not fall below cost price.
                </span>
              </div>

              {/* Discount Banner Label */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  Banner Text on Product Thumbnail:
                </label>
                <input
                  type="text"
                  value={editBanner}
                  onChange={(e) => setEditBanner(e.target.value)}
                  placeholder="e.g. SPECIAL 15% OFF or FESTIVE DEAL"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
                <span className="text-[10px] text-slate-400">
                  Once submitted, this badge is displayed directly on products imported via this link.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLinkEdit}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black rounded-xl cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSavingLinkEdit ? 'Saving...' : 'Submit & Show Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 2: DeoDap Bestsellers & Brand Products Pipeline (Admin Staging -> Public Store) */}
      <div className="bg-[#111827] border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        {/* Header with 2-Step Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>
                  {activeCollection === 'all-brand' && !customCollectionHandle
                    ? 'DeoDap All Brand Products Pipeline'
                    : 'DeoDap Live Catalog & Bestsellers Pipeline'}
                </span>
              </h4>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                {bestsellers.length} Loaded Items
              </span>
              <a
                href={
                  customCollectionHandle.trim()
                    ? (customCollectionHandle.startsWith('http') ? customCollectionHandle : `https://deodap.in/collections/${customCollectionHandle}`)
                    : activeCollection === 'all-brand'
                    ? 'https://deodap.in/collections/all-brand'
                    : 'https://deodap.in/collections/best-selling-products'
                }
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center gap-1"
                title="Open official DeoDap collection in new tab"
              >
                <span>
                  {activeCollection === 'all-brand' && !customCollectionHandle
                    ? 'deodap.in/collections/all-brand'
                    : 'deodap.in/collections/best-selling-products'}
                </span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Link products directly from DeoDap to your Admin Panel first, then publish to public view after adding {marginPercent}% margin.
            </p>
          </div>

          {/* Master 2-Step Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadLiveBestsellers}
              disabled={isLoadingBestsellers || isBatchProcessing}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Refresh live stream from DeoDap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBestsellers ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Refresh Feed</span>
            </button>

            {/* Step 1: Link All to Admin Panel First */}
            <button
              onClick={handleLinkAllToAdmin}
              disabled={isBatchProcessing || bestsellers.filter((b) => !b.isLinkedToAdmin).length === 0}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
              title="Link all fetched products into Admin Panel as draft staging items"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Step 1: Link All ({bestsellers.filter((b) => !b.isLinkedToAdmin).length}) to Admin</span>
            </button>

            {/* Step 2: Publish All to Public View with margin */}
            <button
              onClick={handlePublishAllToPublic}
              disabled={isBatchProcessing || bestsellers.length === 0}
              className="px-4 py-2 rounded-xl font-black text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-40"
              title={`Publish all products to the public customer store view with ${marginPercent}% margin`}
            >
              {isBatchProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Step 2: Publish All ({bestsellers.length}) to Public Store (+{marginPercent}%)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collection Selector Tabs: Bestsellers (270 items) vs All Brand (262 items) vs Custom */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Direct Collection:
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveCollection('best-selling-products');
                setCustomCollectionHandle('');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeCollection === 'best-selling-products' && !customCollectionHandle
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              🔥 Bestsellers (270 Products)
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCollection('all-brand');
                setCustomCollectionHandle('');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeCollection === 'all-brand' && !customCollectionHandle
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md shadow-amber-400/20'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              🏷️ All Brand Products (262 Products)
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCollection('all');
                setCustomCollectionHandle('');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeCollection === 'all' && !customCollectionHandle
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-sm'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              🌐 All Catalog
            </button>
          </div>

          {/* Custom Collection URL or Handle Input */}
          <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
            <input
              type="text"
              placeholder="Paste link e.g. https://deodap.in/collections/all-brand"
              value={customCollectionHandle}
              onChange={(e) => setCustomCollectionHandle(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono flex-1 sm:w-64"
            />
            {customCollectionHandle && (
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  loadLiveBestsellers();
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 cursor-pointer shadow-sm shrink-0"
              >
                Fetch
              </button>
            )}
          </div>
        </div>

        {/* Search, Filter Pills & Pagination Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={`Search among ${bestsellers.length} products by title, brand, SKU...`}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter View Pills */}
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => {
                setActiveViewFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeViewFilter === 'all'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All ({filteredBestsellers.length})
            </button>
            <button
              onClick={() => {
                setActiveViewFilter('staged');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeViewFilter === 'staged'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-amber-300 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>In Admin ({stagedCount})</span>
            </button>
            <button
              onClick={() => {
                setActiveViewFilter('published');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeViewFilter === 'published'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-emerald-300 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Public Store ({publishedCount})</span>
            </button>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className="text-slate-400 text-[11px]">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-cyan-400"
            >
              <option value={24}>24 / page</option>
              <option value={48}>48 / page</option>
              <option value={96}>96 / page</option>
              <option value={-1}>All ({filteredBestsellers.length})</option>
            </select>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoadingBestsellers && (
          <div className="p-14 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-300 font-medium">
              Connecting directly to <code className="text-cyan-300 font-mono">deodap.in</code> public stream (fetching full collection)...
            </p>
          </div>
        )}

        {/* Error message */}
        {bestsellerError && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{bestsellerError}</span>
          </div>
        )}

        {/* Empty Filter State */}
        {!isLoadingBestsellers && filteredBestsellers.length === 0 && (
          <div className="p-12 text-center space-y-2 bg-[#0a0f1d] rounded-2xl border border-slate-800">
            <Package className="w-10 h-10 text-slate-600 mx-auto" />
            <h5 className="font-bold text-white text-sm">No products found</h5>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No items match "${searchQuery}". Clear your search query to see all items.`
                : activeViewFilter === 'staged'
                ? 'No draft products currently waiting in Admin staging. Click "Step 1: Link All to Admin" above to link them!'
                : activeViewFilter === 'published'
                ? 'No products published to the public store yet. Click "Step 2: Publish All to Public Store" to make them live.'
                : 'No products returned from this collection.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 px-3 py-1.5 rounded-xl bg-slate-800 text-cyan-300 text-xs font-bold hover:bg-slate-700"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Products Grid (Paginated) */}
        {!isLoadingBestsellers && paginatedBestsellers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedBestsellers.map((item) => (
              <div
                key={item.deodapId || item.handle}
                className={`bg-[#0b101d] border rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-xl group ${
                  item.isPublished
                    ? 'border-emerald-600/50 hover:border-emerald-400'
                    : item.isLinkedToAdmin
                    ? 'border-amber-600/50 hover:border-amber-400'
                    : 'border-slate-800 hover:border-cyan-500/60'
                }`}
              >
                {/* Thumbnail & Badges */}
                <div className="relative aspect-square bg-slate-900 overflow-hidden">
                  {/* Supplier Name on Top Side of Product Photo (Admin page only) */}
                  <div className="absolute top-0 inset-x-0 bg-slate-950/95 backdrop-blur-xs border-b border-cyan-500/50 px-2 py-0.5 text-[8.5px] font-black text-cyan-300 flex items-center justify-between z-20 shadow-xs">
                    <span className="truncate flex items-center gap-1">
                      <Building className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                      <span>{item.vendor || 'DeoDap Dropship Supplier'}</span>
                    </span>
                    <span className="text-[8px] text-amber-300 font-mono font-bold">+{marginPercent}%</span>
                  </div>
                  <img
                    src={item.primaryImage}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pt-5"
                    loading="lazy"
                  />

                  {/* Status Badges on Image */}
                  <div className="absolute top-7 left-2.5 flex flex-col gap-1 z-10 max-w-[80%]">
                    {item.isPublished ? (
                      <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Live in Public Store
                      </span>
                    ) : item.isLinkedToAdmin ? (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <Package className="w-3 h-3" /> In Admin (Draft)
                      </span>
                    ) : (
                      <span className="bg-slate-950/90 text-cyan-300 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-cyan-400/30">
                        DeoDap Direct
                      </span>
                    )}

                    <span className="bg-slate-950/80 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.2 rounded-full border border-amber-400/30">
                      +{marginPercent}% Margin
                    </span>

                    {/* Brand / Vendor Tag */}
                    {item.vendor && item.vendor !== 'DeoDap' && (
                      <span className="bg-slate-900/90 text-cyan-200 text-[10px] font-semibold px-2 py-0.2 rounded-full border border-slate-700/80 truncate">
                        🏷️ {item.vendor}
                      </span>
                    )}
                  </div>

                  {/* Direct external link to DeoDap */}
                  <a
                    href={item.supplierLink}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-950/80 text-slate-300 hover:text-white transition-colors z-10"
                    title="View official product page on deodap.in"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Content */}
                <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-white line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h5>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="truncate">SKU: {item.sku}</span>
                      {item.vendor && <span className="text-slate-500 truncate ml-1">{item.vendor}</span>}
                    </div>
                  </div>

                  {/* Pricing Breakdown Card */}
                  <div className="bg-[#12192c] border border-slate-800 rounded-xl p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>DeoDap Wholesale:</span>
                      <span className="font-mono font-semibold text-slate-200">₹{item.wholesaleINR}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-bold">+{marginPercent}% Margin Profit:</span>
                      <span className="font-mono font-black text-emerald-400">+₹{item.profitINR}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                      <span className="text-white font-bold">Public Store Price:</span>
                      <span className="font-mono font-black text-cyan-300 text-sm">₹{item.retailINR}</span>
                    </div>

                    <div className="flex items-center justify-between pt-0.5 text-[10px] text-amber-300 font-medium">
                      <span>Delivery charges:</span>
                      <span>+₹{item.deliveryChargeINR} additional at checkout</span>
                    </div>
                  </div>

                  {/* Step Action Buttons */}
                  <div className="space-y-1.5 pt-1">
                    {item.isPublished ? (
                      <div className="space-y-1">
                        <div className="w-full py-1.5 px-2.5 rounded-xl bg-emerald-500/10 text-emerald-300 text-[11px] font-bold text-center border border-emerald-500/30 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Published & Live in Store</span>
                        </div>
                        <button
                          onClick={() => handleUnpublishProduct(item)}
                          disabled={actionLoadingHandle === item.handle}
                          className="w-full py-1 text-[11px] text-slate-400 hover:text-rose-400 hover:underline flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <EyeOff className="w-3 h-3" />
                          <span>Unpublish to Admin Staging</span>
                        </button>
                      </div>
                    ) : item.isLinkedToAdmin ? (
                      <div className="space-y-1.5">
                        <div className="w-full py-1 px-2 rounded-lg bg-amber-500/10 text-amber-300 text-[10px] font-bold text-center border border-amber-500/20">
                          In Admin Panel (Draft)
                        </div>
                        <button
                          onClick={() => handlePublishProduct(item)}
                          disabled={actionLoadingHandle === item.handle}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-500/15 cursor-pointer disabled:opacity-50"
                        >
                          {actionLoadingHandle === item.handle ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Publishing...</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Publish to Public Store</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {/* Step 1 Button: Link to Admin */}
                        <button
                          onClick={() => handleLinkToAdmin(item)}
                          disabled={actionLoadingHandle === item.handle}
                          className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                          title="Link to Admin Panel first as draft"
                        >
                          {actionLoadingHandle === item.handle ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                          <span>Link Admin</span>
                        </button>

                        {/* Step 2 Direct: Publish */}
                        <button
                          onClick={() => handlePublishProduct(item)}
                          disabled={actionLoadingHandle === item.handle}
                          className="py-2 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black flex items-center justify-center gap-1 transition-all active:scale-95 shadow-xs cursor-pointer disabled:opacity-50"
                          title={`Publish directly to public view with ${marginPercent}% margin`}
                        >
                          <Eye className="w-3 h-3" />
                          <span>Publish</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Pagination Bar */}
        {!isLoadingBestsellers && filteredBestsellers.length > 0 && itemsPerPage > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <div>
              Showing <strong className="text-white">{(currentPage - 1) * itemsPerPage + 1}</strong> -{' '}
              <strong className="text-white">
                {Math.min(currentPage * itemsPerPage, filteredBestsellers.length)}
              </strong>{' '}
              of <strong className="text-white">{filteredBestsellers.length}</strong> products
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 7) {
                  if (currentPage > 4 && currentPage < totalPages - 2) {
                    pageNum = currentPage - 3 + i;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 6 + i;
                  }
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: Workflow & Margin Verification Reference */}
      <div className="bg-[#111827] border border-slate-800 rounded-3xl p-5 sm:p-6 text-xs text-slate-300 space-y-3">
        <h4 className="font-bold text-white text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Workflow Rules & Delivery Fee Transparency</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="bg-[#0b101d] p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
            <span className="text-cyan-300 font-bold block text-xs">1. Linked to Admin Panel First</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Products are linked directly into the Admin Panel as staging drafts. Review title, images, and wholesale costs before publishing.
            </p>
          </div>
          <div className="bg-[#0b101d] p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
            <span className="text-amber-300 font-bold block text-xs">2. Exact {marginPercent}% Margin Pricing</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              DeoDap wholesale costs are marked up by <strong>{marginPercent}%</strong> (<code className="text-amber-300">Cost × {(1 + marginPercent / 100).toFixed(2)}</code>). Provision to easily change margin anytime via quick presets or custom percentage input.
            </p>
          </div>
          <div className="bg-[#0b101d] p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
            <span className="text-emerald-400 font-bold block text-xs">3. Delivery Charges Additional</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Delivery is not absorbed into the product price. Delivery fees (₹49 standard across India) are added additionally at checkout so customers get full transparency.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: Supabase SQL Settings Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#0f172a] border border-emerald-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Database className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    Supabase PostgreSQL Table Settings
                  </h3>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                    12 Tables Ready
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Run this SQL in your Supabase project dashboard to set up all tables, RLS security policies, and initial dropship configurations.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 3-Step Setup Instructions */}
            <div className="px-5 sm:px-6 py-3.5 bg-slate-900/60 border-b border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <div>
                  <span className="font-bold text-white block">Open Supabase</span>
                  <span className="text-slate-400 text-[11px]">Go to Dashboard &gt; SQL Editor &gt; + New query</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <div>
                  <span className="font-bold text-white block">Copy &amp; Paste Script</span>
                  <span className="text-slate-400 text-[11px]">Click "Copy SQL Query" below and paste in editor</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <div>
                  <span className="font-bold text-white block">Click Run</span>
                  <span className="text-slate-400 text-[11px]">Creates tables, RLS rules, and default seed data</span>
                </div>
              </div>
            </div>

            {/* Included Tables Badges */}
            <div className="px-5 sm:px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-slate-400 font-semibold mr-1">Tables:</span>
              {[
                'uploaded_web_links',
                'products',
                'dresses',
                'suppliers',
                'orders',
                'order_items',
                'dropship_settings',
                'payment_settings',
                'customer_users',
                'saved_addresses',
                'announcements',
                'store_offers',
              ].map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-md bg-slate-800/90 text-cyan-300 font-mono text-[10px] border border-slate-700">
                  {t}
                </span>
              ))}
            </div>

            {/* SQL Code Preview & Copy Action */}
            <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400 text-[11px]">PostgreSQL DDL + RLS Policies + Seed Data</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-xs"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-4 h-4 text-slate-950" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-950" />
                        <span>Copy Full SQL Script</span>
                      </>
                    )}
                  </button>
                  <a
                    href="/supabase_schema.sql"
                    download="supabase_schema.sql"
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-colors text-xs"
                  >
                    Download .sql
                  </a>
                </div>
              </div>

              <div className="relative rounded-2xl bg-[#090d16] border border-slate-800 p-4 max-h-[380px] overflow-y-auto text-slate-300 select-all whitespace-pre font-mono text-[11px] leading-relaxed">
                {isLoadingSql ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                    <span>Loading SQL Schema...</span>
                  </div>
                ) : (
                  sqlSchemaText || `-- Loading schema... Click "Copy Full SQL Script" or download directly.`
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">
                Direct UPI ID configured: <code className="text-amber-300 font-mono">9656850012@upi</code>
              </span>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
