import React, { useState, useEffect } from 'react';
import { Product, CurrencyCode } from '../types';
import { formatPrice } from '../utils/currency';
import {
  Sparkles,
  ShoppingBag,
  Star,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Zap,
  CheckCircle2,
  Tag,
  Eye,
} from 'lucide-react';

interface HeroBannerAdProps {
  products: Product[];
  currency: CurrencyCode;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
}

export const HeroBannerAd: React.FC<HeroBannerAdProps> = ({
  products,
  currency,
  onSelectProduct,
  onAddToCart,
}) => {
  // Filter for most selling or new stock / featured products
  const adProducts = products.filter((p) => p.featured || p.stock > 10).slice(0, 5);
  const fallbackList = adProducts.length > 0 ? adProducts : products.slice(0, 4);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (fallbackList.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % fallbackList.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [fallbackList.length, isPaused]);

  if (fallbackList.length === 0) return null;

  const currentProduct = fallbackList[currentIndex];
  // Calculate simulated MRP for discount badge (35% to 50% higher)
  const simulatedMRP = currentProduct.priceUSD * 1.45;
  const isBestSeller = currentIndex % 2 === 0;

  return (
    <div
      id="hero-banner-ad-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full lg:w-[420px] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl text-white overflow-hidden shrink-0 flex flex-col justify-between group"
    >
      {/* Decorative Glow Elements */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Badge & Navigation */}
      <div className="relative z-10 flex items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          {isBestSeller ? (
            <span className="inline-flex items-center gap-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              #1 Best Seller
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Zap className="w-3 h-3 text-cyan-400" />
              New Stock Arrival
            </span>
          )}

          <span className="text-[10px] bg-white/10 text-cyan-200 border border-cyan-500/30 px-2 py-0.5 rounded-md font-semibold">
            ⚡ Verified Quality
          </span>
        </div>

        {/* Banner Navigation Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setCurrentIndex((prev) => (prev - 1 + fallbackList.length) % fallbackList.length)
            }
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
            aria-label="Previous banner ad"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-slate-400 font-mono px-1">
            {currentIndex + 1}/{fallbackList.length}
          </span>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % fallbackList.length)}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
            aria-label="Next banner ad"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Banner Product Content */}
      <div
        onClick={() => onSelectProduct(currentProduct)}
        className="relative z-10 py-4 cursor-pointer flex gap-4 items-center"
      >
        {/* Product Visual Container */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-800 border border-white/15 shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
          <img
            src={currentProduct.images[0]}
            alt={currentProduct.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
            SAVE 35%
          </div>
        </div>

        {/* Product Details & Pricing */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-extrabold">{Number(currentProduct.rating).toFixed(1)}</span>
            <span className="text-slate-400 text-[11px]">({currentProduct.reviewsCount} reviews)</span>
          </div>

          <h4 className="font-black text-base sm:text-lg text-white line-clamp-1 leading-snug group-hover:text-cyan-300 transition-colors">
            {currentProduct.title.replace(/^(DeoDap|Baapstore|CJdropshipping|CJ)\s*[-–—:]*\s*/gi, '')}
          </h4>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-black text-white font-['Outfit',sans-serif]">
              {formatPrice(currentProduct.priceUSD, currency)}
            </span>
            <span className="text-xs sm:text-sm text-slate-400 line-through">
              {formatPrice(simulatedMRP, currency)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
            <span>Ready to Dispatch • Express</span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons & Indicators */}
      <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
        {/* Carousel indicator dots */}
        <div className="flex items-center gap-1.5">
          {fallbackList.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? 'w-6 bg-cyan-400 shadow-sm shadow-cyan-400/50' : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Big Action CTAs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectProduct(currentProduct)}
            className="h-11 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-100 hover:text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4" /> Details
          </button>
          <button
            onClick={(e) => onAddToCart(currentProduct, e)}
            className="h-11 px-5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-slate-950 text-xs sm:text-sm font-black transition-all flex items-center gap-2 shadow-lg shadow-cyan-950/30 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" /> Add to Bag
          </button>
        </div>
      </div>
    </div>
  );
};
