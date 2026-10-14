import React from 'react';
import { DressProduct } from '../types';
import {
  Sparkles,
  Truck,
  ArrowRight,
  ShoppingBag,
  Tag,
  Flame,
} from 'lucide-react';

interface DressPromoBannerProps {
  dresses: DressProduct[];
  onNavigateToDresses: () => void;
}

export const DressPromoBanner: React.FC<DressPromoBannerProps> = ({
  dresses,
  onNavigateToDresses,
}) => {
  const sampleDress = dresses[0];
  const images = dresses.slice(0, 3).map((d) => d.images[0] || '/assets/dresses/partywear_gown_1_1791385855095.jpg');

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#0e1526] to-slate-950 border-2 border-cyan-500/40 shadow-2xl p-6 sm:p-8 my-6 text-white group">
      {/* Decorative Brand Glows */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
        {/* Left Column: Catchy Message & Highlights */}
        <div className="space-y-3.5 text-center lg:text-left max-w-2xl">
          {/* Catchy Headline */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-['Outfit',sans-serif] tracking-tight leading-tight">
            👗 Shop <span className="text-cyan-400">Shivora Collections</span>
          </h2>

          {/* Catchy Body Message to read & navigate */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            Explore our curated boutique collection from <strong className="text-white font-bold">Shivora Collections</strong> — stylish printed patterns, pure soft cotton cambric fabrics, and elegant evening party fits with instant online checkout!
          </p>

          {/* Key Feature Highlights */}
          <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-5 flex-wrap text-xs text-slate-300 pt-1">
            <span className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Truck className="w-4 h-4 text-cyan-400" /> Pan-India Delivery
            </span>
            <span className="flex items-center gap-1.5 font-bold text-amber-300">
              <Tag className="w-4 h-4 text-amber-400" /> Starting ₹460/- (Up to 40% OFF)
            </span>
          </div>
        </div>

        {/* Right Column: Visual Photo Preview with Discount Badges & Big CTA */}
        <div className="flex flex-col items-center lg:items-end gap-4 shrink-0 w-full sm:w-auto">
          {/* Thumbnails Row */}
          <div className="flex items-center gap-2 sm:gap-3 justify-center">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`relative w-20 sm:w-24 aspect-3/4 rounded-2xl overflow-hidden border-2 shadow-lg transition-transform duration-300 hover:scale-105 ${
                  idx === 0 ? 'border-cyan-400 shadow-cyan-400/25' : 'border-slate-800'
                }`}
              >
                <img src={img} alt="Boutique gown" className="w-full h-full object-cover" />
                {idx === 0 && (
                  <span className="absolute top-1 left-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                    40% OFF
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Big CTA Button */}
          <button
            onClick={onNavigateToDresses}
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 active:scale-98 text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-cyan-400/30 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-slate-950" />
            <span>Shop Shivora Collections</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
