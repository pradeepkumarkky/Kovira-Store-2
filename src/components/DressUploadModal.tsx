import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { DressProduct } from '../types';
import {
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Check,
  Tag,
  Truck,
  Plus,
  Percent,
  Calculator,
  Eye,
} from 'lucide-react';

interface DressUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDress: (dress: Partial<DressProduct>) => Promise<void>;
  initialDress?: DressProduct | null;
}

export const DressUploadModal: React.FC<DressUploadModalProps> = ({
  isOpen,
  onClose,
  onSaveDress,
  initialDress,
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [images, setImages] = useState<string[]>(
    initialDress?.images || ['/assets/dresses/partywear_gown_1_1791385855095.jpg']
  );
  const [title, setTitle] = useState(
    initialDress?.title || '👗 Premium Western Partywear Gown 👗'
  );
  const [subtitle, setSubtitle] = useState(
    initialDress?.subtitle || 'Designer Printed Cotton Cambric Flared Gown'
  );
  const [category, setCategory] = useState(
    initialDress?.category || 'Partywear Gowns'
  );
  const [baseCostINR, setBaseCostINR] = useState<number>(
    initialDress?.baseCostINR || 328
  );
  const [marginPercent, setMarginPercent] = useState<number>(
    initialDress?.marginPercent || 40 // Default 40% margin as requested
  );
  const [priceINR, setPriceINR] = useState<number>(
    initialDress?.priceINR || 460
  );
  const [showDiscount, setShowDiscount] = useState<boolean>(
    initialDress?.showDiscount ?? true
  );
  const [discountPercent, setDiscountPercent] = useState<number>(
    initialDress?.discountPercent || 40
  );
  const [mrpINR, setMrpINR] = useState<number>(
    initialDress?.mrpINR || 769
  );
  const [deliveryChargeINR, setDeliveryChargeINR] = useState<number>(
    initialDress?.deliveryChargeINR || 80 // Delivery charge 80/- as requested
  );
  const [orderPhone, setOrderPhone] = useState(
    initialDress?.orderPhone || ''
  );
  const [instagramHandle, setInstagramHandle] = useState(
    initialDress?.instagramHandle || '@shivora.collections'
  );
  const [tagline, setTagline] = useState(
    initialDress?.tagline || '💖 Trendy Look • Premium Feel • Perfect Style 💖'
  );

  // Structured Shop Details (Design Code, Material, Full Description)
  const [designCode, setDesignCode] = useState(
    initialDress?.designCode || initialDress?.sku || ''
  );
  const [material, setMaterial] = useState(
    initialDress?.material || 'Pure Cotton Cambric'
  );
  const [fullDescription, setFullDescription] = useState(
    initialDress?.fullDescription || ''
  );
  const [rawParagraph, setRawParagraph] = useState('');
  const [isParsedNotice, setIsParsedNotice] = useState(false);

  // Features / Highlights
  const defaultFeatures = [
    '✨ Stylish Printed Design',
    '✨ Soft Cotton Cambric Fabric',
    '✨ Sleeveless Pattern',
    '✨ Elegant & Comfortable Fit',
    '✨ Perfect for Party • Outing • Evening Wear 💫',
  ];
  const [features, setFeatures] = useState<string[]>(
    initialDress?.features && initialDress.features.length > 0
      ? initialDress.features
      : defaultFeatures
  );
  const [newFeatureText, setNewFeatureText] = useState('');

  // Available Sizes
  const [sizes, setSizes] = useState<string[]>(
    initialDress?.sizes && initialDress.sizes.length > 0
      ? initialDress.sizes
      : ['M', 'L', 'XL', 'XXL']
  );
  const allAvailableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];

  // Recalculate price when baseCost or margin changes
  const handleBaseCostChange = (val: number) => {
    setBaseCostINR(val);
    const calculated = Math.round(val * (1 + marginPercent / 100));
    setPriceINR(calculated);
    if (showDiscount && discountPercent > 0) {
      setMrpINR(Math.round(calculated / (1 - discountPercent / 100)));
    }
  };

  const handleMarginChange = (val: number) => {
    setMarginPercent(val);
    const calculated = Math.round(baseCostINR * (1 + val / 100));
    setPriceINR(calculated);
    if (showDiscount && discountPercent > 0) {
      setMrpINR(Math.round(calculated / (1 - discountPercent / 100)));
    }
  };

  const handleDiscountChange = (val: number) => {
    setDiscountPercent(val);
    if (val > 0) {
      setMrpINR(Math.round(priceINR / (1 - val / 100)));
    }
  };

  // Smart Parser for Pasted Raw Text Paragraph
  const handleSortParagraph = () => {
    if (!rawParagraph.trim()) return;
    const text = rawParagraph.trim();

    // 1. Extract Design Code / SKU
    const codeMatch =
      text.match(/(?:design\s*code|item\s*code|code|d\.?no\.?|art\.?\s*no\.?|sku)[:\s=\-–]+([A-Za-z0-9_\-\/]+)/i) ||
      text.match(/\b(D-\d{2,6}|SHV-[A-Za-z0-9\-]+|KOV-[A-Za-z0-9\-]+|[A-Z]{2,4}-\d{2,6})\b/i);
    if (codeMatch) {
      setDesignCode(codeMatch[1].trim());
    }

    // 2. Extract Fabric / Material
    const fabricMatch =
      text.match(/(?:fabric|material|stuff|cloth)[:\s=\-–]+([^\n\r,;.]+)/i) ||
      text.match(/\b(Pure\s+Cotton\s+Cambric|Cotton\s+Cambric|Pure\s+Georgette|Georgette|Chanderi|Mulmul|Silk|Pure\s+Silk|Rayon|Organza|Crepe|Satin|Velvet|Linen)\b/i);
    if (fabricMatch) {
      setMaterial(fabricMatch[1].trim());
    }

    // 3. Extract Sizes
    const sizesFound: string[] = [];
    const sizeSection = text.match(/(?:sizes?|size\s*available)[:\s=\-–]+([^\n\r]+)/i);
    const searchString = sizeSection ? sizeSection[1] : text;
    ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'].forEach((sz) => {
      const regex = new RegExp(`\\b${sz === 'Free Size' ? 'Free\\s*Size' : sz}\\b`, 'i');
      if (regex.test(searchString)) {
        sizesFound.push(sz);
      }
    });
    if (/\b2XL\b/i.test(searchString) && !sizesFound.includes('XXL')) {
      sizesFound.push('XXL');
    }
    if (sizesFound.length > 0) {
      setSizes(sizesFound);
    }

    // 4. Extract Rate / Price / Base Cost
    const rateMatch = text.match(/(?:rate|wholesale|base\s*cost|cost)[:\s=\-–]+(?:rs\.?|inr|₹)?\s*(\d{2,5})/i);
    const priceMatch = text.match(/(?:price|selling\s*price)[:\s=\-–]+(?:rs\.?|inr|₹)?\s*(\d{2,5})/i);
    if (rateMatch) {
      const cost = Number(rateMatch[1]);
      setBaseCostINR(cost);
      const calculated = Math.round(cost * (1 + marginPercent / 100));
      setPriceINR(calculated);
      setMrpINR(Math.round(calculated * 1.6));
    } else if (priceMatch) {
      const p = Number(priceMatch[1]);
      setPriceINR(p);
      setBaseCostINR(Math.round(p / 1.4));
      setMrpINR(Math.round(p * 1.6));
    }

    // 5. Extract MRP
    const mrpMatch = text.match(/(?:mrp|market\s*price)[:\s=\-–]+(?:rs\.?|inr|₹)?\s*(\d{2,5})/i);
    if (mrpMatch) {
      setMrpINR(Number(mrpMatch[1]));
    }

    // 6. Extract / Format Title
    const titleMatch = text.match(/(?:title|product|item)[:\s=\-–]+([^\n\r]+)/i);
    if (titleMatch) {
      setTitle(titleMatch[1].trim());
    } else {
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      const candidateLine = lines.find((l) => !/^(design|code|fabric|material|size|rate|price|mrp|d\.?no)/i.test(l));
      if (candidateLine && candidateLine.length > 8 && candidateLine.length < 85) {
        setTitle(candidateLine);
      }
    }

    // 7. Extract Key Bullet Features
    const extractedFeatures: string[] = [];
    if (fabricMatch) extractedFeatures.push(`✨ Fabric: ${fabricMatch[1].trim()}`);
    const workMatch = text.match(/(?:work|craft|embroidery|pattern)[:\s=\-–]+([^\n\r]+)/i);
    if (workMatch) extractedFeatures.push(`✨ Work: ${workMatch[1].trim()}`);
    const lengthMatch = text.match(/(?:length)[:\s=\-–]+([^\n\r]+)/i);
    if (lengthMatch) extractedFeatures.push(`✨ Length: ${lengthMatch[1].trim()}`);
    const inclusionsMatch = text.match(/(?:dupatta|inclusions|with)[:\s=\-–]+([^\n\r]+)/i);
    if (inclusionsMatch) extractedFeatures.push(`✨ Inclusions: ${inclusionsMatch[1].trim()}`);
    extractedFeatures.push('✨ Regular Comfortable Indian Boutique Fit');
    extractedFeatures.push('✨ Ideal for Party, Festive & Evening Occasions');
    if (extractedFeatures.length >= 2) {
      setFeatures(extractedFeatures);
    }

    // 8. Store the complete lengthy paragraph as fullDescription
    setFullDescription(text);

    setIsParsedNotice(true);
    setTimeout(() => setIsParsedNotice(false), 4000);
  };

  // Compress image to prevent PayloadTooLarge
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      try {
        const compressedDataUrl = await compressImage(file);
        // Try uploading to server endpoint to get a clean url
        try {
          const res = await fetch('/api/dresses/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageDataUrl: compressedDataUrl, filename: file.name }),
          });
          const data = await res.json();
          if (data.success && data.url) {
            newImages.push(data.url);
          } else {
            newImages.push(compressedDataUrl);
          }
        } catch {
          newImages.push(compressedDataUrl);
        }
      } catch (err) {
        console.error('Failed to process image:', err);
      }
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimary = (index: number) => {
    setImages((prev) => {
      const selected = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [selected, ...rest];
    });
  };

  const toggleSize = (size: string) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const addFeature = () => {
    if (newFeatureText.trim()) {
      setFeatures((prev) => [...prev, newFeatureText.trim()]);
      setNewFeatureText('');
    }
  };

  const removeFeature = (idx: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (images.length === 0) {
      setErrorMsg('Please upload at least one dress photo.');
      return;
    }
    if (sizes.length === 0) {
      setErrorMsg('Please select at least one size.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveDress({
        title,
        subtitle,
        category,
        designCode: designCode.trim() || undefined,
        material: material.trim() || undefined,
        fullDescription: fullDescription.trim() || undefined,
        baseCostINR,
        marginPercent,
        priceINR,
        mrpINR,
        showDiscount,
        discountPercent,
        deliveryChargeINR,
        orderPhone,
        instagramHandle,
        tagline,
        features,
        sizes,
        images,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save dress. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Upload className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white font-['Outfit',sans-serif]">
                {initialDress ? 'Edit Dress in Shivora Collections' : 'Add New Dress to Shivora Collections'}
              </h2>
              <p className="text-xs text-slate-400">
                Upload photos manually (click / drag & drop) • 40% margin & highlighted discount badges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* 0. SMART PARAGRAPH PASTE & AUTO-SORT */}
          <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border-2 border-cyan-500/40 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300 font-black text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Paste WhatsApp / Product Paragraph to Auto-Sort</span>
              </div>
              <span className="text-[10px] text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-700 font-semibold">
                Auto-Formatter
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Paste raw text message or supplier paragraph below. It will automatically be sorted and formatted into online shop content with <strong>Design Code, Size, Material/Fabric, Price, and structured details</strong>!
            </p>
            <textarea
              value={rawParagraph}
              onChange={(e) => setRawParagraph(e.target.value)}
              placeholder={`Paste text paragraph here (e.g. Design Code: D-104\nPure Georgette heavy embroidery gown with dupatta\nFabric: Pure Georgette\nWork: Resham Sequins Handwork\nSizes: M, L, XL, XXL\nRate: 520\nMRP: 899\nLength: 52 inches...)`}
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleSortParagraph}
                disabled={!rawParagraph.trim()}
                className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>⚡ Sort & Format into Online Shop Content</span>
              </button>
              {isParsedNotice && (
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                  <Check className="w-4 h-4" /> Parsed & populated: Design Code, Sizes, Fabric & Price!
                </span>
              )}
            </div>
          </div>

          {/* 1. PHOTO UPLOADER: CLICK OR DRAG & DROP ZONE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Dress Photos (Click or Drag & Drop)</span>
              </label>
              <span className="text-xs text-slate-400 font-medium">
                {images.length} photo{images.length !== 1 ? 's' : ''} uploaded
              </span>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
                  : 'border-slate-700 hover:border-cyan-500/70 bg-slate-950/50 hover:bg-slate-950/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <Upload className="w-6 h-6 animate-bounce" />
                </div>
                <div className="font-bold text-white text-sm">
                  Click to select photos or drag and drop here
                </div>
                <p className="text-xs text-slate-400 max-w-md">
                  Upload multiple dress photos from your camera or gallery. High-resolution images are automatically optimized.
                </p>
              </div>
            </div>

            {/* Photo Preview Strip with Visible Delete & Make Cover Photo Actions */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-3.5 pt-2">
                {images.map((img, idx) => {
                  const isCover = idx === 0;
                  return (
                    <div
                      key={idx}
                      className={`group relative aspect-3/4 rounded-2xl overflow-hidden bg-slate-950 border-2 shadow-lg transition-all ${
                        isCover ? 'border-cyan-400 ring-2 ring-cyan-500/30' : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />

                      {/* Top Badges & Delete Button */}
                      <div className="absolute top-2 inset-x-2 flex items-center justify-between gap-1 z-10">
                        {isCover ? (
                          <span className="bg-cyan-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg shadow-md flex items-center gap-1">
                            <Check className="w-3 h-3 text-slate-950" />
                            Primary Cover
                          </span>
                        ) : (
                          <span className="bg-slate-950/80 backdrop-blur-md text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-slate-700/80">
                            Photo #{idx + 1}
                          </span>
                        )}

                        {/* Direct Delete / Remove Photo Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-md transition-all active:scale-90 cursor-pointer flex items-center justify-center shrink-0 hover:shadow-rose-600/40"
                          title="Delete photo"
                          aria-label="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Bottom Action Strip: Make Cover Photo */}
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent z-10">
                        {isCover ? (
                          <div className="w-full py-1.5 text-[11px] font-black text-cyan-300 text-center bg-cyan-950/90 border border-cyan-500/40 rounded-xl flex items-center justify-center gap-1 shadow-xs">
                            <Check className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Current Cover Photo</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetPrimary(idx);
                            }}
                            className="w-full py-1.5 text-[11px] font-extrabold text-slate-100 hover:text-slate-950 text-center bg-slate-900/90 hover:bg-cyan-400 border border-slate-700 hover:border-cyan-300 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                            title="Set this photo as primary cover photo"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:text-slate-950" />
                            <span>Make Cover Photo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. TEXT DETAILS: TITLE, DESIGN CODE, MATERIAL & CATEGORY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-300 block mb-1">
                🏷️ Design Code / SKU
              </label>
              <input
                type="text"
                value={designCode}
                onChange={(e) => setDesignCode(e.target.value)}
                placeholder="e.g. SHV-D105 or D-8842"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-300 block mb-1">
                🧵 Fabric / Material
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. Pure Cotton Cambric / Pure Georgette"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-300 block mb-1">
                Dress Title (With Emojis & Style)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="👗 Premium Western Partywear Gown 👗"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="Partywear Gowns">Partywear Gowns</option>
                <option value="Cotton Cambric">Cotton Cambric</option>
                <option value="Western Wear">Western Wear</option>
                <option value="Festive & Ethnic">Festive & Ethnic</option>
                <option value="Maxi Dresses">Maxi Dresses</option>
                <option value="Casual Outing">Casual Outing</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-300 block mb-1">
              Subtitle / Pattern Description
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Designer Printed Cotton Cambric Flared Gown"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs font-black text-slate-300 block mb-1">
              📝 Detailed Product Overview (Lengthy Description)
            </label>
            <textarea
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Paste or write detailed specifications, length, inclusions, care instructions..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* 3. MARGIN 40% & DISCOUNT HIGHLIGHT CALCULATOR */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <span className="text-xs sm:text-sm font-black text-white">
                  Pricing, 40% Margin & Discount Highlight Settings
                </span>
              </div>
              <span className="text-[11px] font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                40% Margin Configured
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Base Cost Price (₹)
                </label>
                <input
                  type="number"
                  value={baseCostINR}
                  onChange={(e) => handleBaseCostChange(Number(e.target.value))}
                  min="50"
                  step="1"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Margin Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={marginPercent}
                    onChange={(e) => handleMarginChange(Number(e.target.value))}
                    min="1"
                    max="200"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                  />
                  <Percent className="w-3.5 h-3.5 text-cyan-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-cyan-300 block mb-1">
                  Final Selling Price (₹)
                </label>
                <input
                  type="number"
                  value={priceINR}
                  onChange={(e) => setPriceINR(Number(e.target.value))}
                  min="50"
                  className="w-full bg-cyan-950/60 border border-cyan-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-cyan-300 font-mono font-black focus:outline-none"
                />
              </div>
            </div>

            {/* Discount Provision & Thumbnail Highlight */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                  <input
                    type="checkbox"
                    checked={showDiscount}
                    onChange={(e) => setShowDiscount(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>Provision to show Discount Badge highlighted on product photo thumbnail</span>
                </label>
                {showDiscount && (
                  <span className="text-[10px] uppercase font-black text-rose-400 bg-rose-950/70 px-2 py-0.5 rounded border border-rose-800">
                    Badge Active
                  </span>
                )}
              </div>

              {showDiscount && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Discount Percentage (% OFF)
                    </label>
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => handleDiscountChange(Number(e.target.value))}
                      min="1"
                      max="90"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Original MRP (₹ Slashed Price)
                    </label>
                    <input
                      type="number"
                      value={mrpINR}
                      onChange={(e) => setMrpINR(Number(e.target.value))}
                      min="100"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Charge Specification: 80/- added at cart and checkout */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>Delivery Charge:</span>
                <input
                  type="number"
                  value={deliveryChargeINR}
                  onChange={(e) => setDeliveryChargeINR(Number(e.target.value))}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-300 font-mono font-bold"
                />
                <span className="text-slate-400">₹80/- (added when added to cart & checkout time)</span>
              </div>
            </div>
          </div>

          {/* 4. SIZES CHECKLIST (M | L | XL | XXL) */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 block">
              📏 Available Sizes (Select all that apply)
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {allAvailableSizes.map((sz) => {
                const isSelected = sizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-sm'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {sz} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. FINE-TUNED BULLET POINTS / HIGHLIGHTS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Text Details & Feature Highlights</span>
              </label>
              <button
                type="button"
                onClick={() => setFeatures(defaultFeatures)}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Reset to Sample Specifications
              </button>
            </div>

            <div className="space-y-1.5">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => {
                      const updated = [...features];
                      updated[idx] = e.target.value;
                      setFeatures(updated);
                    }}
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                placeholder="Add bullet highlight (e.g. ✨ Flared Bottom Hemline)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addFeature();
                  }
                }}
              />
              <button
                type="button"
                onClick={addFeature}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* 6. BOTTOM TAGLINE */}
          <div>
            <label className="text-xs font-black text-slate-300 block mb-1">
              💖 Bottom Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="💖 Trendy Look • Premium Feel • Perfect Style 💖"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-pink-300 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialDress ? 'Update Dress' : 'Publish Dress to Shivora Collections'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
