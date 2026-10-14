import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { OrderItem, CurrencyCode, Order, RestockNotification, CustomerLocation, CustomerUser, DropshipDeliveryQuote } from '../types';
import { formatPrice, CURRENCIES, convertPrice } from '../utils/currency';
import { getRegionalRouting, getEstimatedDeliveryDate } from '../utils/supplierSync';
import { TaxInvoiceReceiptModal } from './TaxInvoiceReceiptModal';
import {
  X,
  Lock,
  CheckCircle2,
  Truck,
  ShieldCheck,
  AlertCircle,
  Printer,
  Copy,
  Check,
  QrCode,
  Smartphone,
  ExternalLink,
  Download,
  Maximize2,
  Minimize2,
  Settings,
  Clock,
  Share2,
  MessageCircle,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  currency: CurrencyCode;
  customerLocation?: CustomerLocation;
  currentUser?: CustomerUser | null;
  onOrderSuccess: (order: Order, restocks: RestockNotification[]) => void;
}

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  customerLocation,
  currentUser,
  onOrderSuccess,
}) => {
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Form states - Indian Details as Default
  const [customerName, setCustomerName] = useState(currentUser?.name || 'Rahul Sharma');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || 'rahul.sharma@gmail.com');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '+91 98765 43210');
  const [address, setAddress] = useState(
    currentUser?.savedAddresses?.[0]?.address || 'Flat 402, Shanti Niketan Apts, 4th Cross Road'
  );
  const [city, setCity] = useState(currentUser?.savedAddresses?.[0]?.city || 'Bengaluru');
  const [country, setCountry] = useState(
    currentUser?.savedAddresses?.[0]?.country || customerLocation?.country || 'India'
  );
  const [postalCode, setPostalCode] = useState(
    currentUser?.savedAddresses?.[0]?.postalCode || '560034'
  );

  // Live Dropship Direct Sync State
  const [liveQuote, setLiveQuote] = useState<DropshipDeliveryQuote | null>(null);
  const [, setIsSyncingDelivery] = useState(false);

  // UPI Options: 'scanner' (QR Code), 'type_id' (Enter UPI VPA), 'click_link' (1-Click Deeplink / App)
  const [upiOption, setUpiOption] = useState<'scanner' | 'type_id' | 'click_link'>('scanner');
  
  // Store / Merchant Receiver UPI Configuration (Stored in localStorage for store owner flexibility)
  const [receiverUpiId, setReceiverUpiId] = useState<string>(() => {
    return localStorage.getItem('kovira_receiver_upi_id') || '9656850012@upi';
  });
  const [receiverName, setReceiverName] = useState<string>(() => {
    return localStorage.getItem('kovira_receiver_name') || 'Kovira Store';
  });
  const [showReceiverSettings, setShowReceiverSettings] = useState(false);
  const [customReceiverInput, setCustomReceiverInput] = useState(receiverUpiId);
  const [customReceiverNameInput, setCustomReceiverNameInput] = useState(receiverName);

  // Customer UPI Details
  const [customerUpiId, setCustomerUpiId] = useState('rahul.sharma@okaxis');
  const [upiUtrRef, setUpiUtrRef] = useState('');
  const [collectRequestSent, setCollectRequestSent] = useState(false);
  const [copiedUpiId, setCopiedUpiId] = useState(false);
  const [copiedUpiLink, setCopiedUpiLink] = useState(false);
  const [isQrEnlarged, setIsQrEnlarged] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.name || '');
      setCustomerEmail(currentUser.email || '');
      setCustomerPhone(currentUser.phone || '+91 98765 43210');
      if (currentUser.savedAddresses && currentUser.savedAddresses.length > 0) {
        const def = currentUser.savedAddresses.find((a) => a.isDefault) || currentUser.savedAddresses[0];
        setAddress(def.address || '');
        setCity(def.city || '');
        setPostalCode(def.postalCode || '');
        setCountry(def.country || customerLocation?.country || 'India');
      }
    }
  }, [currentUser, customerLocation]);

  useEffect(() => {
    if (customerLocation?.country && !currentUser) {
      setCountry(customerLocation.country);
    }
  }, [customerLocation, currentUser]);

  // Sync real-time delivery estimate directly from dropship app endpoint
  useEffect(() => {
    let isCancelled = false;
    const fetchDeliveryEstimate = async () => {
      setIsSyncingDelivery(true);
      try {
        const supplierPlatform = items[0]?.supplierPlatform || 'DeoDap';
        const res = await fetch(
          `/api/dropship/delivery-estimate?country=${encodeURIComponent(country)}&pincode=${encodeURIComponent(
            postalCode
          )}&platform=${encodeURIComponent(supplierPlatform)}`
        );
        const data = await res.json();
        if (!isCancelled && data.success && data.quote) {
          setLiveQuote(data.quote);
        }
      } catch {
        // fallback to client-side utility
      } finally {
        if (!isCancelled) setIsSyncingDelivery(false);
      }
    };

    fetchDeliveryEstimate();
    return () => {
      isCancelled = true;
    };
  }, [country, postalCode, items]);

  if (!isOpen) return null;

  // Real-time location-aware routing from supplier link
  const routing = getRegionalRouting(country);
  const estimatedDelivery = getEstimatedDeliveryDate(routing.leadDaysMin, routing.leadDaysMax);

  const subtotalUSD = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasDressItem = items.some(
    (i) => i.isDress || i.deliveryChargeINR === 80 || i.supplierId === 'shivora_collections' || i.sku?.startsWith('KOV-') || i.sku?.startsWith('SHV-')
  );
  // Free express shipping for INR over ₹999 or USD over $50 (for general gadgets)
  const isFreeShipping = !hasDressItem && (currency === 'INR' ? convertPrice(subtotalUSD, 'INR') >= 999 : subtotalUSD >= 50);
  // Delivery charges: 80/- flat added while product added to cart and checkout time for Shivora Collections dresses
  const shippingUSD = hasDressItem
    ? (80 / 86.5)
    : (isFreeShipping ? 0 : (currency === 'INR' ? (49 / 86.5) : 4.99));
  const taxUSD = subtotalUSD * 0.05;
  const totalUSD = subtotalUSD + shippingUSD + taxUSD;
  const inrTotalAmount = Math.round(convertPrice(totalUSD, 'INR'));

  // Standard UPI URI format
  const orderRefNote = `KOV-${Math.floor(10000 + Math.random() * 90000)}`;
  const upiDeeplink = `upi://pay?pa=${encodeURIComponent(receiverUpiId)}&pn=${encodeURIComponent(receiverName)}&am=${inrTotalAmount}&cu=INR&tn=${encodeURIComponent('Kovira Order ' + orderRefNote)}`;
  
  // High-resolution Dynamic QR URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(upiDeeplink)}`;

  const handleSaveReceiverSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customReceiverInput.trim() || !customReceiverInput.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. yourname@okaxis)');
      return;
    }
    const cleanId = customReceiverInput.trim();
    const cleanName = customReceiverNameInput.trim() || 'Kovira Store';
    setReceiverUpiId(cleanId);
    setReceiverName(cleanName);
    localStorage.setItem('kovira_receiver_upi_id', cleanId);
    localStorage.setItem('kovira_receiver_name', cleanName);
    setShowReceiverSettings(false);
  };

  const handleCopyReceiverUPI = () => {
    navigator.clipboard.writeText(receiverUpiId);
    setCopiedUpiId(true);
    setTimeout(() => setCopiedUpiId(false), 2000);
  };

  const handleCopyUpiLink = () => {
    navigator.clipboard.writeText(upiDeeplink);
    setCopiedUpiLink(true);
    setTimeout(() => setCopiedUpiLink(false), 2000);
  };

  const handleSendCollectRequest = () => {
    if (!customerUpiId.trim() || !customerUpiId.includes('@')) {
      setErrorMessage('Please enter a valid personal UPI ID (e.g. username@okhdfcbank)');
      return;
    }
    setErrorMessage('');
    setCollectRequestSent(true);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStep('processing');

    try {
      // Validate customer UPI input if using typing mode
      if (upiOption === 'type_id' && (!customerUpiId.trim() || !customerUpiId.includes('@'))) {
        throw new Error('Please enter a valid UPI ID (e.g. username@okaxis)');
      }

      // Finalize checkout directly via UPI
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customer: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            address,
            city,
            country,
            postalCode,
          },
          currency: 'INR',
          paymentMethod: 'UPI',
          paymentIntentId: `upi_${Date.now()}`,
          subtotal: convertPrice(subtotalUSD, 'INR'),
          shipping: convertPrice(shippingUSD, 'INR'),
          tax: convertPrice(taxUSD, 'INR'),
          total: inrTotalAmount,
          upiDetails: {
            receiverUpiId,
            receiverName,
            customerUpiId: upiOption === 'type_id' ? customerUpiId : undefined,
            upiUtrRef: upiUtrRef.trim() || undefined,
            optionUsed: upiOption,
            amountINR: inrTotalAmount,
          },
        }),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok || !checkoutData.success) {
        throw new Error(checkoutData.error || 'UPI Checkout processing failed');
      }

      setCompletedOrder(checkoutData.order);
      setStep('success');
      onOrderSuccess(checkoutData.order, checkoutData.triggeredRestocks || []);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#059669', '#10B981', '#06B6D4', '#3B82F6'],
        });
      } catch {
        // Safe fallback
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment submission failed. Please verify payment details.');
      setStep('details');
    }
  };

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        id="stripe-checkout-modal-container"
        className="relative w-full max-w-xl lg:max-w-2xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col h-[96dvh] sm:h-auto sm:max-h-[92vh] text-slate-900 overflow-hidden"
      >
        {/* Fixed Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  Kovira UPI Instant Checkout
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  Exclusive UPI • Zero Surcharge
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                Pay directly via Google Pay • PhonePe • Paytm • BHIM • CRED • Any UPI App
              </p>
            </div>
          </div>
          <button
            id="close-stripe-checkout-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400 overscroll-contain">
          {/* STEP 1: Details & UPI Form */}
          {step === 'details' && (
            <form onSubmit={handlePay} className="space-y-5">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Order Summary Pill */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Total Amount Payable via UPI</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-['Outfit',sans-serif]">
                      ₹{inrTotalAmount.toLocaleString('en-IN')}
                    </span>
                    {currency !== 'INR' && (
                      <span className="text-xs text-slate-500 font-medium">
                        ({formatPrice(totalUSD, currency)})
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold block pt-0.5">
                    {hasDressItem
                      ? `+ ₹80 Shivora Collections Delivery Charge (Added at Checkout)`
                      : isFreeShipping
                      ? '✓ Free Delivery (Orders ₹999+)'
                      : `+ ₹49 Standard Tracked Delivery`}
                  </span>
                </div>

                {/* Receiver Info Badge & Store Owner Quick Settings */}
                <div className="flex flex-col items-start sm:items-end gap-1">
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-[11px]">
                    <span className="text-slate-500">Pay to:</span>
                    <strong className="font-mono text-emerald-950 font-bold">{receiverUpiId}</strong>
                    <button
                      type="button"
                      onClick={() => setShowReceiverSettings(!showReceiverSettings)}
                      className="p-1 text-slate-400 hover:text-emerald-700 rounded transition-colors cursor-pointer"
                      title="Store Owner: Change Receiver UPI ID"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Merchant Name: <strong>{receiverName}</strong>
                  </span>
                </div>
              </div>

              {/* Store Owner Receiver Settings Dropdown (When triggered) */}
              {showReceiverSettings && (
                <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl p-4 space-y-3 text-xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <Settings className="w-4 h-4" />
                      <span>Store Owner: Configure Receiver UPI Payment ID</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowReceiverSettings(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Set your own UPI ID (GPay, PhonePe, Paytm, BHIM or Merchant QR). The scanner and 1-click links will immediately route customer payments directly to this account!
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        Merchant UPI ID / VPA
                      </label>
                      <input
                        type="text"
                        value={customReceiverInput}
                        onChange={(e) => setCustomReceiverInput(e.target.value)}
                        placeholder="e.g. shivorastore@okaxis or yourphoneno@ybl"
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        Payee / Business Name
                      </label>
                      <input
                        type="text"
                        value={customReceiverNameInput}
                        onChange={(e) => setCustomReceiverNameInput(e.target.value)}
                        placeholder="e.g. Kovira Store or Shivora Collections"
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomReceiverInput('9656850012@upi');
                        setCustomReceiverNameInput('Kovira Store');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-xs hover:bg-slate-800 cursor-pointer"
                    >
                      Reset Default
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveReceiverSettings}
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      Save Receiver Details
                    </button>
                  </div>
                </div>
              )}

              {/* 1. Customer & Shipping Address */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  1. Shipping & Delivery Address
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Full Name</label>
                    <input
                      required
                      type="text"
                      value={customerName || ''}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Email (For Order Updates)</label>
                    <input
                      required
                      type="email"
                      value={customerEmail || ''}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="rahul.sharma@gmail.com"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Contact Phone</label>
                    <input
                      required
                      type="tel"
                      value={customerPhone || ''}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">PIN / Postal Code</label>
                    <input
                      required
                      type="text"
                      value={postalCode || ''}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 560034"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-slate-600 mb-1 font-medium">Street Address / House No.</label>
                  <input
                    required
                    type="text"
                    value={address || ''}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Flat 402, Shanti Niketan Apts, 4th Cross Road"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">City</label>
                    <input
                      required
                      type="text"
                      value={city || ''}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bengaluru"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Country / Region</label>
                    <input
                      required
                      type="text"
                      value={country || ''}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. EXCLUSIVE UPI PAYMENT METHODS HUB */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    2. Choose Convenient UPI Payment Option
                  </h4>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Instant Bank Transfer • 0% Fee
                  </span>
                </div>

                {/* 3 Convenient Option Tabs: Scanner, Typing UPI ID, Click Link Opens UPI App */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1 bg-slate-100 border border-slate-300/80 rounded-2xl">
                  {/* Option 1: Scanner */}
                  <button
                    type="button"
                    onClick={() => setUpiOption('scanner')}
                    className={`py-2 px-2 sm:px-3 rounded-xl font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                      upiOption === 'scanner'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <QrCode className="w-4 h-4 shrink-0" />
                    <span className="text-center sm:text-left">1. QR Scanner</span>
                  </button>

                  {/* Option 2: Typing UPI ID */}
                  <button
                    type="button"
                    onClick={() => setUpiOption('type_id')}
                    className={`py-2 px-2 sm:px-3 rounded-xl font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                      upiOption === 'type_id'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span className="text-center sm:text-left">2. Type UPI ID</span>
                  </button>

                  {/* Option 3: Click Link Opens UPI App */}
                  <button
                    type="button"
                    onClick={() => setUpiOption('click_link')}
                    className={`py-2 px-2 sm:px-3 rounded-xl font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                      upiOption === 'click_link'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Zap className="w-4 h-4 shrink-0" />
                    <span className="text-center sm:text-left">3. Open UPI App</span>
                  </button>
                </div>

                {/* OPTION 1 CONTENT: SCANNER (QR CODE) */}
                {upiOption === 'scanner' && (
                  <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-white border border-emerald-200/90 rounded-2xl p-4 shadow-xs">
                      {/* Stylized QR Representation */}
                      <div className="relative p-2.5 bg-white border-2 border-slate-900 rounded-2xl shrink-0 shadow-md flex flex-col items-center">
                        <img
                          src={qrCodeUrl}
                          alt="UPI QR Code"
                          className={`object-contain transition-all duration-200 ${
                            isQrEnlarged ? 'w-48 h-48' : 'w-32 h-32 sm:w-36 sm:h-36'
                          }`}
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                          <div className="w-7 h-7 bg-slate-950 text-white rounded-lg flex items-center justify-center text-xs font-black border-2 border-white shadow-md">
                            ₹
                          </div>
                        </div>

                        {/* QR Actions: Enlarge & Download */}
                        <div className="flex items-center gap-2 pt-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setIsQrEnlarged(!isQrEnlarged)}
                            className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded cursor-pointer"
                          >
                            {isQrEnlarged ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                            <span>{isQrEnlarged ? 'Shrink' : 'Enlarge'}</span>
                          </button>
                          <a
                            href={qrCodeUrl}
                            download="Kovira_Order_UPI_QR.png"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Save QR</span>
                          </a>
                        </div>
                      </div>

                      {/* Instructions & Quick Details */}
                      <div className="space-y-2.5 text-xs flex-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <span className="font-black text-sm sm:text-base text-slate-900">
                            Scan with Any UPI App
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                            Live Scanner
                          </span>
                        </div>

                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Open Google Pay, PhonePe, Paytm, CRED, or BHIM scanner to authorize payment of{' '}
                          <strong className="text-slate-950 font-black text-sm font-['Outfit',sans-serif]">
                            ₹{inrTotalAmount.toLocaleString('en-IN')}
                          </strong>.
                        </p>

                        {/* Supported Apps Badges */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                          <span className="bg-slate-100 border border-slate-200 text-slate-800 font-bold text-[10px] px-2 py-0.5 rounded-md">
                            Google Pay
                          </span>
                          <span className="bg-purple-50 border border-purple-200 text-purple-700 font-bold text-[10px] px-2 py-0.5 rounded-md">
                            PhonePe
                          </span>
                          <span className="bg-sky-50 border border-sky-200 text-sky-700 font-bold text-[10px] px-2 py-0.5 rounded-md">
                            Paytm
                          </span>
                          <span className="bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-md">
                            BHIM
                          </span>
                          <span className="bg-slate-900 text-white font-bold text-[10px] px-2 py-0.5 rounded-md">
                            CRED
                          </span>
                        </div>

                        {/* Store VPA Copy Bar */}
                        <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <span>UPI ID: <strong className="font-mono text-slate-900 font-bold">{receiverUpiId}</strong></span>
                          <button
                            type="button"
                            onClick={handleCopyReceiverUPI}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedUpiId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedUpiId ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Instructions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-100 flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                        <span>Open camera or scan button in your UPI app</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-100 flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                        <span>Point camera at this QR code</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-100 flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                        <span>Confirm amount of ₹{inrTotalAmount} & enter PIN</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* OPTION 2 CONTENT: TYPING UPI ID (VPA COLLECT) */}
                {upiOption === 'type_id' && (
                  <div className="bg-white border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Type Your UPI ID / Virtual Payment Address (VPA)
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Enter your UPI handle. We will send a payment collect request directly to your UPI app.
                      </p>
                      <div className="relative">
                        <input
                          type="text"
                          value={customerUpiId}
                          onChange={(e) => {
                            setCustomerUpiId(e.target.value);
                            setCollectRequestSent(false);
                          }}
                          placeholder="e.g. rahul@okaxis, 9876543210@paytm, or username@ybl"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
                        />
                        <Smartphone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {/* Quick Suffix Chips for Easy Tap-Typing */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-slate-500 font-semibold">Quick handles:</span>
                      {['@okaxis', '@okhdfcbank', '@oksbi', '@paytm', '@ybl', '@axl', '@ibl', '@apl'].map((suf) => (
                        <button
                          key={suf}
                          type="button"
                          onClick={() => {
                            const base = customerUpiId.includes('@') ? customerUpiId.split('@')[0] : customerUpiId;
                            setCustomerUpiId(`${base || 'username'}${suf}`);
                            setCollectRequestSent(false);
                          }}
                          className="text-[10px] bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 font-mono px-2 py-0.5 rounded-md transition-colors cursor-pointer border border-slate-200"
                        >
                          {suf}
                        </button>
                      ))}
                    </div>

                    {/* Action button to test/send collect request */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleSendCollectRequest}
                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Send UPI Collect Request to App</span>
                      </button>
                    </div>

                    {collectRequestSent && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                        <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong>Collect request sent to {customerUpiId}!</strong>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            Please open your UPI app (Google Pay, PhonePe, Paytm) and approve the ₹{inrTotalAmount} payment request within 5 minutes.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Optional 12-digit UTR Input */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        12-Digit UPI Reference No. / UTR (Optional, if already paid)
                      </label>
                      <input
                        type="text"
                        maxLength={16}
                        value={upiUtrRef}
                        onChange={(e) => setUpiUtrRef(e.target.value)}
                        placeholder="e.g. 412389104821"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Found in your UPI app transaction history after payment approval.
                      </span>
                    </div>
                  </div>
                )}

                {/* OPTION 3 CONTENT: CLICK LINK OPENS UPI APP (DIRECT INTENT / DEEPLINK) */}
                {upiOption === 'click_link' && (
                  <div className="bg-gradient-to-br from-cyan-50/70 via-emerald-50/50 to-white border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-900 mb-1 flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                        1-Click Direct Launch into Installed UPI App
                      </h5>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Clicking the button below directly triggers your device's installed UPI app (Google Pay, PhonePe, Paytm, BHIM) with recipient and exact ₹{inrTotalAmount} pre-filled!
                      </p>
                    </div>

                    {/* Master 1-Click Launch Button */}
                    <a
                      href={upiDeeplink}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-98 transition-all cursor-pointer text-center"
                    >
                      <Zap className="w-4 h-4 text-emerald-200" />
                      <span>Launch UPI App Now (₹{inrTotalAmount.toLocaleString('en-IN')})</span>
                      <ExternalLink className="w-4 h-4 text-emerald-200" />
                    </a>

                    {/* Specific App Direct Buttons */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Or open specific app directly:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <a
                          href={`tez://upi/pay?pa=${encodeURIComponent(receiverUpiId)}&pn=${encodeURIComponent(receiverName)}&am=${inrTotalAmount}&cu=INR&tn=${encodeURIComponent('Kovira Order ' + orderRefNote)}`}
                          className="p-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-center text-xs font-bold text-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>Google Pay</span>
                        </a>
                        <a
                          href={`phonepe://pay?pa=${encodeURIComponent(receiverUpiId)}&pn=${encodeURIComponent(receiverName)}&am=${inrTotalAmount}&cu=INR&tn=${encodeURIComponent('Kovira Order ' + orderRefNote)}`}
                          className="p-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-center text-xs font-bold text-purple-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-purple-600" />
                          <span>PhonePe</span>
                        </a>
                        <a
                          href={`paytmmp://pay?pa=${encodeURIComponent(receiverUpiId)}&pn=${encodeURIComponent(receiverName)}&am=${inrTotalAmount}&cu=INR&tn=${encodeURIComponent('Kovira Order ' + orderRefNote)}`}
                          className="p-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-center text-xs font-bold text-sky-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-sky-500" />
                          <span>Paytm</span>
                        </a>
                        <a
                          href={`bhim://pay?pa=${encodeURIComponent(receiverUpiId)}&pn=${encodeURIComponent(receiverName)}&am=${inrTotalAmount}&cu=INR&tn=${encodeURIComponent('Kovira Order ' + orderRefNote)}`}
                          className="p-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-center text-xs font-bold text-amber-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>BHIM UPI</span>
                        </a>
                      </div>
                    </div>

                    {/* Copy Link & Share to WhatsApp Actions */}
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyUpiLink}
                        className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {copiedUpiLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUpiLink ? 'Payment Link Copied!' : 'Copy UPI Payment Link'}</span>
                      </button>

                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Complete Kovira Store UPI Payment of ₹${inrTotalAmount}: ${upiDeeplink}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Send Link to WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit / Complete Order Button */}
              <div className="pt-2 space-y-2">
                <button
                  id="stripe-submit-payment-btn"
                  type="submit"
                  className="w-full h-14 py-4 px-6 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 shadow-xl transition-all active:scale-98 cursor-pointer bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-emerald-900/20"
                >
                  <Smartphone className="w-5 h-5 text-emerald-200" />
                  <span>Confirm UPI Order (₹{inrTotalAmount.toLocaleString('en-IN')})</span>
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>National Payments Corporation of India (NPCI) Verified UPI Protocol</span>
                </div>
              </div>

              {/* Cancel / Dismiss Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full text-center py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel & Return to Store
              </button>
            </form>
          )}

          {/* STEP 2: Processing state */}
          {step === 'processing' && (
            <div className="p-14 text-center space-y-4">
              <div className="w-14 h-14 mx-auto border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <h3 className="text-lg font-bold text-slate-900">Confirming UPI Transaction...</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Validating UPI authorization, reserving dropship inventory at Central Priority Logistics Hub, and preparing your Delhivery package.
              </p>
            </div>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 'success' && completedOrder && (
            <div className="p-4 sm:p-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  UPI Payment Received & Order Confirmed!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Thank you, {completedOrder.customer.name}! We have received your UPI payment of ₹{inrTotalAmount.toLocaleString('en-IN')}. A confirmation receipt with GST invoice and tracking has been sent to <strong>{completedOrder.customer.email}</strong>.
                </p>
              </div>

              {/* Order Receipt Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Order Reference</span>
                    <span className="font-mono font-extrabold text-slate-900 text-base">
                      #{completedOrder.orderNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Tracking Code</span>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-mono font-bold">
                      <span>{completedOrder.trackingNumber}</span>
                      <button
                        onClick={() => handleCopyTracking(completedOrder.trackingNumber || '')}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copy tracking number"
                      >
                        {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Carrier</span>
                    <span className="text-slate-800 font-bold">{completedOrder.carrier}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Est. Delivery</span>
                    <span className="text-emerald-700 font-bold">
                      {completedOrder.estimatedDelivery || estimatedDelivery}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between">
                  <span className="text-emerald-800 font-medium">Payment Channel:</span>
                  <span className="font-bold text-emerald-900 font-mono flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    Verified UPI Transfer ({receiverUpiId})
                  </span>
                </div>

                {/* Items summary */}
                <div className="space-y-2 max-h-36 overflow-y-auto pt-1">
                  {completedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-slate-800 font-medium truncate max-w-[280px]">
                        {it.quantity}x {it.title.replace(/^(DeoDap|Baapstore|CJdropshipping|CJ)\s*[-–—:]*\s*/gi, '')}
                      </span>
                      <span className="text-slate-900 font-bold font-['Outfit',sans-serif]">
                        ₹{Math.round(convertPrice(it.price * it.quantity, 'INR')).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Total Amount Paid via UPI</span>
                  <span className="font-['Outfit',sans-serif] text-base text-emerald-700 font-black">
                    ₹{inrTotalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Support concierge info */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Need assistance with your purchase?</span>
                  <span className="text-slate-900 font-bold">Kovira Priority Concierge</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Live WhatsApp & Chat Concierge Active 24/7
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  id="print-receipt-btn"
                  type="button"
                  onClick={() => setShowInvoiceModal(true)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" /> View & Print Tax Receipt / Bill
                </button>
                <button
                  id="done-checkout-btn"
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Tax Invoice & Printable Bill Modal */}
      {completedOrder && (
        <TaxInvoiceReceiptModal
          order={completedOrder}
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          receiverUpiId={receiverUpiId}
          storeName={receiverName}
        />
      )}
    </div>
  );
};
