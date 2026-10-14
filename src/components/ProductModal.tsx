import React, { useState, useEffect } from 'react';
import { Product, CurrencyCode, CustomerLocation, DropshipDeliveryQuote } from '../types';
import { formatPrice } from '../utils/currency';
import { computeProductLiveSync, SUPPORTED_LOCATIONS } from '../utils/supplierSync';
import { lookupPostalCode, PostalLocationResult } from '../utils/pincodeLookup';
import { ProductReviewsSection } from './ProductReviewsSection';
import { getProductRandomDiscount } from '../utils/discountBanner';
import {
  X,
  Truck,
  ShieldCheck,
  Star,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  PackageCheck,
  Sparkles,
  Heart,
  ExternalLink,
  MapPin,
  Building2,
  MessageSquare,
  Zap,
  Plus,
} from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  allProducts?: Product[];
  currency: CurrencyCode;
  customerLocation?: CustomerLocation;
  onChangeLocation?: (loc: CustomerLocation) => void;
  isLiked?: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
  onToggleWishlist?: (product: Product) => void;
  onReviewAdded?: (productId: string, updatedReviews: any[], newRating: number, count: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  allProducts = [],
  currency,
  customerLocation,
  onChangeLocation,
  isLiked = false,
  onClose,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  onReviewAdded,
}) => {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  const [liveDropshipQuote, setLiveDropshipQuote] = useState<DropshipDeliveryQuote | null>(null);
  const [isSyncingDelivery, setIsSyncingDelivery] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('560001');
  const [pincodeCheckResult, setPincodeCheckResult] = useState<PostalLocationResult | null>(() => lookupPostalCode('560001', 'India'));

  useEffect(() => {
    if (!product) return;
    let isMounted = true;
    const fetchEstimate = async () => {
      setIsSyncingDelivery(true);
      try {
        const country = customerLocation?.country || 'India';
        const platform = product.supplierPlatform || 'DeoDap';
        const res = await fetch(
          `/api/dropship/delivery-estimate?country=${encodeURIComponent(country)}&platform=${encodeURIComponent(platform)}`
        );
        const data = await res.json();
        if (isMounted && data.success && data.quote) {
          setLiveDropshipQuote(data.quote);
        }
      } catch {
        // fallback
      } finally {
        if (isMounted) setIsSyncingDelivery(false);
      }
    };
    fetchEstimate();
    return () => {
      isMounted = false;
    };
  }, [product, customerLocation]);

  if (!product) return null;

  // Compute live location-aware sync directly from supplier link
  const liveSync =
    product.liveSync ||
    computeProductLiveSync(product, customerLocation?.country || 'India');

  const stock = liveSync.stock;
  const isLowStock = stock > 0 && stock <= product.reorderPoint;
  const isOutOfStock = stock <= 0;

  // Clean customer-facing title and description (hide internal supplier names)
  const displayTitle = product.title
    .replace(/^(DeoDap|Baapstore|CJdropshipping|CJ)\s*[-–—:]*\s*/gi, '')
    .trim();
  const displayDescription = product.description
    .replace(/DeoDap|Baapstore|CJdropshipping/gi, 'Kovira')
    .trim();

  const originalPriceUSD = Math.round(product.priceUSD * 1.35);
  const savingsUSD = originalPriceUSD - product.priceUSD;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="product-detail-modal"
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-y-auto md:overflow-hidden h-[96dvh] sm:h-auto sm:max-h-[90vh] flex flex-col md:flex-row text-slate-900 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
      >
        {/* Top Control Buttons (Wishlist + Close) - Floating with High Contrast */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 flex items-center gap-2">
          {onToggleWishlist && (
            <button
              id={`modal-wishlist-btn-${product.id}`}
              type="button"
              onClick={() => onToggleWishlist(product)}
              className={`p-2.5 sm:p-2 rounded-full transition-colors shadow-md border cursor-pointer ${
                isLiked
                  ? 'bg-rose-50 text-rose-500 border-rose-200'
                  : 'bg-white/90 backdrop-blur-md hover:bg-slate-100 text-slate-700 hover:text-rose-500 border-slate-200'
              }`}
              title={isLiked ? 'Remove from Liked list' : 'Add to Liked list'}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          )}
          <button
            id="close-product-modal-btn"
            onClick={onClose}
            className="p-2.5 sm:p-2 bg-white/95 backdrop-blur-md hover:bg-slate-100 text-slate-700 hover:text-slate-950 rounded-full shadow-md border border-slate-200 transition-colors cursor-pointer"
            title="Close details"
            aria-label="Close product modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Media Column */}
        <div className="w-full md:w-1/2 p-4 sm:p-6 flex flex-col justify-between bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 shrink-0">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-inner">
            <img
              src={product.images[selectedImageIdx] || product.images[0]}
              alt={product.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {isLowStock && (
              <div className="absolute bottom-3 left-3 bg-amber-50 text-amber-800 border border-amber-300 text-xs font-semibold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Only {stock} items available for {customerLocation?.country || 'your location'}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-3 sm:mt-4 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImageIdx === idx
                      ? 'border-slate-900 ring-2 ring-slate-900/10'
                      : 'border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info & Action Column */}
        <div className="w-full md:w-1/2 p-4 sm:p-6 overflow-y-auto max-h-none md:max-h-[88vh] flex flex-col justify-between space-y-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          <div className="space-y-4">
            {/* Category & Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {product && (() => {
                const disc = getProductRandomDiscount(product.id);
                return disc.hasDiscount ? (
                  <span className="text-[11px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 border border-rose-300/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                    <span>{disc.label}</span>
                  </span>
                ) : null;
              })()}
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                {product.category}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Free Worldwide Shipping
              </span>
            </div>

            {/* Product Title */}
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {displayTitle}
            </h2>

            {/* Rating Stars & Customer Review Provision */}
            <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200 fill-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-slate-900 font-extrabold">{Number(product.rating).toFixed(1)}</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className="text-slate-500 hover:text-cyan-700 underline underline-offset-2 cursor-pointer transition-colors"
                >
                  ({product.reviewsCount} customer reviews)
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200/80 px-2.5 py-1 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Star className="w-3.5 h-3.5 fill-cyan-500 text-cyan-500" />
                <span>Add Review</span>
              </button>
            </div>

            {/* Price Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl sm:text-4xl font-black text-slate-950 font-['Outfit',sans-serif] tracking-tight">
                    {formatPrice(product.priceUSD, currency)}
                  </span>
                  <span className="text-base text-slate-400 line-through">
                    {formatPrice(originalPriceUSD, currency)}
                  </span>
                  <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/60">
                    Save {formatPrice(savingsUSD, currency)}
                  </span>
                </div>
                <div className="text-xs text-amber-700 font-semibold mt-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Delivery charges additional (+₹{product.deliveryChargeINR || 49}) • Free over ₹999</span>
                </div>
              </div>

              {/* Stock Status Indicator */}
              <div className="text-right">
                {isOutOfStock ? (
                  <span className="text-rose-600 text-sm font-black block">Sold Out</span>
                ) : isLowStock ? (
                  <span className="text-amber-700 text-sm font-black block">
                    Only {stock} left
                  </span>
                ) : (
                  <span className="text-emerald-700 text-sm font-black block">
                    ✓ In Stock ({stock})
                  </span>
                )}
                <span className="text-xs text-slate-400">Ready to dispatch</span>
              </div>
            </div>

            {/* Tabs Selector: Overview vs Verified Customer Reviews */}
            <div className="flex border-b border-slate-200 gap-4 text-xs font-bold pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-cyan-500 text-slate-950 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-cyan-900'
                }`}
              >
                <span>Product & Live Delivery</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'reviews'
                    ? 'border-cyan-500 text-slate-950 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-cyan-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Verified Reviews ({product.reviewsCount})</span>
              </button>
            </div>

            {activeTab === 'overview' ? (
              <>
                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed">
                  {displayDescription}
                </p>

                {/* Live Location-Aware Fulfillment & Delivery Box */}
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 space-y-3 text-xs shadow-md border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-100">
                      <Truck className="w-4 h-4 text-cyan-400" />
                      <span>Direct Delivery Guarantee</span>
                    </div>
                    {/* Destination Country Switcher */}
                    {onChangeLocation && (
                      <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <select
                          id="modal-destination-country-select"
                          value={customerLocation?.country || 'India'}
                          onChange={(e) => {
                            const found =
                              SUPPORTED_LOCATIONS.find((loc) => loc.country === e.target.value) || {
                                country: e.target.value,
                                countryCode: 'IN',
                                flag: '🇮🇳',
                              };
                            onChangeLocation(found);
                          }}
                          className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                        >
                          {SUPPORTED_LOCATIONS.map((loc) => (
                            <option key={loc.country} value={loc.country} className="bg-slate-900 text-slate-100">
                              {loc.flag} {loc.country}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="block text-slate-400 font-medium">Estimated Arrival:</span>
                      <span className="text-amber-300 font-bold text-xs flex items-center gap-1">
                        {liveDropshipQuote?.estimatedDeliveryWindow || liveSync.deliveryEstimate}
                        {isSyncingDelivery && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-spin" />}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        ({liveDropshipQuote ? `${liveDropshipQuote.leadDaysMin}–${liveDropshipQuote.leadDaysMax} business days` : liveSync.leadDaysLabel})
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium">Direct Carrier:</span>
                      <span className="text-slate-100 font-semibold truncate block">
                        {liveDropshipQuote?.carrier || liveSync.carrier}
                      </span>
                      <span className="block text-[10px] text-cyan-400 font-medium mt-0.5">
                        ✓ Tracked Priority Delivery
                      </span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-800">
                      <span className="block text-slate-400 font-medium">Fulfillment Dispatch:</span>
                      <span className="text-slate-200 font-medium block truncate">
                        Kovira Indian Central Hub (Bengaluru / Mumbai) · Verified Quality Dispatch
                      </span>
                    </div>
                  </div>

                  {/* Indian Serviceable PIN Code Checker Widget */}
                  <div className="pt-2.5 border-t border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        Check Delivery Speed & Serviceable PIN Code
                      </span>
                      {pincodeCheckResult && (
                        <span className="text-[10px] font-bold text-emerald-400">
                          ✓ Delivery in 2-3 Days
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={pincodeInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setPincodeInput(val);
                          if (val.length >= 2) {
                            setPincodeCheckResult(lookupPostalCode(val, 'India'));
                          }
                        }}
                        placeholder="e.g. 560001 (Bengaluru), 110001 (Delhi)"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setPincodeCheckResult(lookupPostalCode(pincodeInput, 'India'))}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                      >
                        Check
                      </button>
                    </div>

                    {pincodeCheckResult && (
                      <div className="bg-slate-800/80 rounded-xl p-2 text-[10px] text-slate-300 flex items-center justify-between border border-slate-700/60">
                        <span>
                          📍 <strong>{pincodeCheckResult.city}, {pincodeCheckResult.state}</strong>
                        </span>
                        <span className="text-cyan-300 font-semibold">
                          Via {pincodeCheckResult.couriers.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1 text-cyan-300">
                      <CheckCircle2 className="w-3 h-3 text-cyan-400" /> In Stock & Ready to Dispatch: {stock} units
                    </span>
                    <span>100% Genuine Guaranteed</span>
                  </div>
                </div>
              </>
            ) : (
              <ProductReviewsSection
                productId={product.id}
                initialReviews={product.reviews || []}
                currentRating={product.rating}
                reviewsCount={product.reviewsCount}
                onReviewAdded={(updatedReviews, newRating, count) => {
                  if (onReviewAdded) {
                    onReviewAdded(product.id, updatedReviews, newRating, count);
                  }
                }}
              />
            )}

            {/* Trust Badges */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" /> Stripe SSL & UPI
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Truck className="w-3.5 h-3.5 text-cyan-600" /> Direct Hub Dispatch
              </span>
              <span className="flex items-center gap-1 font-medium">
                <PackageCheck className="w-3.5 h-3.5 text-slate-700" /> Quality Inspected
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-3 mt-4">
            <div className="flex items-center gap-3">
              {/* Quantity selector */}
              <div className="flex items-center border border-slate-300 bg-slate-50 rounded-2xl px-2 h-14 text-base">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-950 font-black text-lg cursor-pointer rounded-xl hover:bg-white transition-colors"
                >
                  -
                </button>
                <span className="px-3 font-black text-slate-950 min-w-[28px] text-center text-lg">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(stock || 1, quantity + 1))}
                  disabled={quantity >= stock}
                  className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-950 font-black text-lg disabled:opacity-30 cursor-pointer rounded-xl hover:bg-white transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to cart */}
              <button
                id="modal-add-to-cart-btn"
                disabled={isOutOfStock}
                onClick={() => {
                  onAddToCart(product, quantity);
                  onClose();
                }}
                className="flex-1 h-14 flex items-center justify-center gap-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 border border-slate-300 px-6 rounded-2xl font-black text-sm sm:text-base transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <ShoppingBag className="w-5 h-5 text-slate-900" />
                Add to Bag
              </button>
            </div>

            {/* Instant Buy with Stripe / UPI / COD */}
            <button
              id="modal-buy-now-btn"
              disabled={isOutOfStock}
              onClick={() => {
                onBuyNow(product, quantity);
                onClose();
              }}
              className="w-full h-14 flex items-center justify-center gap-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 px-6 rounded-2xl font-black text-base shadow-xl hover:shadow-cyan-500/25 active:scale-98 transition-all cursor-pointer"
            >
              <CreditCard className="w-5 h-5 text-slate-950" />
              <span>Instant Buy (UPI • COD • Card)</span>
            </button>

            {/* Mobile-Friendly Close Link */}
            <button
              type="button"
              onClick={onClose}
              className="w-full text-center py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
