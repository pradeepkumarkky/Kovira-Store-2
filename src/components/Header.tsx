import React, { useState, useEffect } from 'react';
import { KoviraLogo } from './KoviraLogo';
import { CurrencyCode, CustomerLocation, CustomerUser, Product } from '../types';
import { CURRENCIES } from '../utils/currency';
import { SUPPORTED_LOCATIONS } from '../utils/supplierSync';
import { SmartSearch } from './SmartSearch';
import {
  ShoppingBag,
  Menu,
  X,
  Lock,
  Truck,
  Sparkles,
  Heart,
  User,
  CheckCircle2,
  LogOut,
  Sun,
  Moon,
  ShieldCheck,
  Zap,
  Flame,
  Award,
  LayoutGrid,
  ChevronRight,
  Boxes,
  Compass,
} from 'lucide-react';

interface HeaderProps {
  currentCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  customerLocation?: CustomerLocation;
  onChangeLocation?: (loc: CustomerLocation) => void;
  currentUser?: CustomerUser | null;
  onOpenCustomerAuth?: () => void;
  onLogout?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  cartCount: number;
  cartSubtotalUSD?: number;
  wishlistCount?: number;
  onOpenCart: () => void;
  onOpenWishlist?: () => void;
  onOpenAdmin: () => void;
  onOpenOrderTracker?: () => void;
  onOpenCategories?: () => void;
  onSelectCollection?: (collection: 'all' | 'bestsellers' | 'brands') => void;
  activeCollection?: 'all' | 'bestsellers' | 'brands';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories: string[];
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
  currentPage?: 'shop' | 'categories' | 'dresses' | 'admin';
  onOpenDresses?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCurrency,
  onCurrencyChange,
  customerLocation,
  onChangeLocation,
  currentUser,
  onOpenCustomerAuth,
  onLogout,
  theme = 'dark',
  onToggleTheme,
  cartCount,
  cartSubtotalUSD = 0,
  wishlistCount = 0,
  onOpenCart,
  onOpenWishlist,
  onOpenAdmin,
  onOpenOrderTracker,
  onOpenCategories,
  onOpenDresses,
  onSelectCollection,
  activeCollection = 'all',
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categories,
  products = [],
  onSelectProduct,
  currentPage = 'shop',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamic Announcement from Admin / Server
  const [announcement, setAnnouncement] = useState<{
    tag: string;
    message: string;
    enabled: boolean;
    promoCode?: string;
  }>({
    tag: '✨ FESTIVE OFFER:',
    message: 'Free Delivery on all orders over ₹999',
    enabled: true,
    promoCode: 'KOVIRA10',
  });

