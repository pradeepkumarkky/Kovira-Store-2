import React, { useState, useEffect } from 'react';
import { Product, CurrencyCode, CustomerLocation } from '../types';
import { formatPrice } from '../utils/currency';
import { computeProductLiveSync } from '../utils/supplierSync';
import { getProductRandomDiscount } from '../utils/discountBanner';
import { Star, ShoppingBag, Eye, CheckCircle2, Zap, AlertTriangle, Heart, Truck, ExternalLink, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  currency: CurrencyCode;
  customerLocation?: CustomerLocation;
  isLiked?: boolean;
  viewMode?: 'grid' | 'list';
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onBuyNow?: (product: Product, e: React.MouseEvent) => void;
  onToggleWishlist?: (product: Product, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  customerLocation,
  isLiked = false,
  viewMode = 'list',
  onSelect,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
}) => {
  // Random 10-15% discount banner (editable from admin panel)
  const [discountInfo, setDiscountInfo] = useState(() => getProductRandomDiscount(product.id));

  useEffect(() => {
    const handleUpdate = () => {
      setDiscountInfo(getProductRandomDiscount(product.id));
    };
    window.addEventListener('discount-banner-updated', handleUpdate);
    return () => window.removeEventListener('discount-banner-updated', handleUpdate);
  }, [product.id]);

  // Compute location-aware live sync values directly from supplier link
  const liveSync =
    product.liveSync ||
    computeProductLiveSync(product, customerLocation?.country || 'India');

  const stock = liveSync ? liveSync.stock : product.stock;
  const isLowStock = stock > 0 && stock <= product.reorderPoint;
  const isOutOfStock = stock <= 0;

  // Clean customer-facing title and description (hide internal supplier names)
  const displayTitle = product.title
    .replace(/^(DeoDap|Baapstore|CJdropshipping|CJ)\s*[-–—:]*\s*/gi, '')
    .trim();
  const displayDescription = product.description
    .replace(/DeoDap|Baapstore|CJdropshipping/gi, 'Kovira')
    .trim();

  // Calculate estimated original MSRP (standard 25-35% markdown to simulate realistic customer retail savings)
  const originalPriceUSD = Math.round(product.priceUSD * 1.35);
  const savingsUSD = originalPriceUSD - product.priceUSD;

  // ---------------- LIST VIEW LAYOUT ----------------
  if (viewMode === 'list') {
    return (
      <div
        id={`product-card-${product.id}`}
        onClick={() => onSelect(product)}
        className="group relative bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-row items-stretch cursor-pointer"
      >
        {/* Left: Product Picture (fills full left height) */}
        <div className="relative w-28 sm:w-44 md:w-56 lg:w-64 shrink-0 bg-slate-950 overflow-hidden self-stretch">
          <img
            src={product.images[0]}
            alt={product.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />

          {/* Badges on Image */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1 z-10">
            {((product as any).customDiscountBanner || discountInfo.hasDiscount) && (
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md border border-white/20 animate-pulse">
                <Sparkles className="w-2.5 h-2.5 text-amber-200 fill-amber-200" />
                <span>{(product as any).customDiscountBanner || discountInfo.label}</span>
              </span>
            )}
            {product.featured && (
              <span className="inline-flex items-center gap-1 bg-slate-900/90 text-cyan-300 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md border border-cyan-400/20">
                <Zap className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" /> Bestseller
              </span>
            )}
            <span className="inline-flex items-center bg-rose-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
              Save {formatPrice(savingsUSD, currency)}
            </span>
          </div>

          {/* Wishlist Heart Button */}
          {onToggleWishlist && (
            <button
              id={`wishlist-btn-${product.id}`}
              type="button"
              onClick={(e) => onToggleWishlist(product, e)}
              className={`absolute top-2 sm:top-3 right-2 sm:right-3 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md ${
                isLiked
                  ? 'bg-white text-rose-500 hover:bg-rose-50 ring-2 ring-rose-400 scale-105'
                  : 'bg-white/95 hover:bg-white text-slate-500 hover:text-rose-500 hover:scale-110'
              }`}
              aria-label={isLiked ? 'Remove from Liked list' : 'Save to Liked list'}
              title={isLiked ? 'Remove from Liked list' : 'Add to Liked list'}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-all duration-150 ${
                  isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
                }`}
              />
            </button>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="bg-white text-slate-950 text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 border border-slate-200">
              <Eye className="w-3 h-3 text-cyan-600" /> View
            </span>
          </div>
        </div>

        {/* Right: Product Details (aligned with picture height) */}
        <div className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 flex flex-col justify-between gap-2.5 self-stretch">
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-cyan-400 font-extrabold uppercase tracking-wider text-[10px] sm:text-[11px] truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                {product.category}
              </span>
              <div className="flex items-center gap-1 text-amber-400 font-extrabold text-xs shrink-0" title={`${Number(product.rating).toFixed(1)} stars from ${product.reviewsCount} customer reviews`}>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{Number(product.rating).toFixed(1)}</span>
                <span className="text-slate-400 font-medium text-[10px]">({product.reviewsCount})</span>
              </div>
            </div>

            {/* Product Name - Scaled Down for Proportional Elegance */}
            <h3 className="font-bold text-sm sm:text-base lg:text-lg text-white group-hover:text-cyan-400 transition-colors leading-snug line-clamp-2">
              {displayTitle}
            </h3>

            {/* Short Minimal Description */}
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 hidden sm:block">
              {displayDescription}
            </p>

            {/* Delivery badge */}
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
              <Truck className="w-3 h-3 text-emerald-400" />
              <span>{customerLocation?.flag || '⚡'} Delivery · {liveSync.deliveryEstimate}</span>
            </div>
          </div>

          {/* Pricing & Action Buttons (Aligned along bottom of card) */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl lg:text-2xl font-black text-white font-['Outfit',sans-serif]">
                  {formatPrice(product.priceUSD, currency)}
                </span>
                <span className="text-xs text-slate-400 line-through">
                  {formatPrice(originalPriceUSD, currency)}
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-amber-400 font-medium block truncate">
                +₹{product.deliveryChargeINR || 49} Delivery charges additional (Free over ₹999)
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id={`add-to-cart-list-${product.id}`}
                disabled={isOutOfStock}
                onClick={(e) => onAddToCart(product, e)}
                className={`py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                  isOutOfStock
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
              </button>

              <button
                id={`buy-now-list-${product.id}`}
                disabled={isOutOfStock}
                onClick={(e) => onBuyNow ? onBuyNow(product, e) : onAddToCart(product, e)}
                className={`py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                  isOutOfStock
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- GRID VIEW LAYOUT ----------------

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onSelect(product)}
      className="group relative bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 active:scale-[0.99] flex flex-col cursor-pointer"
    >
      {/* Product Media Container */}
      <div className="relative w-full aspect-square bg-slate-950 overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2 sm:top-3.5 left-2 sm:left-3.5 flex flex-col gap-1 sm:gap-1.5 z-10 max-w-[80%]">
          {discountInfo.hasDiscount && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white text-[9px] sm:text-[11px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-lg border border-white/25 animate-pulse">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-200 fill-amber-200" />
              <span>{discountInfo.label}</span>
            </span>
          )}
          {product.featured && (
            <span className="inline-flex items-center gap-1 bg-slate-950/90 backdrop-blur-xs text-cyan-300 text-[9px] sm:text-[11px] font-black uppercase tracking-wider px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md border border-cyan-500/30">
              <Zap className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-cyan-400 fill-cyan-400" />
              <span className="hidden xs:inline">Bestseller</span>
            </span>
          )}

          {/* Discount Badge */}
          <span className="inline-flex items-center bg-rose-600 text-white text-[9px] sm:text-[11px] font-black uppercase tracking-wider px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md">
            Save {formatPrice(savingsUSD, currency)}
          </span>
        </div>

        {/* Wishlist / Liked Heart Button */}
        {onToggleWishlist && (
          <button
            id={`wishlist-btn-${product.id}`}
            type="button"
            onClick={(e) => onToggleWishlist(product, e)}
            className={`absolute top-2 sm:top-3.5 right-2 sm:right-3.5 z-20 w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md ${
              isLiked
                ? 'bg-white text-rose-500 hover:bg-rose-50 ring-2 ring-rose-400 scale-105'
                : 'bg-slate-950/80 hover:bg-white text-slate-300 hover:text-rose-500 hover:scale-110 border border-slate-700/60'
            }`}
            aria-label={isLiked ? 'Remove from Liked list' : 'Save to Liked list'}
            title={isLiked ? 'Remove from Liked list' : 'Add to Liked list'}
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-5 sm:h-5 transition-all duration-150 ${
                isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-300'
              }`}
            />
          </button>
        )}

        {/* Desktop Delivery Pill Over Image */}
        <div className="hidden sm:block absolute bottom-3 left-3 right-3 z-10">
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 flex items-center justify-between shadow-md">
            {isOutOfStock ? (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Sold Out
              </span>
            ) : isLowStock ? (
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Only {stock} left
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{customerLocation?.flag || '⚡'} Delivery {liveSync.deliveryEstimate}</span>
              </span>
            )}
            <span className="text-slate-400 font-semibold text-[11px]">
              {liveSync.leadDaysMin}–{liveSync.leadDaysMax}d
            </span>
          </div>
        </div>

        {/* Hover Quick View Trigger */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center pointer-events-none">
          <span className="bg-white text-slate-950 text-xs sm:text-sm font-extrabold px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-cyan-600" /> Quick View
          </span>
        </div>
      </div>

      {/* Product Details & Action Buttons */}
      <div className="p-2.5 sm:p-4 md:p-5 flex flex-col flex-1 justify-between gap-2 sm:gap-2.5 bg-slate-900 border-t border-slate-800">
        <div className="space-y-1 sm:space-y-1.5">
          {/* Category & Star Rating */}
          <div className="flex items-center justify-between text-xs gap-1">
            <span className="text-cyan-400 uppercase tracking-wider text-[9px] sm:text-[11px] font-extrabold flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block shrink-0" />
              <span className="truncate">{product.category}</span>
            </span>
            <div className="flex items-center gap-1 text-amber-400 font-bold text-[10px] sm:text-xs shrink-0" title={`${Number(product.rating).toFixed(1)} stars`}>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{Number(product.rating).toFixed(1)}</span>
              <span className="text-slate-400 font-normal hidden sm:inline">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-xs sm:text-sm md:text-base text-white group-hover:text-cyan-400 transition-colors line-clamp-2 leading-tight sm:leading-snug min-h-[2rem] sm:min-h-0">
            {displayTitle}
          </h3>

          {/* Mobile Delivery Note */}
          <div className="sm:hidden text-[10px] text-emerald-400 font-medium flex items-center gap-1 truncate">
            <Truck className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">Delivery {liveSync.deliveryEstimate}</span>
          </div>

          {/* Price Callout */}
          <div className="flex items-baseline gap-1.5 sm:gap-2 pt-0.5">
            <span className="text-sm sm:text-lg md:text-xl font-black text-white font-['Outfit',sans-serif] tracking-tight">
              {formatPrice(product.priceUSD, currency)}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 line-through">
              {formatPrice(originalPriceUSD, currency)}
            </span>
          </div>
          <div className="text-[9px] sm:text-[11px] text-amber-400/90 font-medium truncate">
            +₹{product.deliveryChargeINR || 49} delivery
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-1.5 flex items-center gap-1.5 sm:gap-2">
          <button
            id={`add-to-cart-btn-${product.id}`}
            disabled={isOutOfStock}
            onClick={(e) => onAddToCart(product, e)}
            className={`flex-1 py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 active:scale-95 shadow-xs flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
              isOutOfStock
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title="Add to Cart"
          >
            <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
          </button>

          {onBuyNow && !isOutOfStock && (
            <button
              id={`buy-now-btn-${product.id}`}
              disabled={isOutOfStock}
              onClick={(e) => onBuyNow(product, e)}
              className="py-1.5 sm:py-2.5 px-2 sm:px-3.5 rounded-xl text-[11px] sm:text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-all duration-200 active:scale-95 shadow-xs flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
              title="Instant Checkout"
            >
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-slate-950 text-slate-950 shrink-0" />
              <span>Buy</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
