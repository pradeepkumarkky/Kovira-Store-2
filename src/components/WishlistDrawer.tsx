import React from 'react';
import { Product, CurrencyCode, CustomerLocation } from '../types';
import { formatPrice } from '../utils/currency';
import { computeProductLiveSync } from '../utils/supplierSync';
import {
  X,
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Truck,
  MapPin,
} from 'lucide-react';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  likedProducts: Product[];
  currency: CurrencyCode;
  customerLocation?: CustomerLocation;
  onRemoveFromWishlist: (productId: string) => void;
  onClearWishlist: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onAddAllToCart: (products: Product[]) => void;
  onSelectProduct: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  likedProducts,
  currency,
  customerLocation,
  onRemoveFromWishlist,
  onClearWishlist,
  onAddToCart,
  onAddAllToCart,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  const totalValueUSD = likedProducts.reduce((sum, p) => sum + p.priceUSD, 0);
  const inStockProducts = likedProducts.filter((p) => {
    const sync = p.liveSync || computeProductLiveSync(p, customerLocation?.country || 'India');
    return sync.stock > 0;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        id="wishlist-backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div
          id="wishlist-drawer-container"
          className="w-screen max-w-md bg-white border-l border-slate-200 text-slate-900 flex flex-col shadow-2xl h-full max-h-screen"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-2xs">
                <Heart className="w-4 h-4 fill-rose-500" />
              </div>
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                  Liked Products
                </h2>
                <span className="text-[11px] text-slate-500">
                  Saved to your personal device wishlist
                </span>
              </div>
              <span
                id="wishlist-drawer-count-badge"
                className="bg-slate-100 text-slate-800 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200 ml-1"
              >
                {likedProducts.length}
              </span>
            </div>
            <button
              id="close-wishlist-drawer-btn"
              onClick={onClose}
              className="p-2 sm:p-2.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Liked List"
              aria-label="Close wishlist drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 overscroll-contain">
            {likedProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center shadow-xs">
                  <Heart className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">Your Liked list is empty</h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Click the heart icon on any product card to save your favorite lifestyle essentials and smart gear for later.
                  </p>
                </div>
                <button
                  id="browse-catalog-wishlist-btn"
                  onClick={onClose}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {likedProducts.map((product) => {
                  const liveSync =
                    product.liveSync ||
                    computeProductLiveSync(product, customerLocation?.country || 'India');
                  const stock = liveSync.stock;
                  const isOutOfStock = stock <= 0;
                  const originalPriceUSD = Math.round(product.priceUSD * 1.35);

                  return (
                    <div
                      key={product.id}
                      id={`wishlist-item-${product.id}`}
                      className="group bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 sm:p-3.5 flex gap-3 transition-colors relative"
                    >
                      {/* Product Thumbnail */}
                      <button
                        onClick={() => {
                          onSelectProduct(product);
                          onClose();
                        }}
                        className="relative w-20 h-20 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 cursor-pointer text-left"
                        title="View details"
                      >
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                            <span className="text-[9px] text-white font-bold uppercase">Sold Out</span>
                          </div>
                        )}
                      </button>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() => {
                                onSelectProduct(product);
                                onClose();
                              }}
                              className="text-left font-bold text-xs sm:text-sm text-slate-900 hover:text-sky-600 transition-colors line-clamp-1 cursor-pointer"
                            >
                              {product.title.replace(/^(DeoDap|Baapstore|CJdropshipping|CJ)\s*[-–—:]*\s*/gi, '')}
                            </button>
                            {/* Remove button */}
                            <button
                              id={`remove-wishlist-${product.id}`}
                              onClick={() => onRemoveFromWishlist(product.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 -mr-1 -mt-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
                              title="Remove from Liked list"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">
                              {product.category}
                            </span>
                            <span className="text-slate-300">•</span>
                            {isOutOfStock ? (
                              <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Out of stock
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {stock} in stock
                              </span>
                            )}
                          </div>

                          {/* Live Supplier Delivery Promise */}
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                            <Truck className="w-3 h-3 text-sky-500 shrink-0" />
                            <span>
                              {customerLocation?.flag || '⚡'} {liveSync.deliveryEstimate} ({liveSync.leadDaysMin}–{liveSync.leadDaysMax}d)
                            </span>
                          </div>
                        </div>

                        {/* Price & Add to Cart Action */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-extrabold text-slate-900 font-['Outfit',sans-serif]">
                              {formatPrice(product.priceUSD, currency)}
                            </span>
                            <span className="text-[10px] text-slate-400 line-through">
                              {formatPrice(originalPriceUSD, currency)}
                            </span>
                          </div>

                          <button
                            id={`wishlist-add-to-cart-${product.id}`}
                            disabled={isOutOfStock}
                            onClick={() => {
                              onAddToCart(product, 1);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isOutOfStock
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs active:scale-95'
                            }`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Summary & Bulk Actions */}
          {likedProducts.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Total Saved Value:</span>
                <span className="font-extrabold text-base text-slate-900 font-['Outfit',sans-serif]">
                  {formatPrice(totalValueUSD, currency)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  id="wishlist-add-all-btn"
                  disabled={inStockProducts.length === 0}
                  onClick={() => {
                    onAddAllToCart(inStockProducts);
                    onClose();
                  }}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add All Available ({inStockProducts.length}) to Cart</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                <span>Stored locally on this device</span>
                <button
                  id="clear-wishlist-btn"
                  onClick={onClearWishlist}
                  className="text-rose-600 hover:text-rose-700 font-semibold hover:underline cursor-pointer"
                >
                  Clear All Liked
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
