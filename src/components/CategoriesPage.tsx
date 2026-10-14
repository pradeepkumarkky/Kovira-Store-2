import React, { useState, useMemo } from 'react';
import { Product, CustomerLocation } from '../types';
import { formatPrice } from '../utils/currency';
import {
  LayoutGrid,
  ArrowLeft,
  Sparkles,
  Flame,
  Award,
  Search,
  CheckCircle2,
  Package,
  CookingPot,
  Home,
  Cpu,
  Smile,
  Dumbbell,
  Wrench,
  Boxes,
  ArrowRight,
  Eye,
  ShoppingCart,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

export interface CategoriesPageProps {
  categories: string[];
  products: Product[];
  currency: string;
  customerLocation: CustomerLocation;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onSelectCollection: (collection: 'all' | 'bestsellers' | 'brands') => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onBackToShop: () => void;
}

// Category visual metadata for rich thumbnail cards
const CATEGORY_META: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    border: string;
    badgeColor: string;
    description: string;
    tags: string[];
  }
> = {
  'Smart Kitchen': {
    icon: CookingPot,
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    border: 'border-amber-500/40 hover:border-amber-400',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Electric choppers, non-stick cookware, rotating condiment organizers, slicers & kitchen tools',
    tags: ['Choppers', 'Tawa', 'Organizers', 'Mincers', 'Utensils'],
  },
  'Home & Living': {
    icon: Home,
    gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
    border: 'border-blue-500/40 hover:border-blue-400',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    description: 'Motivational 1L time-marked water bottles, vacuum thermos flasks, showpieces & home decor',
    tags: ['Water Bottles', 'LED Thermos', 'Buddha', 'Mugs', 'Planters'],
  },
  'Smart Gadgets': {
    icon: Cpu,
    gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
    border: 'border-purple-500/40 hover:border-purple-400',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'USB star projectors, 8-in-1 screen cleaning kits, wireless audio & tech gadgets',
    tags: ['Projectors', 'Cleaners', 'Earphones', 'Car Disco'],
  },
  'Home Improvement': {
    icon: Wrench,
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    border: 'border-emerald-500/40 hover:border-emerald-400',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Unbreakable adhesive wall mirror sheets, spray bottles, hooks & repairs',
    tags: ['Mirror Sheets', 'Spray Bottles', 'Wall Decor'],
  },
  'Lifestyle Accessories': {
    icon: Smile,
    gradient: 'from-pink-500/20 via-rose-500/10 to-transparent',
    border: 'border-pink-500/40 hover:border-pink-400',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    description: 'Mini doll keychains, car backrest organizers, foldable hangers & gift items',
    tags: ['Keychains', 'Gifts', 'Car Accessories', 'Hangers'],
  },
  'Fitness & Sports': {
    icon: Dumbbell,
    gradient: 'from-teal-500/20 via-emerald-500/10 to-transparent',
    border: 'border-teal-500/40 hover:border-teal-400',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    description: 'Motivational 1L gym bottles, shaker bottles & daily hydration tracking gear',
    tags: ['Gym Bottles', 'Hydration', 'Outdoor'],
  },
  Electronics: {
    icon: Cpu,
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    border: 'border-cyan-500/40 hover:border-cyan-400',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    description: 'In-ear wired earphones with microphone, silicone keyboard covers & cables',
    tags: ['Audio', 'Earphones', 'Keyboard Cover', 'Computer'],
  },
  'Personal Care': {
    icon: Sparkles,
    gradient: 'from-rose-500/20 via-purple-500/10 to-transparent',
    border: 'border-rose-500/40 hover:border-rose-400',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    description: 'Hair straightener massage brushes, sleep eye masks & personal wellness essentials',
    tags: ['Hair Care', 'Sleep Masks', 'Grooming'],
  },
  'Home & Storage': {
    icon: Boxes,
    gradient: 'from-indigo-500/20 via-violet-500/10 to-transparent',
    border: 'border-indigo-500/40 hover:border-indigo-400',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    description: 'Canvas laundry storage bags, multi-tier steel kitchen racks & pantry organizers',
    tags: ['Laundry Bags', 'Storage Racks', 'Bins'],
  },
};

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  products,
  currency,
  customerLocation,
  selectedCategory,
  onSelectCategory,
  onSelectCollection,
  onSelectProduct,
  onAddToCart,
  onBackToShop,
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'categories' | 'all-thumbnails'>('categories');
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchName = cat.toLowerCase().includes(search.toLowerCase());
      const matchProduct = products.some(
        (p) => p.category === cat && (p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
      );
      return matchName || matchProduct;
    });
  }, [categories, products, search]);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const map: Record<string, Product[]> = {};
    for (const cat of categories) {
      map[cat] = products.filter((p) => p.category === cat);
    }
    return map;
  }, [categories, products]);

  const handleChooseCategory = (cat: string) => {
    onSelectCategory(cat);
    onSelectCollection('all');
    onBackToShop();
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleChooseCollection = (coll: 'all' | 'bestsellers' | 'brands') => {
    onSelectCollection(coll);
    if (coll === 'bestsellers') onSelectCategory('Bestsellers');
    else if (coll === 'brands') onSelectCategory('Brands');
    else onSelectCategory('All');
    onBackToShop();
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  return (
    <div className="w-full min-h-[85vh] bg-[#090d16] text-slate-100 py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
        
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <button
              onClick={onBackToShop}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Shop Store</span>
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-black flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-cyan-400" />
              <span>All Categories & Thumbnail Directory</span>
            </span>
          </div>

          <button
            onClick={onBackToShop}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <span>Back to Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Page Hero Header */}
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-[#101b2f] to-slate-900 border border-slate-800 p-6 sm:p-10 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Visual Product Directory</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black text-white font-['Outfit',sans-serif] tracking-tight">
              Categories & Department Thumbnails
            </h1>
            
            <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-medium">
              Browse factory-direct wholesale collections with high-resolution visual thumbnails. Click any department or thumbnail to filter or inspect product details.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <Package className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">{products.length} Products</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <LayoutGrid className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">{categories.length} Departments</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white">Direct Express Logistics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Curated Feeds & Quick Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Bestsellers Card */}
          <button
            onClick={() => handleChooseCollection('bestsellers')}
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#131d31] to-slate-900 border border-amber-500/30 hover:border-amber-400 text-left transition-all active:scale-[0.98] group cursor-pointer shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                270 Items
              </span>
            </div>
            <div>
              <div className="text-sm font-black text-white group-hover:text-amber-300 transition-colors flex items-center gap-1">
                Bestsellers Feed <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Top-rated trending popular products</div>
            </div>
          </button>

          {/* Brands Card */}
          <button
            onClick={() => handleChooseCollection('brands')}
            className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/15 via-[#131d31] to-slate-900 border border-teal-500/30 hover:border-teal-400 text-left transition-all active:scale-[0.98] group cursor-pointer shadow-lg hover:shadow-teal-500/10 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5 text-teal-400" />
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800 font-bold">
                262 SKUs
              </span>
            </div>
            <div>
              <div className="text-sm font-black text-white group-hover:text-teal-300 transition-colors flex items-center gap-1">
                All Brands Directory <ChevronRight className="w-4 h-4 text-teal-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-xs text-slate-400 mt-0.5">GripChef, Styleva & brand collections</div>
            </div>
          </button>

          {/* All Catalog Card */}
          <button
            onClick={() => handleChooseCollection('all')}
            className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-[#131d31] to-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all active:scale-[0.98] group cursor-pointer shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                {products.length} Products
              </span>
            </div>
            <div>
              <div className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                Full Store Catalog <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Every verified wholesale SKU in stock</div>
            </div>
          </button>
        </div>

        {/* Search & View Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
          {/* Instant Search Bar */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter departments or products..."
              className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                activeTab === 'categories'
                  ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-black shadow-xs'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Department Thumbnails</span>
            </button>
            <button
              onClick={() => setActiveTab('all-thumbnails')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                activeTab === 'all-thumbnails'
                  ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-black shadow-xs'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Product Thumbnails ({products.length})</span>
            </button>
          </div>
        </div>

        {/* VIEW MODE 1: DEPARTMENT THUMBNAIL CARDS */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {filteredCategories.map((cat) => {
                const catProducts = productsByCategory[cat] || [];
                const meta = CATEGORY_META[cat] || {
                  icon: Package,
                  gradient: 'from-slate-800/40 via-slate-900/20 to-transparent',
                  border: 'border-slate-800 hover:border-slate-600',
                  badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
                  description: 'Curated wholesale collection for modern living.',
                  tags: ['Wholesale', 'Direct Supply'],
                };
                const Icon = meta.icon;
                const primaryImage = catProducts[0]?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';

                return (
                  <div
                    key={cat}
                    className={`rounded-3xl bg-slate-900/90 border ${meta.border} p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between shadow-xl hover:shadow-cyan-500/5 group`}
                  >
                    <div>
                      {/* Top Row: Icon, Category Name, Product Count Badge */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                            <Icon className="w-6 h-6 text-cyan-400" />
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                              {cat}
                            </h3>
                            <p className="text-xs text-slate-400 line-clamp-1">
                              {meta.description}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-950 text-cyan-300 border border-slate-800 shrink-0">
                          {catProducts.length} {catProducts.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      {/* Visual Thumbnail Showcase Row */}
                      <div className="mb-4">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Product Thumbnails</span>
                          <span className="text-[10px] text-slate-500">Click photo to view</span>
                        </div>
                        
                        <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                          {catProducts.slice(0, 4).map((p) => (
                            <div
                              key={p.id}
                              onClick={() => onSelectProduct(p)}
                              className="group/thumb relative aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-cyan-400 transition-all cursor-pointer"
                              title={`${p.title} - ${formatPrice(p.priceUSD, currency as any)}`}
                            >
                              <img
                                src={p.images[0]}
                                alt={p.title}
                                className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-end p-1">
                                <span className="text-[9px] font-black text-cyan-300 truncate w-full font-mono">
                                  {formatPrice(p.priceUSD, currency as any)}
                                </span>
                              </div>
                            </div>
                          ))}

                          {/* Fallback fill if fewer than 4 items */}
                          {catProducts.length < 4 && (
                            <div
                              onClick={() => handleChooseCategory(cat)}
                              className="aspect-square rounded-xl bg-slate-950/50 border border-dashed border-slate-800 hover:border-slate-600 flex flex-col items-center justify-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer p-1 text-center"
                            >
                              <Package className="w-4 h-4 mb-1" />
                              <span className="text-[10px] font-bold">More</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tag Pills Row */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-5">
                        {meta.tags.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-950 text-slate-400 border border-slate-800"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-400">
                        Wholesale from{' '}
                        <strong className="text-white font-mono">
                          {catProducts.length > 0
                            ? formatPrice(Math.min(...catProducts.map((p) => p.priceUSD)), currency as any)
                            : '₹40'}
                        </strong>
                      </div>

                      <button
                        onClick={() => handleChooseCategory(cat)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-cyan-500/25"
                      >
                        <span>Browse {cat}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredCategories.length === 0 && (
              <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-3">
                <Search className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No categories found matching "{search}"</h3>
                <p className="text-xs text-slate-400">Try searching for Kitchen, Living, Gadgets, or Audio</p>
                <button
                  onClick={() => setSearch('')}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-cyan-400 font-bold text-xs hover:bg-slate-700 cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE 2: ALL PRODUCTS THUMBNAIL GALLERY */}
        {activeTab === 'all-thumbnails' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                All Products Thumbnail Gallery ({products.length})
              </h2>
              <span className="text-xs text-slate-400">Click any product to view full specifications</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {products
                .filter((p) =>
                  !search ? true : p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
                )
                .map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectProduct(p)}
                    className="group rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-400 p-2.5 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-md hover:shadow-cyan-500/10"
                  >
                    <div>
                      {/* Product Thumbnail */}
                      <div className="aspect-square rounded-xl overflow-hidden bg-slate-950 mb-2 relative">
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[10px] text-cyan-300 font-mono font-bold">
                          {p.category.split(' ')[0]}
                        </div>
                      </div>

                      {/* Product Title */}
                      <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-cyan-300 transition-colors mb-1">
                        {p.title}
                      </h4>
                    </div>

                    {/* Price & Action */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs font-black text-cyan-400 font-mono">
                        {formatPrice(p.priceUSD, currency as any)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(p, 1);
                        }}
                        className="w-7 h-7 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
                        title="Quick Add to Cart"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
