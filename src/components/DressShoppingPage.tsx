import React, { useState } from 'react';
import { DressProduct, CurrencyCode } from '../types';
import {
  Sparkles,
  ShoppingBag,
  Heart,
  SlidersHorizontal,
  Tag,
  ArrowLeft,
  Check,
  MessageCircle,
  Eye,
  CheckCircle2,
  Share2,
  Flame,
  Award,
  Layers,
} from 'lucide-react';
import { DressDetailModal } from './DressDetailModal';

interface DressShoppingPageProps {
  dresses: DressProduct[];
  currency: CurrencyCode;
  onAddToCart: (dress: DressProduct, selectedSize: string, quantity: number) => void;
  onBackToShop: () => void;
  onRefreshDresses: () => void;
  wishlistIds?: string[];
  onToggleWishlist?: (id: string) => void;
}

export const DressShoppingPage: React.FC<DressShoppingPageProps> = ({
  dresses,
  currency,
  onAddToCart,
  onBackToShop,
  onRefreshDresses,
  wishlistIds = [],
  onToggleWishlist,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('All');
  const [onlyDiscounted, setOnlyDiscounted] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'discount'>('featured');

  // Modals
  const [activeDress, setActiveDress] = useState<DressProduct | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null);

  // Selected size state for fast cards
  const [cardSelectedSizes, setCardSelectedSizes] = useState<Record<string, string>>({});

  const categories = ['All', 'Partywear Gowns', 'Cotton Cambric', 'Western Wear', 'Festive & Ethnic'];
  const sizes = ['All', 'M', 'L', 'XL', 'XXL'];

  // Filtering & Sorting
  const filteredDresses = dresses.filter((d) => {
    if (selectedCategory !== 'All' && d.category !== selectedCategory) return false;
    if (selectedSizeFilter !== 'All' && !d.sizes.includes(selectedSizeFilter)) return false;
    if (onlyDiscounted && (!d.showDiscount || d.discountPercent <= 0)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.priceINR - b.priceINR;
    if (sortBy === 'price-desc') return b.priceINR - a.priceINR;
    if (sortBy === 'discount') return (b.discountPercent || 0) - (a.discountPercent || 0);
    return 0;
  });

  const handleOpenDetail = (dress: DressProduct) => {
    setActiveDress(dress);
    setIsDetailModalOpen(true);
  };

  const handleQuickAdd = (dress: DressProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    const size = cardSelectedSizes[dress.id] || dress.sizes[0] || 'M';
    onAddToCart(dress, size, 1);
    setQuickAddedId(dress.id);
    setTimeout(() => setQuickAddedId(null), 2000);
  };



  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 md:pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. TOP HEADER & CATCHY HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#060911] via-slate-950 to-[#0b0f19] border-b border-slate-800/80 px-4 py-8 sm:py-12">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Bar with Back Button */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onBackToShop}
              className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-cyan-400 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to General Store</span>
            </button>
          </div>

          {/* Boutique Announcement */}
          <div className="max-w-3xl space-y-3.5">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-['Outfit',sans-serif] tracking-tight leading-[1.15]">
              👗 Shivora Collections <br />
              <span className="text-cyan-400">Designer Western & Partywear Gowns</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
              Elevate your style with handcrafted prints, soft cotton cambric fabrics, and elegant silhouettes from Shivora Collections. Dispatched across India with priority courier tracking.
            </p>
          </div>
        </div>
      </section>

      {/* 2. FILTER & SORT NAVIGATION BAR */}
      <section className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border ${
                  selectedCategory === cat
                    ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Size Filter & Discount Toggle */}
          <div className="flex items-center gap-2.5 overflow-x-auto w-full md:w-auto justify-between md:justify-end pb-1 md:pb-0">
            {/* Size Selector Pills */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl shrink-0">
              <span className="text-[11px] font-bold text-slate-400 px-2">Size:</span>
              {sizes.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSizeFilter(sz)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    selectedSizeFilter === sz
                      ? 'bg-cyan-400 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>

            {/* Discount Highlight Filter Toggle */}
            <button
              onClick={() => setOnlyDiscounted((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border shrink-0 ${
                onlyDiscounted
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-rose-500/40'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-rose-400" />
              <span>Discount Deals</span>
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer shrink-0"
            >
              <option value="featured">Featured Collection</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
            </select>
          </div>
        </div>
      </section>

      {/* 3. DRESS PRODUCT CATALOG GRID */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
          <div>
            Showing <strong className="text-white font-extrabold">{filteredDresses.length}</strong> designer dress{filteredDresses.length !== 1 ? 'es' : ''}
          </div>
          <div className="text-cyan-400 font-semibold">
            ✨ Shivora Collections • Pan-India Delivery Available
          </div>
        </div>

        {filteredDresses.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No dresses match this filter</h3>
            <p className="text-xs text-slate-400">
              Try resetting your category or size filters, or upload a new dress to the boutique!
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedSizeFilter('All');
                setOnlyDiscounted(false);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5 md:gap-6">
            {filteredDresses.map((dress) => {
              const cardSelectedSize = cardSelectedSizes[dress.id] || dress.sizes[0] || 'M';
              const isWishlisted = wishlistIds.includes(dress.id);
              const isAdded = quickAddedId === dress.id;
              const primaryImage = dress.images?.[0] || '/assets/dresses/partywear_gown_1_1791385855095.jpg';

              return (
                <div
                  key={dress.id}
                  onClick={() => handleOpenDetail(dress)}
                  className="group relative bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {/* PRODUCT PHOTO THUMBNAIL (With Highlighted Discount Badge) */}
                  <div className="relative aspect-3/4 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={primaryImage}
                      alt={dress.title}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* PROVISION TO SHOW DISCOUNT HIGHLIGHTED ON THUMBNAIL (As requested!) */}
                    {dress.showDiscount && dress.discountPercent > 0 && (
                      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 text-white font-black text-[9px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl shadow-xl flex items-center gap-1 sm:gap-1.5 border border-white/20 animate-pulse">
                        <Tag className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
                        <span>{dress.discountPercent}% OFF</span>
                      </div>
                    )}

                    {/* Brand Tag on Thumbnail */}
                    <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-slate-950/80 backdrop-blur-md text-cyan-300 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1 shadow-md">
                      <span>✨ Shivora</span>
                    </div>

                    {/* Quick Wishlist Button on Thumbnail */}
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-2 z-10">
                      {onToggleWishlist && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(dress.id);
                          }}
                          className="p-1.5 sm:p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-rose-400 border border-slate-700/60 transition-colors shadow-md cursor-pointer"
                          title="Save to Wishlist"
                        >
                          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* PRODUCT DETAILS (Main details only to show along with the products) */}
                  <div className="p-2.5 sm:p-5 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      {/* Category Tag & Design Code */}
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-1.5 sm:px-2 py-0.5 rounded border border-cyan-800 truncate">
                          {dress.category || 'Gowns'}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-cyan-300 font-mono font-bold bg-slate-900 px-1.5 sm:px-2 py-0.5 rounded border border-slate-800">
                          {dress.designCode ? `Code: ${dress.designCode}` : dress.sku}
                        </span>
                      </div>

                      {/* Material / Fabric Badge if available */}
                      {dress.material && (
                        <div className="text-[10px] sm:text-[11px] text-slate-300 font-medium flex items-center gap-1 sm:gap-1.5 truncate">
                          <span className="text-slate-400 shrink-0">🧵 Fabric:</span>
                          <span className="text-white font-bold truncate">{dress.material}</span>
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="font-extrabold text-xs sm:text-base lg:text-lg text-white font-['Outfit',sans-serif] group-hover:text-cyan-300 transition-colors line-clamp-2 leading-tight sm:leading-snug">
                        {dress.title}
                      </h3>

                      {/* Neat Feature Highlights - Shown on larger screens */}
                      <ul className="text-xs text-slate-300 space-y-1 pt-1 border-t border-slate-800/80 hidden sm:block">
                        {dress.features && dress.features.slice(0, 3).map((feat, i) => (
                          <li key={i} className="flex items-center gap-1.5 truncate">
                            <span className="text-cyan-400 font-bold">•</span>
                            <span className="truncate">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Sizes Selection Strip */}
                    <div className="space-y-1 pt-1.5 sm:pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                        <span className="font-bold text-slate-400">📏 Sizes:</span>
                        <span className="text-cyan-300 font-semibold">{cardSelectedSize} Selected</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                        {dress.sizes.map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCardSelectedSizes((prev) => ({ ...prev, [dress.id]: sz }));
                            }}
                            className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black transition-all cursor-pointer border ${
                              cardSelectedSize === sz
                                ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clean Price with Slashed MRP (No delivery charge shown in dress section) */}
                    <div className="pt-1.5 sm:pt-2 border-t border-slate-800/80 flex items-baseline justify-between flex-wrap gap-1 sm:gap-2">
                      <div className="flex items-baseline gap-1.5 sm:gap-2">
                        <span className="text-base sm:text-xl lg:text-2xl font-black text-cyan-400 font-['Outfit',sans-serif]">
                          ₹{dress.priceINR}/-
                        </span>
                        {dress.mrpINR && dress.mrpINR > dress.priceINR && (
                          <span className="text-[10px] sm:text-xs text-slate-400 line-through font-semibold">
                            MRP ₹{dress.mrpINR}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ACTION BUTTON: Direct Add to Cart & Checkout */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(dress, e)}
                        className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-cyan-500/20'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>Added to Cart!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                            <span>Add to Cart (₹{dress.priceINR}/-)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 4. MODALS */}
      <DressDetailModal
        dress={activeDress}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setActiveDress(null);
        }}
        currency={currency}
        onAddToCart={onAddToCart}
        isWishlisted={activeDress ? wishlistIds.includes(activeDress.id) : false}
        onToggleWishlist={onToggleWishlist}
      />
    </div>
  );
};
