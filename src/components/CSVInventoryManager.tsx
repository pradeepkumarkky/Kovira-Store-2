import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { parseCSV, parseDeoDapShopifyCSV } from '../utils/csvParser';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Building,
  Truck,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
  PackageCheck,
  List,
  Eye,
  Trash2,
  FileSpreadsheet,
  Globe2,
  Calendar,
  Boxes,
  Plus,
} from 'lucide-react';

interface CSVFileRecord {
  id: string;
  fileName: string;
  supplierPlatform: string;
  supplierName: string;
  warehouseOrigin: string;
  uploadedAt: string;
  rowCount: number;
  totalStockUnits: number;
  status: 'Synced & Active' | 'Pending Review' | 'Archived';
  fileSizeKb: number;
  sampleItems: string[];
}

interface CSVInventoryManagerProps {
  onCatalogUploaded: (importedProducts: Product[]) => void;
  onNavigateToInventoryWithSupplier?: (supplierKey: string) => void;
  onClose?: () => void;
}

export const CSVInventoryManager: React.FC<CSVInventoryManagerProps> = ({
  onCatalogUploaded,
  onNavigateToInventoryWithSupplier,
  onClose,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'upload'>('list');
  const [csvFiles, setCsvFiles] = useState<CSVFileRecord[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Upload Form State
  const [selectedSupplier, setSelectedSupplier] = useState<'DeoDap' | 'Baapstore' | 'CJdropshipping' | 'Custom'>('DeoDap');
  const [customSupplierName, setCustomSupplierName] = useState('');
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [markupMultiplier, setMarkupMultiplier] = useState(2.2);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedPreviewItems, setParsedPreviewItems] = useState<any[]>([]);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    count?: number;
    message?: string;
    products?: Product[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch uploaded CSV files from server
  const fetchCsvFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch('/api/admin/csv-files');
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setCsvFiles(data.files);
      }
    } catch (e) {
      console.error('Failed to load CSV files:', e);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchCsvFiles();
  }, []);

  // Pre-built Supplier CSV Templates
  const sampleDeoDapFeed = [
    {
      sku: 'DD-KITCH-982',
      title: 'Multi-Function Vegetable Slicer & Mandoline Cutter',
      wholesaleINR: 185,
      stock: 450,
      category: 'Smart Kitchen',
      image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&q=80',
      description: 'Ergonomic stainless-steel rotating kitchen slicer with 6 interchangeable blades.',
    },
    {
      sku: 'DD-ELEC-412',
      title: 'USB Rechargeable Hands-Free Neck Fan 3-Speed Dual Blower',
      wholesaleINR: 240,
      stock: 320,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1593121923573-509836b7866f?w=800&q=80',
      description: 'Portable bladeless neck cooler with 360-degree airflow and 4000mAh battery.',
    },
    {
      sku: 'DD-HOME-731',
      title: 'Intelligent Touchless Motion Sensor Trash Can 12L',
      wholesaleINR: 420,
      stock: 180,
      category: 'Home & Living',
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
      description: 'Infrared motion-activated smart waste bin with odor-seal gasket.',
    },
  ];

  const sampleBaapstoreFeed = [
    {
      sku: 'BAAP-WTCH-101',
      title: 'Waterproof Classic Chronograph Business Wristwatch',
      wholesaleINR: 850,
      stock: 120,
      category: 'Timepieces',
      image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80',
      description: 'Sapphire glass casing with genuine leather strap and Japanese quartz mechanism.',
    },
    {
      sku: 'BAAP-PWR-202',
      title: 'Magnetic Qi Fast Charging Wireless Power Bank 10,000mAh',
      wholesaleINR: 690,
      stock: 200,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=800&q=80',
      description: 'Ultra-thin MagSafe magnetic battery pack with 20W PD USB-C fast output.',
    },
  ];

  const sampleCjFeed = [
    {
      sku: 'CJ-DIFF-550',
      title: 'Ultrasonic Realistic Flame Aroma Diffuser & Ambient Lamp',
      costUSD: 9.5,
      stock: 150,
      category: 'Home & Living',
      image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80',
      description: 'Warm flame LED effect with quiet cold mist ultrasound aroma dispersal.',
    },
    {
      sku: 'CJ-CHRG-770',
      title: 'Foldable 3-in-1 Magnetic Travel Charging Station',
      costUSD: 14.2,
      stock: 190,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&q=80',
      description: 'Simultaneously fast charges phone, smartwatch, and wireless earbuds.',
    },
  ];

  // Helper to parse file or text input into items
  const parseRawContent = (text: string): any[] => {
    if (!text || !text.trim()) return [];

    try {
      const parsedJson = JSON.parse(text);
      if (Array.isArray(parsedJson)) return parsedJson;
    } catch {
      // CSV format
    }

    if (text.toLowerCase().includes('handle') && text.toLowerCase().includes('title')) {
      return parseDeoDapShopifyCSV(text);
    }

    const rows = parseCSV(text);
    if (rows.length < 2) return [];

    const headers = rows[0].map((h) => h.toLowerCase().trim());
    const findIndex = (keywords: string[]) =>
      headers.findIndex((h) => keywords.some((k) => h.includes(k)));

    const skuIdx = findIndex(['sku', 'code', 'handle', 'item']);
    const titleIdx = findIndex(['title', 'name', 'product']);
    const costIdx = findIndex(['cost', 'wholesale', 'price_inr', 'buying']);
    const retailIdx = findIndex(['retail', 'price', 'selling', 'mrp']);
    const stockIdx = findIndex(['stock', 'qty', 'quantity', 'inventory']);
    const catIdx = findIndex(['category', 'type', 'collection']);
    const imgIdx = findIndex(['image src', 'image', 'images', 'image url', 'image_url', 'photo', 'photos', 'src', 'url', 'pic', 'picture', 'img']);
    const descIdx = findIndex(['desc', 'body', 'details']);

    const items: any[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

      const rawTitle = titleIdx !== -1 ? row[titleIdx] : `Inventory Item #${i}`;
      const rawCost = costIdx !== -1 ? parseFloat(row[costIdx]) : 150;
      const rawRetail = retailIdx !== -1 ? parseFloat(row[retailIdx]) : 0;
      const rawStock = stockIdx !== -1 ? parseInt(row[stockIdx], 10) : 100;
      const rawSku = skuIdx !== -1 && row[skuIdx] ? row[skuIdx] : `INV-${Date.now()}-${i}`;
      const rawCat = catIdx !== -1 && row[catIdx] ? row[catIdx] : 'Lifestyle Essentials';
      let rawImg = imgIdx !== -1 && row[imgIdx] ? row[imgIdx].trim() : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
      if (rawImg.startsWith('//')) rawImg = `https:${rawImg}`;
      const rawDesc = descIdx !== -1 && row[descIdx] ? row[descIdx] : 'Factory direct dropship inventory.';

      items.push({
        sku: rawSku,
        title: rawTitle,
        wholesaleINR: rawCost > 100 || selectedSupplier === 'DeoDap' || selectedSupplier === 'Baapstore' ? rawCost : rawCost * 86.5,
        costUSD: rawCost > 100 ? rawCost / 86.5 : rawCost,
        priceUSD: rawRetail > 0 ? (rawRetail > 100 ? rawRetail / 86.5 : rawRetail) : 0,
        stock: isNaN(rawStock) ? 80 : rawStock,
        category: rawCat,
        image: rawImg,
        images: [rawImg],
        description: rawDesc,
      });
    }

    return items;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setFileName(selected.name);
      setError(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRawText(text);
        const parsed = parseRawContent(text);
        setParsedPreviewItems(parsed);
      };
      reader.readAsText(selected);
    }
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    if (!fileName) {
      setFileName(`${selectedSupplier.toLowerCase()}_inventory_${Date.now()}.csv`);
    }
    const parsed = parseRawContent(text);
    setParsedPreviewItems(parsed);
  };

  const handleLoadSample = (supplier: 'DeoDap' | 'Baapstore' | 'CJdropshipping') => {
    setSelectedSupplier(supplier);
    setError(null);
    let sampleData: any[] = [];
    let name = '';

    if (supplier === 'DeoDap') {
      sampleData = sampleDeoDapFeed;
      name = 'deodap_rajkot_sample_feed.json';
    } else if (supplier === 'Baapstore') {
      sampleData = sampleBaapstoreFeed;
      name = 'baapstore_chennai_sample_feed.json';
    } else {
      sampleData = sampleCjFeed;
      name = 'cjdropshipping_global_sample_feed.json';
    }

    const jsonStr = JSON.stringify(sampleData, null, 2);
    setRawText(jsonStr);
    setFileName(name);
    setParsedPreviewItems(sampleData);
  };

  const handleLoadUploadedCSV = async () => {
    try {
      setSelectedSupplier('DeoDap');
      setFileName('deodap_products_export.csv');
      const res = await fetch('/deodap_products_export.csv');
      const text = await res.text();
      setRawText(text);
      const parsed = parseDeoDapShopifyCSV(text);
      setParsedPreviewItems(parsed);
      setError(null);
    } catch {
      setError('Could not read /deodap_products_export.csv');
    }
  };

  const handleProcessUpload = async () => {
    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      let itemsToUpload = parsedPreviewItems;
      if (itemsToUpload.length === 0 && rawText.trim()) {
        itemsToUpload = parseRawContent(rawText);
      }

      if (!Array.isArray(itemsToUpload) || itemsToUpload.length === 0) {
        throw new Error('Please select a CSV file or paste valid inventory data.');
      }

      const supplierName =
        selectedSupplier === 'Custom'
          ? customSupplierName.trim() || 'Custom Verified Supplier'
          : selectedSupplier === 'DeoDap'
          ? 'DeoDap Direct B2B Dropshipping Hub'
          : selectedSupplier === 'Baapstore'
          ? 'Baapstore B2B Dropshipping'
          : 'CJdropshipping Overseas Logistics';

      const payload = {
        fileName: fileName || `${selectedSupplier.toLowerCase()}_catalog.csv`,
        supplierPlatform: selectedSupplier,
        customSupplierName: supplierName,
        items: itemsToUpload,
        markupMultiplier,
      };

      const res = await fetch('/api/admin/csv-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server failed to process CSV inventory upload');
      }

      setUploadResult({
        success: true,
        count: data.count,
        message: data.message,
        products: data.products,
      });

      // Refresh parent store inventory
      if (data.products) {
        onCatalogUploaded(data.products);
      }

      // Refresh CSV files list
      fetchCsvFiles();

      // Clear text
      setRawText('');
      setParsedPreviewItems([]);
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to process CSV file upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteCsvRecord = async (id: string) => {
    if (!confirm('Are you sure you want to archive this CSV file record?')) return;
    try {
      const res = await fetch(`/api/admin/csv-files/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCsvFiles((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete CSV record:', e);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      'Handle,Title,Variant SKU,Cost Per Item,Variant Compare At Price,Variant Inventory Qty,Image Src,Custom Product Type,Body (HTML)\n' +
      'kov-smart-cutter,"Handheld Electric Food Chopper & Mincer",KOV-ECHO-101,250,699,150,https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&q=80,Smart Kitchen,"Rechargeable multi-purpose kitchen food cutter."\n' +
      'kov-ambient-diffuser,"Ultrasonic Ambient Flame Lamp Humidifier",KOV-DIFF-202,380,999,200,https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80,Home & Living,"Aromatherapy cold mist with realistic flame ambient light."\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'kovira_inventory_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 text-slate-100 shadow-2xl relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5A43]/10 border border-[#FF5A43]/30 flex items-center justify-center text-[#FF5A43] shrink-0 shadow-xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white font-['Outfit',sans-serif]">
                CSV Inventory Feeds & Supplier Uploader
              </h3>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Admin Exclusive View
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Upload and manage bulk CSV inventory files mapped to <strong>DeoDap</strong>, <strong>Baapstore</strong>, or <strong>CJdropshipping</strong>. 
              Supplier origin is recorded for admin fulfillment, while <strong>customers will see only clean product details without supplier names</strong>.
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center bg-[#0B1120] border border-slate-800 rounded-xl p-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'list'
                ? 'bg-[#FF5A43] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Uploaded CSV Files ({csvFiles.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'upload'
                ? 'bg-[#FF5A43] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New CSV</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: LIST OF UPLOADED CSV FILES IN STORE */}
      {activeSubTab === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Active CSV Inventory Files in Kovira Store</span>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded-full">
                  {csvFiles.reduce((acc, f) => acc + f.rowCount, 0)} Total Products Synced
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                All inventory feeds synced into the storefront. Click "View in Inventory" to manage stock under each supplier.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="text-xs text-slate-300 hover:text-white bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Template CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('upload')}
                className="text-xs text-white bg-[#FF5A43] hover:bg-[#e04b36] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload New CSV</span>
              </button>
            </div>
          </div>

          {/* Files List Table */}
          {isLoadingFiles ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
              Loading CSV files registry...
            </div>
          ) : csvFiles.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-300">No CSV inventory files uploaded yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload your first DeoDap, Baapstore, or CJdropshipping catalog CSV to automatically populate products in the store.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('upload')}
                className="mt-2 text-xs font-bold text-white bg-[#FF5A43] px-3.5 py-1.5 rounded-xl cursor-pointer"
              >
                Upload First CSV Feed
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {csvFiles.map((fileRecord) => {
                const isDeo = fileRecord.supplierPlatform.toLowerCase().includes('deodap');
                const isBaap = fileRecord.supplierPlatform.toLowerCase().includes('baap');

                return (
                  <div
                    key={fileRecord.id}
                    className="bg-[#0B1120] border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                              isDeo
                                ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                                : isBaap
                                ? 'bg-sky-950/80 text-sky-300 border-sky-500/40'
                                : 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                            }`}
                          >
                            <Building className="w-3 h-3" />
                            {fileRecord.supplierPlatform}
                          </span>
                          <span className="font-mono text-sm font-bold text-white flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-slate-400" />
                            {fileRecord.fileName}
                          </span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {fileRecord.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                          <span className="text-slate-300 font-medium">Supplier: {fileRecord.supplierName}</span>
                          <span>•</span>
                          <span>Hub: {fileRecord.warehouseOrigin}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(fileRecord.uploadedAt).toLocaleDateString()} at {new Date(fileRecord.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Metrics & Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <div className="bg-[#111827] border border-slate-800 px-3 py-1.5 rounded-xl text-center">
                          <div className="text-[9px] uppercase font-bold text-slate-500">Products</div>
                          <div className="text-xs font-mono font-bold text-cyan-400">{fileRecord.rowCount} SKUs</div>
                        </div>

                        <div className="bg-[#111827] border border-slate-800 px-3 py-1.5 rounded-xl text-center">
                          <div className="text-[9px] uppercase font-bold text-slate-500">Stock Added</div>
                          <div className="text-xs font-mono font-bold text-emerald-400">{fileRecord.totalStockUnits.toLocaleString()} units</div>
                        </div>

                        {onNavigateToInventoryWithSupplier && (
                          <button
                            type="button"
                            onClick={() => onNavigateToInventoryWithSupplier(isDeo ? 'deodap' : isBaap ? 'baapstore' : 'cj')}
                            className="bg-[#1E293B] hover:bg-[#FF5A43] text-slate-200 hover:text-white border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                            title="View all products under this supplier in inventory table"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View in Inventory</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteCsvRecord(fileRecord.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                          title="Archive CSV Feed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sample Imported Items Pills */}
                    {fileRecord.sampleItems && fileRecord.sampleItems.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="text-slate-500 font-semibold">Sample Synced Products:</span>
                        {fileRecord.sampleItems.map((item, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-lg truncate max-w-[220px]"
                            title={item}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: UPLOAD NEW CSV FORM */}
      {activeSubTab === 'upload' && (
        <div className="space-y-6">
          {/* Step 1: Select Supplier Destination */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#FF5A43]" />
              <span>Step 1: Assign to Dropship Supplier (Visible in Admin Only)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* DeoDap Option */}
              <button
                type="button"
                onClick={() => setSelectedSupplier('DeoDap')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedSupplier === 'DeoDap'
                    ? 'bg-amber-950/60 border-amber-500 shadow-md shadow-amber-950/40'
                    : 'bg-[#0B1120] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-white">DeoDap Dropship</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                    India B2B
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Rajkot Central Mega Hub, Gujarat · 1-2 days dispatch via Delhivery
                </p>
              </button>

              {/* Baapstore Option */}
              <button
                type="button"
                onClick={() => setSelectedSupplier('Baapstore')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedSupplier === 'Baapstore'
                    ? 'bg-sky-950/60 border-sky-500 shadow-md shadow-sky-950/40'
                    : 'bg-[#0B1120] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-white">Baapstore B2B</span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-bold">
                    India Express
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Chennai Gateway & Surat Hub · Premium timepieces & gadgets
                </p>
              </button>

              {/* CJdropshipping Option */}
              <button
                type="button"
                onClick={() => setSelectedSupplier('CJdropshipping')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedSupplier === 'CJdropshipping'
                    ? 'bg-purple-950/60 border-purple-500 shadow-md shadow-purple-950/40'
                    : 'bg-[#0B1120] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-white">CJdropshipping</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                    US / Global
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  US West (Chino, CA) & Global Air Warehouses · Tracked air cargo
                </p>
              </button>
            </div>
          </div>

          {/* Quick Pre-fill Feeds & Template Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0B1120] border border-slate-800 p-3 rounded-2xl text-xs">
            <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Test Feeds:</span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleLoadUploadedCSV}
                className="text-xs text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-700/60 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Load 8 products from /deodap_products_export.csv"
              >
                <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Load DeoDap CSV (8 Items)</span>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSample('Baapstore')}
                className="text-xs text-sky-300 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-700/60 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Baapstore Sample</span>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSample('CJdropshipping')}
                className="text-xs text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-700/60 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>CJ Sample</span>
              </button>

              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-800 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Blank CSV Template
              </button>
            </div>
          </div>

          {/* Step 2: Drag and Drop CSV Zone */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Step 2: Select CSV File or Drag & Drop</span>
              {fileName && <span className="font-mono text-cyan-400 lowercase">{fileName}</span>}
            </label>
            <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#0B1120] hover:bg-slate-900/60">
              <Upload className="w-8 h-8 text-cyan-400 mb-2 animate-bounce" />
              <span className="text-sm font-bold text-white">
                {file ? file.name : `Click or drag & drop ${selectedSupplier} CSV inventory feed here`}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Accepts standard Shopify, DeoDap, CJ, or generic product CSV (Max 15MB)
              </span>
              <input
                type="file"
                accept=".csv,.json,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Paste CSV / Text Input Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">
                Or Paste CSV Rows / JSON Feed Lines Directly:
              </label>
              {parsedPreviewItems.length > 0 && (
                <span className="font-mono text-emerald-400 font-bold">
                  ✓ {parsedPreviewItems.length} Products Recognized
                </span>
              )}
            </div>
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Handle,Title,Variant SKU,Cost Per Item,Variant Compare At Price,Variant Inventory Qty..."
              className="w-full bg-[#0B1120] border border-slate-700 rounded-xl p-3 font-mono text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Step 3: Markup Slider */}
          <div className="bg-[#0B1120] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-white block">Step 3: Retail Profit Margin Multiplier</span>
              <span className="text-slate-400 text-[11px]">
                Calculates customer selling price: Wholesale Cost × {markupMultiplier}x (e.g. ₹200 cost → ₹{Math.round(200 * markupMultiplier)} retail)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1.3"
                max="3.5"
                step="0.1"
                value={markupMultiplier}
                onChange={(e) => setMarkupMultiplier(parseFloat(e.target.value))}
                className="w-32 accent-[#FF5A43] cursor-pointer"
              />
              <span className="font-black font-mono text-white bg-slate-800 border border-slate-700 px-3 py-1 rounded-xl text-sm">
                {markupMultiplier}x
              </span>
            </div>
          </div>

          {/* Live Parsed Preview Table */}
          {parsedPreviewItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Preview: Ready to Import {parsedPreviewItems.length} Products</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Customer will see clean product title without supplier tags
                </span>
              </div>

              <div className="bg-[#0B1120] border border-slate-800 rounded-xl overflow-hidden overflow-x-auto max-h-56">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <th className="p-2.5">SKU</th>
                      <th className="p-2.5">Product Title (Clean Customer View)</th>
                      <th className="p-2.5">Supplier Assigned (Admin Only)</th>
                      <th className="p-2.5">Wholesale Cost</th>
                      <th className="p-2.5">Est. Retail Price</th>
                      <th className="p-2.5">Initial Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {parsedPreviewItems.slice(0, 5).map((item, idx) => {
                      const costUSD = item.costUSD || (item.wholesaleINR ? item.wholesaleINR / 86.5 : 8);
                      const retailUSD = item.priceUSD || costUSD * markupMultiplier;

                      return (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-mono text-cyan-400 font-bold text-[11px]">
                            {item.sku || `INV-${idx}`}
                          </td>
                          <td className="p-2.5 text-white font-medium max-w-[240px] truncate" title={item.title}>
                            {item.title}
                          </td>
                          <td className="p-2.5">
                            <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-bold">
                              {selectedSupplier}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-300 font-mono">
                            ${costUSD.toFixed(2)}
                          </td>
                          <td className="p-2.5 font-bold text-emerald-400 font-mono">
                            ${retailUSD.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-slate-300 font-mono">
                            {item.stock || 100} units
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Result */}
          {uploadResult && uploadResult.success && (
            <div className="p-4 bg-emerald-950/70 border border-emerald-800 rounded-2xl text-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{uploadResult.message || `Successfully synced ${uploadResult.count} products!`}</span>
              </div>
              <p className="text-emerald-300/80 text-[11px]">
                Products are now live in the store. Admin can view them grouped under supplier <strong>{selectedSupplier}</strong> in the Real-Time Inventory tab.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('list')}
                  className="bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-bold cursor-pointer"
                >
                  View in Uploaded Files List
                </button>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            disabled={isUploading || (!rawText.trim() && parsedPreviewItems.length === 0)}
            onClick={handleProcessUpload}
            className="w-full bg-[#FF5A43] hover:bg-[#e04b36] disabled:opacity-50 text-white py-3.5 px-6 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Importing & Syncing CSV to Store Catalog...</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                <span>Publish CSV Products to Live Store (Assign to {selectedSupplier})</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
