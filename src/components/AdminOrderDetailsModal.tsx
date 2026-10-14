import React, { useState } from 'react';
import { Order, CurrencyCode } from '../types';
import { formatPrice, convertPrice } from '../utils/currency';
import {
  X,
  Package,
  Truck,
  Printer,
  CheckCircle2,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ExternalLink,
  Save,
  MessageSquare,
  ShieldCheck,
  Building,
  FileText,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface AdminOrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  currency?: CurrencyCode;
  onUpdateOrderStatus?: (orderId: string, status: string, trackingNumber?: string, carrier?: string) => Promise<void>;
  onPrintInvoice?: (order: Order) => void;
}

export const AdminOrderDetailsModal: React.FC<AdminOrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  currency = 'INR',
  onUpdateOrderStatus,
  onPrintInvoice,
}) => {
  if (!isOpen || !order) return null;

  const [fulfillmentStatus, setFulfillmentStatus] = useState<string>(
    order.fulfillmentStatus || 'Order Placed with Supplier'
  );
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [carrier, setCarrier] = useState(order.carrier || 'Delhivery Express');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const isOrdINR = order.currency === 'INR';
  const getOrdINR = (v: number) => Math.round(isOrdINR ? v : convertPrice(v, 'INR'));
  const ordTotal = getOrdINR(order.total);
  const ordShipping = order.shipping ? getOrdINR(order.shipping) : 0;
  const ordTaxable = Math.round((ordTotal - ordShipping) / 1.05);
  const ordGst = Math.max(0, ordTotal - ordShipping - ordTaxable);
  const ordCgst = Math.round(ordGst / 2);
  const ordSgst = ordGst - ordCgst;
  const invoiceNumber = `INV-KOV-${order.orderNumber.replace(/[^0-9]/g, '')}`;

  const cleanPhone = (order.customer?.phone || '').replace(/[^0-9]/g, '');

  const handleSaveFulfillment = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      if (onUpdateOrderStatus) {
        await onUpdateOrderStatus(order.id, fulfillmentStatus, trackingNumber, carrier);
      } else {
        await fetch(`/api/orders/${order.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fulfillmentStatus,
            trackingNumber,
            carrier,
          }),
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update order fulfillment:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyTracking = () => {
    if (!trackingNumber) return;
    navigator.clipboard.writeText(trackingNumber);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handlePrintPackingSlip = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Packing Slip - ${order.orderNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .badge { background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
            th { background: #f8fafc; font-weight: bold; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 16px; font-size: 13px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h2 style="margin: 0; font-size: 20px; font-weight: 800;">KOVIRA • PACKING SLIP & DISPATCH MANIFEST</h2>
              <div style="font-size: 12px; color: #64748b;">Order Ref: #${order.orderNumber} | Invoice: ${invoiceNumber}</div>
            </div>
            <div class="badge">${fulfillmentStatus}</div>
          </div>

          <div style="display: flex; gap: 20px;">
            <div class="box" style="flex: 1;">
              <strong>DELIVER TO:</strong><br/>
              ${order.customer?.name || 'Customer'}<br/>
              ${order.customer?.address || 'Shipping Address'}<br/>
              ${order.customer?.city || ''}, ${order.customer?.postalCode || ''}<br/>
              Phone: ${order.customer?.phone || 'N/A'}<br/>
              Email: ${order.customer?.email || 'N/A'}
            </div>
            <div class="box" style="flex: 1;">
              <strong>DISPATCH LOGISTICS:</strong><br/>
              Carrier: ${carrier}<br/>
              Tracking AWB: ${trackingNumber || 'Pending Assignment'}<br/>
              Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}<br/>
              Fulfillment Method: Express Air Cargo
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item Description</th>
                <th>SKU</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((it, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${it.title.replace(/^(DeoDap|Baapstore|CJdropshipping)\s*[-–—:]*\s*/gi, '')}</strong></td>
                  <td><code>${it.sku}</code></td>
                  <td style="text-align: center;"><strong>${it.quantity}</strong></td>
                  <td style="text-align: right;">₹${getOrdINR(it.price).toLocaleString('en-IN')}</td>
                  <td style="text-align: right;">₹${(getOrdINR(it.price) * it.quantity).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 12px;">
            Inspected and verified for Kovira Direct Factory Dispatch • Quality Verified
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0B1120] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        {/* Top Header */}
        <div className="bg-[#111827] border-b border-slate-800 px-5 sm:px-6 py-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white font-mono">
                  #{order.orderNumber}
                </h3>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {invoiceNumber}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    fulfillmentStatus.includes('Delivered')
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                      : fulfillmentStatus.includes('Transit')
                      ? 'bg-blue-950/80 text-blue-300 border-blue-700'
                      : fulfillmentStatus.includes('Dispatched')
                      ? 'bg-purple-950/80 text-purple-300 border-purple-700'
                      : 'bg-amber-950/80 text-amber-300 border-amber-700'
                  }`}
                >
                  {fulfillmentStatus}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Placed on {new Date(order.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">100% UPI Verified</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintInvoice && onPrintInvoice(order)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Print Official GST Tax Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Tax Invoice</span>
            </button>
            <button
              onClick={handlePrintPackingSlip}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
              title="Print Packing Slip / Shipping Label"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Packing Slip</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          {/* Section 1: Customer Profile & Delivery Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Details Box */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400" /> Customer Information
              </h4>
              <div className="space-y-1.5 text-xs text-slate-200">
                <div className="font-black text-sm text-white">
                  {order.customer?.name || 'Customer'}
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.customer?.phone || 'No phone provided'}</span>
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(order.customer?.name || '')},%20regarding%20your%20Kovira%20Order%20${order.orderNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto bg-emerald-950 text-emerald-300 border border-emerald-700/80 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 hover:bg-emerald-900 transition-colors"
                      title="Direct WhatsApp Message"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-400" /> WhatsApp
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.customer?.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address Box */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" /> Doorstep Delivery Address
              </h4>
              <div className="text-xs text-slate-200 space-y-1">
                <div className="font-semibold text-white">
                  {order.customer?.address || 'Street address on file'}
                </div>
                <div className="text-slate-300">
                  {order.customer?.city || 'City'}, {order.customer?.postalCode || 'PIN Code'}
                </div>
                <div className="text-slate-400 text-[11px] pt-1">
                  Country: India • Priority Air Cargo Dispatch
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Fulfillment & Tracking Management Box (Active Controls) */}
          <div className="bg-[#111827] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>Fulfillment & Dispatch Controls</span>
              </h4>
              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Updated Successfully!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">Order Status</label>
                <select
                  value={fulfillmentStatus}
                  onChange={(e) => setFulfillmentStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Order Placed with Supplier">Order Placed with Supplier</option>
                  <option value="Processing & Quality Inspection">Processing & Quality Inspection</option>
                  <option value="Dispatched from Central Hub">Dispatched from Central Hub</option>
                  <option value="In Transit • Air Cargo Fast Track">In Transit • Air Cargo Fast Track</option>
                  <option value="Out for Doorstep Delivery">Out for Doorstep Delivery</option>
                  <option value="Delivered to Customer">Delivered to Customer</option>
                  <option value="Cancelled & Refunded">Cancelled & Refunded</option>
                </select>
              </div>

              {/* Carrier Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">Express Courier Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Delhivery Express">Delhivery Express</option>
                  <option value="Blue Dart Express">Blue Dart Express</option>
                  <option value="DTDC Priority">DTDC Priority</option>
                  <option value="India Post Speed Post">India Post Speed Post</option>
                  <option value="Ekart Logistics">Ekart Logistics</option>
                  <option value="Shadowfax Fast">Shadowfax Fast</option>
                </select>
              </div>

              {/* Tracking Number Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">Courier Tracking AWB</label>
                <div className="relative">
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. DEL-IND-9024881"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-8 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                  {trackingNumber && (
                    <button
                      type="button"
                      onClick={handleCopyTracking}
                      className="absolute right-2 top-2 text-slate-400 hover:text-white"
                      title="Copy Tracking Number"
                    >
                      {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveFulfillment}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Update Fulfillment & Status'}</span>
              </button>
            </div>
          </div>

          {/* Section 3: Ordered Items Table */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Ordered Items ({order.items.reduce((s, it) => s + it.quantity, 0)})</span>
              <span className="text-cyan-400 font-mono">Currency: INR (₹)</span>
            </h4>

            <div className="divide-y divide-slate-800 overflow-x-auto">
              {order.items.map((it, idx) => {
                const itemPriceINR = getOrdINR(it.price);
                const lineTotalINR = itemPriceINR * it.quantity;
                const cleanTitle = it.title.replace(/^(DeoDap|Baapstore|CJdropshipping)\s*[-–—:]*\s*/gi, '');

                return (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {it.image ? (
                        <img
                          src={it.image}
                          alt={cleanTitle}
                          className="w-12 h-12 object-cover rounded-xl border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-slate-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs line-clamp-1">{cleanTitle}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-slate-400">SKU: {it.sku}</span>
                          {it.selectedSize && (
                            <span className="bg-slate-800 text-cyan-300 px-1.5 py-0.2 rounded font-bold text-[10px]">
                              Size: {it.selectedSize}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-white font-mono text-xs">
                        ₹{lineTotalINR.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {it.quantity} × ₹{itemPriceINR.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Comprehensive Bill & GST Breakdown */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Bill Summary & Financial Breakdown</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
              <div>
                <div className="text-[11px] text-slate-400">Taxable Product Value</div>
                <div className="text-sm font-mono font-bold text-slate-100 mt-0.5">
                  ₹{ordTaxable.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">CGST (2.5%) + SGST (2.5%)</div>
                <div className="text-sm font-mono font-bold text-slate-300 mt-0.5">
                  ₹{ordCgst.toLocaleString('en-IN')} + ₹{ordSgst.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Courier Shipping</div>
                <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                  {ordShipping > 0 ? `₹${ordShipping.toLocaleString('en-IN')}` : 'FREE (₹0)'}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Net Bill Total</div>
                <div className="text-base font-mono font-black text-emerald-300 mt-0.5">
                  ₹{ordTotal.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                <span>Payment Mode: <strong className="text-slate-200">{order.paymentMethod || '100% Verified UPI Transfer'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>GST Tax Invoice No: <strong className="font-mono text-cyan-300">{invoiceNumber}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-[#111827] border-t border-slate-800 px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            Order ID: <span className="font-mono text-slate-300">{order.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintInvoice && onPrintInvoice(order)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Tax Invoice</span>
            </button>
            <button
              onClick={handlePrintPackingSlip}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Print Packing Slip</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors cursor-pointer border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
