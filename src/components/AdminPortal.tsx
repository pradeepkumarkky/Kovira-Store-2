import React, { useState, useEffect } from 'react';
import { Product, Supplier, Order, RestockNotification, AnalyticsSummary, CurrencyCode, DressProduct } from '../types';
import { formatPrice, convertPrice } from '../utils/currency';
import { KoviraLogo } from './KoviraLogo';
import { MultiSupplierDropshipHub } from './MultiSupplierDropshipHub';
import { AdminAnnouncementManager } from './AdminAnnouncementManager';
import { DeoDapCatalogUploader } from './DeoDapCatalogUploader';
import { CSVInventoryManager } from './CSVInventoryManager';
import { DeoDapDirectLinkManager } from './DeoDapDirectLinkManager';
import { DressUploadModal } from './DressUploadModal';
import { TaxInvoiceReceiptModal } from './TaxInvoiceReceiptModal';
import { AdminOrderDetailsModal } from './AdminOrderDetailsModal';
import {
  Lock,
  Unlock,
  Zap,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Package,
  Boxes,
  Truck,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  LogOut,
  ArrowLeft,
  X,
  ExternalLink,
  Link,
  Users,
  Globe,
  Globe2,
  DollarSign,
  ArrowUpRight,
  Send,
  Building,
  Phone,
  Mail,
  Search,
  Megaphone,
  Upload,
  Layers,
  Filter,
  Sliders,
  LayoutGrid,
  List,
  Tag,
  Sparkles,
  FileSpreadsheet,
  Download,
  MapPin,
  Eye,
  EyeOff,
  Smartphone,
  QrCode,
  Settings,
  Check,
  Copy,
  Printer,
  Receipt,
  FileText,
  CreditCard,
} from 'lucide-react';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  suppliers: Supplier[];
  orders: Order[];
  restockNotifications: RestockNotification[];
  currency: CurrencyCode;
  onRefreshData: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  products,
  suppliers,
  orders,
  restockNotifications,
  currency,
  onRefreshData,
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('pradeepkumarkky');
  const [passwordInput, setPasswordInput] = useState('Kovira@143');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<
    | 'inventory'
    | 'dropship_hub'
    | 'orders'
    | 'dresses'
    | 'offers'
    | 'analytics'
    | 'upi_settings'
  >('inventory');

  // Unified Dropship Hub sub-navigation: 1. DeoDap Live Link, 2. CSV Catalog Link, 3. Dropship Suppliers
  const [dropshipSubTab, setDropshipSubTab] = useState<
    'live_link' | 'csv_catalog' | 'suppliers'
  >('live_link');

  // Merchant UPI Receiver Settings
  const [merchantUpiId, setMerchantUpiId] = useState<string>(() => {
    return localStorage.getItem('kovira_receiver_upi_id') || '9656850012@upi';
  });
  const [merchantName, setMerchantName] = useState<string>(() => {
    return localStorage.getItem('kovira_receiver_name') || 'Kovira Store';
  });
  const [savedUpiNotice, setSavedUpiNotice] = useState(false);
  const [copiedAdminUpi, setCopiedAdminUpi] = useState(false);
  const [copiedAdminUpiLink, setCopiedAdminUpiLink] = useState(false);
  const [adminTestAmount, setAdminTestAmount] = useState('1499');
  const [adminDresses, setAdminDresses] = useState<DressProduct[]>([]);
  const [showDressUploadModal, setShowDressUploadModal] = useState(false);
  const [editingAdminDress, setEditingAdminDress] = useState<DressProduct | null>(null);

  const loadAdminDresses = () => {
    fetch('/api/dresses')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.dresses) setAdminDresses(d.dresses);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAdminDresses();
  }, []);

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Search, sort & filter in Live Inventory
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low' | 'healthy'>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [inventorySortBy, setInventorySortBy] = useState<
    'supplier_asc' | 'supplier_desc' | 'stock_asc' | 'stock_desc' | 'price_asc' | 'price_desc' | 'title_asc' | 'newest'
  >('supplier_asc');
  const [inventoryViewMode, setInventoryViewMode] = useState<'supplier-wise' | 'table'>('supplier-wise');

  // Modals for adding product & supplier
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);

  // New product form
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Electronics');
  const [newProdPrice, setNewProdPrice] = useState(149);
  const [newProdCost, setNewProdCost] = useState(65);
  const [newProdStock, setNewProdStock] = useState(15);
  const [newProdReorderPoint, setNewProdReorderPoint] = useState(5);
  const [newProdReorderQty, setNewProdReorderQty] = useState(25);
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdSupplierId, setNewProdSupplierId] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdImage, setNewProdImage] = useState('');

  // New supplier form
  const [newSupName, setNewSupName] = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupCountry, setNewSupCountry] = useState('India');
  const [newSupLeadDays, setNewSupLeadDays] = useState(2);
  const [newSupMethod, setNewSupMethod] = useState<'Automated EDI' | 'Direct Email PO' | 'API Webhook'>('Automated EDI');

  // Action status message
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Orders Filter & Management State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editTrackingInput, setEditTrackingInput] = useState('');
  const [editCarrierInput, setEditCarrierInput] = useState('');

  // Active Tax Invoice & Bill Summary State
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [showBillingRegisterTable, setShowBillingRegisterTable] = useState(false);

  // Financial Bill Summary calculation across all placed orders
  const billSummaryMetrics = React.useMemo(() => {
    let totalGrossBilledINR = 0;
    let totalTaxableSubtotalINR = 0;
    let totalGSTINR = 0;
    let totalShippingINR = 0;
    let upiPaidCount = 0;
    let upiPaidTotalINR = 0;

    orders.forEach((ord) => {
      const isOrderINR = ord.currency === 'INR';
      const getINR = (v: number) => Math.round(isOrderINR ? v : convertPrice(v, 'INR'));

      const ordTotal = getINR(ord.total);
      const ordShipping = ord.shipping ? getINR(ord.shipping) : 0;
      const taxable = Math.round((ordTotal - ordShipping) / 1.18);
      const gst = Math.max(0, ordTotal - ordShipping - taxable);

      totalGrossBilledINR += ordTotal;
      totalTaxableSubtotalINR += taxable;
      totalGSTINR += gst;
      totalShippingINR += ordShipping;

      if ((ord.paymentMethod || '').includes('UPI') || ord.paymentStatus === 'Paid') {
        upiPaidCount += 1;
        upiPaidTotalINR += ordTotal;
      }
    });

    const aovINR = orders.length > 0 ? Math.round(totalGrossBilledINR / orders.length) : 0;

    return {
      totalGrossBilledINR,
      totalTaxableSubtotalINR,
      totalGSTINR,
      cgstINR: Math.round(totalGSTINR / 2),
      sgstINR: totalGSTINR - Math.round(totalGSTINR / 2),
      totalShippingINR,
      upiPaidCount,
      upiPaidTotalINR,
      aovINR,
      totalOrdersCount: orders.length,
    };
  }, [orders]);

  const handleExportBillSummaryCSV = () => {
    if (!orders || orders.length === 0) {
      showNotification('No orders available to export bill summary');
      return;
    }
    const headers = [
      'Invoice Number',
      'Order Reference',
      'Date & Time',
      'Customer Name',
      'Phone',
      'Email',
      'Delivery City',
      'State Code',
      'Items Billed Count',
      'Taxable Subtotal (INR)',
      'CGST 9% (INR)',
      'SGST 9% (INR)',
      'Total GST 18% (INR)',
      'Shipping Fee (INR)',
      'Grand Total Billed (INR)',
      'Payment Channel',
      'UPI Transaction UTR',
      'Payment Status',
      'Fulfillment Status',
      'Courier',
      'Tracking Number',
    ];

    const rows = orders.map((o) => {
      const isOrderINR = o.currency === 'INR';
      const getINR = (v: number) => Math.round(isOrderINR ? v : convertPrice(v, 'INR'));
      const ordTotal = getINR(o.total);
      const ordShipping = o.shipping ? getINR(o.shipping) : 0;
      const taxable = Math.round((ordTotal - ordShipping) / 1.18);
      const totalGst = Math.max(0, ordTotal - ordShipping - taxable);
      const cgst = Math.round(totalGst / 2);
      const sgst = totalGst - cgst;
      const invNo = `INV-KOV-${o.orderNumber.replace(/[^0-9]/g, '')}`;

      return [
        `"${invNo}"`,
        `"${o.orderNumber}"`,
        `"${new Date(o.createdAt).toLocaleString('en-IN')}"`,
        `"${(o.customer?.name || '').replace(/"/g, '""')}"`,
        `"${(o.customer?.phone || '').replace(/"/g, '""')}"`,
        `"${(o.customer?.email || '').replace(/"/g, '""')}"`,
        `"${(o.customer?.city || '').replace(/"/g, '""')}"`,
        `"${(o.customer?.postalCode || '').replace(/"/g, '""')}"`,
        o.items.reduce((s, it) => s + it.quantity, 0),
        taxable,
        cgst,
        sgst,
        totalGst,
        ordShipping,
        ordTotal,
        `"${o.paymentMethod || 'UPI'}"`,
        `"${o.stripePaymentIntentId || ''}"`,
        `"${o.paymentStatus || 'Paid'}"`,
        `"${o.fulfillmentStatus || 'Order Placed'}"`,
        `"${o.carrier || ''}"`,
        `"${o.trackingNumber || ''}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kovira_gst_billing_register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Exported complete GST Billing Register CSV successfully!');
  };

  const handlePrintBillingRegister = () => {
    if (!orders || orders.length === 0) {
      showNotification('No orders placed to generate billing register');
      return;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Kovira GST Billing Register</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: sans-serif; font-size: 10px; color: #111; margin: 0; padding: 10px; }
    h2 { margin: 0 0 4px; font-size: 16px; font-weight: 900; }
    .meta { font-size: 9px; color: #555; margin-bottom: 12px; }
    .kpi-row { display: flex; gap: 15px; margin-bottom: 14px; background: #f1f5f9; padding: 10px; border-radius: 6px; }
    .kpi-item { flex: 1; }
    .kpi-item span { display: block; font-size: 8px; color: #64748b; text-transform: uppercase; font-weight: bold; }
    .kpi-item strong { font-size: 13px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #0f172a; color: #fff; padding: 5px 6px; text-align: left; font-size: 8.5px; text-transform: uppercase; }
    td { padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 9.5px; }
    .num { text-align: right; }
    .bold { font-weight: bold; }
  </style>
</head>
<body>
  <h2>KOVIRA COMMERCE PVT. LTD. — GST BILLING REGISTER & FINANCIAL SUMMARY</h2>
  <div class="meta">
    GSTIN: 27AABCK9876Q1Z8 | Report Date: ${new Date().toLocaleString('en-IN')} | Total Orders Billed: ${orders.length}
  </div>
  <div class="kpi-row">
    <div class="kpi-item"><span>Total Gross Billed</span><strong>₹${billSummaryMetrics.totalGrossBilledINR.toLocaleString('en-IN')}</strong></div>
    <div class="kpi-item"><span>Taxable Subtotal</span><strong>₹${billSummaryMetrics.totalTaxableSubtotalINR.toLocaleString('en-IN')}</strong></div>
    <div class="kpi-item"><span>Central GST (CGST)</span><strong>₹${billSummaryMetrics.cgstINR.toLocaleString('en-IN')}</strong></div>
    <div class="kpi-item"><span>State GST (SGST)</span><strong>₹${billSummaryMetrics.sgstINR.toLocaleString('en-IN')}</strong></div>
    <div class="kpi-item"><span>Total GST (18%)</span><strong>₹${billSummaryMetrics.totalGSTINR.toLocaleString('en-IN')}</strong></div>
    <div class="kpi-item"><span>Shipping Billed</span><strong>₹${billSummaryMetrics.totalShippingINR.toLocaleString('en-IN')}</strong></div>
    <div class="kpi-item"><span>100% UPI Settled</span><strong>₹${billSummaryMetrics.upiPaidTotalINR.toLocaleString('en-IN')}</strong></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Invoice / Order</th>
        <th>Date</th>
        <th>Customer & City</th>
        <th>Items</th>
        <th class="num">Taxable (₹)</th>
        <th class="num">CGST 9% (₹)</th>
        <th class="num">SGST 9% (₹)</th>
        <th class="num">Delivery (₹)</th>
        <th class="num">Total Billed (₹)</th>
        <th>Payment</th>
      </tr>
    </thead>
    <tbody>
      ${orders
        .map((o, i) => {
          const isOrderINR = o.currency === 'INR';
          const getINR = (v: number) => Math.round(isOrderINR ? v : convertPrice(v, 'INR'));
          const total = getINR(o.total);
          const shipping = o.shipping ? getINR(o.shipping) : 0;
          const taxable = Math.round((total - shipping) / 1.18);
          const gst = Math.max(0, total - shipping - taxable);
          const cgst = Math.round(gst / 2);
          const sgst = gst - cgst;
          return `
        <tr>
          <td>${i + 1}</td>
          <td><strong>#${o.orderNumber}</strong><br/><span style="font-size: 8px; color: #64748b;">INV-KOV-${o.orderNumber.replace(/[^0-9]/g, '')}</span></td>
          <td>${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
          <td><strong>${o.customer?.name || ''}</strong><br/>${o.customer?.city || ''}</td>
          <td>${o.items.map((it) => `${it.title.slice(0, 22)}... (x${it.quantity})`).join(', ')}</td>
          <td class="num">₹${taxable.toLocaleString('en-IN')}</td>
          <td class="num">₹${cgst.toLocaleString('en-IN')}</td>
          <td class="num">₹${sgst.toLocaleString('en-IN')}</td>
          <td class="num">₹${shipping.toLocaleString('en-IN')}</td>
          <td class="num bold">₹${total.toLocaleString('en-IN')}</td>
          <td><span style="color: #059669; font-weight: bold;">UPI PAID</span></td>
        </tr>`;
        })
        .join('')}
    </tbody>
  </table>
</body>
</html>`;

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
      frameDoc.write(html);
      frameDoc.close();
      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } finally {
          setTimeout(() => {
            try {
              document.body.removeChild(printIframe);
            } catch {}
          }, 1500);
        }
      }, 400);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, trackingNum?: string, carrierName?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfillmentStatus: newStatus,
          trackingNumber: trackingNum,
          carrier: carrierName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onRefreshData();
        showNotification(data.message || `Order status updated to ${newStatus}`);
        setEditingOrderId(null);
      }
    } catch {
      showNotification('Failed to update order status');
    }
  };

  const handleExportOrdersCSV = () => {
    if (!orders || orders.length === 0) {
      showNotification('No orders available to export');
      return;
    }
    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Email',
      'Phone',
      'Address',
      'City',
      'Postal Code',
      'Country',
      'Items Purchased',
      'Total Amount',
      'Currency',
      'Payment Method',
      'Fulfillment Status',
      'Tracking Number',
      'Carrier',
    ];

    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${new Date(o.createdAt).toLocaleString()}"`,
      `"${(o.customer?.name || '').replace(/"/g, '""')}"`,
      `"${(o.customer?.email || '').replace(/"/g, '""')}"`,
      `"${(o.customer?.phone || '').replace(/"/g, '""')}"`,
      `"${(o.customer?.address || '').replace(/"/g, '""')}"`,
      `"${(o.customer?.city || '').replace(/"/g, '""')}"`,
      `"${(o.customer?.postalCode || '').replace(/"/g, '""')}"`,
      `"${(o.customer?.country || '').replace(/"/g, '""')}"`,
      `"${o.items.map((i) => `${i.title} (x${i.quantity})`).join('; ').replace(/"/g, '""')}"`,
      o.total,
      `"${o.currency}"`,
      `"${o.paymentMethod || 'Stripe'}"`,
      `"${o.fulfillmentStatus || 'Pending'}"`,
      `"${o.trackingNumber || ''}"`,
      `"${o.carrier || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kovira_customer_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Exported all customer orders to CSV successfully!');
  };

  useEffect(() => {
    const savedToken = sessionStorage.getItem('kovira_admin_token');
    if (savedToken) {
      setIsAuthenticated(true);
      fetchAnalytics();
    }
  }, []);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });
      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem('kovira_admin_token', data.token);
        setIsAuthenticated(true);
        fetchAnalytics();
        showNotification('Authenticated successfully as Super Administrator (pradeepkumarkky)');
      } else {
        setAuthError(data.error || 'Invalid administrator username or password');
      }
    } catch (e) {
      setAuthError('Connection error while authenticating');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('kovira_admin_token');
    setIsAuthenticated(false);
  };

  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Quick Stock Adjustment
  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: Math.max(0, newStock) }),
      });
      const data = await res.json();
      if (data.success) {
        onRefreshData();
        if (data.triggeredNotification) {
          showNotification(
            `Automated PO Triggered! Dispatched to ${data.triggeredNotification.supplierEmail} for SKU ${data.triggeredNotification.sku}`
          );
        } else {
          showNotification('Stock level updated successfully');
        }
      }
    } catch (e) {
      showNotification('Failed to update stock');
    }
  };

  // Publish Staged Product to Public Store with 40% Margin
  const handlePublishProduct = async (productId: string) => {
    try {
      const res = await fetch('/api/dropship/deodap/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: [productId] }),
      });
      const data = await res.json();
      if (data.success) {
        onRefreshData();
        showNotification(data.message || 'Product published to public store with 40% margin!');
      }
    } catch {
      showNotification('Failed to publish product');
    }
  };

  // Unpublish Product from Public Store (revert to Admin Staging)
  const handleUnpublishProduct = async (productId: string) => {
    try {
      const res = await fetch('/api/dropship/deodap/unpublish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.success) {
        onRefreshData();
        showNotification(data.message || 'Product reverted to Admin Staging');
      }
    } catch {
      showNotification('Failed to unpublish product');
    }
  };

  // Manual Restock PO Trigger
  const handleTriggerManualRestock = async (productId: string, units = 25) => {
    try {
      const res = await fetch('/api/restock-notifications/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, orderedUnits: units }),
      });
      const data = await res.json();
      if (data.success) {
        onRefreshData();
        showNotification(
          `Restock PO #${data.notification.purchaseOrderNumber} successfully sent to ${data.notification.supplierName}!`
        );
      }
    } catch (e) {
      showNotification('Failed to dispatch restock notification');
    }
  };

  // Create Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProdTitle,
          category: newProdCategory,
          priceUSD: newProdPrice,
          costUSD: newProdCost,
          stock: newProdStock,
          reorderPoint: newProdReorderPoint,
          reorderQuantity: newProdReorderQty,
          sku: newProdSku || `KOV-${newProdCategory.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          supplierId: newProdSupplierId || (suppliers[0]?.id || 'sup_1'),
          description: newProdDescription || 'Curated luxury item dropshipped worldwide.',
          images: newProdImage ? [newProdImage] : [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        onRefreshData();
        setShowAddProductModal(false);
        setNewProdTitle('');
        setNewProdDescription('');
        showNotification('New dropshipped product registered with supplier linkage');
      }
    } catch (e) {
      showNotification('Failed to add product');
    }
  };

  // Create Supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSupName,
          contactPerson: newSupContact,
          email: newSupEmail,
          phone: newSupPhone,
          country: newSupCountry,
          leadTimeDays: newSupLeadDays,
          fulfillmentMethod: newSupMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onRefreshData();
        setShowAddSupplierModal(false);
        setNewSupName('');
        setNewSupContact('');
        setNewSupEmail('');
        showNotification(`Supplier ${newSupName} onboarded with ${newSupMethod} integration`);
      }
    } catch (e) {
      showNotification('Failed to add supplier');
    }
  };

  // Combine all inventory sources (direct uploads, web links, CSV imports, boutique dresses, drafts)
  const allLiveInventory: Product[] = React.useMemo(() => {
    const list = [...products];
    const existingIds = new Set(list.map((p) => p.id));
    const existingSkus = new Set(list.map((p) => (p.sku || '').toLowerCase()));

    // Merge any boutique dresses uploaded directly so all live stock is represented in Live Inventory
    adminDresses.forEach((d) => {
      if (!existingIds.has(d.id) && !existingSkus.has((d.sku || '').toLowerCase())) {
        const priceUSD = Number(((d.priceINR || 1499) / 86.5).toFixed(2));
        const costUSD = Number(((d.baseCostINR || 900) / 86.5).toFixed(2));
        list.push({
          id: d.id,
          title: d.title,
          description: d.subtitle || d.title,
          category: d.category || 'Partywear Gowns & Apparel',
          priceUSD,
          costUSD,
          stock: d.stock || 75,
          reorderPoint: 15,
          reorderQuantity: 30,
          sku: d.sku || `SHV-${d.id.slice(-6).toUpperCase()}`,
          supplierId: 'sup_shivora',
          supplierName: 'Shivora In-House Boutique',
          supplierLeadDays: 1,
          supplierPlatform: 'Shivora Boutique',
          images: d.images.length > 0 ? d.images : ['/assets/dresses/partywear_gown_1_1791385855095.jpg'],
          rating: d.rating || 4.9,
          reviewsCount: d.reviewsCount || 38,
          tags: ['Shivora Boutique', 'Handcrafted', 'Dress'],
          weightKg: 0.55,
          isDropshipped: false,
          featured: true,
          isPublished: true,
          marginPercent: 40,
          wholesaleINR: d.baseCostINR || 900,
          deliveryChargeINR: d.deliveryChargeINR || 80,
        });
      }
    });

    return list;
  }, [products, adminDresses]);

  // Extract all unique suppliers across the entire live inventory for filtering
  const uniqueSuppliers = React.useMemo(() => {
    const supMap = new Map<string, { key: string; name: string; count: number }>();
    allLiveInventory.forEach((p) => {
      const rawName = p.supplierName || p.supplierPlatform || 'Direct Factory / In-House';
      const key = rawName.toLowerCase().trim();
      if (!supMap.has(key)) {
        supMap.set(key, { key, name: rawName, count: 1 });
      } else {
        supMap.get(key)!.count++;
      }
    });
    return Array.from(supMap.values()).sort((a, b) => b.count - a.count);
  }, [allLiveInventory]);

  // Filtered and sorted live inventory
  const filteredProducts = React.useMemo(() => {
    let list = allLiveInventory.filter((p) => {
      // Search query
      if (inventorySearch.trim()) {
        const q = inventorySearch.toLowerCase();
        const matchesQuery =
          p.title.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.supplierName || '').toLowerCase().includes(q) ||
          (p.supplierPlatform || '').toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Stock status filter
      if (inventoryFilter === 'low') return p.stock <= p.reorderPoint;
      if (inventoryFilter === 'healthy') return p.stock > p.reorderPoint;

      // Supplier filter
      if (supplierFilter !== 'all') {
        const rawSup = p.supplierName || p.supplierPlatform || 'Direct Factory / In-House';
        const supSearchable = `${rawSup} ${p.supplierPlatform || ''} ${p.supplierId || ''}`.toLowerCase();
        const target = supplierFilter.toLowerCase().trim();
        if (!supSearchable.includes(target) && !target.includes(rawSup.toLowerCase().trim())) {
          return false;
        }
      }

      return true;
    });

    // Sorting by supplier, stock, price, title, or newest
    list = [...list].sort((a, b) => {
      if (inventorySortBy === 'supplier_asc') {
        const supA = (a.supplierName || a.supplierPlatform || 'Direct Factory / In-House').toLowerCase();
        const supB = (b.supplierName || b.supplierPlatform || 'Direct Factory / In-House').toLowerCase();
        return supA.localeCompare(supB) || a.title.localeCompare(b.title);
      }
      if (inventorySortBy === 'supplier_desc') {
        const supA = (a.supplierName || a.supplierPlatform || 'Direct Factory / In-House').toLowerCase();
        const supB = (b.supplierName || b.supplierPlatform || 'Direct Factory / In-House').toLowerCase();
        return supB.localeCompare(supA) || a.title.localeCompare(b.title);
      }
      if (inventorySortBy === 'stock_asc') {
        return a.stock - b.stock;
      }
      if (inventorySortBy === 'stock_desc') {
        return b.stock - a.stock;
      }
      if (inventorySortBy === 'price_asc') {
        return a.priceUSD - b.priceUSD;
      }
      if (inventorySortBy === 'price_desc') {
        return b.priceUSD - a.priceUSD;
      }
      if (inventorySortBy === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return list;
  }, [allLiveInventory, inventorySearch, inventoryFilter, supplierFilter, inventorySortBy]);

  // Categorize and group products by supplier for grouped view
  const supplierGroups = React.useMemo(() => {
    const groupMap = new Map<string, {
      key: string;
      name: string;
      platform: string;
      tagColor: string;
      badgeBg: string;
      cardBorder: string;
      headerBg: string;
      accentText: string;
      warehouse: string;
      leadTime: string;
      website: string;
      portalName: string;
      items: Product[];
      totalStock: number;
      lowStockCount: number;
      avgMargin: number;
    }>();

    const presets: Record<string, any> = {
      deodap: {
        key: 'deodap',
        name: 'DeoDap Dropship Logistics (Rajkot Central Hub, Gujarat)',
        platform: 'DeoDap',
        tagColor: 'amber',
        badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        cardBorder: 'border-amber-500/30',
        headerBg: 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900',
        accentText: 'text-amber-400',
        warehouse: 'Rajkot Mega Depot, Gujarat (Central Logistics Center)',
        leadTime: '1–2 days dispatch · Delhivery & Blue Dart Surface',
        website: 'https://deodap.in',
        portalName: 'DeoDap B2B Wholesale Portal',
      },
      baapstore: {
        key: 'baapstore',
        name: 'Baapstore B2B Dropshipping (Chennai Hub & Surat Center)',
        platform: 'Baapstore',
        tagColor: 'sky',
        badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        cardBorder: 'border-sky-500/30',
        headerBg: 'bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-900',
        accentText: 'text-sky-400',
        warehouse: 'Chennai Gateway & Surat Hub',
        leadTime: '2–3 days dispatch · Express Air Cargo',
        website: 'https://baapstore.com',
        portalName: 'Baapstore Merchant Portal',
      },
      cj: {
        key: 'cj',
        name: 'CJdropshipping Overseas Logistics (US & Global Warehouses)',
        platform: 'CJdropshipping',
        tagColor: 'purple',
        badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        cardBorder: 'border-purple-500/30',
        headerBg: 'bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900',
        accentText: 'text-purple-400',
        warehouse: 'US West (Chino, CA) & Global Air Gateway',
        leadTime: '3–6 days tracked air express',
        website: 'https://cjdropshipping.com',
        portalName: 'CJdropshipping Global App',
      },
      shivora: {
        key: 'shivora',
        name: 'Shivora In-House Boutique & Apparel Studio',
        platform: 'Shivora Boutique',
        tagColor: 'pink',
        badgeBg: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
        cardBorder: 'border-pink-500/30',
        headerBg: 'bg-gradient-to-r from-pink-950/40 via-slate-900 to-slate-900',
        accentText: 'text-pink-400',
        warehouse: 'Kovira In-House Studio Warehouse',
        leadTime: 'Same-day / 1 day express dispatch',
        website: '',
        portalName: 'Shivora In-House Studio',
      },
      other: {
        key: 'other',
        name: 'Independent & Direct Factory Partners',
        platform: 'Direct Factory',
        tagColor: 'emerald',
        badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        cardBorder: 'border-slate-800',
        headerBg: 'bg-slate-900',
        accentText: 'text-emerald-400',
        warehouse: 'Regional Fulfillment Depot',
        leadTime: '2–4 days express',
        website: '',
        portalName: 'Direct Partner Integration',
      },
    };

    filteredProducts.forEach((prod) => {
      const supName = (prod.supplierName || '').toLowerCase();
      const supPlat = (prod.supplierPlatform || '').toLowerCase();
      const sku = (prod.sku || '').toLowerCase();

      let groupKey = 'other';
      if (supName.includes('deodap') || supPlat.includes('deodap') || sku.startsWith('618') || sku.startsWith('279') || sku.startsWith('642') || sku.startsWith('727') || sku.startsWith('dd-') || sku.includes('deodap')) {
        groupKey = 'deodap';
      } else if (supName.includes('baap') || supPlat.includes('baap') || sku.includes('baap')) {
        groupKey = 'baapstore';
      } else if (supName.includes('cj') || supPlat.includes('cj') || sku.startsWith('cj')) {
        groupKey = 'cj';
      } else if (supName.includes('shivora') || supPlat.includes('in-house') || sku.startsWith('shv-')) {
        groupKey = 'shivora';
      }

      if (!groupMap.has(groupKey)) {
        const pInfo = presets[groupKey] || presets.other;
        groupMap.set(groupKey, {
          ...pInfo,
          items: [],
          totalStock: 0,
          lowStockCount: 0,
          avgMargin: 0,
        });
      }

      const g = groupMap.get(groupKey)!;
      g.items.push(prod);
      g.totalStock += prod.stock;
      if (prod.stock <= prod.reorderPoint) g.lowStockCount++;
    });

    groupMap.forEach((g) => {
      if (g.items.length > 0) {
        const sumMargin = g.items.reduce((acc, curr) => acc + ((curr.priceUSD - curr.costUSD) / curr.priceUSD) * 100, 0);
        g.avgMargin = Math.round(sumMargin / g.items.length);
      }
    });

    return Array.from(groupMap.values());
  }, [filteredProducts]);

  if (!isOpen) return null;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col w-full touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div
        id="admin-portal-main-window"
        className="relative w-full flex-1 flex flex-col min-h-screen text-slate-100 touch-pan-y"
      >
        {/* Top Header - Dedicated Page Bar */}
        <header className="bg-[#0B1120] border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              id="admin-back-to-store-btn"
              onClick={onClose}
              className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
              title="Return to Customer Storefront"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span>Back to Store</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-3">
              <KoviraLogo size="sm" />
              <div className="border-l border-slate-700 pl-3">
                <h1 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  Admin Control Center
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-800 font-mono font-bold">
                    Super Admin Pro
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Store: Kovira · Inventory, Suppliers, Orders & Shivora Collections Hub
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/80 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              title="Go to customer shop storefront"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Customer Store</span>
            </button>

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                title="Logout of admin session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </header>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="bg-emerald-950/90 border-b border-emerald-700/80 text-emerald-200 px-6 py-2.5 text-xs flex items-center justify-between animate-in fade-in shrink-0">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {actionNotice}
            </span>
            <button onClick={() => setActionNotice(null)} className="text-emerald-400 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* AUTH GATE: If Not Logged In */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 my-auto">
            <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/20 mx-auto">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-1 text-center">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  Super Admin Portal
                </h2>
                <p className="text-xs text-slate-400">
                  Manage Kovira live catalog, drop shipping supplier pipelines, customer orders, and Shivora collections.
                </p>
              </div>

              <form onSubmit={handleLogin} className="w-full space-y-4">
                {authError && (
                  <div className="p-2.5 bg-rose-950/70 border border-rose-800 text-rose-200 text-xs rounded-xl">
                    {authError}
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">Super Admin Username</label>
                  <input
                    id="admin-username-input"
                    type="text"
                    placeholder="Enter super admin username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">Super Admin Password</label>
                  <input
                    id="admin-password-input"
                    type="password"
                    placeholder="Enter super admin password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Authorized role: <strong>Super Admin</strong></span>
                    <span className="font-mono text-cyan-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md">pradeepkumarkky</span>
                  </div>
                </div>

                <button
                  id="admin-login-submit-btn"
                  type="submit"
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  Unlock Super Admin Dashboard
                </button>
              </form>

              {/* Helpful options to login easily without customer friction */}
              <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-[11px] text-slate-400 space-y-1.5">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Quick Store Owner Access:
                </div>
                <p className="leading-relaxed text-slate-400">
                  • <strong>Header Icon:</strong> Click the discreet lock icon in the top header without scrolling.
                </p>
                <p className="leading-relaxed text-slate-400">
                  • <strong>Shortcut:</strong> Press <kbd className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-[10px] border border-slate-700">Ctrl + Shift + A</kbd> anywhere on the site.
                </p>
                <p className="leading-relaxed text-slate-400">
                  • <strong>Direct URL:</strong> Append <span className="text-cyan-300 font-mono">#admin</span> to your store URL.
                </p>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-center gap-2 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Protected by Kovira Security Infrastructure
              </div>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED PORTAL VIEW */
          <div className="flex-1 flex flex-col w-full touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Navigation Tabs - Sticky beneath top header so always accessible while scrolling */}
            <div className="bg-[#0B1120]/95 border-b border-slate-800/90 sticky top-[57px] sm:top-[61px] z-30 backdrop-blur-md shrink-0 shadow-sm">
              {/* Mobile Quick Dropdown Switcher */}
              <div className="sm:hidden px-3 pt-2.5 pb-1">
                <div className="flex items-center gap-2 bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 shadow-xs">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider shrink-0">Tab:</span>
                  <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value as any)}
                    className="bg-transparent text-white text-xs font-bold w-full focus:outline-none cursor-pointer"
                  >
                    <option value="inventory" className="bg-[#111827]">📦 1. Live Inventory ({allLiveInventory.length})</option>
                    <option value="dropship_hub" className="bg-[#111827]">🌐 2. Drop ship hub (DeoDap Live Link, CSV & Suppliers)</option>
                    <option value="orders" className="bg-[#111827]">📦 3. Order Management (Fulfillment & Orders) ({orders.length})</option>
                    <option value="dresses" className="bg-[#111827]">👗 4. Shivora Collections ({adminDresses.length})</option>
                    <option value="offers" className="bg-[#111827]">📢 5. Store offers</option>
                    <option value="analytics" className="bg-[#111827]">📈 6. Weekly analysis</option>
                    <option value="upi_settings" className="bg-[#111827]">⚡ 7. UPI Gateway & QR Settings</option>
                  </select>
                </div>
              </div>

              {/* Click-Button Pills Row with Smooth Horizontal Scrolling */}
              <div className="px-3 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 scroll-smooth touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
                {/* 1. Live Inventory */}
                <button
                  id="admin-tab-inventory"
                  onClick={() => setActiveTab('inventory')}
                  className={`px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap shrink-0 border cursor-pointer ${
                    activeTab === 'inventory'
                      ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/25 font-black'
                      : 'bg-[#131D31] text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80 shadow-xs hover:border-slate-500'
                  }`}
                >
                  <Boxes className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${activeTab === 'inventory' ? 'text-slate-950' : 'text-cyan-400'}`} />
                  <span>1. Live Inventory</span>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                    activeTab === 'inventory' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {allLiveInventory.length}
                  </span>
                </button>

                {/* 2. Drop ship hub (Combines DeoDap Live Link, CSV Catalog, Dropship Suppliers) */}
                <button
                  id="admin-tab-dropship-hub"
                  onClick={() => setActiveTab('dropship_hub')}
                  className={`px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap shrink-0 border cursor-pointer ${
                    activeTab === 'dropship_hub'
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 text-slate-950 border-emerald-300 shadow-md shadow-emerald-500/25 font-black'
                      : 'bg-[#131D31] text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80 shadow-xs hover:border-slate-500'
                  }`}
                >
                  <Globe className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${activeTab === 'dropship_hub' ? 'text-slate-950' : 'text-emerald-400'}`} />
                  <span>2. Drop ship hub</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    activeTab === 'dropship_hub' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    3 In 1 Hub
                  </span>
                </button>

                {/* 3. Order Management Tab (Fulfillment & Orders) */}
                <button
                  id="admin-tab-orders"
                  onClick={() => setActiveTab('orders')}
                  className={`px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap shrink-0 border cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/25 font-black'
                      : 'bg-[#131D31] text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80 shadow-xs hover:border-slate-500'
                  }`}
                >
                  <Package className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${activeTab === 'orders' ? 'text-slate-950' : 'text-emerald-400'}`} />
                  <span>3. Order Management</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    activeTab === 'orders' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    Fulfillment ({orders.length})
                  </span>
                </button>

                {/* 4. Dress Boutique (Upload & Margins) */}
                <button
                  id="admin-tab-dresses"
                  onClick={() => setActiveTab('dresses')}
                  className={`px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap shrink-0 border cursor-pointer ${
                    activeTab === 'dresses'
                      ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 text-white border-pink-400 shadow-md font-black'
                      : 'bg-[#131D31] text-pink-300 hover:text-white hover:bg-slate-800 border-pink-500/40 shadow-xs hover:border-pink-400'
                  }`}
                >
                  <span className="text-base leading-none">👗</span>
                  <span>4. Shivora Collections</span>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                    activeTab === 'dresses' ? 'bg-slate-950/20 text-white font-black' : 'bg-pink-950/80 text-pink-300 border border-pink-800'
                  }`}>
                    {adminDresses.length}
                  </span>
                </button>

                {/* 5. Store offers */}
                <button
                  id="admin-tab-offers"
                  onClick={() => setActiveTab('offers')}
                  className={`px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap shrink-0 border cursor-pointer ${
                    activeTab === 'offers'
                      ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/25 font-black'
                      : 'bg-[#131D31] text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80 shadow-xs hover:border-slate-500'
                  }`}
                >
                  <Megaphone className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${activeTab === 'offers' ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span>5. Store offers</span>
                </button>

                {/* 6. Weekly analysis */}
                <button
                  id="admin-tab-analytics"
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap shrink-0 border cursor-pointer ${
                    activeTab === 'analytics'
                      ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/25 font-black'
                      : 'bg-[#131D31] text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80 shadow-xs hover:border-slate-500'
                  }`}
                >
                  <TrendingUp className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${activeTab === 'analytics' ? 'text-slate-950' : 'text-cyan-400'}`} />
                  <span>6. Weekly analysis</span>
                </button>

                {/* 7. UPI Payment Gateway & QR Settings */}
                <button
                  id="admin-tab-upi"
                  onClick={() => setActiveTab('upi_settings')}
                  className={`px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap shrink-0 border cursor-pointer ${
                    activeTab === 'upi_settings'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-md font-black'
                      : 'bg-[#131D31] text-emerald-300 hover:text-white hover:bg-slate-800 border-emerald-600/40 shadow-xs hover:border-emerald-500'
                  }`}
                >
                  <Smartphone className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${activeTab === 'upi_settings' ? 'text-slate-950' : 'text-emerald-400'}`} />
                  <span>7. UPI Gateway & QR</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENTS - Natural Page Touch & Wheel Scrolling */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 w-full touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
              {/* TAB 1: Analytics & Weekly Sales */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>7-Day Gross Sales</span>
                        <DollarSign className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="text-2xl font-black text-white mt-2">
                        {formatPrice(analytics?.totalRevenueUSD || 19280, currency)}
                      </div>
                      <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                        <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% vs previous week
                      </div>
                    </div>

                    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Dropship Orders</span>
                        <Package className="w-4 h-4 text-[#FF5A43]" />
                      </div>
                      <div className="text-2xl font-black text-white mt-2">
                        {analytics?.totalOrders || 83}
                      </div>
                      <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                        <ArrowUpRight className="w-3.5 h-3.5" /> 100% Stripe authorized
                      </div>
                    </div>

                    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Avg Order Value</span>
                        <TrendingUp className="w-4 h-4 text-[#FF5A43]" />
                      </div>
                      <div className="text-2xl font-black text-white mt-2">
                        {formatPrice(analytics?.avgOrderValueUSD || 232, currency)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Across multi-currency checkouts
                      </div>
                    </div>

                    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                      <div className="flex justify-between items-center text-slate-400 text-xs">
                        <span>Returning Customer Rate</span>
                        <Users className="w-4 h-4 text-[#FF5A43]" />
                      </div>
                      <div className="text-2xl font-black text-white mt-2">
                        {analytics?.returningCustomerRate || 34.8}%
                      </div>
                      <div className="text-[11px] text-emerald-400 mt-1">
                        High boutique repeat loyalty
                      </div>
                    </div>
                  </div>

                  {/* Weekly Sales Chart */}
                  <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-[#FF5A43]" />
                          Weekly Sales Trends & Daily Dropship Volume
                        </h3>
                        <p className="text-xs text-slate-400">
                          Daily gross revenue breakdown and customer orders
                        </p>
                      </div>

                      <button
                        onClick={fetchAnalytics}
                        className="text-xs bg-[#1E293B] hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#FF5A43]" /> Refresh
                      </button>
                    </div>

                    {/* Visual Bar Chart */}
                    <div className="pt-4 pb-2">
                      <div className="h-56 flex items-end gap-3 sm:gap-6 justify-between px-2 sm:px-6 border-b border-slate-800">
                        {(analytics?.weeklySales || []).map((sale, idx) => {
                          const maxRev = 5000;
                          const heightPct = Math.min(100, Math.max(15, (sale.revenueUSD / maxRev) * 100));

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                              {/* Hover Tooltip */}
                              <div className="absolute -top-12 bg-slate-900 border border-slate-700 text-white text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                {sale.day} ({sale.date}): {formatPrice(sale.revenueUSD, currency)} ({sale.orders} orders)
                              </div>

                              {/* Bar */}
                              <div className="w-full max-w-[40px] bg-slate-800/80 rounded-t-md relative flex items-end overflow-hidden h-44">
                                <div
                                  className="w-full bg-gradient-to-t from-[#0B1120] via-[#E04B36] to-[#FF5A43] rounded-t-md transition-all duration-500 group-hover:brightness-110"
                                  style={{ height: `${heightPct}%` }}
                                />
                              </div>

                              {/* Day Label */}
                              <span className="text-[11px] font-semibold text-slate-400 group-hover:text-white">
                                {sale.day}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Customer Regional Analytics & Supplier Performance */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* International Region Breakdown */}
                    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <Globe2 className="w-4 h-4 text-[#FF5A43]" />
                        International Shipping Customer Analytics
                      </h4>
                      <div className="space-y-3">
                        {(analytics?.regionalBreakdown || []).map((r, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-300">
                              <span>{r.country}</span>
                              <span className="text-slate-400 font-mono">
                                {r.orders} orders ({r.share}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#FF5A43] h-full rounded-full"
                                style={{ width: `${r.share}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Supplier Performance Metrics */}
                    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#FF5A43]" />
                        Supplier Fulfillment Reliability
                      </h4>
                      <div className="space-y-3 text-xs">
                        {(analytics?.supplierPerformance || []).map((s, i) => (
                          <div key={i} className="bg-[#0B1120] border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-white">{s.supplierName}</div>
                              <div className="text-[11px] text-slate-400">
                                {s.activeSKUs} active product lines synced
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-emerald-400 font-bold text-sm">
                                {s.onTimeRate}%
                              </span>
                              <div className="text-[10px] text-slate-400">On-Time Dispatch</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Real-Time Inventory Management */}
              {activeTab === 'inventory' && (
                <div className="space-y-4">
                  {/* Action Bar & Supplier Filter Bar */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between gap-3 items-stretch sm:items-center">
                      <div className="flex items-center gap-2 flex-1 max-w-md">
                        <div className="relative w-full">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Filter by title, SKU, or supplier..."
                            value={inventorySearch}
                            onChange={(e) => setInventorySearch(e.target.value)}
                            className="w-full bg-[#111827] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF5A43]"
                          />
                        </div>

                        <select
                          value={inventoryFilter}
                          onChange={(e: any) => setInventoryFilter(e.target.value)}
                          className="bg-[#111827] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF5A43]"
                        >
                          <option value="all">All Stock</option>
                          <option value="low">Low Stock Alerts Only</option>
                          <option value="healthy">Healthy Stock</option>
                        </select>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Sort by Supplier / Criteria Dropdown */}
                        <div className="flex items-center gap-1.5 bg-[#111827] border border-slate-700 rounded-lg px-2.5 py-1.5">
                          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
                            <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Sort:
                          </span>
                          <select
                            value={inventorySortBy}
                            onChange={(e: any) => setInventorySortBy(e.target.value)}
                            className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
                            title="Sort live inventory"
                          >
                            <option value="supplier_asc" className="bg-[#111827]">🏢 Supplier (A to Z)</option>
                            <option value="supplier_desc" className="bg-[#111827]">🏢 Supplier (Z to A)</option>
                            <option value="stock_asc" className="bg-[#111827]">⚠️ Stock: Low to High (Alerts)</option>
                            <option value="stock_desc" className="bg-[#111827]">📦 Stock: High to Low</option>
                            <option value="price_asc" className="bg-[#111827]">💵 Price: Low to High</option>
                            <option value="price_desc" className="bg-[#111827]">💎 Price: High to Low</option>
                            <option value="title_asc" className="bg-[#111827]">🔤 Product Title (A to Z)</option>
                          </select>
                        </div>

                        {/* Supplier Filter Dropdown */}
                        <div className="flex items-center gap-1.5 bg-[#111827] border border-slate-700 rounded-lg px-2.5 py-1.5">
                          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
                            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Supplier:
                          </span>
                          <select
                            value={supplierFilter}
                            onChange={(e) => setSupplierFilter(e.target.value)}
                            className="bg-transparent text-xs text-cyan-300 font-bold focus:outline-none cursor-pointer"
                          >
                            <option value="all" className="bg-[#111827]">All Suppliers ({allLiveInventory.length})</option>
                            {uniqueSuppliers.map((s) => (
                              <option key={s.key} value={s.key} className="bg-[#111827]">
                                {s.name} ({s.count})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* View Mode Toggle: Supplier-Wise Grouped vs Flat Table */}
                        <div className="flex items-center bg-[#111827] border border-slate-700 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => setInventoryViewMode('supplier-wise')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                              inventoryViewMode === 'supplier-wise'
                                ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="Group Products by Dropshipping Supplier"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Supplier-Wise</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setInventoryViewMode('table')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                              inventoryViewMode === 'table'
                                ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="Show Unified Inventory Table"
                          >
                            <List className="w-3.5 h-3.5" />
                            <span>Flat Table</span>
                          </button>
                        </div>

                        <button
                          id="add-new-product-btn"
                          onClick={() => setShowAddProductModal(true)}
                          className="bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                        >
                          <Plus className="w-4 h-4 text-slate-950" /> Add Product
                        </button>
                      </div>
                    </div>

                    {/* Dedicated Dynamic Supplier Filter Pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Filter className="w-3 h-3 text-cyan-400" /> Filter by Supplier:
                      </span>

                      <button
                        type="button"
                        onClick={() => setSupplierFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          supplierFilter === 'all'
                            ? 'bg-slate-800 text-white border border-slate-600 shadow-xs font-bold'
                            : 'bg-[#111827] text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <span>All Suppliers</span>
                        <span className="bg-slate-700 text-slate-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                          {allLiveInventory.length}
                        </span>
                      </button>

                      {uniqueSuppliers.map((sup) => {
                        const isSelected = supplierFilter.toLowerCase() === sup.key.toLowerCase();
                        return (
                          <button
                            key={sup.key}
                            type="button"
                            onClick={() => setSupplierFilter(isSelected ? 'all' : sup.key)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500 shadow-xs font-bold'
                                : 'bg-[#111827] text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <Building className="w-3 h-3 text-cyan-400" />
                            <span className="truncate max-w-[160px]">{sup.name}</span>
                            <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                              {sup.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* MODE 1: SUPPLIER-WISE GROUPED VIEW (Identifies products per supplier) */}
                  {inventoryViewMode === 'supplier-wise' ? (
                    <div className="space-y-6">
                      {supplierGroups
                        .filter((g) => supplierFilter === 'all' || g.key === supplierFilter)
                        .filter((g) => g.items.length > 0)
                        .map((group) => {
                          return (
                            <div
                              key={group.key}
                              id={`supplier-section-${group.key}`}
                              className={`bg-[#111827] border ${group.cardBorder} rounded-2xl overflow-hidden shadow-lg`}
                            >
                              {/* Supplier Header Box */}
                              <div className={`${group.headerBg} border-b border-slate-800 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3`}>
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${group.badgeBg}`}>
                                      <Building className="w-3 h-3" />
                                      {group.platform}
                                    </span>
                                    <h4 className="text-base font-bold text-white">
                                      {group.name}
                                    </h4>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                    <span>📍 {group.warehouse}</span>
                                    <span>•</span>
                                    <span>⚡ {group.leadTime}</span>
                                  </div>
                                </div>

                                {/* Supplier Summary Metrics & Quick Actions */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-center">
                                    <div className="text-[10px] text-slate-400 font-medium uppercase">SKUs</div>
                                    <div className="text-xs font-bold text-white">{group.items.length} Products</div>
                                  </div>

                                  <div className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-center">
                                    <div className="text-[10px] text-slate-400 font-medium uppercase">Total Stock</div>
                                    <div className="text-xs font-bold text-emerald-400">{group.totalStock.toLocaleString()} units</div>
                                  </div>

                                  <div className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-center">
                                    <div className="text-[10px] text-slate-400 font-medium uppercase">Avg Margin</div>
                                    <div className="text-xs font-bold text-cyan-400">+{group.avgMargin}%</div>
                                  </div>

                                  {group.website && (
                                    <a
                                      href={group.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" /> Portal
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Supplier Products Table */}
                              <div className="overflow-x-auto touch-pan-x touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-[#0B1120] text-slate-400 border-b border-slate-800">
                                      <th className="p-3">Product & SKU</th>
                                      <th className="p-3">Wholesale Cost</th>
                                      <th className="p-3">Retail Price</th>
                                      <th className="p-3">Gross Margin</th>
                                      <th className="p-3">Live Stock</th>
                                      <th className="p-3">Reorder Threshold</th>
                                      <th className="p-3 text-right">Stock & Restock Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/80">
                                    {group.items.map((prod) => {
                                      const isLow = prod.stock <= prod.reorderPoint;
                                      const margin = Math.round(((prod.priceUSD - prod.costUSD) / prod.priceUSD) * 100);
                                      const profitUSD = (prod.priceUSD - prod.costUSD).toFixed(2);
                                      const costINR = Math.round(prod.costUSD * 86.5);

                                      return (
                                        <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                                          <td className="p-3">
                                            <div className="flex items-center gap-2.5">
                                              <div className="relative pt-2.5 shrink-0">
                                                <div className="absolute top-0 inset-x-0 bg-slate-950/95 border border-cyan-500/60 text-[7.5px] font-black text-cyan-300 rounded px-1 py-0.2 text-center truncate max-w-[56px] shadow-xs" title={`Supplier: ${prod.supplierName || prod.supplierPlatform || 'Supplier'}`}>
                                                  {prod.supplierName ? (prod.supplierName.split(' ')[0] || 'Supplier') : (prod.supplierPlatform || 'Supplier')}
                                                </div>
                                                <img
                                                  src={prod.images[0]}
                                                  alt=""
                                                  referrerPolicy="no-referrer"
                                                  className="w-11 h-11 rounded-lg object-cover bg-slate-900 border border-slate-700/60 shrink-0"
                                                />
                                              </div>
                                              <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 max-w-[260px]">
                                                  <span className="font-semibold text-white truncate" title={prod.title}>
                                                    {prod.title}
                                                  </span>
                                                  {prod.isPublished === false && (
                                                    <span className="bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
                                                      Draft
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                                  <span className="text-[#FF5A43] font-bold">{prod.sku}</span>
                                                  <span>•</span>
                                                  <span>{prod.category}</span>
                                                  {prod.supplierLink && (
                                                    <a
                                                      href={prod.supplierLink}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-slate-400 hover:text-cyan-300 underline inline-flex items-center gap-0.5"
                                                    >
                                                      supplier item <ExternalLink className="w-2.5 h-2.5" />
                                                    </a>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </td>

                                          <td className="p-3">
                                            <div className="text-slate-300 font-semibold">
                                              {formatPrice(prod.costUSD, currency)}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono">
                                              ₹{costINR} INR
                                            </div>
                                          </td>

                                          <td className="p-3 font-semibold text-white">
                                            {formatPrice(prod.priceUSD, currency)}
                                          </td>

                                          <td className="p-3">
                                            <div className="font-bold text-emerald-400">
                                              +{margin}%
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                              +${profitUSD}/unit
                                            </div>
                                          </td>

                                          <td className="p-3">
                                            {isLow ? (
                                              <span className="inline-flex items-center gap-1 bg-amber-950/80 text-amber-300 border border-amber-700/80 px-2 py-0.5 rounded text-[11px] font-bold animate-pulse">
                                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                                {prod.stock} (Low Alert)
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                                                {prod.stock} units
                                              </span>
                                            )}
                                          </td>

                                          <td className="p-3 text-slate-400 font-mono">
                                            ≤ {prod.reorderPoint} (auto: +{prod.reorderQuantity})
                                          </td>

                                          <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                              {/* Decrement */}
                                              <button
                                                onClick={() => handleUpdateStock(prod.id, prod.stock - 1)}
                                                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                                                title="Decrease stock by 1"
                                              >
                                                -
                                              </button>
                                              {/* Increment */}
                                              <button
                                                onClick={() => handleUpdateStock(prod.id, prod.stock + 1)}
                                                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                                                title="Increase stock by 1"
                                              >
                                                +
                                              </button>
                                              {/* Trigger Restock PO */}
                                              <button
                                                onClick={() => handleTriggerManualRestock(prod.id, prod.reorderQuantity)}
                                                className="ml-2 bg-[#1E293B] hover:bg-[#FF5A43] hover:text-white text-slate-300 border border-slate-700 px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                                                title={`Send Restock PO to ${group.platform}`}
                                              >
                                                <Send className="w-3 h-3" /> PO
                                              </button>

                                              {/* Publish / Unpublish */}
                                              {prod.isPublished === false ? (
                                                <button
                                                  onClick={() => handlePublishProduct(prod.id)}
                                                  className="ml-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-2 py-1 rounded text-[10px] font-black shadow-sm flex items-center gap-1 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                                  title={`Publish to public storefront view with ${prod.marginPercent || 40}% margin`}
                                                >
                                                  <Eye className="w-3 h-3" /> Publish (+{prod.marginPercent || 40}%)
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => handleUnpublishProduct(prod.id)}
                                                  className="ml-2 text-[10px] text-slate-400 hover:text-rose-400 hover:underline cursor-pointer whitespace-nowrap"
                                                  title="Revert to Admin Staging"
                                                >
                                                  Unpublish
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    /* MODE 2: FLAT TABLE VIEW WITH CLEAR SUPPLIER BADGES */
                    <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-x-auto touch-pan-x touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#0B1120] text-slate-400 border-b border-slate-800">
                            <th className="p-3">Product & SKU</th>
                            <th className="p-3">Supplier Origin</th>
                            <th className="p-3">Retail Price</th>
                            <th className="p-3">Supplier Cost</th>
                            <th className="p-3">Margin</th>
                            <th className="p-3">Live Stock</th>
                            <th className="p-3">Reorder Point</th>
                            <th className="p-3 text-right">Quick Stock Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {filteredProducts
                            .filter((p) => {
                              if (supplierFilter === 'all') return true;
                              const s = (p.supplierName + ' ' + (p.supplierPlatform || '') + ' ' + p.sku).toLowerCase();
                              if (supplierFilter === 'deodap') return s.includes('deodap') || p.sku.startsWith('6') || p.sku.startsWith('27') || p.sku.startsWith('72');
                              if (supplierFilter === 'baapstore') return s.includes('baap');
                              if (supplierFilter === 'cj') return s.includes('cj');
                              return true;
                            })
                            .map((prod) => {
                              const isLow = prod.stock <= prod.reorderPoint;
                              const margin = Math.round(((prod.priceUSD - prod.costUSD) / prod.priceUSD) * 100);
                              const sLower = (prod.supplierName + ' ' + (prod.supplierPlatform || '') + ' ' + prod.sku).toLowerCase();
                              const isDeo = sLower.includes('deodap') || prod.sku.startsWith('6') || prod.sku.startsWith('27') || prod.sku.startsWith('72');
                              const isBaap = sLower.includes('baap');

                              return (
                                <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                                  <td className="p-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className="relative pt-2.5 shrink-0">
                                        <div className="absolute top-0 inset-x-0 bg-slate-950/95 border border-cyan-500/60 text-[7.5px] font-black text-cyan-300 rounded px-1 py-0.2 text-center truncate max-w-[56px] shadow-xs" title={`Supplier: ${prod.supplierName || prod.supplierPlatform || 'Supplier'}`}>
                                          {prod.supplierName ? (prod.supplierName.split(' ')[0] || 'Supplier') : (prod.supplierPlatform || 'Supplier')}
                                        </div>
                                        <img
                                          src={prod.images[0]}
                                          alt=""
                                          referrerPolicy="no-referrer"
                                          className="w-11 h-11 rounded-lg object-cover bg-slate-900 border border-slate-700/60 shrink-0"
                                        />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1.5 max-w-[220px]">
                                          <span className="font-semibold text-white truncate" title={prod.title}>
                                            {prod.title}
                                          </span>
                                          {prod.isPublished === false && (
                                            <span className="bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
                                              Draft
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                          {prod.sku} · {prod.category}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="p-3">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                        isDeo
                                          ? 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                                          : isBaap
                                          ? 'bg-sky-950/70 text-sky-300 border-sky-700/60'
                                          : 'bg-purple-950/70 text-purple-300 border-purple-700/60'
                                      }`}
                                    >
                                      <Building className="w-3 h-3" />
                                      {isDeo ? 'DeoDap Rajkot Depot' : isBaap ? 'Baapstore Chennai Hub' : 'CJdropshipping US/Global'}
                                    </span>
                                    <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                                      {prod.supplierName}
                                    </div>
                                  </td>

                                  <td className="p-3 font-semibold text-white">
                                    {formatPrice(prod.priceUSD, currency)}
                                  </td>

                                  <td className="p-3 text-slate-400">
                                    {formatPrice(prod.costUSD, currency)}
                                  </td>

                                  <td className="p-3 font-semibold text-emerald-400">
                                    +{margin}%
                                  </td>

                                  <td className="p-3">
                                    {isLow ? (
                                      <span className="inline-flex items-center gap-1 bg-amber-950/80 text-amber-300 border border-amber-700/80 px-2 py-0.5 rounded text-[11px] font-bold animate-pulse">
                                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                                        {prod.stock} (Low Alert)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                                        {prod.stock} units
                                      </span>
                                    )}
                                  </td>

                                  <td className="p-3 text-slate-400 font-mono">
                                    ≤ {prod.reorderPoint} (auto: +{prod.reorderQuantity})
                                  </td>

                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {/* Decrement */}
                                      <button
                                        onClick={() => handleUpdateStock(prod.id, prod.stock - 1)}
                                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                                        title="Decrease stock by 1"
                                      >
                                        -
                                      </button>
                                      {/* Increment */}
                                      <button
                                        onClick={() => handleUpdateStock(prod.id, prod.stock + 1)}
                                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                                        title="Increase stock by 1"
                                      >
                                        +
                                      </button>
                                      {/* Trigger Restock PO */}
                                      <button
                                        onClick={() => handleTriggerManualRestock(prod.id, prod.reorderQuantity)}
                                        className="ml-2 bg-[#1E293B] hover:bg-[#FF5A43] hover:text-white text-slate-300 border border-slate-700 px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                                        title="Dispatch Restock Purchase Order to Supplier"
                                      >
                                        <Send className="w-3 h-3" /> PO
                                      </button>

                                      {/* Publish / Unpublish */}
                                      {prod.isPublished === false ? (
                                        <button
                                          onClick={() => handlePublishProduct(prod.id)}
                                          className="ml-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-2 py-1 rounded text-[10px] font-black shadow-sm flex items-center gap-1 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                          title={`Publish to public storefront view with ${prod.marginPercent || 40}% margin`}
                                        >
                                          <Eye className="w-3 h-3" /> Publish (+{prod.marginPercent || 40}%)
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleUnpublishProduct(prod.id)}
                                          className="ml-2 text-[10px] text-slate-400 hover:text-rose-400 hover:underline cursor-pointer whitespace-nowrap"
                                          title="Revert to Admin Staging"
                                        >
                                          Unpublish
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}



              {/* TAB 5: Orders & Dropship Dispatch */}
              {activeTab === 'orders' && (
                <div className="space-y-5">
                  {/* Header & Actions Bar */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#111827] border border-slate-800 p-4 sm:p-5 rounded-2xl">
                    <div>
                      <h3 className="font-black text-base text-white flex flex-wrap items-center gap-2">
                        <span>Customer Orders & Live Fulfillment Requests</span>
                        <span className="text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-mono">
                          {orders.length} Total
                        </span>
                        <span className="text-xs bg-cyan-950/80 text-cyan-300 border border-cyan-800 px-2.5 py-0.5 rounded-full font-mono">
                          ₹{billSummaryMetrics.totalGrossBilledINR.toLocaleString('en-IN')} Billed
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Inspect customer requests, view shipping addresses, update live delivery tracking, view billing register, or export invoices.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                      <button
                        type="button"
                        onClick={handlePrintBillingRegister}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-slate-700"
                        title="Print Complete GST Billing Register"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Print Bill Register</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportBillSummaryCSV}
                        className="bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        title="Download GST Billing & Financial Summary Spreadsheet"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Bill Summary (CSV)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportOrdersCSV}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        title="Download all orders formatted for Delhivery / Shiprocket / FedEx logistics"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Orders (CSV)</span>
                      </button>
                    </div>
                  </div>

                  {/* 🧾 ORDERS BILL SUMMARY DASHBOARD */}
                  <div className="bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#0B1120] border border-cyan-900/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                            <span>Store Orders Bill & Revenue Financial Summary</span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                              GST Compliant
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Real-time billing register breakdown across all customer purchases settled via UPI.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowBillingRegisterTable(!showBillingRegisterTable)}
                          className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{showBillingRegisterTable ? 'Hide Billing Ledger' : 'View Billing Ledger'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Financial Metric Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {/* 1. Total Gross Billed */}
                      <div className="bg-[#111827]/90 border border-slate-800 p-3 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Total Gross Billed
                        </span>
                        <div className="text-base sm:text-lg font-black font-mono text-emerald-400">
                          ₹{billSummaryMetrics.totalGrossBilledINR.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          {billSummaryMetrics.totalOrdersCount} orders placed
                        </span>
                      </div>

                      {/* 2. Taxable Subtotal */}
                      <div className="bg-[#111827]/90 border border-slate-800 p-3 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Taxable Base (Goods)
                        </span>
                        <div className="text-base sm:text-lg font-black font-mono text-slate-200">
                          ₹{billSummaryMetrics.totalTaxableSubtotalINR.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Net pre-tax merchandise
                        </span>
                      </div>

                      {/* 3. GST (18%) Collected */}
                      <div className="bg-[#111827]/90 border border-slate-800 p-3 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Total GST (18%)
                        </span>
                        <div className="text-base sm:text-lg font-black font-mono text-cyan-400">
                          ₹{billSummaryMetrics.totalGSTINR.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          CGST ₹{billSummaryMetrics.cgstINR} | SGST ₹{billSummaryMetrics.sgstINR}
                        </span>
                      </div>

                      {/* 4. Courier & Shipping Billed */}
                      <div className="bg-[#111827]/90 border border-slate-800 p-3 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Shipping Charges
                        </span>
                        <div className="text-base sm:text-lg font-black font-mono text-amber-300">
                          ₹{billSummaryMetrics.totalShippingINR.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Express Delhivery / Air
                        </span>
                      </div>

                      {/* 5. UPI Collections */}
                      <div className="bg-[#111827]/90 border border-emerald-900/50 p-3 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block flex items-center gap-1">
                          <Smartphone className="w-3 h-3" /> 100% UPI Realized
                        </span>
                        <div className="text-base sm:text-lg font-black font-mono text-emerald-300">
                          ₹{billSummaryMetrics.upiPaidTotalINR.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-emerald-400/80 block">
                          {billSummaryMetrics.upiPaidCount} UPI receipts verified
                        </span>
                      </div>

                      {/* 6. Avg Order Value */}
                      <div className="bg-[#111827]/90 border border-slate-800 p-3 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Avg Bill Value (AOV)
                        </span>
                        <div className="text-base sm:text-lg font-black font-mono text-purple-300">
                          ₹{billSummaryMetrics.aovINR.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Per customer order
                        </span>
                      </div>
                    </div>

                    {/* Expandable Detailed Billing Register Table */}
                    {showBillingRegisterTable && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            Official Orders Billing Register & Tax Invoices ({orders.length} records)
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Entity: Kovira Commerce Pvt. Ltd. (GSTIN: 27AABCK9876Q1Z8)
                          </span>
                        </div>

                        <div className="border border-slate-800 rounded-xl overflow-x-auto touch-pan-x touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-[#0B1120] text-slate-300 text-[10px] uppercase font-bold border-b border-slate-800">
                              <tr>
                                <th className="p-2.5">Invoice #</th>
                                <th className="p-2.5">Date</th>
                                <th className="p-2.5">Customer & City</th>
                                <th className="p-2.5 text-center">Items</th>
                                <th className="p-2.5 text-right">Taxable (₹)</th>
                                <th className="p-2.5 text-right">CGST (9%)</th>
                                <th className="p-2.5 text-right">SGST (9%)</th>
                                <th className="p-2.5 text-right">Shipping</th>
                                <th className="p-2.5 text-right font-black">Grand Total</th>
                                <th className="p-2.5 text-center">Payment</th>
                                <th className="p-2.5 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-[11px]">
                              {orders.map((ord) => {
                                const isOrdINR = ord.currency === 'INR';
                                const getOrdINR = (v: number) => Math.round(isOrdINR ? v : convertPrice(v, 'INR'));
                                const ordTotal = getOrdINR(ord.total);
                                const ordShipping = ord.shipping ? getOrdINR(ord.shipping) : 0;
                                const ordTaxable = Math.round((ordTotal - ordShipping) / 1.18);
                                const ordGst = Math.max(0, ordTotal - ordShipping - ordTaxable);
                                const ordCgst = Math.round(ordGst / 2);
                                const ordSgst = ordGst - ordCgst;
                                const invNum = `INV-KOV-${ord.orderNumber.replace(/[^0-9]/g, '')}`;

                                return (
                                  <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="p-2.5 font-mono font-bold text-cyan-400">
                                      <div>{invNum}</div>
                                      <div className="text-[10px] text-slate-500">#{ord.orderNumber}</div>
                                    </td>
                                    <td className="p-2.5 text-slate-400 text-[10px] whitespace-nowrap">
                                      {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </td>
                                    <td className="p-2.5">
                                      <div className="font-bold text-white">{ord.customer?.name || 'Customer'}</div>
                                      <div className="text-[10px] text-slate-400">{ord.customer?.city || 'India'}</div>
                                    </td>
                                    <td className="p-2.5 text-center font-mono font-bold text-slate-300">
                                      {ord.items.reduce((s, it) => s + it.quantity, 0)}
                                    </td>
                                    <td className="p-2.5 text-right font-mono text-slate-200">
                                      ₹{ordTaxable.toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-2.5 text-right font-mono text-slate-400">
                                      ₹{ordCgst.toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-2.5 text-right font-mono text-slate-400">
                                      ₹{ordSgst.toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-2.5 text-right font-mono text-emerald-400">
                                      {ordShipping > 0 ? `₹${ordShipping.toLocaleString('en-IN')}` : 'FREE'}
                                    </td>
                                    <td className="p-2.5 text-right font-mono font-black text-emerald-300">
                                      ₹{ordTotal.toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                        <Check className="w-2.5 h-2.5" /> UPI PAID
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedInvoiceOrder(ord)}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                        title="View & Print Official GST Tax Invoice"
                                      >
                                        <Printer className="w-3 h-3" />
                                        <span>Print Bill</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filter and Search Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0B1120] border border-slate-800 p-3 rounded-xl">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search by Order #, Customer, Email, City..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="w-full bg-[#111827] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto text-xs">
                      {['all', 'Order Placed', 'Dispatched', 'In Transit', 'Delivered'].map((statusKey) => (
                        <button
                          key={statusKey}
                          type="button"
                          onClick={() => setOrderStatusFilter(statusKey)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            orderStatusFilter === statusKey
                              ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {statusKey === 'all' ? 'All Orders' : statusKey}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Double Click Tip Banner */}
                  <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-2xl px-4 py-3 text-xs text-cyan-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-md">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        <strong>Interactive Order List View:</strong> Double-click any order row to view full details (customer information, ordered items, shipping address, live tracking update, and packing slip).
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-lg border border-cyan-800/80 self-start sm:self-auto shrink-0">
                      ⚡ Double-Click Row = Full Details
                    </span>
                  </div>

                  {/* Orders Interactive List View Table */}
                  <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#0B1120] border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                            <th className="p-3.5 whitespace-nowrap">Order # / Inv</th>
                            <th className="p-3.5 whitespace-nowrap">Date & Time</th>
                            <th className="p-3.5 whitespace-nowrap">Customer & City</th>
                            <th className="p-3.5 whitespace-nowrap">Phone</th>
                            <th className="p-3.5 whitespace-nowrap">Items</th>
                            <th className="p-3.5 text-right whitespace-nowrap">Total (₹)</th>
                            <th className="p-3.5 text-center whitespace-nowrap">Payment</th>
                            <th className="p-3.5 text-center whitespace-nowrap">Fulfillment Status</th>
                            <th className="p-3.5 whitespace-nowrap">Carrier & Tracking</th>
                            <th className="p-3.5 text-center whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 text-xs">
                          {orders
                            .filter((ord) => {
                              if (orderStatusFilter !== 'all') {
                                if (!ord.fulfillmentStatus?.toLowerCase().includes(orderStatusFilter.toLowerCase())) {
                                  return false;
                                }
                              }
                              if (orderSearch.trim()) {
                                const query = orderSearch.toLowerCase();
                                const matchesNumber = ord.orderNumber.toLowerCase().includes(query);
                                const matchesName = (ord.customer?.name || '').toLowerCase().includes(query);
                                const matchesEmail = (ord.customer?.email || '').toLowerCase().includes(query);
                                const matchesCity = (ord.customer?.city || '').toLowerCase().includes(query);
                                const matchesTracking = (ord.trackingNumber || '').toLowerCase().includes(query);
                                return matchesNumber || matchesName || matchesEmail || matchesCity || matchesTracking;
                              }
                              return true;
                            })
                            .map((ord) => {
                              const isOrdINR = ord.currency === 'INR';
                              const getOrdINR = (v: number) => Math.round(isOrdINR ? v : convertPrice(v, 'INR'));
                              const ordTotal = getOrdINR(ord.total);
                              const invNum = `INV-KOV-${ord.orderNumber.replace(/[^0-9]/g, '')}`;
                              const totalItems = ord.items.reduce((s, it) => s + it.quantity, 0);
                              const cleanPhone = (ord.customer?.phone || '').replace(/[^0-9]/g, '');

                              return (
                                <tr
                                  key={ord.id}
                                  onDoubleClick={() => setSelectedDetailOrder(ord)}
                                  className="hover:bg-slate-800/60 border-b border-slate-800/80 transition-colors cursor-pointer group select-none"
                                  title="💡 Double-click this order to view full details"
                                >
                                  {/* Order & Invoice */}
                                  <td className="p-3.5 font-mono">
                                    <div className="font-black text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1.5">
                                      <span>#{ord.orderNumber}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{invNum}</div>
                                  </td>

                                  {/* Date & Time */}
                                  <td className="p-3.5 text-slate-300 whitespace-nowrap">
                                    <div>
                                      {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      {new Date(ord.createdAt).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </div>
                                  </td>

                                  {/* Customer & City */}
                                  <td className="p-3.5">
                                    <div className="font-bold text-white group-hover:text-cyan-200 transition-colors">
                                      {ord.customer?.name || 'Customer'}
                                    </div>
                                    <div className="text-[11px] text-slate-400">{ord.customer?.city || 'India'}</div>
                                  </td>

                                  {/* Phone */}
                                  <td className="p-3.5 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                                    <div>{ord.customer?.phone || 'N/A'}</div>
                                    {cleanPhone && (
                                      <a
                                        href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(ord.customer?.name || '')},%20regarding%20your%20Kovira%20Order%20${ord.orderNumber}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:underline mt-0.5"
                                      >
                                        <span>WhatsApp</span>
                                      </a>
                                    )}
                                  </td>

                                  {/* Items Thumbnails & Count */}
                                  <td className="p-3.5">
                                    <div className="flex items-center gap-2">
                                      <div className="flex -space-x-2 overflow-hidden">
                                        {ord.items.slice(0, 3).map((it, i) => (
                                          <img
                                            key={i}
                                            src={it.image || 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=200'}
                                            alt={it.title}
                                            className="inline-block w-7 h-7 rounded-lg object-cover ring-2 ring-slate-900"
                                            title={it.title}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-[11px] font-bold text-slate-300 font-mono">
                                        {totalItems} {totalItems === 1 ? 'item' : 'items'}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Total Price INR */}
                                  <td className="p-3.5 text-right font-mono font-black text-sm text-emerald-300 whitespace-nowrap">
                                    ₹{ordTotal.toLocaleString('en-IN')}
                                  </td>

                                  {/* Payment Mode */}
                                  <td className="p-3.5 text-center whitespace-nowrap">
                                    <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                      <Check className="w-2.5 h-2.5" /> 100% UPI PAID
                                    </span>
                                  </td>

                                  {/* Fulfillment Status Dropdown */}
                                  <td className="p-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <select
                                      value={ord.fulfillmentStatus || 'Order Placed'}
                                      onChange={(e) => {
                                        const newSt = e.target.value;
                                        handleUpdateOrderStatus(ord.id, newSt, ord.trackingNumber, ord.carrier);
                                      }}
                                      className={`text-[11px] px-2.5 py-1 rounded-xl font-bold border transition-colors cursor-pointer focus:outline-none ${
                                        ord.fulfillmentStatus?.includes('Delivered')
                                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                                          : ord.fulfillmentStatus?.includes('Transit') || ord.fulfillmentStatus?.includes('Shipping')
                                          ? 'bg-blue-950 text-blue-300 border-blue-700'
                                          : ord.fulfillmentStatus?.includes('Dispatched')
                                          ? 'bg-purple-950 text-purple-300 border-purple-700'
                                          : ord.fulfillmentStatus?.includes('Processing') || ord.fulfillmentStatus?.includes('Under Process')
                                          ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                                          : ord.fulfillmentStatus?.includes('Accepted')
                                          ? 'bg-teal-950 text-teal-300 border-teal-700'
                                          : 'bg-amber-950 text-amber-300 border-amber-700'
                                      }`}
                                    >
                                      <option value="Accepted (Order Accepted)" className="bg-slate-900 text-teal-300">Accepted</option>
                                      <option value="Under Process (Processing)" className="bg-slate-900 text-cyan-300">Under Process</option>
                                      <option value="Shipping (In Transit)" className="bg-slate-900 text-blue-300">Shipping / In Transit</option>
                                      <option value="Delivered" className="bg-slate-900 text-emerald-300">Delivered</option>
                                      <option value="Cancelled" className="bg-slate-900 text-rose-300">Cancelled</option>
                                    </select>
                                  </td>

                                  {/* Carrier & Tracking Input with Live Customer Tracking Link */}
                                  <td className="p-3.5 text-slate-300 text-[11px] whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col gap-1 max-w-[200px]">
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="text"
                                          placeholder="Enter AWB #"
                                          defaultValue={ord.trackingNumber || ''}
                                          onBlur={(e) => {
                                            const val = e.target.value.trim();
                                            if (val !== (ord.trackingNumber || '')) {
                                              handleUpdateOrderStatus(ord.id, ord.fulfillmentStatus || 'Shipping (In Transit)', val, ord.carrier || 'Delhivery Express');
                                            }
                                          }}
                                          className="w-32 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-2 py-0.5 text-[11px] text-cyan-300 font-mono focus:outline-none"
                                          title="Enter courier tracking number (press Tab to save)"
                                        />
                                      </div>
                                      {ord.trackingNumber && (
                                        <div className="flex items-center gap-1.5 text-[10px]">
                                          <span className="text-slate-400">{ord.carrier || 'Delhivery'}</span>
                                          <a
                                            href={
                                              ord.trackingUrl ||
                                              (ord.carrier?.toLowerCase().includes('blue dart')
                                                ? `https://www.bluedart.com/tracking?handler=trak&action=custtracking&trackNumber=${ord.trackingNumber}`
                                                : `https://www.delhivery.com/track/package/${ord.trackingNumber}`)
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-cyan-400 hover:text-cyan-300 font-mono underline flex items-center gap-0.5"
                                            title="Open customer live tracking link in new tab"
                                          >
                                            <span>Track Link</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* Actions */}
                                  <td className="p-3.5 text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedDetailOrder(ord)}
                                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                        title="View Full Order Details"
                                      >
                                        <Eye className="w-3 h-3 text-slate-950" />
                                        <span>Details</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedInvoiceOrder(ord)}
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-2 py-1 rounded-lg text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer border border-slate-700"
                                        title="Print Official GST Tax Bill"
                                      >
                                        <Printer className="w-3 h-3 text-emerald-400" />
                                        <span>Bill</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {orders.length === 0 && (
                      <div className="p-10 text-center text-slate-400 space-y-2">
                        <Package className="w-10 h-10 text-slate-600 mx-auto" />
                        <div className="text-sm font-bold text-white">No Customer Orders Yet</div>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          When shoppers place orders using UPI checkout, they will immediately appear here in this list view with complete shipping details and item breakdowns.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: UPI Payment Gateway & QR Receiver Configuration */}
              {activeTab === 'upi_settings' && (
                <div className="space-y-6">
                  {/* Top Notification / Banner */}
                  <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-[#111827] border border-emerald-500/40 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Smartphone className="w-5 h-5" />
                        </span>
                        <h3 className="font-black text-base text-white">
                          Exclusive UPI Payment Gateway & Receiver Configuration
                        </h3>
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Active & Operational
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 max-w-2xl">
                        All other payment options (COD, Cards) have been removed from the storefront. Customer purchases are routed exclusively via UPI using <strong>QR Scanner</strong>, <strong>Typing UPI ID</strong>, or <strong>1-Click App Launch Links</strong> directly into your verified bank account.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Platform Commission</span>
                        <span className="text-emerald-400 font-black text-sm">0.0% (Zero MDR)</span>
                      </div>
                    </div>
                  </div>

                  {savedUpiNotice && (
                    <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
                      <div className="flex items-center gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Receiver UPI details saved! All customer checkout QR codes and links are updated immediately.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSavedUpiNotice(false)}
                        className="text-emerald-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Main Grid: Settings & Live Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Receiver UPI Setup Form */}
                    <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-5">
                      <div className="border-b border-slate-800 pb-3">
                        <h4 className="font-bold text-sm text-white flex items-center gap-2">
                          <Settings className="w-4 h-4 text-emerald-400" />
                          <span>1. Merchant Receiving Account Settings</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Specify where payments should be credited. You can use your personal or business UPI ID (Google Pay, PhonePe, Paytm, BHIM, Bank).
                        </p>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!merchantUpiId.trim() || !merchantUpiId.includes('@')) {
                            alert('Please enter a valid UPI ID (e.g. yourbusiness@okaxis)');
                            return;
                          }
                          const cleanId = merchantUpiId.trim();
                          const cleanName = merchantName.trim() || 'Kovira Store';
                          setMerchantUpiId(cleanId);
                          setMerchantName(cleanName);
                          localStorage.setItem('kovira_receiver_upi_id', cleanId);
                          localStorage.setItem('kovira_receiver_name', cleanName);
                          setSavedUpiNotice(true);
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Receiving UPI ID / VPA <span className="text-rose-400">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={merchantUpiId}
                              onChange={(e) => {
                                setMerchantUpiId(e.target.value);
                                setSavedUpiNotice(false);
                              }}
                              placeholder="e.g. kovira.store@okaxis, 9876543210@paytm, or shop@ybl"
                              className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-400 focus:bg-[#131d31]"
                            />
                            <Smartphone className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            This UPI ID is encoded into every customer order QR code and deeplink.
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Merchant / Payee Name <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={merchantName}
                            onChange={(e) => {
                              setMerchantName(e.target.value);
                              setSavedUpiNotice(false);
                            }}
                            placeholder="e.g. Kovira Store or Shivora Collections"
                            className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-400"
                          />
                          <span className="text-[10px] text-slate-500 block mt-1">
                            Shown on the customer's UPI app (Google Pay, PhonePe) as the verified recipient.
                          </span>
                        </div>

                        {/* Quick Presets for Demo / Testing */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] text-slate-400 font-semibold block">Quick Test Handles:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: 'Kovira Official UPI', id: '9656850012@upi', name: 'Kovira Store' },
                              { label: 'Shivora Boutique HDFC', id: 'shivora.fashion@okhdfcbank', name: 'Shivora Collections' },
                              { label: 'Paytm Merchant Hub', id: 'koviraretail@paytm', name: 'Kovira Retail LLP' },
                              { label: 'SBI BHIM Priority', id: 'kovira.orders@oksbi', name: 'Kovira India' },
                            ].map((preset) => (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => {
                                  setMerchantUpiId(preset.id);
                                  setMerchantName(preset.name);
                                  localStorage.setItem('kovira_receiver_upi_id', preset.id);
                                  localStorage.setItem('kovira_receiver_name', preset.name);
                                  setSavedUpiNotice(true);
                                }}
                                className="text-[10px] bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setMerchantUpiId('9656850012@upi');
                              setMerchantName('Kovira Store');
                              localStorage.setItem('kovira_receiver_upi_id', '9656850012@upi');
                              localStorage.setItem('kovira_receiver_name', 'Kovira Store');
                              setSavedUpiNotice(true);
                            }}
                            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            Reset Default (9656850012@upi)
                          </button>

                          <button
                            type="submit"
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Save UPI Receiver Settings</span>
                          </button>
                        </div>
                      </form>

                      {/* Summary of Convenient Options Implemented */}
                      <div className="p-4 bg-[#0B1120] border border-slate-800 rounded-xl space-y-2 text-xs">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-emerald-400" />
                          <span>Customer Options Active in Checkout:</span>
                        </div>
                        <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
                          <li>
                            <strong className="text-white">Option 1 (Scanner):</strong> High-definition dynamic UPI QR Code automatically generated with exact order amount, receiver UPI ID, and order note.
                          </li>
                          <li>
                            <strong className="text-white">Option 2 (Typing UPI ID):</strong> Customer enters personal VPA with instant bank suffix chips (@okaxis, @paytm, @ybl) & optional UTR reference tracking.
                          </li>
                          <li>
                            <strong className="text-white">Option 3 (Click Link Opens App):</strong> 1-click intent deeplinks launch GPay, PhonePe, Paytm, or BHIM directly on mobile devices with zero typing.
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Right Column: Live Interactive Preview */}
                    <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h4 className="font-bold text-sm text-white flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-emerald-400" />
                            <span>2. Live Interactive Customer Preview</span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Real-time test of the QR code and deep-links generated for your current settings.
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">Test Amount:</span>
                          <div className="flex items-center bg-[#0B1120] border border-slate-700 rounded-lg px-2 py-1 text-xs">
                            <span className="text-slate-400 mr-1">₹</span>
                            <input
                              type="number"
                              value={adminTestAmount}
                              onChange={(e) => setAdminTestAmount(e.target.value)}
                              className="w-16 bg-transparent text-white font-mono font-bold focus:outline-none text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Stylized QR Card */}
                      {(() => {
                        const amt = Math.max(1, Number(adminTestAmount) || 1499);
                        const testDeeplink = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${amt}&cu=INR&tn=${encodeURIComponent('Kovira Store Test Order')}`;
                        const testQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(testDeeplink)}`;

                        return (
                          <div className="space-y-4">
                            <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 text-slate-900 shadow-md">
                              {/* QR Box */}
                              <div className="relative p-2 bg-white border-2 border-slate-900 rounded-2xl shrink-0 shadow-sm flex flex-col items-center">
                                <img
                                  src={testQrUrl}
                                  alt="Merchant Test UPI QR Code"
                                  className="w-32 h-32 object-contain"
                                />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                                  <div className="w-7 h-7 bg-slate-950 text-white rounded-lg flex items-center justify-center text-xs font-black border-2 border-white shadow-md">
                                    ₹
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 pt-1">Scan & Pay ₹{amt}</span>
                              </div>

                              <div className="space-y-2 text-xs flex-1 text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                                  <span className="font-extrabold text-sm text-slate-900">{merchantName}</span>
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                    Verified
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-600 bg-slate-100 p-2 rounded-xl font-mono flex items-center justify-between">
                                  <span>{merchantUpiId}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(merchantUpiId);
                                      setCopiedAdminUpi(true);
                                      setTimeout(() => setCopiedAdminUpi(false), 2000);
                                    }}
                                    className="text-emerald-700 hover:text-emerald-900 font-bold text-[10px] cursor-pointer"
                                  >
                                    {copiedAdminUpi ? 'Copied!' : 'Copy'}
                                  </button>
                                </div>

                                <p className="text-[11px] text-slate-500">
                                  Scan using Google Pay, PhonePe, Paytm, BHIM, CRED or open directly via intent link.
                                </p>

                                <div className="pt-1 flex flex-wrap gap-1">
                                  {['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'CRED'].map((app) => (
                                    <span key={app} className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                                      {app}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Direct Intent Launch Buttons */}
                            <div className="space-y-2">
                              <span className="text-[11px] font-bold text-slate-400 block">
                                Test 1-Click Intent Links (Opens UPI App):
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                <a
                                  href={testDeeplink}
                                  className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-center text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                  <span>Launch Default UPI App</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(testDeeplink);
                                    setCopiedAdminUpiLink(true);
                                    setTimeout(() => setCopiedAdminUpiLink(false), 2000);
                                  }}
                                  className="p-2.5 bg-[#0B1120] hover:bg-slate-800 border border-slate-700 text-white rounded-xl text-center text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  {copiedAdminUpiLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedAdminUpiLink ? 'Link Copied!' : 'Copy Deeplink'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: Dropshipping Hub & Catalog Linking */}
              {/* TAB 2: Unified Drop ship hub (DeoDap Live Link, CSV Catalog Link, Dropship Suppliers) */}
              {activeTab === 'dropship_hub' && (
                <div className="space-y-6">
                  {/* Top Hub Header Banner with Sub-Navigation Tabs */}
                  <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <Globe className="w-4 h-4" />
                          </div>
                          <h2 className="text-base sm:text-lg font-black text-white font-['Outfit',sans-serif]">
                            Drop Ship Hub
                          </h2>
                          <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
                            Unified Supply Center
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                          All-in-one dropshipping command center: paste single or full-page web links from DeoDap to upload directly to store, sync CSV catalog links, and manage supplier partner channels.
                        </p>
                      </div>

                      <button
                        onClick={() => setActiveTab('inventory')}
                        className="px-3 py-1.5 bg-[#0B1120] hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-bold rounded-xl flex items-center gap-2 self-start md:self-auto cursor-pointer transition-all active:scale-95"
                      >
                        <Boxes className="w-4 h-4 text-cyan-400" />
                        <span>Show in Live Inventory ({allLiveInventory.length})</span>
                      </button>
                    </div>

                    {/* Sub-Tab Navigation Bar */}
                    <div className="flex items-center gap-2 border-t border-slate-800 pt-3 overflow-x-auto scrollbar-thin">
                      <button
                        type="button"
                        onClick={() => setDropshipSubTab('live_link')}
                        className={`px-3.5 sm:px-4 py-2 text-xs sm:text-sm rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                          dropshipSubTab === 'live_link'
                            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 text-slate-950 border-emerald-300 shadow-md font-black'
                            : 'bg-[#0B1120] text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80'
                        }`}
                      >
                        <Link className="w-4 h-4" />
                        <span>1. Web link paste and upload</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          dropshipSubTab === 'live_link' ? 'bg-slate-950/25 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                        }`}>
                          Auto Supplier & Margin
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDropshipSubTab('csv_catalog')}
                        className={`px-3.5 sm:px-4 py-2 text-xs sm:text-sm rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                          dropshipSubTab === 'csv_catalog'
                            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 text-slate-950 border-emerald-300 shadow-md font-black'
                            : 'bg-[#0B1120] text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80'
                        }`}
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>2. CSV Catalog Link</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          dropshipSubTab === 'csv_catalog' ? 'bg-slate-950/25 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                        }`}>
                          Bulk Feed
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDropshipSubTab('suppliers')}
                        className={`px-3.5 sm:px-4 py-2 text-xs sm:text-sm rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                          dropshipSubTab === 'suppliers'
                            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 text-slate-950 border-emerald-300 shadow-md font-black'
                            : 'bg-[#0B1120] text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80'
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                        <span>3. Dropship Suppliers</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          dropshipSubTab === 'suppliers' ? 'bg-slate-950/25 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {suppliers.length} Partners
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-Tab 1: DeoDap Live Link (Paste & Upload Single / Full Page) */}
                  {dropshipSubTab === 'live_link' && (
                    <DeoDapDirectLinkManager
                      currency={currency}
                      onRefreshData={onRefreshData}
                    />
                  )}

                  {/* Sub-Tab 2: CSV Catalog Link (File & Link Feeds) */}
                  {dropshipSubTab === 'csv_catalog' && (
                    <div className="space-y-6">
                      <CSVInventoryManager
                        onCatalogUploaded={(importedProducts) => {
                          onRefreshData();
                          showNotification(`Successfully uploaded and synced ${importedProducts.length} CSV products to store catalog!`);
                        }}
                        onNavigateToInventoryWithSupplier={(supKey) => {
                          setActiveTab('inventory');
                          setSupplierFilter(supKey as any);
                        }}
                      />
                    </div>
                  )}

                  {/* Sub-Tab 3: Dropship Suppliers (Directory + Integration Hub) */}
                  {dropshipSubTab === 'suppliers' && (
                    <div className="space-y-6">
                      {/* Connected Suppliers Directory Header */}
                      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="font-bold text-sm text-white flex items-center gap-2">
                            <Building className="w-4 h-4 text-emerald-400" />
                            Connected Dropshipping Supplier Network
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Active fulfillment partners with automated dispatch hooks and live inventory synchronization
                          </p>
                        </div>

                        <button
                          id="add-supplier-btn"
                          onClick={() => setShowAddSupplierModal(true)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 shrink-0"
                        >
                          <Plus className="w-4 h-4" /> Add New Supplier
                        </button>
                      </div>

                      {/* Supplier Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {suppliers.map((sup) => (
                          <div
                            key={sup.id}
                            className="bg-[#111827] border border-slate-800 rounded-2xl p-4 space-y-3"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-sm text-white">{sup.name}</h4>
                                <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Globe2 className="w-3.5 h-3.5 text-emerald-400" /> {sup.country} · Lead Time: {sup.leadTimeDays} days
                                </span>
                              </div>

                              <span className="text-[10px] bg-slate-800 text-emerald-300 border border-emerald-800/50 px-2 py-0.5 rounded font-mono font-bold">
                                {sup.fulfillmentMethod}
                              </span>
                            </div>

                            <div className="bg-[#0B1120] rounded-xl p-3 text-xs text-slate-300 space-y-1.5 border border-slate-800/70">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Contact Person:</span>
                                <span className="font-medium text-white">{sup.contactPerson}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">PO Email:</span>
                                <a href={`mailto:${sup.email}`} className="text-emerald-400 hover:underline font-mono text-[11px]">
                                  {sup.email}
                                </a>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Phone Hotline:</span>
                                <span className="font-mono text-slate-300">{sup.phone}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Active SKUs:</span>
                                <span className="font-bold text-cyan-300">{sup.activeProductsCount} products</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Multi-Supplier Platform Connectors & Catalog Importer */}
                      <MultiSupplierDropshipHub
                        currency={currency}
                        onProductImported={(newProd) => {
                          onRefreshData();
                          showNotification(`Imported "${newProd.title}" successfully into Kovira store!`);
                        }}
                        onNavigateToInventory={() => setActiveTab('inventory')}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: Offers & Announcements Management */}
              {activeTab === 'offers' && (
                <div className="space-y-6">
                  <AdminAnnouncementManager
                    products={allLiveInventory}
                    onRefreshData={onRefreshData}
                  />
                </div>
              )}

              {/* TAB 8c: Dress Boutique & Apparel Catalog Manager */}
              {activeTab === 'dresses' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[#111827] border border-slate-800 p-5 rounded-2xl">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">👗</span>
                        <h3 className="font-black text-base sm:text-lg text-white font-['Outfit',sans-serif]">
                          Dress Boutique & Apparel Management
                        </h3>
                        <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-bold px-2 py-0.5 rounded-full">
                          {adminDresses.length} Dresses
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 max-w-xl">
                        Add and manage dresses with click / drag & drop photo upload, 40% margin calculation, and highlighted discount badges on product thumbnails.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingAdminDress(null);
                        setShowDressUploadModal(true);
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-cyan-400 hover:from-pink-400 hover:to-cyan-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4 text-slate-950" />
                      <span>Add Dress (Click / Drag & Drop)</span>
                    </button>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                      <div className="text-slate-400 text-xs font-medium">Boutique Inventory</div>
                      <div className="text-2xl font-black text-white mt-1">{adminDresses.length} Styles</div>
                      <div className="text-[11px] text-pink-400 mt-1">Shivora Collections</div>
                    </div>

                    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                      <div className="text-slate-400 text-xs font-medium">Auto-Retention</div>
                      <div className="text-2xl font-black text-amber-400 mt-1">90 Days</div>
                      <div className="text-[11px] text-slate-400 mt-1">Auto-removes from portal</div>
                    </div>

                    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                      <div className="text-slate-400 text-xs font-medium">Margin Configuration</div>
                      <div className="text-2xl font-black text-cyan-400 mt-1">40% Margin</div>
                      <div className="text-[11px] text-slate-400 mt-1">Added to base cost price</div>
                    </div>

                    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                      <div className="text-slate-400 text-xs font-medium">Delivery Charge</div>
                      <div className="text-2xl font-black text-emerald-400 mt-1">₹80/-</div>
                      <div className="text-[11px] text-slate-400 mt-1">Added at cart & checkout time</div>
                    </div>

                    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                      <div className="text-slate-400 text-xs font-medium">Boutique Catalog</div>
                      <div className="text-2xl font-black text-white mt-1">{adminDresses.length} Outfits</div>
                      <div className="text-[11px] text-cyan-400 mt-1">Live in Shivora boutique</div>
                    </div>
                  </div>

                  {/* Dresses Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {adminDresses.map((dress) => (
                      <div
                        key={dress.id}
                        className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between p-4 space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Thumbnail with highlighted discount badge */}
                          <div className="relative aspect-3/4 rounded-xl overflow-hidden bg-slate-950">
                            <img
                              src={dress.images[0] || '/assets/dresses/partywear_gown_1_1791385855095.jpg'}
                              alt={dress.title}
                              className="w-full h-full object-cover object-top"
                            />
                            {dress.showDiscount && dress.discountPercent > 0 && (
                              <span className="absolute top-2 left-2 bg-rose-600 text-white font-black text-[11px] px-2.5 py-1 rounded-lg shadow-md animate-pulse">
                                {dress.discountPercent}% OFF SPECIAL DEAL
                              </span>
                            )}
                            <span className="absolute bottom-2 left-2 bg-slate-950/80 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/30">
                              🚚 ₹80 at cart & checkout
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                                {dress.category}
                              </span>
                              <span className="text-[11px] font-mono text-cyan-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {dress.designCode ? `Code: ${dress.designCode}` : dress.sku}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-white line-clamp-2">
                              {dress.title}
                            </h4>
                            {dress.material && (
                              <div className="text-[11px] text-slate-300 font-medium">
                                <span className="text-slate-400">Fabric: </span>
                                <span className="text-white font-semibold">{dress.material}</span>
                              </div>
                            )}
                          </div>

                          {/* 90-Day Retention Notice */}
                          <div className="flex items-center justify-between text-[11px] bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800">
                            <span className="text-slate-400">90-Day Portal Retention:</span>
                            <span className="text-amber-400 font-bold font-mono">
                              ⏳ {dress.daysRemaining ?? 90} days remaining
                            </span>
                          </div>

                          {/* Pricing breakdown */}
                          <div className="bg-[#0B1120] p-3 rounded-xl space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-400">
                              <span>Base Cost Price:</span>
                              <span className="font-mono text-white">₹{dress.baseCostINR}</span>
                            </div>
                            <div className="flex justify-between text-cyan-400">
                              <span>Margin (40%):</span>
                              <span className="font-mono font-bold">+{dress.marginPercent}%</span>
                            </div>
                            <div className="flex justify-between text-white font-black text-sm pt-1 border-t border-slate-800">
                              <span>Selling Price:</span>
                              <span className="text-cyan-400 font-mono">₹{dress.priceINR}/-</span>
                            </div>
                            {dress.mrpINR && (
                              <div className="flex justify-between text-slate-500 text-[11px]">
                                <span>Original MRP:</span>
                                <span className="line-through font-mono">₹{dress.mrpINR}</span>
                              </div>
                            )}
                          </div>

                          {/* Sizes */}
                          <div className="text-xs text-slate-300">
                            <strong className="text-slate-400">Sizes: </strong>
                            {dress.sizes.join(' | ')}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAdminDress(dress);
                              setShowDressUploadModal(true);
                            }}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Delete ${dress.title}?`)) {
                                await fetch(`/api/dresses/${dress.id}`, { method: 'DELETE' });
                                loadAdminDresses();
                              }
                            }}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-lg text-xs cursor-pointer"
                            title="Delete dress"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dress Upload / Edit Modal */}
                  <DressUploadModal
                    isOpen={showDressUploadModal}
                    onClose={() => {
                      setShowDressUploadModal(false);
                      setEditingAdminDress(null);
                    }}
                    onSaveDress={async (dressData) => {
                      if (editingAdminDress) {
                        await fetch(`/api/dresses/${editingAdminDress.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(dressData),
                        });
                      } else {
                        await fetch('/api/dresses', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(dressData),
                        });
                      }
                      loadAdminDresses();
                      onRefreshData();
                    }}
                    initialDress={editingAdminDress}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: ADD PRODUCT */}
        {showAddProductModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0F172A] border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-white">Add Product to Dropship Catalog</h3>
                <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Product Title</label>
                  <input
                    required
                    type="text"
                    value={newProdTitle}
                    onChange={(e) => setNewProdTitle(e.target.value)}
                    placeholder="e.g. Kovira Zenith Active Smart Watch"
                    className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Category</label>
                    <select
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Timepieces">Timepieces</option>
                      <option value="Lifestyle">Lifestyle</option>
                      <option value="Home & Living">Home & Living</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Assign Dropship Supplier</label>
                    <select
                      value={newProdSupplierId}
                      onChange={(e) => setNewProdSupplierId(e.target.value)}
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.country})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Retail Selling Price ({currency === 'INR' ? '₹ INR' : currency})</label>
                    <input
                      required
                      type="number"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(Number(e.target.value))}
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Supplier Dropship Cost ({currency === 'INR' ? '₹ INR' : currency})</label>
                    <input
                      required
                      type="number"
                      value={newProdCost}
                      onChange={(e) => setNewProdCost(Number(e.target.value))}
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Initial Stock</label>
                    <input
                      required
                      type="number"
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(Number(e.target.value))}
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Reorder Point</label>
                    <input
                      required
                      type="number"
                      value={newProdReorderPoint}
                      onChange={(e) => setNewProdReorderPoint(Number(e.target.value))}
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Auto-Restock Units</label>
                    <input
                      required
                      type="number"
                      value={newProdReorderQty}
                      onChange={(e) => setNewProdReorderQty(Number(e.target.value))}
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={newProdImage}
                    onChange={(e) => setNewProdImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newProdDescription}
                    onChange={(e) => setNewProdDescription(e.target.value)}
                    placeholder="Product highlights & specs"
                    className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 rounded-lg text-slate-950 font-bold shadow-md shadow-cyan-950/20 cursor-pointer transition-all active:scale-95"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD SUPPLIER */}
        {showAddSupplierModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0F172A] border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 text-slate-100">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-white">Register Dropshipping Supplier</h3>
                <button onClick={() => setShowAddSupplierModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Supplier Company Name</label>
                  <input
                    required
                    type="text"
                    value={newSupName}
                    onChange={(e) => setNewSupName(e.target.value)}
                    placeholder="e.g. Apex Global Fulfillment Ltd"
                    className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Contact Coordinator</label>
                    <input
                      required
                      type="text"
                      value={newSupContact}
                      onChange={(e) => setNewSupContact(e.target.value)}
                      placeholder="e.g. Jennifer Smith"
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Country / Warehouse Origin</label>
                    <input
                      required
                      type="text"
                      value={newSupCountry}
                      onChange={(e) => setNewSupCountry(e.target.value)}
                      placeholder="e.g. India (Bengaluru / Mumbai / Surat)"
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">PO Dispatch Email</label>
                    <input
                      required
                      type="email"
                      value={newSupEmail}
                      onChange={(e) => setNewSupEmail(e.target.value)}
                      placeholder="dispatch@supplier.in"
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Phone Hotline</label>
                    <input
                      required
                      type="text"
                      value={newSupPhone}
                      onChange={(e) => setNewSupPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Dispatch Lead Time (Days)</label>
                    <input
                      required
                      type="number"
                      value={newSupLeadDays}
                      onChange={(e) => setNewSupLeadDays(Number(e.target.value))}
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Fulfillment Protocol</label>
                    <select
                      value={newSupMethod}
                      onChange={(e: any) => setNewSupMethod(e.target.value)}
                      className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="Automated EDI">Automated EDI</option>
                      <option value="Direct Email PO">Direct Email PO</option>
                      <option value="API Webhook">API Webhook</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 rounded-lg text-slate-950 font-bold shadow-md shadow-cyan-950/20 cursor-pointer transition-all active:scale-95"
                  >
                    Onboard Supplier
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Full Order Details Modal on Double-Click or Click */}
        {selectedDetailOrder && (
          <AdminOrderDetailsModal
            order={selectedDetailOrder}
            isOpen={!!selectedDetailOrder}
            onClose={() => setSelectedDetailOrder(null)}
            currency={currency}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onPrintInvoice={(ord) => {
              setSelectedInvoiceOrder(ord);
            }}
          />
        )}

        {/* Active Tax Invoice & Bill Modal for Store Owner / Admin */}
        {selectedInvoiceOrder && (
          <TaxInvoiceReceiptModal
            order={selectedInvoiceOrder}
            isOpen={!!selectedInvoiceOrder}
            onClose={() => setSelectedInvoiceOrder(null)}
            receiverUpiId={merchantUpiId}
            storeName={merchantName}
          />
        )}
      </div>
    </div>
  );
};
