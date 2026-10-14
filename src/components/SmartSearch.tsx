import React, { useState, useEffect, useRef } from 'react';
import { Product, CurrencyCode } from '../types';
import { formatPrice } from '../utils/currency';
import {
  Search,
  Sparkles,
  X,
  TrendingUp,
  Clock,
  ArrowRight,
  ShoppingBag,
  CheckCircle2,
  Tag,
  Zap,
  SlidersHorizontal,
} from 'lucide-react';

interface SmartSearchProps {
  products: Product[];
  currency: CurrencyCode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectProduct: (product: Product) => void;
  onSelectCategory?: (category: string) => void;
  placeholder?: string;
  className?: string;
}

const TRENDING_QUERIES = [
  'Smart Kitchen Essentials',
  'Wireless Magnetic Power Bank',
  'Noise Cancelling Earbuds',
  'Titanium Smartwatch',
  'LED Minimalist Desk Lamp',
  'Top Deals Under ₹999',
];

export const SmartSearch: React.FC<SmartSearchProps> = ({
  products,
  currency,
  searchQuery,
  onSearchChange,
  onSelectProduct,
  onSelectCategory,
  placeholder = 'Smart search: products, wireless tech, kitchen essentials, watches...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kovira_recent_searches');
      return saved ? JSON.parse(saved) : ['Smart Watch', 'Wireless Charger', 'Kitchen Cutter'];
    } catch {
      return ['Smart Watch', 'Wireless Charger', 'Kitchen Cutter'];
    }
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'instock' | 'featured' | 'under1000'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save recent searches
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const clean = query.trim();
    const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem('kovira_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    try {
      localStorage.setItem('kovira_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  // Smart multi-field scoring algorithm
  const matchingProducts = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products
      .filter((p) => {
        // Quick active filters
        if (activeFilter === 'instock' && p.stock <= 0) return false;
        if (activeFilter === 'featured' && !p.featured) return false;
        if (activeFilter === 'under1000' && p.priceUSD > 13) return false; // approx ₹1000

        if (!query) return true;

        // Multi-attribute match
        const titleMatch = p.title.toLowerCase().includes(query);
        const descMatch = p.description.toLowerCase().includes(query);
        const categoryMatch = p.category.toLowerCase().includes(query);
        const tagMatch = p.tags.some((t) => t.toLowerCase().includes(query));
        const skuMatch = p.sku.toLowerCase().includes(query);

        return titleMatch || descMatch || categoryMatch || tagMatch || skuMatch;
      })
      .slice(0, 6);
  }, [products, searchQuery, activeFilter]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < matchingProducts.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : matchingProducts.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < matchingProducts.length) {
        e.preventDefault();
        const prod = matchingProducts[selectedIndex];
        saveRecentSearch(prod.title);
        onSelectProduct(prod);
        setIsOpen(false);
      } else if (searchQuery.trim()) {
        saveRecentSearch(searchQuery);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (product: Product) => {
    saveRecentSearch(product.title);
    onSelectProduct(product);
    setIsOpen(false);
  };

  const handleChooseQuery = (q: string) => {
    onSearchChange(q);
    saveRecentSearch(q);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Bar Input Container */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none text-slate-400">
          <Search className="w-4 h-4 text-cyan-600" />
          <span className="hidden xl:inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-900 border border-cyan-200 px-1.5 py-0.5 rounded">
            <Sparkles className="w-2.5 h-2.5 text-cyan-600" /> Smart
          </span>
        </div>

        <input
          ref={inputRef}
          id="smart-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            if (!isOpen) setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-[#111827] hover:bg-[#151D30] focus:bg-[#111827] border border-slate-700/80 focus:border-cyan-400 rounded-2xl pl-11 xl:pl-24 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-xs"
        />

        {searchQuery ? (
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              setSelectedIndex(-1);
              inputRef.current?.focus();
            }}
            className="absolute right-3.5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="absolute right-3.5 hidden sm:flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </div>
        )}
      </div>

      {/* Smart Search Dropdown Modal / Popover */}
      {isOpen && (
        <div
          id="smart-search-dropdown"
          className="absolute left-0 right-0 top-full mt-2 bg-[#0F172A] border border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-5 z-50 text-slate-100 max-h-[80vh] sm:max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 overscroll-contain animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Top Bar with Dismiss Button */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Smart Search Assistant</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close search popover"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Smart Quick Filters Row */}
          <div className="flex items-center gap-1.5 py-2.5 border-b border-slate-100 overflow-x-auto text-xs scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
              <SlidersHorizontal className="w-3 h-3" /> Filters:
            </span>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'bg-slate-100 hover:bg-cyan-50 hover:text-cyan-900 text-slate-700'
              }`}
            >
              All Items
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('instock')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                activeFilter === 'instock'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-cyan-50 hover:text-cyan-900 text-slate-700'
              }`}
            >
              In Stock Only
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('featured')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                activeFilter === 'featured'
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-400/40'
                  : 'bg-slate-100 hover:bg-cyan-50 hover:text-cyan-900 text-slate-700'
              }`}
            >
              Bestsellers
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('under1000')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                activeFilter === 'under1000'
                  ? 'bg-slate-900 text-amber-300 border border-amber-400/40'
                  : 'bg-slate-100 hover:bg-cyan-50 hover:text-cyan-900 text-slate-700'
              }`}
            >
              Budget (Under ₹1,000)
            </button>
          </div>

          {/* Results Section */}
          <div className="py-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>
                {searchQuery ? `Products matching "${searchQuery}"` : 'Top Trending Products'}
              </span>
              <span className="text-[11px] lowercase font-normal text-slate-400">
                {matchingProducts.length} results
              </span>
            </div>

            {matchingProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchingProducts.map((product, idx) => {
                  const isSelected = selectedIndex === idx;

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleSelect(product)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-50/80 border-cyan-400 shadow-xs'
                          : 'bg-white hover:bg-cyan-50/40 border-slate-200/80'
                      }`}
                    >
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'}
                        alt={product.title}
                        className="w-14 h-14 object-cover rounded-xl bg-slate-100 shrink-0 border border-slate-100"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {product.category}
                          </span>
                          {product.featured && (
                            <span className="text-[9px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 px-1.5 py-0.2 rounded">
                              Featured
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {product.title.replace(/^(DeoDap|Baapstore|CJdropshipping|CJ)\s*[-–—:]*\s*/gi, '')}
                        </h4>
                        <div className="flex items-center justify-between mt-1 text-xs">
                          <span className="font-black text-slate-950 font-['Outfit',sans-serif]">
                            {formatPrice(product.priceUSD, currency)}
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              product.stock > 0 ? 'text-cyan-700' : 'text-rose-500'
                            }`}
                          >
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                      <div className="p-1.5 text-slate-400 hover:text-cyan-600 rounded-lg hover:bg-cyan-50">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">No exact products found for "{searchQuery}"</p>
                <p className="text-[11px] text-slate-400">
                  Try searching for generic terms like "charger", "earbuds", "watch", or "kitchen".
                </p>
              </div>
            )}
          </div>

          {/* Quick Suggestions & Recent Searches */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Trending Suggestions */}
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-2">
                <TrendingUp className="w-3 h-3 text-cyan-500" />
                <span>Trending Searches</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TRENDING_QUERIES.map((tq) => (
                  <button
                    key={tq}
                    type="button"
                    onClick={() => handleChooseQuery(tq)}
                    className="bg-slate-100 hover:bg-cyan-50 hover:text-cyan-950 hover:border-cyan-200 border border-transparent text-slate-700 font-medium px-2.5 py-1 rounded-full text-[11px] transition-colors cursor-pointer"
                  >
                    {tq}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-2">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>Recent Queries</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((rec) => (
                    <span
                      key={rec}
                      onClick={() => handleChooseQuery(rec)}
                      className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full text-[11px] transition-colors cursor-pointer group"
                    >
                      <span>{rec}</span>
                      <X
                        className="w-3 h-3 text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                        onClick={(e) => removeRecentSearch(rec, e)}
                      />
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
