import React, { useState, useRef } from 'react';
import { OrderItem, CurrencyCode } from '../types';
import { formatPrice, CURRENCIES } from '../utils/currency';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck, Truck, Tag, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  currency: CurrencyCode;
  onUpdateQuantity: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleScrollDown = () => {
    if (itemsContainerRef.current) {
      itemsContainerRef.current.scrollBy({ top: 220, behavior: 'smooth' });
    }
  };

  const handleScrollUp = () => {
    if (itemsContainerRef.current) {
      itemsContainerRef.current.scrollBy({ top: -220, behavior: 'smooth' });
    }
  };

  const subtotalUSD = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currencyInfo = CURRENCIES[currency] || CURRENCIES.INR;
  const hasDressItem = items.some(
    (i) => i.isDress || i.deliveryChargeINR === 80 || i.supplierId === 'shivora_collections' || i.sku?.startsWith('KOV-') || i.sku?.startsWith('SHV-')
  );
  const freeShippingThresholdUSD = currency === 'INR' ? (999 / 86.5) : 50;
  const isFreeShipping = !hasDressItem && subtotalUSD >= freeShippingThresholdUSD;
  // Delivery charges: 80/- flat added while product added to cart and checkout time for Shivora Collections dresses
  const shippingUSD = hasDressItem
    ? (80 / 86.5)
    : (isFreeShipping ? 0 : (currency === 'INR' ? (49 / 86.5) : 4.99));
  const discountUSD = (subtotalUSD * discountPercent) / 100;
  const taxUSD = Math.max(0, subtotalUSD - discountUSD) * 0.07;
  const totalUSD = Math.max(0, subtotalUSD - discountUSD + shippingUSD + taxUSD);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (clean === 'WELCOME10' || clean === 'SAVE10') {
      setDiscountPercent(10);
      setPromoMessage('10% off applied!');
    } else if (clean === 'KOVIRA15' || clean === 'SPRING15') {
      setDiscountPercent(15);
      setPromoMessage('15% Spring VIP discount applied!');
    } else {
      setPromoMessage('Invalid code. Try "WELCOME10" or "SPRING15"');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 text-slate-900 flex flex-col shadow-2xl h-full max-h-screen">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-cyan-600" />
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900">Your Shopping Cart</h2>
              <span className="bg-cyan-50 text-cyan-900 text-xs font-bold px-2 py-0.5 rounded-full border border-cyan-200">
                {items.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            </div>
            <button
              id="close-cart-drawer-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-cyan-700 rounded-full hover:bg-cyan-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress bar */}
          <div className="bg-cyan-50/40 px-5 py-3 text-xs border-b border-cyan-100 shrink-0">
            {hasDressItem ? (
              <div className="text-cyan-950 flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-cyan-900">
                  <Truck className="w-4 h-4 text-cyan-600" />
                  <span>👗 Shivora Collections item: Flat ₹80 delivery added</span>
                </span>
                <span className="text-[11px] bg-cyan-100 text-cyan-900 px-2 py-0.5 rounded-full border border-cyan-300">
                  ₹80 Delivery Charge
                </span>
              </div>
            ) : isFreeShipping ? (
              <div className="text-cyan-900 flex items-center gap-1.5 font-bold">
                <Truck className="w-4 h-4 text-cyan-600" />
                <span>🎉 You've unlocked FREE Delivery across India!</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="text-slate-600 flex justify-between font-medium">
                  <span>
                    Add <strong className="text-cyan-900">{formatPrice(freeShippingThresholdUSD - subtotalUSD, currency)}</strong> more for FREE PAN-India shipping
                  </span>
                  <span className="font-bold text-cyan-800">
                    {Math.round((subtotalUSD / freeShippingThresholdUSD) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotalUSD / freeShippingThresholdUSD) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick scroll control bar when items exist */}
          {items.length > 2 && (
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
              <span className="font-medium">Scrollable list ({items.length} items in cart)</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleScrollUp}
                  className="p-1 hover:bg-slate-200 text-slate-600 rounded cursor-pointer transition-colors"
                  title="Scroll Up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleScrollDown}
                  className="p-1 hover:bg-slate-200 text-slate-600 rounded cursor-pointer transition-colors"
                  title="Scroll Down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Cart Item List with smooth scrolling and visible scrollbar */}
          <div
            ref={itemsContainerRef}
            className="flex-1 overflow-y-auto overscroll-contain scroll-smooth p-4 sm:p-5 space-y-4 divide-y divide-slate-100"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#94a3b8 #f1f5f9',
            }}
          >
            {items.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-slate-900 font-bold text-base">Your cart is currently empty</h3>
                <p className="text-slate-500 text-xs max-w-xs mx-auto leading-relaxed">
                  Discover our curated collection of lifestyle essentials, timepieces, and smart tech.
                </p>
                <button
                  onClick={onClose}
                  className="mt-3 inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="pt-4 first:pt-0 flex gap-3.5 items-start">
                  <img
                    src={item.image}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug">
                        {item.title.replace(/^(DeoDap|Baapstore|CJdropshipping|CJ)\s*[-–—:]*\s*/gi, '')}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.productId)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mt-1">
                      <span>Unit: {formatPrice(item.price, currency)}</span>
                      {item.selectedSize && (
                        <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-black px-1.5 py-0.2 rounded">
                          📏 Size: {item.selectedSize}
                        </span>
                      )}
                      {item.isDress && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                          🚚 Pan-India ₹80
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 px-2 py-0.5 text-xs">
                        <button
                          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                          className="px-1.5 py-0.5 text-slate-500 hover:text-slate-900 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 font-bold text-slate-900 min-w-[18px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                          className="px-1.5 py-0.5 text-slate-500 hover:text-slate-900 font-bold"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Total */}
                      <span className="font-extrabold text-sm text-slate-900 font-['Outfit',sans-serif]">
                        {formatPrice(item.price * item.quantity, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-3">
              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Discount code (e.g. WELCOME10)"
                    value={promoCode || ''}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors"
                >
                  Apply
                </button>
              </form>
              {promoMessage && (
                <div className={`text-[11px] font-semibold ${discountPercent > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {promoMessage}
                </div>
              )}

              {/* Price Calculations */}
              <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    {formatPrice(subtotalUSD, currency)}
                  </span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-{formatPrice(discountUSD, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges {hasDressItem ? '(Shivora Collections ₹80/-)' : '(Additional)'}</span>
                  <span className="font-semibold text-slate-900">
                    {shippingUSD === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE (Order ₹999+)</span>
                    ) : (
                      formatPrice(shippingUSD, currency)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Taxes</span>
                  <span className="font-semibold text-slate-900">
                    {formatPrice(taxUSD, currency)}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2.5 flex justify-between text-base sm:text-lg font-black text-slate-950">
                  <span>Total</span>
                  <span className="font-['Outfit',sans-serif] text-xl">
                    {formatPrice(totalUSD, currency)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                id="checkout-proceed-button"
                onClick={onProceedToCheckout}
                className="w-full h-14 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 active:scale-98 text-slate-950 font-black py-4 px-6 rounded-2xl text-base flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-emerald-500/25 cursor-pointer"
              >
                <span>Proceed to UPI Checkout (Fast & Secure)</span>
                <ArrowRight className="w-5 h-5 text-slate-950" />
              </button>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Secure UPI
                </span>
                <span>•</span>
                <span>GPay • PhonePe • Paytm</span>
                <span>•</span>
                <span>Zero Extra Fees</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