  useEffect(() => {
    fetch('/api/announcement')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.announcement) {
          const a = data.announcement;
          setAnnouncement({
            tag: a.tag || a.badge || '✨ FESTIVE OFFER:',
            message: a.message || a.headline || 'Free Delivery on all orders over ₹999',
            enabled: Boolean(a.enabled ?? a.isEnabled ?? true),
            promoCode: a.promoCode || 'KOVIRA10',
          });
        }
      })
      .catch(() => {});
  }, []);

  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-[100] w-full max-w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100 transition-colors shadow-lg">
      {/* Top Customer Announcement Bar (Centered & Clean) */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 text-slate-200 px-3 sm:px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-center text-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2 py-0.5 rounded font-black tracking-wide text-[10px] uppercase">
            {announcement.tag}
          </span>
          <span className="font-semibold text-slate-200">
            {announcement.message}
          </span>
          {announcement.promoCode && (
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold">
              Code: {announcement.promoCode}
            </span>
          )}
        </div>
      </div>

      {/* LINE 1: Brand Logo, Integrated Search & Action Buttons */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-4 w-full">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#"
            id="brand-logo-link"
            className="flex items-center group cursor-pointer"
            title="Kovira Store"
          >
            <KoviraLogo size="lg" showSubtitle={true} isLight={true} />
          </a>
        </div>

        {/* Center: Smart Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-lg lg:max-w-xl mx-2 lg:mx-6">
          <SmartSearch
            products={products}
            currency={currentCurrency}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onSelectProduct={onSelectProduct || (() => {})}
            onSelectCategory={onSelectCategory}
            placeholder="Search watches, wireless earbuds, smart gadgets, audio..."
            className="w-full"
          />
        </div>

        {/* Right Action Cluster - Responsive & Constrained to Prevent Off-Screen Overflow */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
          {/* User Account & Logout Section - Desktop & Tablet */}
          {currentUser ? (
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl sm:rounded-2xl p-1">
              {/* Account details trigger */}
              <button
                id="open-customer-auth-btn"
                onClick={onOpenCustomerAuth}
                className="h-8 sm:h-9 flex items-center gap-1.5 px-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                title={`Account: ${currentUser.name}`}
              >
                <div className="w-6 h-6 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center text-[10px] font-black">
                  {currentUser.name[0]?.toUpperCase() || 'U'}
                </div>
                <span className="max-w-[70px] sm:max-w-[100px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
              </button>

              {/* Dedicated Logout Button */}
              {onLogout && (
                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  className="h-8 sm:h-9 flex items-center gap-1 px-2 rounded-lg sm:rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                  title="Log out of your account"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          ) : (
            onOpenCustomerAuth && (
              <button
                id="open-customer-auth-btn"
                onClick={onOpenCustomerAuth}
                className="hidden sm:flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                title="Customer Sign In / Register"
              >
                <User className="w-4 h-4 text-cyan-400" />
                <span>Sign In</span>
              </button>
            )
          )}

          {/* Liked / Wishlist Trigger Button - Desktop & Tablet (already in bottom nav on mobile) */}
          {onOpenWishlist && (
            <button
              id="open-wishlist-button"
              onClick={onOpenWishlist}
              className="hidden sm:flex relative h-9 sm:h-10 items-center gap-1.5 sm:gap-2 bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-700 text-slate-200 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
              title="View Liked Products Wishlist"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                }`}
              />
              <span>Liked</span>
              {wishlistCount > 0 && (
                <span
                  id="wishlist-count-badge"
                  className="bg-rose-500 text-white text-[11px] font-black px-1.5 py-0.2 rounded-full min-w-[20px] text-center"
                >
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

          {/* Cart Trigger Button - Ultra Compact on Mobile */}
          <button
            id="open-cart-button"
            onClick={onOpenCart}
            className="relative h-9 sm:h-10 flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-slate-950 font-black px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm transition-all shadow-md hover:shadow-cyan-500/25 cursor-pointer shrink-0"
            title="Open Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4 text-slate-950 shrink-0" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 ? (
              <span
                id="cart-count-badge"
                className="bg-slate-950 text-cyan-300 text-xs font-black px-1.5 sm:px-2 py-0.5 rounded-full min-w-[18px] sm:min-w-[20px] text-center shadow-xs"
              >
                {cartCount}
              </span>
            ) : (
              <span className="text-slate-900/70 text-xs hidden sm:inline">(0)</span>
            )}
          </button>

          {/* Theme Switcher Button - Guaranteed within screen view */}
          {onToggleTheme && (
            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle visual theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-300" />
              )}
            </button>
          )}

          {/* 3-Line Drop-Down Menu Button (Mobile & Desktop) */}
          <button
            id="header-dropdown-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`h-9 sm:h-10 px-2.5 sm:px-3 flex items-center gap-1.5 rounded-xl border transition-all cursor-pointer shrink-0 shadow-xs active:scale-95 ${
              mobileMenuOpen
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 ring-1 ring-cyan-400'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/80'
            }`}
            aria-label="Toggle navigation menu"
            title="Menu: Categories, Bestsellers, Brands & More"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5 text-slate-200" />}
            <span className="hidden sm:inline text-xs font-bold text-slate-200">Menu</span>
          </button>
        </div>
      </div>

      {/* LINE 2 (Mobile only): Smart Search Bar */}
      <div className="md:hidden px-3 sm:px-4 pb-2.5">
        <SmartSearch
          products={products}
          currency={currentCurrency}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onSelectProduct={onSelectProduct || (() => {})}
          onSelectCategory={onSelectCategory}
          placeholder="Search products..."
          className="w-full"
        />
      </div>

      {/* LINE 3: Sleek Category Navigation Bar */}
      <div className="border-t border-slate-800/80 bg-slate-950/80 px-3 sm:px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center overflow-x-auto scrollbar-none gap-2 py-0.5">
          {/* All Collections */}
          <button
            id="category-tab-all"
            onClick={() => {
              if (onSelectCollection) onSelectCollection('all');
              onSelectCategory('All');
            }}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 border ${
              selectedCategory === 'All' && activeCollection === 'all'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 border-cyan-400 shadow-md font-black'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-700/80'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${selectedCategory === 'All' && activeCollection === 'all' ? 'text-slate-950' : 'text-cyan-400'}`} />
            <span>All</span>
          </button>

          {/* Categories Button */}
          {onOpenCategories && (
            <button
              id="category-tab-open-categories"
              onClick={onOpenCategories}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                currentPage === 'categories'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 border-cyan-400 shadow-md font-black'
                  : 'bg-gradient-to-r from-cyan-950/80 to-slate-900 text-cyan-300 hover:text-white hover:border-cyan-400 border-cyan-500/40 shadow-xs'
              }`}
              title="Open Separate Category Page (Thumbnail View)"
            >
              <LayoutGrid className={`w-3.5 h-3.5 ${currentPage === 'categories' ? 'text-slate-950' : 'text-cyan-400'}`} />
              <span>Categories</span>
            </button>
          )}

          {/* Dedicated Dresses Boutique Button */}
          {onOpenDresses && (
            <button
              id="category-tab-open-dresses"
              onClick={onOpenDresses}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                currentPage === 'dresses'
                  ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 text-white border-pink-400 shadow-md font-black'
                  : 'bg-gradient-to-r from-pink-950/80 to-slate-900 text-pink-300 hover:text-white hover:border-pink-400 border-pink-500/40 shadow-xs'
              }`}
              title="Shop Online Dress Collection - Shivora Collections"
            >
              <span>👗 Shivora Collections</span>
              <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider animate-pulse">
                HOT
              </span>
            </button>
          )}

          {/* Bestsellers Fast Pill */}
          <button
            id="category-tab-bestsellers"
            onClick={() => {
              if (onSelectCollection) onSelectCollection('bestsellers');
              else onSelectCategory('Bestsellers');
            }}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 border ${
              activeCollection === 'bestsellers' || selectedCategory === 'Bestsellers'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-400 shadow-md font-black'
                : 'bg-slate-900 text-amber-300/90 hover:bg-slate-800 hover:text-amber-300 border-amber-500/30'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${activeCollection === 'bestsellers' || selectedCategory === 'Bestsellers' ? 'fill-slate-950 text-slate-950' : 'fill-amber-400 text-amber-400'}`} />
            <span>Bestsellers (270)</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat && activeCollection === 'all';
            return (
              <button
                key={cat}
                id={`category-tab-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => {
                  if (onSelectCollection) onSelectCollection('all');
                  onSelectCategory(cat);
                }}
                className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 border-cyan-400 shadow-md font-black'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-700/80'
                }`}
              >
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3-Line Drop-Down Menu (Positioned smoothly from top-right) */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop click to dismiss */}
          <div
            className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed right-2 sm:right-6 top-[112px] sm:top-[76px] w-[calc(100vw-16px)] sm:w-96 max-h-[85vh] overflow-y-auto bg-slate-950/98 backdrop-blur-2xl border border-slate-700/80 rounded-2xl p-3 sm:p-4 space-y-3.5 shadow-2xl z-[99999] animate-in fade-in zoom-in-95 duration-150 scrollbar-thin scrollbar-thumb-slate-700 ring-1 ring-cyan-500/30">
          {/* User Status Bar if logged in */}
          {currentUser && (
            <div className="p-3 bg-slate-900 rounded-xl flex items-center justify-between border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
                  {currentUser.name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-white text-xs">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400">{currentUser.membershipTier || 'VIP Member'}</div>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" /> Logout
                </button>
              )}
            </div>
          )}

          {/* SECTION 1: REQUESTED CORE MENUS (Categories, Bestsellers, Brands, Dresses) */}
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wider text-cyan-400 px-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Featured Feeds & Collections
            </div>

            {/* 0. Shivora Collections (Instagram Shop) */}
            {onOpenDresses && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDresses();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-pink-500/20 via-purple-500/10 to-cyan-500/10 hover:from-pink-500/30 hover:to-cyan-500/20 border border-pink-500/40 hover:border-pink-400 text-left transition-all active:scale-[0.98] group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 shrink-0 group-hover:scale-105 transition-transform text-lg">
                    👗
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-white group-hover:text-pink-300 transition-colors flex items-center gap-1.5">
                      <span>Shivora Collections</span>
                      <span className="text-[9px] bg-rose-500 text-white font-black px-1.5 py-0.2 rounded uppercase">
                        Dresses Boutique
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Western partywear gowns, soft cambric • ₹80 added at cart & checkout
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-pink-400 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* 1. Bestsellers Click Item */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onSelectCollection) onSelectCollection('bestsellers');
                else onSelectCategory('Bestsellers');
                window.scrollTo({ top: 350, behavior: 'smooth' });
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/5 hover:from-amber-500/25 hover:to-orange-500/15 border border-amber-500/35 hover:border-amber-400 text-left transition-all active:scale-[0.98] group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                  <Flame className="w-5 h-5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                    Bestsellers
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded font-mono font-bold">
                      270 Products
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Direct factory hot-selling items</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* 3. Category Page Trigger */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenCategories) onOpenCategories();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/5 hover:from-cyan-500/25 hover:to-blue-500/15 border border-cyan-500/35 hover:border-cyan-400 text-left transition-all active:scale-[0.98] group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 group-hover:scale-105 transition-transform">
                  <LayoutGrid className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                    Browse All Categories
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Kitchen, Gadgets, Living, Storage & more
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Quick Categories Filter Chips */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 mb-2">
              Browse Categories
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onSelectCollection) onSelectCollection('all');
                    onSelectCategory(cat);
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  className={`p-2 rounded-xl text-xs font-bold text-left transition-all truncate border cursor-pointer ${
                    selectedCategory === cat && activeCollection === 'all'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                      : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Actions: Wishlist, Track, Admin, Account */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs">
            {onOpenWishlist && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenWishlist();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-900 font-semibold cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Heart className={`w-4 h-4 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                  Liked Products Wishlist
                </span>
                {wishlistCount > 0 && (
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {wishlistCount}
                  </span>
                )}
              </button>
            )}

            {onOpenOrderTracker && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenOrderTracker();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-900 font-semibold cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  Track Order / Courier Status
                </span>
                <span className="text-slate-500">→</span>
              </button>
            )}

            {!currentUser && onOpenCustomerAuth && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCustomerAuth();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-900 font-semibold cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-cyan-400" />
                  Customer Sign In / Register
                </span>
                <span className="text-slate-500">→</span>
              </button>
            )}

            {onToggleTheme && (
              <button
                onClick={() => {
                  onToggleTheme();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 font-semibold cursor-pointer pt-2 border-t border-slate-800/80"
              >
                <span className="flex items-center gap-2.5">
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
                  Theme Mode: {isDark ? 'Dark Theme' : 'Light Theme'}
                </span>
                <span className="text-xs text-cyan-400 font-bold">Toggle</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800 text-center">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Genuine Verified Goods
            </span>
            <span>24/7 Live Support</span>
          </div>
        </div>
      </>
    )}
    </header>
  );
};
