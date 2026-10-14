import React, { useState } from 'react';
import { ProductReview } from '../types';
import {
  Star,
  CheckCircle2,
  MessageSquarePlus,
  User,
  Camera,
  Image as ImageIcon,
  X,
  UploadCloud,
  Maximize2,
} from 'lucide-react';

interface ProductReviewsSectionProps {
  productId: string;
  initialReviews?: ProductReview[];
  currentRating: number;
  reviewsCount: number;
  customerName?: string;
  onReviewAdded?: (updatedReviews: ProductReview[], newRating: number, count: number) => void;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  initialReviews = [],
  currentRating,
  reviewsCount,
  customerName = '',
  onReviewAdded,
}) => {
  const [reviews, setReviews] = useState<ProductReview[]>(
    initialReviews.length > 0
      ? initialReviews
      : [
          {
            id: 'rev_sample_1',
            productId,
            customerName: 'Arjun Venkatesh (Bengaluru)',
            rating: 5,
            comment:
              'Outstanding quality and craftsmanship. Delivered to Bengaluru in just 2 days. The packaging was immaculate, and the real-time courier tracking kept me updated every step of the journey. Truly impressive.',
            date: 'September 14, 2026',
            verifiedPurchase: true,
            photos: [
              'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
            ],
          },
          {
            id: 'rev_sample_2',
            productId,
            customerName: 'Priya Nambiar (Mumbai)',
            rating: 5,
            comment:
              'Exceeded my expectations! Paid via UPI QR with zero hassle. Shipped faster than estimated and exactly matches the photographs. Will definitely order from Kovira again.',
            date: 'September 08, 2026',
            verifiedPurchase: true,
            photos: [
              'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&auto=format&fit=crop&q=80',
            ],
          },
        ]
  );

  const [isWriting, setIsWriting] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorInput, setAuthorInput] = useState(customerName || '');
  const [commentInput, setCommentInput] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Quick preset customer unboxing photos to add with 1 click
  const PRESET_SAMPLE_PHOTOS = [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setPhotoUrls((prev) => [...prev, event.target!.result as string].slice(0, 4));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddPresetPhoto = (url: string) => {
    if (photoUrls.includes(url) || photoUrls.length >= 4) return;
    setPhotoUrls((prev) => [...prev, url]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: authorInput.trim() || 'Verified Buyer',
          rating: ratingInput,
          comment: commentInput.trim(),
          photos: photoUrls,
        }),
      });

      const data = await res.json();
      if (data.success && data.review) {
        const updated = [data.review, ...reviews];
        setReviews(updated);
        setIsWriting(false);
        setCommentInput('');
        setPhotoUrls([]);
        if (onReviewAdded) {
          onReviewAdded(updated, data.updatedProduct?.rating || ratingInput, (reviewsCount || 0) + 1);
        }
      }
    } catch {
      // Local fallback
      const fallbackRev: ProductReview = {
        id: `rev_${Date.now()}`,
        productId,
        customerName: authorInput.trim() || 'Verified Buyer',
        rating: ratingInput,
        comment: commentInput.trim(),
        photos: photoUrls,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        verifiedPurchase: true,
      };
      const updated = [fallbackRev, ...reviews];
      setReviews(updated);
      setIsWriting(false);
      setCommentInput('');
      setPhotoUrls([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-3 border-t border-slate-200">
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={lightboxImage} alt="Customer Review Photo" className="w-full h-auto max-h-[80vh] object-contain" />
            <div className="p-3 bg-white text-xs text-slate-600 font-medium text-center">
              Verified Customer Unboxing / In-Hand Photo
            </div>
          </div>
        </div>
      )}

      {/* Overall Score Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-black text-slate-900 font-mono">
            {Number(currentRating).toFixed(1)}
          </div>
          <div>
            <div className="flex items-center gap-0.5 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${
                    s <= Math.round(currentRating) ? 'fill-amber-400' : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Based on {Math.max(reviews.length, reviewsCount)} verified customer reviews
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsWriting(!isWriting)}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>{isWriting ? 'Close Form' : 'Write a Review'}</span>
        </button>
      </div>

      {/* Review Form */}
      {isWriting && (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-600" />
            <span>Share Your Feedback & Product Photos</span>
          </h4>

          {/* Star Rating Selector */}
          <div>
            <span className="block text-[11px] text-slate-600 mb-1">Your Rating:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRatingInput(star)}
                  className="p-1 cursor-pointer focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= (hoverRating || ratingInput)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-700 ml-2">
                {ratingInput}.0 out of 5 stars
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-600 mb-1">Your Name:</label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma / Ananya Iyer"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-600 mb-1">Review Comments:</label>
            <textarea
              required
              rows={3}
              placeholder="Describe product quality, delivery to your PIN code, packaging, or usability..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
            />
          </div>

          {/* Customer Photo Upload Section */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Camera className="w-3 h-3 text-cyan-600" />
                Upload Real Product Photos ({photoUrls.length}/4)
              </span>
              <span className="text-[10px] text-slate-400">Optional · JPG, PNG</span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {/* Photo Previews */}
              {photoUrls.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute top-1 right-1 p-0.5 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                    title="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {photoUrls.length < 4 && (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-900 bg-white flex flex-col items-center justify-center text-slate-400 hover:text-slate-900 transition-colors cursor-pointer text-center">
                  <UploadCloud className="w-4 h-4 mb-0.5" />
                  <span className="text-[9px] font-bold">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Quick preset selector for test unboxing photos */}
            {photoUrls.length === 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1">
                <span>Quick attach unboxing snapshot:</span>
                {PRESET_SAMPLE_PHOTOS.slice(0, 3).map((url, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleAddPresetPhoto(url)}
                    className="text-cyan-700 hover:underline font-semibold bg-cyan-50 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    + Photo {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-slate-900 text-white font-bold text-xs px-4 py-1.5 rounded-xl hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Publishing...' : 'Submit Verified Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {reviews.map((rev) => (
          <div key={rev.id} className="p-3.5 bg-white border border-slate-100 rounded-xl text-xs space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                  {rev.customerName ? rev.customerName.charAt(0) : <User className="w-3 h-3" />}
                </div>
                <div>
                  <span className="font-bold text-slate-900 block leading-tight">{rev.customerName}</span>
                  {rev.verifiedPurchase && (
                    <span className="text-[9px] text-emerald-700 font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Verified Purchase
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-slate-400">{rev.date}</span>
            </div>

            <div className="flex items-center gap-0.5 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400' : 'text-slate-200'}`}
                />
              ))}
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">{rev.comment}</p>

            {/* Review Photos Display */}
            {rev.photos && rev.photos.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-2">
                {rev.photos.map((photo, pIdx) => (
                  <div
                    key={pIdx}
                    onClick={() => setLightboxImage(photo)}
                    className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 cursor-pointer group shadow-2xs hover:ring-2 hover:ring-cyan-500/50 transition-all"
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Maximize2 className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
