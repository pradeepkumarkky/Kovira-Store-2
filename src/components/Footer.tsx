import React, { useState } from 'react';
import { KoviraLogo } from './KoviraLogo';
import { Mail, ShieldCheck, Truck, RotateCcw, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenOrderTracker?: () => void;
  onOpenCategories?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenOrderTracker, onOpenCategories }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 text-xs border-t border-slate-800">
      {/* Top Highlights Banner */}
      <div className="border-b border-slate-800 py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-cyan-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Free Tracked Delivery</h4>
              <p className="text-slate-400 mt-1 leading-relaxed text-xs">
                Complimentary tracked dispatch on all orders over ₹999.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-cyan-300 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Direct Factory Dispatch</h4>
              <p className="text-slate-400 mt-1 leading-relaxed text-xs">
                Verified inventory linked directly with certified regional logistics centers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto py-12 px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand & Contact Info */}
        <div className="space-y-4 lg:col-span-2">
          <KoviraLogo size="md" showSubtitle={true} isLight={true} />
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
            Kovira delivers modern lifestyle essentials, precision timepieces, and intelligent home electronics engineered for durability and contemporary living.
          </p>
        </div>

        {/* Shop Collections */}
        <div className="space-y-3">
          <h5 className="font-bold text-white text-xs uppercase tracking-wider">
            Shop Collections
          </h5>
          <ul className="space-y-2 text-xs text-slate-400">
            <li><a href="#products-section" className="hover:text-white transition-colors">All Products</a></li>
            {onOpenCategories && (
              <li>
                <button
                  type="button"
                  onClick={onOpenCategories}
                  className="hover:text-cyan-400 text-cyan-300 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Browse Category Page</span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.2 rounded font-mono">Directory</span>
                </button>
              </li>
            )}
            <li><a href="#products-section" className="hover:text-white transition-colors">Smart Kitchen & Living</a></li>
            <li><a href="#products-section" className="hover:text-white transition-colors">Electronics & Smart Gadgets</a></li>
            <li><a href="#products-section" className="hover:text-white transition-colors">Personal Care & Accessories</a></li>
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div className="space-y-3">
          <h5 className="font-bold text-white text-xs uppercase tracking-wider">
            Stay Connected
          </h5>
          <p className="text-slate-400 text-xs leading-relaxed">
            Subscribe for special member pricing, seasonal drops, and 10% off your first purchase.
          </p>
          {subscribed ? (
            <div className="bg-emerald-950/80 border border-emerald-700/60 rounded-xl p-3 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>You're subscribed! Use code <strong>WELCOME10</strong> for 10% off.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex">
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul.sharma@gmail.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-l-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-2 rounded-r-xl text-xs transition-colors flex items-center cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[10px] text-slate-500 block">We respect your privacy. Unsubscribe anytime.</span>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Legal & Payment Bar */}
      <div className="border-t border-slate-800/80 py-6 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} Kovira Store. All rights reserved. GST Compliant PAN-India Retail.
          </div>
        </div>
      </div>
    </footer>
  );
};
