import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  PackageCheck,
  MapPin,
  Mail,
  Headphones,
  Printer,
  Receipt,
  Phone,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Package,
} from 'lucide-react';
import { Order } from '../types';
import { TaxInvoiceReceiptModal } from './TaxInvoiceReceiptModal';
import { formatPrice } from '../utils/currency';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancelOrder?: (orderId: string, orderNumber: string) => void;
  initialOrderNumber?: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  onCancelOrder,
  initialOrderNumber = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialOrderNumber || 'KOV-10492');
  const [isLoading, setIsLoading] = useState(false);
  const [ordersFound, setOrdersFound] = useState<Order[]>([]);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  // Search orders via live API
  const performSearch = async (query: string) => {
    const q = query.trim();
    if (!q) return;

    setIsLoading(true);
    setHasSearched(true);
    setCancelSuccessMsg(null);

    try {
      const res = await fetch(`/api/orders/track?q=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
        setOrdersFound(data.orders);
        setSelectedOrderIndex(0);
      } else {
        // Fallback demo order if specific demo query or none found
        if (q.toUpperCase().includes('KV-IND-9024') || q.toUpperCase().includes('9024')) {
          const fallbackOrder: Order = {
            id: 'ord_demo_9024',
            orderNumber: 'KV-IND-9024',
            createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
            items: [
              {
                productId: 'prod_tracked_1',
                title: 'Garlic Press – Rocking Stainless Steel Ginger Mincer for Kitchen | GripChef',
                sku: '2350_loose_round_garlic_press',
                price: 189,
                currency: 'INR',
                quantity: 1,
                supplierId: 'sup_deodap',
                supplierName: 'DeoDap Direct Dropshipping Hub',
                image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
              },
            ],
            customer: {
              name: 'Rahul Sharma',
              email: 'rahul.sharma@gmail.com',
              phone: '+91 98765 43210',
              address: 'Flat 402, Shanti Niketan Apts, 4th Cross Road',
              city: 'Bengaluru',
              country: 'India',
              postalCode: '560034',
            },
            currency: 'INR',
            subtotal: 189,
            shipping: 0,
            tax: 0,
            total: 189,
            paymentMethod: 'UPI',
            paymentStatus: 'Paid',
            stripePaymentIntentId: 'UPI9024143',
            fulfillmentStatus: 'Shipped via Courier',
            trackingNumber: 'TRK-EXP-9921841',
            carrier: 'Blue Dart / Delhivery',
            estimatedDelivery: '1-2 business days',
          };
          setOrdersFound([fallbackOrder]);
          setSelectedOrderIndex(0);
        } else {
          setOrdersFound([]);
        }
      }
    } catch (err) {
      console.error('Failed to track orders:', err);
      setOrdersFound([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      performSearch(searchQuery);
    }
  }, [isOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const currentOrder = ordersFound[selectedOrderIndex] || null;
  const isOrderCancelled = currentOrder?.fulfillmentStatus === 'Cancelled';

  const handleCancelCurrentOrder = async () => {
    if (!currentOrder) return;
    if (
      !window.confirm(
        `Are you sure you want to cancel Order #${currentOrder.orderNumber}? Any debited amount will be refunded directly to your UPI source account.`
      )
    ) {
      return;
    }

    setCancelLoading(true);
    try {
      const res = await fetch(`/api/orders/${currentOrder.id}/cancel`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setCancelSuccessMsg(data.message || `Order #${currentOrder.orderNumber} has been cancelled successfully.`);
        // Update local order status
        setOrdersFound((prev) =>
          prev.map((o, idx) =>
            idx === selectedOrderIndex
              ? { ...o, fulfillmentStatus: 'Cancelled', paymentStatus: 'Refunded' }
              : o
          )
        );
        if (onCancelOrder) {
          onCancelOrder(currentOrder.id, currentOrder.orderNumber);
        }
      } else {
        alert(data.error || 'Failed to cancel order.');
      }
    } catch (err) {
      console.error('Cancel order error:', err);
      alert('Network error while cancelling order.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCopyTrackingNumber = (trk: string) => {
    navigator.clipboard.writeText(trk);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col h-[94dvh] sm:h-auto sm:max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-xs border border-slate-700">
              <Truck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Track Live Order Status
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track by 10-digit Mobile Number or Order Reference (e.g. KOV-10492)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close tracker"
            aria-label="Close order tracker modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 overscroll-contain">
          {/* SEARCH BAR (Mobile Number or Order ID) */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter Phone Number (e.g. 9876543210) or Order # (e.g. KOV-10492)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-slate-900 dark:bg-cyan-500 hover:bg-slate-800 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isLoading ? 'Tracking...' : 'Track Order'}
              </button>
            </div>

            {/* Quick Helper Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Quick Search:</span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('+91 98765 43210');
                  performSearch('+91 98765 43210');
                }}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] cursor-pointer"
              >
                📱 Mobile: 9876543210
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('KOV-10492');
                  performSearch('KOV-10492');
                }}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] cursor-pointer"
              >
                📦 Order #KOV-10492
              </button>
            </div>
          </form>

          {/* Cancel Notification Banner */}
          {cancelSuccessMsg && (
            <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 text-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{cancelSuccessMsg}</span>
            </div>
          )}

          {/* Multiple Orders Selector Pill Bar */}
          {ordersFound.length > 1 && (
            <div className="space-y-1.5 bg-cyan-950/20 dark:bg-cyan-950/40 border border-cyan-800/40 rounded-2xl p-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                Found {ordersFound.length} Orders matching this search:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pt-1">
                {ordersFound.map((ord, idx) => (
                  <button
                    key={ord.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedOrderIndex(idx);
                      setCancelSuccessMsg(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                      selectedOrderIndex === idx
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    #{ord.orderNumber} • ₹{ord.total} ({ord.fulfillmentStatus})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* RESULTS DISPLAY */}
          {hasSearched && currentOrder ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Order Status Header Card */}
              <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2">
                    <span>Order Reference</span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                      {new Date(currentOrder.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    #{currentOrder.orderNumber}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Customer Mobile: <strong className="font-mono text-slate-900 dark:text-slate-200">{currentOrder.customer?.phone || 'Registered Phone'}</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                      isOrderCancelled
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                        : currentOrder.fulfillmentStatus === 'Delivered'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        : 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700'
                    }`}
                  >
                    {!isOrderCancelled && <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
                    {currentOrder.fulfillmentStatus}
                  </span>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {isOrderCancelled ? (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">100% Refund Initiated to UPI</span>
                    ) : (
                      <>Est. Delivery: <strong>{currentOrder.estimatedDelivery || '2-4 business days'}</strong></>
                    )}
                  </div>
                </div>
              </div>

              {/* COURIER & LIVE TRACKING NUMBER */}
              {currentOrder.trackingNumber && !isOrderCancelled && (
                <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-cyan-500 shrink-0" />
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Carrier Partner:</span>{' '}
                      <strong className="text-slate-900 dark:text-slate-100 font-bold">{currentOrder.carrier || 'Blue Dart / Delhivery Express'}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">AWB No:</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {currentOrder.trackingNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyTrackingNumber(currentOrder.trackingNumber || '')}
                      className="text-[11px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      title="Copy AWB Tracking Number"
                    >
                      {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {/* Live Courier Tracking Link */}
                    {(() => {
                      const trackUrl =
                        currentOrder.trackingUrl ||
                        (currentOrder.carrier?.toLowerCase().includes('blue dart')
                          ? `https://www.bluedart.com/tracking?handler=trak&action=custtracking&trackNumber=${currentOrder.trackingNumber}`
                          : currentOrder.carrier?.toLowerCase().includes('dtdc')
                          ? `https://www.dtdc.in/tracking/shipment-tracking.asp?strCnno=${currentOrder.trackingNumber}`
                          : `https://www.delhivery.com/track/package/${currentOrder.trackingNumber}`);
                      return (
                        <a
                          href={trackUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1 transition-all shadow-xs"
                          title="Open Live Courier Tracking Link in New Tab"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Live Tracking Link</span>
                        </a>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* ORDERED ITEMS LIST */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Ordered Items ({currentOrder.items?.length || 0})
                </h4>
                <div className="space-y-2">
                  {currentOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover bg-slate-200 shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                            <Package className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                            {item.title}
                          </h5>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            Qty: {item.quantity} · SKU: {item.sku || 'KOV-ITEM'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-slate-900 dark:text-white font-['Outfit',sans-serif]">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Courier Timeline Stepper */}
              <div className="space-y-3 px-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Fulfillment & Delivery Milestone Timeline
                </h4>

                <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {/* Step 1 */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-xs flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <div className="text-xs flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          Order Confirmed & GST Tax Invoice Generated
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                          Payment Status: <strong className="text-emerald-600 dark:text-emerald-400">{currentOrder.paymentStatus}</strong> via {currentOrder.paymentMethod}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowInvoiceModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                        title="View & Print Official GST Tax Receipt"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print Bill</span>
                      </button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <div className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-xs flex items-center justify-center ${
                      isOrderCancelled ? 'bg-slate-400' : 'bg-emerald-500 text-white'
                    }`}>
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Dispatched from Central Hub
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Processed & dispatched from {currentOrder.originWarehouse || 'National Central Logistics Hub (Gujarat)'}
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <div className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-xs ${
                      isOrderCancelled
                        ? 'bg-rose-500'
                        : 'bg-cyan-500 animate-pulse'
                    }`} />
                    <div className="text-xs">
                      <div className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                        <span>{isOrderCancelled ? 'Order Cancelled' : 'In Transit via Regional Courier'}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          isOrderCancelled ? 'bg-rose-100 text-rose-800' : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300'
                        }`}>
                          {isOrderCancelled ? 'CANCELLED' : 'CURRENT STATUS'}
                        </span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {isOrderCancelled
                          ? 'Cancellation completed upon customer request. Refund sent to UPI ID.'
                          : 'Carried via surface & air logistics network to destination city hub.'}
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative opacity-60">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-slate-900" />
                    <div className="text-xs">
                      <div className="font-bold text-slate-700 dark:text-slate-300">
                        Doorstep Delivery
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Delivering to: {currentOrder.customer?.city || 'Registered Address'}, PIN: {currentOrder.customer?.postalCode || '560034'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Cancellation Action Button */}
              {!isOrderCancelled ? (
                <div className="flex items-center justify-between p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs">
                  <div>
                    <div className="font-bold text-rose-800 dark:text-rose-300">
                      Need to cancel this order?
                    </div>
                    <div className="text-[11px] text-rose-600 dark:text-rose-400">
                      Cancel anytime before doorstep delivery for immediate 100% UPI refund
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={cancelLoading}
                    onClick={handleCancelCurrentOrder}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {cancelLoading ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                </div>
              ) : (
                <div className="p-3.5 bg-rose-950/40 border border-rose-700/60 rounded-2xl text-xs text-rose-200 flex items-center justify-between">
                  <span className="font-bold">
                    ⚠️ Order #{currentOrder.orderNumber} has been cancelled and refunded to your original UPI account.
                  </span>
                </div>
              )}

              {/* Need help footer */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Delivery assistance or address corrections:</span>
                </div>
                <div className="text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 24/7 Verified Customer Concierge
                </div>
              </div>
            </div>
          ) : hasSearched && !isLoading ? (
            /* NO ORDER FOUND EMPTY STATE */
            <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                No orders found for "{searchQuery}"
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Please double-check your 10-digit mobile number or order reference number (e.g. KOV-10492) and search again.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('KOV-10492');
                    performSearch('KOV-10492');
                  }}
                  className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-cyan-400 transition-colors cursor-pointer"
                >
                  View Sample Order #KOV-10492
                </button>
              </div>
            </div>
          ) : null}

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 text-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close Order Tracker
          </button>
        </div>
      </div>

      {/* Active Tax Invoice Modal */}
      {showInvoiceModal && currentOrder && (
        <TaxInvoiceReceiptModal
          order={currentOrder}
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </div>
  );
};
