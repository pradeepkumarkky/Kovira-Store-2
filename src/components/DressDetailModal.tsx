import React, { useState } from 'react';
import { DressProduct, CurrencyCode } from '../types';
import {
  X,
  Sparkles,
  Truck,
  Phone,
  ShoppingBag,
  Heart,
  Share2,
  Check,
  ShieldCheck,
  Tag,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';

interface DressDetailModalProps {
  dress: DressProduct | null;
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyCode;
  onAddToCart: (dress: DressProduct, selectedSize: string, quantity: number) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (dressId: string) => void;
}

export const DressDetailModal: React.FC<DressDetailModalProps> = ({
  dress,
  isOpen,
  onClose,
  currency,
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  if (!isOpen || !dress) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(dress.sizes[0] || 'M');
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  const images = dress.images && dress.images.length > 0
    ? dress.images
    : ['/assets/dresses/partywear_gown_1_1791385855095.jpg'];

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAdd = () => {
    onAddToCart(dress, selectedSize, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col md:flex-row max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: Photo Gallery */}
        <div className="w-full md:w-1/2 bg-slate-950 p-4 sm:p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-800 shrink-0">
          <div className="relative w-full aspect-3/4 rounded-2xl overflow-hidden bg-slate-900 shadow-inner group flex items-center justify-center">
            <img
              src={images[activeImageIndex]}
              alt={dress.title}
              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />

            {/* Discount Badge on Product Photo Thumbnail Highlight */}
            {dress.showDiscount && dress.discountPercent > 0 && (
              <div className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-xs sm:text-sm px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border border-white/20 animate-pulse">
                <Tag className="w-3.5 h-3.5" />
                <span>{dress.discountPercent}% OFF SPECIAL DEAL</span>
              </div>
            )}

            {/* Brand Badge */}
            <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1 shadow-md">
              <span>✨ Shivora Collections</span>
            </div>

            {/* Navigation Arrows if multiple photos */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails Row */}
          {images.length > 1 && (
            <div className="flex items-center gap-2.5 mt-3 overflow-x-auto w-full pb-1 scrollbar-none justify-center">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-18 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeImageIndex === idx ? 'border-cyan-400 scale-105 shadow-md shadow-cyan-500/20' : 'border-slate-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Instagram Tagline */}
          <div className="mt-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <span className="text-cyan-400 font-semibold">{dress.instagramHandle || '@shivora.collections'}</span>
            <span>•</span>
            <span>Shivora Collections</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Details & Actions */}
        <div className="w-full md:w-1/2 p-5 sm:p-7 overflow-y-auto space-y-5">
          {/* Category & Badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
              {dress.category || 'Partywear Gowns'}
            </span>
            <div className="flex items-center gap-2">
              {onToggleWishlist && (
                <button
                  onClick={() => onToggleWishlist(dress.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Save to Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              )}
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                title="Share link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit',sans-serif] tracking-tight leading-snug">
              {dress.title}
            </h2>
            {dress.subtitle && (
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                {dress.subtitle}
              </p>
            )}
          </div>

          {/* Pricing Section with 40% Margin & Discount Highlights */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-['Outfit',sans-serif]">
                ₹{dress.priceINR}/-
              </span>
              {dress.mrpINR && dress.mrpINR > dress.priceINR && (
                <span className="text-sm sm:text-base text-slate-400 line-through font-semibold">
                  MRP ₹{dress.mrpINR}/-
                </span>
              )}
              {dress.showDiscount && dress.discountPercent > 0 && (
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black px-2 py-0.5 rounded-md">
                  {dress.discountPercent}% OFF
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <Truck className="w-3.5 h-3.5" /> Pan India Delivery
              </span>
              <span className="text-slate-300 font-mono text-[11px] font-bold bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                {dress.designCode ? `Code: ${dress.designCode}` : `SKU: ${dress.sku}`}
              </span>
            </div>
          </div>

          {/* Structured Main Details (Design Code, Material, Category) */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Design Code</span>
              <span className="text-cyan-300 font-mono font-black text-xs">{dress.designCode || dress.sku}</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Fabric / Material</span>
              <span className="text-white font-bold text-xs truncate block">{dress.material || 'Pure Cotton Cambric'}</span>
            </div>
          </div>

          {/* Fine-Tuned Structured Highlights Matching Specifications */}
          <div className="space-y-2 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Product Highlights & Specifications
            </h3>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200">
              {dress.features && dress.features.length > 0 ? (
                dress.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-cyan-400 shrink-0 font-bold">•</span>
                    <span>{feat}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-center gap-2">✨ Stylish Printed Design</li>
                  <li className="flex items-center gap-2">✨ Soft Cotton Cambric Fabric</li>
                  <li className="flex items-center gap-2">✨ Sleeveless Pattern</li>
                  <li className="flex items-center gap-2">✨ Elegant & Comfortable Fit</li>
                  <li className="flex items-center gap-2">✨ Perfect for Party • Outing • Evening Wear 💫</li>
                </>
              )}
            </ul>
          </div>

          {/* Clean Lengthy Description Section formatted neatly */}
          {dress.fullDescription && (
            <div className="bg-slate-950/50 border border-slate-800/80 p-3.5 rounded-xl space-y-1.5 text-xs">
              <span className="text-cyan-400 font-extrabold uppercase text-[10px] tracking-wider block">
                Detailed Product Overview
              </span>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line text-xs font-normal">
                {dress.fullDescription}
              </p>
            </div>
          )}

          {/* Size Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-white">📏 Select Size:</span>
              <span className="text-slate-400">Regular Indian Boutique Fit</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {dress.sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                    selectedSize === sz
                      ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-md shadow-cyan-400/25 scale-[1.02]'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Tagline */}
          <div className="p-3 bg-gradient-to-r from-pink-950/30 via-purple-950/20 to-slate-900 rounded-xl border border-pink-500/20 text-center text-xs font-semibold text-pink-200">
            {dress.tagline || '💖 Trendy Look • Premium Feel • Perfect Style 💖'}
          </div>

          {/* Action Notice */}
          {addedNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" /> Added to Cart! Size: {selectedSize}
            </div>
          )}

          {/* ACTION BUTTON: Direct Online Add to Cart & Checkout */}
          <div className="pt-1">
            <button
              onClick={handleAdd}
              className="w-full py-4 px-5 bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black rounded-2xl text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-500/25 transition-all active:scale-[0.98] cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 text-slate-950" />
              <span>Add to Cart & Checkout (₹{dress.priceINR}/-)</span>
            </button>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>100% Quality Inspected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct Customer Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
