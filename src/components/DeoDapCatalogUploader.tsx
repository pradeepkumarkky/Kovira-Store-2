import React, { useState } from 'react';
import { Product } from '../types';
import { parseDeoDapShopifyCSV } from '../utils/csvParser';
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
} from 'lucide-react';

interface DeoDapCatalogUploaderProps {
  onCatalogUploaded: (importedProducts: Product[]) => void;
  onClose?: () => void;
}

export const DeoDapCatalogUploader: React.FC<DeoDapCatalogUploaderProps> = ({
  onCatalogUploaded,
  onClose,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [markupMultiplier, setMarkupMultiplier] = useState(2.2);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    count?: number;
    message?: string;
    products?: Product[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sample DeoDap format preview
  const sampleDeoDapFeed = [
    {
      sku: 'DD-KITCH-982',
      title: 'DeoDap Multi-Function Vegetable Slicer & Mandoline Cutter',
      wholesaleINR: 185,
      stock: 450,
      category: 'Lifestyle',
      image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&q=80',
    },
    {
      sku: 'DD-ELEC-412',
      title: 'DeoDap USB Rechargeable Portable Neck Fan 3-Speed',
      wholesaleINR: 240,
      stock: 320,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1593121923573-509836b7866f?w=800&q=80',
    },
    {
      sku: 'DD-HOME-731',
      title: 'DeoDap Automatic Sensor Trash Can 12L Smart Dustbin',
      wholesaleINR: 420,
      stock: 180,
      category: 'Lifestyle',
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRawText(text);
      };
      reader.readAsText(selected);
    }
  };

  const handleProcessUpload = async () => {
    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      let itemsToUpload = [];

      if (rawText.trim()) {
        try {
          itemsToUpload = JSON.parse(rawText);
        } catch {
          // Check if it's Shopify / DeoDap multi-column CSV (with handle, title, image src, etc.)
          if (rawText.toLowerCase().includes('handle') && rawText.toLowerCase().includes('title')) {
            itemsToUpload = parseDeoDapShopifyCSV(rawText);
          } else {
            // Fallback simple CSV line parser
            const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
            const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
              if (cols.length >= 3) {
                const itemObj: any = {};
                headers.forEach((h, idx) => {
                  itemObj[h] = cols[idx] || '';
                });
                itemsToUpload.push({
                  sku: itemObj['sku'] || itemObj['item_code'] || `DD-GEN-${Date.now()}-${i}`,
                  title: itemObj['title'] || itemObj['name'] || 'DeoDap Dropship Item',
                  wholesaleINR: parseFloat(itemObj['wholesale'] || itemObj['cost'] || itemObj['price']) || 199,
                  stock: parseInt(itemObj['stock'] || itemObj['qty'] || '100', 10),
                  category: itemObj['category'] || 'Lifestyle',
                  image: itemObj['image'] || itemObj['image_url'] || 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&q=80',
                  description: itemObj['description'] || 'Official DeoDap factory drop-ship inventory.',
                });
              }
            }
          }
        }
      } else {
        // Use sample DeoDap feed if no file uploaded
        itemsToUpload = sampleDeoDapFeed;
      }

      if (!Array.isArray(itemsToUpload) || itemsToUpload.length === 0) {
        throw new Error('No valid DeoDap product rows identified in input file or text.');
      }

      // Send to server API endpoint
      const res = await fetch('/api/dropship/deodap/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToUpload,
          markupMultiplier,
          source: 'DeoDap Portal Upload (Rajkot Depot)',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server failed to process DeoDap catalog upload');
      }

      setUploadResult({
        success: true,
        count: data.count,
        message: data.message,
        products: data.products,
      });

      if (data.products) {
        onCatalogUploaded(data.products);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload DeoDap catalog feed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSample = () => {
    setRawText(JSON.stringify(sampleDeoDapFeed, null, 2));
    setError(null);
  };

  const handleLoadUploadedCSV = async () => {
    try {
      const res = await fetch('/deodap_products_export.csv');
      const text = await res.text();
      setRawText(text);
      setError(null);
    } catch {
      setError('Unable to load /deodap_products_export.csv');
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      'sku,title,wholesale,stock,category,image\n' +
      'DD-KITCH-101,DeoDap Stainless Steel Garlic Press,120,500,Lifestyle,https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&q=80\n' +
      'DD-ELEC-202,DeoDap Mini Portable Vacuum Cleaner 120W,380,250,Electronics,https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80\n' +
      'DD-HOME-303,DeoDap Magnetic Spice Rack Wall Mount,210,340,Lifestyle,https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=80\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'deodap_catalog_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 text-slate-900 shadow-xl relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header Info */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
          <Building className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-slate-900 font-['Outfit',sans-serif]">
              DeoDap Catalog Bulk Uploader
            </h3>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-300">
              India Dropship API
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compatible with official DeoDap wholesale exports (CSV & JSON). Automatically applies INR wholesale pricing, Rajkot warehouse dispatch routing, and dynamic retail margins.
          </p>
        </div>
      </div>

      {/* DeoDap Settings Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Truck className="w-4 h-4 text-sky-600 shrink-0" />
          <div>
            <span className="text-slate-400 text-[10px] block uppercase font-bold">Fulfillment Depot</span>
            <span className="font-semibold text-slate-800">DeoDap Central, Rajkot</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="text-slate-400 text-[10px] block uppercase font-bold">Courier Partner</span>
            <span className="font-semibold text-slate-800">Delhivery / Xpressbees (2-4 Days)</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="text-slate-400 text-[10px] block uppercase font-bold">Markup Multiplier</span>
            <span className="font-bold text-slate-900">{markupMultiplier}x wholesale price</span>
          </div>
        </div>
      </div>

      {/* File Upload & Input Area */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Upload DeoDap CSV or JSON File
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLoadUploadedCSV}
              className="text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Load the 8 products from your uploaded DeoDap CSV"
            >
              <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Load Uploaded CSV (8 Items)</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> CSV Template
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Sample Feed
            </button>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20">
          <Upload className="w-8 h-8 text-indigo-500 mb-2 animate-bounce" />
          <span className="text-sm font-bold text-slate-800">
            {file ? file.name : 'Click or drag & drop DeoDap catalog export here'}
          </span>
          <span className="text-xs text-slate-400 mt-1">
            Accepts .csv, .json, .txt (Max 10MB)
          </span>
          <input
            type="file"
            accept=".csv,.json,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* Raw Text Box / JSON Preview */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Or Paste DeoDap JSON / CSV Lines Directly:
          </label>
          <textarea
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder='[{"sku": "DD-991", "title": "Kitchen Vegetable Peeler", "wholesaleINR": 95, "stock": 500}]'
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
          />
        </div>

        {/* Markup Settings Slider */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-800 block">Retail Profit Margin</span>
            <span className="text-slate-500 text-[11px]">
              E.g. Wholesale ₹100 x {markupMultiplier} = ₹{Math.round(100 * markupMultiplier)} Selling Price
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1.4"
              max="3.5"
              step="0.1"
              value={markupMultiplier}
              onChange={(e) => setMarkupMultiplier(parseFloat(e.target.value))}
              className="w-32 accent-indigo-600 cursor-pointer"
            />
            <span className="font-black font-mono text-indigo-600 text-sm bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
              {markupMultiplier}x
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Notice */}
      {uploadResult && uploadResult.success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{uploadResult.message || `Successfully synced ${uploadResult.count} DeoDap products!`}</span>
          </div>
          <p className="text-emerald-700 text-[11px]">
            The new items have been added to your live store catalog with Rajkot dispatch and real-time inventory tracking.
          </p>
        </div>
      )}

      {/* Action Button */}
      <button
        type="button"
        disabled={isUploading}
        onClick={handleProcessUpload}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3.5 px-6 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer"
      >
        {isUploading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Processing DeoDap Catalog Feed...</span>
          </>
        ) : (
          <>
            <Layers className="w-4 h-4" />
            <span>Import DeoDap Products to Store Catalog</span>
          </>
        )}
      </button>
    </div>
  );
};
