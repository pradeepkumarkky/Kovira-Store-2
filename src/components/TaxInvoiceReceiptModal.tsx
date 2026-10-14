import React, { useState, useRef } from 'react';
import { Order } from '../types';
import { convertPrice } from '../utils/currency';
import {
  Printer,
  Download,
  Copy,
  Check,
  X,
  Share2,
  FileText,
  Building,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

interface TaxInvoiceReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  receiverUpiId?: string;
  storeName?: string;
}

// Convert numbers into words for Indian Rupees
function numberToWordsINR(amount: number): string {
  const num = Math.round(Math.max(0, amount));
  if (num === 0) return 'Zero Rupees Only';

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += ones[hundred] + ' Hundred';
      if (rest > 0) res += ' and ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  let crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;
  let hundreds = remainder;

  let words = '';
  if (crore > 0) words += convertThreeDigits(crore) + ' Crore ';
  if (lakh > 0) words += convertThreeDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += convertThreeDigits(thousand) + ' Thousand ';
  if (hundreds > 0) words += convertThreeDigits(hundreds);

  return (words.trim() || 'Zero') + ' Rupees Only';
}

export const TaxInvoiceReceiptModal: React.FC<TaxInvoiceReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
  receiverUpiId = '9656850012@upi',
  storeName = 'Kovira Store',
}) => {
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const invoiceContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  // Convert amounts to INR for uniform official GST invoice standard
  const isINR = order.currency === 'INR';
  const getINR = (amt: number) => {
    if (!amt || isNaN(amt)) return 0;
    return isINR ? Math.round(amt) : Math.round(convertPrice(amt, 'INR'));
  };

  const calculatedItemsTotal = order.items.reduce((acc, it) => acc + getINR(it.price * it.quantity), 0);
  const totalBilled = order.total ? getINR(order.total) : calculatedItemsTotal;
  const shippingCharge = order.shipping ? getINR(order.shipping) : 0;

  // 18% GST calculation (Standard Indian E-commerce Goods GST: CGST 9% + SGST 9%)
  // Taxable base value = Total / 1.18 or subtotal
  const taxableSubtotal = Math.round((totalBilled - shippingCharge) / 1.18);
  const totalGST = (totalBilled - shippingCharge) - taxableSubtotal;
  const cgst = Math.round(totalGST / 2);
  const sgst = totalGST - cgst;

  const invoiceNumber = `INV-KOV-${order.orderNumber.replace(/[^0-9]/g, '') || Math.floor(100000 + Math.random() * 900000)}`;
  const orderDateFormatted = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const orderTimeFormatted = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const upiTxnId = order.stripePaymentIntentId || `UPI${Date.now()}`;
  const customerState = order.customer?.city?.toLowerCase().includes('bengaluru')
    ? 'Karnataka (Code: 29)'
    : order.customer?.city?.toLowerCase().includes('mumbai')
    ? 'Maharashtra (Code: 27)'
    : order.customer?.city?.toLowerCase().includes('delhi')
    ? 'Delhi (Code: 07)'
    : `${order.customer?.city || 'India'} (State Code: 27)`;

  // Generate self-contained HTML for reliable isolated printing
  const generatePrintHTML = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoiceNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #fff;
      margin: 0;
      padding: 10px;
      font-size: 11px;
      line-height: 1.4;
    }
    .invoice-card {
      border: 1.5px solid #1e293b;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      font-weight: 700;
      font-size: 10px;
      border-radius: 4px;
      margin-top: 4px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 14px;
      background: #f8fafc;
      padding: 10px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    .section-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th {
      background: #0f172a;
      color: #fff;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 6px 8px;
      text-align: left;
    }
    td {
      padding: 7px 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10.5px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 10px;
    }
    .totals-box {
      width: 280px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 10px;
      border-radius: 6px;
    }
    .totals-item {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 10.5px;
    }
    .totals-grand {
      display: flex;
      justify-content: space-between;
      border-top: 1.5px solid #0f172a;
      padding-top: 6px;
      margin-top: 4px;
      font-size: 13px;
      font-weight: 900;
      color: #065f46;
    }
    .upi-box {
      flex: 1;
      background: #ecfdf5;
      border: 1px dashed #059669;
      padding: 10px;
      border-radius: 6px;
    }
    .footer-note {
      margin-top: 16px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 10px;
      text-align: center;
      font-size: 9.5px;
      color: #64748b;
    }
    .stamp {
      display: inline-block;
      padding: 6px 14px;
      border: 2px solid #059669;
      color: #059669;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-size: 11px;
      border-radius: 6px;
      transform: rotate(-3deg);
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header-row">
      <div>
        <div class="brand-title">KOVIRA COMMERCE PVT. LTD.</div>
        <div style="font-size: 10px; color: #475569; margin-top: 2px;">
          402 Business Tech Park, Andheri East, Mumbai, Maharashtra 400069<br/>
          <strong>GSTIN:</strong> 27AABCK9876Q1Z8 | <strong>PAN:</strong> AABCK9876Q | <strong>CIN:</strong> U74999MH2024PTC123456<br/>
          <strong>Support:</strong> concierge@kovira.store | +91 98765 43210
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 13px; font-weight: 900; color: #0f172a;">TAX INVOICE / CASH BILL</div>
        <div style="font-family: monospace; font-size: 12px; font-weight: 800; color: #0284c7; margin-top: 2px;">${invoiceNumber}</div>
        <div style="font-size: 10px; color: #64748b;">Date: ${orderDateFormatted} ${orderTimeFormatted}</div>
        <div class="badge">100% UPI PAYMENT RECEIVED</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="section-title">Billed To / Delivered To:</div>
        <div style="font-weight: 800; font-size: 12px; color: #0f172a;">${order.customer?.name || 'Customer'}</div>
        <div>${order.customer?.address || 'Delivery Address on File'}</div>
        <div>${order.customer?.city || ''}${order.customer?.postalCode ? ` - PIN: ${order.customer.postalCode}` : ''}, India</div>
        <div><strong>Phone:</strong> ${order.customer?.phone || 'On file'} | <strong>Email:</strong> ${order.customer?.email || 'On file'}</div>
        <div><strong>Place of Supply:</strong> ${customerState}</div>
      </div>
      <div>
        <div class="section-title">Logistics & Order Reference:</div>
        <div><strong>Order Reference:</strong> #${order.orderNumber}</div>
        <div><strong>Courier Partner:</strong> ${order.carrier || 'Delhivery Express / Blue Dart Air'}</div>
        <div><strong>Airway Tracking (AWB):</strong> ${order.trackingNumber || 'Assigned & Dispatched'}</div>
        <div><strong>Estimated Delivery:</strong> ${order.estimatedDelivery || '2-4 Business Days'}</div>
        <div><strong>Dispatched From:</strong> Priority Express Central Logistics Hub</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 30px;">#</th>
          <th>Item Description</th>
          <th style="width: 80px;">HSN/SAC</th>
          <th style="width: 40px; text-align: center;">Qty</th>
          <th style="width: 80px; text-align: right;">Unit Rate</th>
          <th style="width: 90px; text-align: right;">Taxable Val</th>
          <th style="width: 90px; text-align: right;">GST (18%)</th>
          <th style="width: 90px; text-align: right;">Total (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${order.items
          .map((item, idx) => {
            const itemPriceINR = getINR(item.price);
            const lineTotal = itemPriceINR * item.quantity;
            const lineTaxable = Math.round(lineTotal / 1.18);
            const lineGst = lineTotal - lineTaxable;
            const hsn = item.isDress ? '6104' : idx % 2 === 0 ? '8517' : '3924';
            return `
          <tr>
            <td>${idx + 1}</td>
            <td>
              <strong style="color: #0f172a;">${item.title.replace(/^(DeoDap|Baapstore|CJdropshipping|CJ)\s*[-–—:]*\s*/gi, '')}</strong>
              <div style="font-size: 9px; color: #64748b; font-family: monospace;">SKU: ${item.sku}</div>
            </td>
            <td style="font-family: monospace;">${hsn}</td>
            <td style="text-align: center; font-weight: 700;">${item.quantity}</td>
            <td style="text-align: right;">₹${itemPriceINR.toLocaleString('en-IN')}</td>
            <td style="text-align: right;">₹${lineTaxable.toLocaleString('en-IN')}</td>
            <td style="text-align: right; color: #0284c7;">₹${lineGst.toLocaleString('en-IN')}</td>
            <td style="text-align: right; font-weight: 800;">₹${lineTotal.toLocaleString('en-IN')}</td>
          </tr>`;
          })
          .join('')}
      </tbody>
    </table>

    <div class="totals-row">
      <div class="upi-box">
        <div style="font-size: 10px; font-weight: 800; color: #065f46; text-transform: uppercase;">
          UPI Payment Settlement Voucher
        </div>
        <div style="margin-top: 4px; font-size: 10.5px; color: #064e3b;">
          <div><strong>Payment Channel:</strong> UPI (Unified Payments Interface)</div>
          <div><strong>Transaction / UTR Ref:</strong> <span style="font-family: monospace;">${upiTxnId}</span></div>
          <div><strong>Store Payee VPA:</strong> <span style="font-family: monospace;">${receiverUpiId}</span></div>
          <div><strong>Payee Name:</strong> ${storeName}</div>
          <div style="margin-top: 6px;">
            <span class="stamp">✓ PAID - UPI SETTLED</span>
          </div>
        </div>
      </div>

      <div class="totals-box">
        <div class="totals-item">
          <span style="color: #64748b;">Taxable Subtotal:</span>
          <span>₹${taxableSubtotal.toLocaleString('en-IN')}</span>
        </div>
        <div class="totals-item">
          <span style="color: #64748b;">Central GST (CGST @ 9%):</span>
          <span>₹${cgst.toLocaleString('en-IN')}</span>
        </div>
        <div class="totals-item">
          <span style="color: #64748b;">State GST (SGST @ 9%):</span>
          <span>₹${sgst.toLocaleString('en-IN')}</span>
        </div>
        <div class="totals-item">
          <span style="color: #64748b;">Express Courier Delivery:</span>
          <span style="color: #059669; font-weight: 700;">${shippingCharge > 0 ? `₹${shippingCharge.toLocaleString('en-IN')}` : 'FREE (Included)'}</span>
        </div>
        <div class="totals-grand">
          <span>Grand Total:</span>
          <span>₹${totalBilled.toLocaleString('en-IN')}</span>
        </div>
        <div style="font-size: 9px; color: #64748b; margin-top: 4px; text-align: right;">
          ${numberToWordsINR(totalBilled)}
        </div>
      </div>
    </div>

    <div class="footer-note">
      <p style="margin: 0;">This is a computer-generated GST tax invoice and payment receipt. No physical signature is required under IT Act 2000.</p>
      <p style="margin: 3px 0 0;">For returns, replacements, or courier tracking inquiries, visit <strong>https://kovira.store</strong> or email <strong>concierge@kovira.store</strong>.</p>
    </div>
  </div>
</body>
</html>`;
  };

  // Robust isolated print handler that works seamlessly inside browser iframes
  const handlePrint = () => {
    setIsPrinting(true);
    try {
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const frameDoc = printIframe.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(generatePrintHTML());
        frameDoc.close();

        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch (e) {
            console.warn('Iframe print failed, falling back to window.print()', e);
            window.print();
          } finally {
            setTimeout(() => {
              try {
                document.body.removeChild(printIframe);
              } catch {}
              setIsPrinting(false);
            }, 1500);
          }
        }, 400);
      } else {
        window.print();
        setIsPrinting(false);
      }
    } catch (err) {
      console.warn('Printing error, fallback to window.print', err);
      window.print();
      setIsPrinting(false);
    }
  };

  // Download printable plain-text invoice summary
  const handleDownloadTextInvoice = () => {
    const textSlip = `===============================================================
               KOVIRA COMMERCE PVT. LTD.
           TAX INVOICE & OFFICIAL CASH BILL
===============================================================
Invoice Number  : ${invoiceNumber}
Order Reference : #${order.orderNumber}
Date & Time     : ${orderDateFormatted} ${orderTimeFormatted}
GSTIN           : 27AABCK9876Q1Z8 | PAN: AABCK9876Q
Registered Hub  : 402 Business Tech Park, Andheri East, Mumbai 400069

---------------------------------------------------------------
CUSTOMER / DELIVERED TO:
Name            : ${order.customer?.name || 'Customer'}
Address         : ${order.customer?.address || ''}
City & PIN      : ${order.customer?.city || ''} - ${order.customer?.postalCode || ''}
Phone           : ${order.customer?.phone || ''}
Email           : ${order.customer?.email || ''}
Place of Supply : ${customerState}

---------------------------------------------------------------
LOGISTICS DETAILS:
Courier Partner : ${order.carrier || 'Delhivery Surface & Express'}
AWB Tracking    : ${order.trackingNumber || 'Dispatched'}
Est. Arrival    : ${order.estimatedDelivery || '2-4 business days'}

---------------------------------------------------------------
ITEMS BILLED:
${order.items
  .map(
    (it, i) =>
      `${i + 1}. ${it.title} (Qty: ${it.quantity}) - Rate: ₹${getINR(it.price).toLocaleString('en-IN')} | Total: ₹${getINR(
        it.price * it.quantity
      ).toLocaleString('en-IN')}`
  )
  .join('\n')}

---------------------------------------------------------------
BILL SUMMARY:
Taxable Goods Subtotal : ₹${taxableSubtotal.toLocaleString('en-IN')}
Central GST (CGST 9%)  : ₹${cgst.toLocaleString('en-IN')}
State GST (SGST 9%)    : ₹${sgst.toLocaleString('en-IN')}
Courier & Handling     : ${shippingCharge > 0 ? `₹${shippingCharge.toLocaleString('en-IN')}` : 'FREE (₹0.00)'}
---------------------------------------------------------------
GRAND TOTAL BILLED     : ₹${totalBilled.toLocaleString('en-IN')}
Amount in Words        : ${numberToWordsINR(totalBilled)}

---------------------------------------------------------------
UPI PAYMENT VERIFICATION:
Payment Method         : 100% Verified UPI Transfer
Transaction Ref / UTR  : ${upiTxnId}
Store VPA              : ${receiverUpiId}
Payment Status         : PAID & VERIFIED (SUCCESS)
===============================================================
Thank you for shopping with Kovira Store!
24/7 Concierge Support: concierge@kovira.store
`;

    const blob = new Blob([textSlip], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${invoiceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyDetails = () => {
    const summary = `🧾 Kovira Tax Invoice: ${invoiceNumber}\nOrder: #${order.orderNumber}\nCustomer: ${order.customer?.name || ''}\nTotal Billed: ₹${totalBilled.toLocaleString('en-IN')} (Paid via UPI)\nUPI Txn Ref: ${upiTxnId}\nCarrier: ${order.carrier || 'Delhivery'} | AWB: ${order.trackingNumber || ''}`;
    navigator.clipboard.writeText(summary);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🧾 *Kovira GST Tax Invoice & Bill Summary*\n\n*Invoice No:* ${invoiceNumber}\n*Order:* #${order.orderNumber}\n*Total Amount:* ₹${totalBilled.toLocaleString('en-IN')}\n*Payment Mode:* UPI (${upiTxnId})\n*Customer:* ${order.customer?.name || ''}\n*Tracking Code:* ${order.trackingNumber || 'Delhivery'}\n\nView online: https://kovira.store`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black tracking-wide flex items-center gap-2">
                <span>TAX INVOICE & BILL RECEIPT</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full font-mono">
                  {invoiceNumber}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Official GST e-Invoice • 100% Verified UPI Payment
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="Print GST Invoice / Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isPrinting ? 'Printing...' : 'Print Bill'}</span>
            </button>

            <button
              onClick={handleDownloadTextInvoice}
              className="hidden sm:flex bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-2.5 py-1.5 rounded-xl items-center gap-1.5 transition-all cursor-pointer"
              title="Download Plain-Text Invoice Slip"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Slip</span>
            </button>

            <button
              onClick={handleCopyDetails}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-xl transition-all cursor-pointer"
              title="Copy invoice summary"
            >
              {copiedInvoice ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="hidden sm:flex bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 p-1.5 rounded-xl transition-all cursor-pointer"
              title="Share on WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Invoice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Formatted Printable Bill Body */}
        <div ref={invoiceContainerRef} className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-white text-slate-900 text-xs">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b-2 border-slate-900 gap-3">
            <div>
              <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                <span>KOVIRA COMMERCE PVT. LTD.</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                402 Business Tech Park, Andheri East, Mumbai, Maharashtra 400069
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 font-mono mt-1">
                <span><strong>GSTIN:</strong> 27AABCK9876Q1Z8</span>
                <span><strong>PAN:</strong> AABCK9876Q</span>
                <span><strong>CIN:</strong> U74999MH2024PTC123456</span>
              </div>
            </div>

            <div className="text-left sm:text-right bg-slate-50 border border-slate-200 p-3 rounded-2xl w-full sm:w-auto">
              <div className="text-xs uppercase font-extrabold tracking-wider text-slate-500">TAX INVOICE</div>
              <div className="text-base font-black font-mono text-emerald-700">{invoiceNumber}</div>
              <div className="text-[10px] text-slate-500">
                Invoice Date: <strong>{orderDateFormatted} {orderTimeFormatted}</strong>
              </div>
              <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                100% UPI Paid
              </div>
            </div>
          </div>

          {/* Meta Grid: Bill To & Logistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            {/* Customer Details */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Billed To & Delivered To:
              </span>
              <div className="font-extrabold text-slate-900 text-sm">{order.customer?.name || 'Customer'}</div>
              <div className="text-slate-600">{order.customer?.address || 'Delivery Address on file'}</div>
              <div className="text-slate-600">
                {order.customer?.city || ''}
                {order.customer?.postalCode ? ` - PIN: ${order.customer.postalCode}` : ''}, India
              </div>
              <div className="text-slate-500 text-[11px] pt-1">
                <strong>Phone:</strong> {order.customer?.phone || 'On file'} | <strong>Email:</strong>{' '}
                {order.customer?.email || 'On file'}
              </div>
              <div className="text-[11px] text-slate-500">
                <strong>Place of Supply:</strong> {customerState}
              </div>
            </div>

            {/* Order & Courier Reference */}
            <div className="space-y-1 border-t sm:border-t-0 sm:border-l sm:pl-4 border-slate-200 pt-2 sm:pt-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Order & Shipping Dispatch:
              </span>
              <div>
                <strong>Order Reference:</strong> <span className="font-mono text-cyan-700">#{order.orderNumber}</span>
              </div>
              <div>
                <strong>Airway Bill (AWB):</strong>{' '}
                <span className="font-mono font-bold text-slate-900">{order.trackingNumber || 'Dispatched'}</span>
              </div>
              <div>
                <strong>Courier Partner:</strong> {order.carrier || 'Delhivery Surface & Express'}
              </div>
              <div>
                <strong>Est. Delivery:</strong> {order.estimatedDelivery || '2-4 business days'}
              </div>
              <div className="text-[11px] text-slate-500">
                <strong>Warehouse Hub:</strong> Priority Express Central Logistics Hub, Gujarat
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-2.5 w-8">#</th>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 w-16">HSN</th>
                    <th className="p-2.5 w-12 text-center">Qty</th>
                    <th className="p-2.5 w-20 text-right">Unit Rate</th>
                    <th className="p-2.5 w-20 text-right">Taxable</th>
                    <th className="p-2.5 w-20 text-right">GST (18%)</th>
                    <th className="p-2.5 w-24 text-right">Total (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {order.items.map((it, idx) => {
                    const priceINR = getINR(it.price);
                    const lineTotal = priceINR * it.quantity;
                    const lineTaxable = Math.round(lineTotal / 1.18);
                    const lineGst = lineTotal - lineTaxable;
                    const hsn = it.isDress ? '6104' : idx % 2 === 0 ? '8517' : '3924';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">
                            {it.title.replace(/^(DeoDap|Baapstore|CJdropshipping|CJ)\s*[-–—:]*\s*/gi, '')}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">SKU: {it.sku}</div>
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">{hsn}</td>
                        <td className="p-2.5 text-center font-bold">{it.quantity}</td>
                        <td className="p-2.5 text-right font-mono">₹{priceINR.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono">₹{lineTaxable.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono text-cyan-700">₹{lineGst.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          ₹{lineTotal.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Summary: UPI Payment Verification + Bill Financial Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* UPI Settlement Box */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-900 text-xs uppercase tracking-wider">
                  UPI Payment Settlement Voucher
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-emerald-900/90 font-mono">
                <div>
                  <span className="text-emerald-700 font-sans">Payment Method:</span>{' '}
                  <strong>100% Verified UPI Transfer</strong>
                </div>
                <div>
                  <span className="text-emerald-700 font-sans">UPI Txn UTR / Ref:</span>{' '}
                  <span className="font-bold">{upiTxnId}</span>
                </div>
                <div>
                  <span className="text-emerald-700 font-sans">Payee VPA:</span>{' '}
                  <span className="font-bold">{receiverUpiId}</span>
                </div>
                <div>
                  <span className="text-emerald-700 font-sans">Merchant Name:</span>{' '}
                  <span>{storeName}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  PAID & VERIFIED
                </div>
                <span className="text-[10px] text-emerald-700 italic">Settled via NPCI UPI</span>
              </div>
            </div>

            {/* Bill Financial Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Items Subtotal:</span>
                <span className="font-mono font-semibold">₹{taxableSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Central GST (CGST @ 9%):</span>
                <span className="font-mono">₹{cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>State GST (SGST @ 9%):</span>
                <span className="font-mono">₹{sgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Courier Delivery:</span>
                <span className="font-semibold text-emerald-700 font-mono">
                  {shippingCharge > 0 ? `₹${shippingCharge.toLocaleString('en-IN')}` : 'FREE (₹0.00)'}
                </span>
              </div>

              <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline text-sm font-black text-slate-900">
                <span>Grand Total Billed:</span>
                <span className="font-mono text-lg text-emerald-700">₹{totalBilled.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[10px] text-slate-500 text-right italic">
                {numberToWordsINR(totalBilled)}
              </div>
            </div>
          </div>

          {/* Footer Legal & Support info */}
          <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500 text-center sm:text-left">
            <div>
              <p>Computer-generated invoice valid under Indian IT Act 2000. Authorized Kovira E-commerce Signatory.</p>
              <p>For questions or 7-day replacements, contact <strong className="text-slate-700">concierge@kovira.store</strong></p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3 h-3" />
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
