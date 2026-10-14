/**
 * Universal Product & Image Normalizer
 * Resolves naming mismatches across all sources:
 * - images vs image vs Images vs Image vs image_url vs imageUrl vs imageSrc vs photo
 * - products vs product
 * - title vs name vs Title vs Name
 * - sku vs handle vs item_code vs variant_sku
 * - wholesale_inr vs wholesaleINR vs cost_usd vs price_usd
 */

export const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&auto=format&fit=crop&q=80';

/**
 * Safely extracts an array of clean image URL strings from any input format
 * (array of objects with .src, array of strings, single string, comma-separated string, JSON string, etc.)
 */
export function normalizeProductImages(input: any): string[] {
  if (!input) return [DEFAULT_PRODUCT_IMAGE];

  let rawList: any[] = [];

  // Check if input itself is a product-like object
  const candidate =
    input.images ??
    input.Images ??
    input.image ??
    input.Image ??
    input.image_url ??
    input.imageUrl ??
    input.imageSrc ??
    input.image_src ??
    input.primaryImage ??
    input.primary_image ??
    input.photos ??
    input.photo ??
    input.img ??
    input.img_url ??
    input.thumbnail ??
    input.src ??
    input;

  if (Array.isArray(candidate)) {
    rawList = candidate;
  } else if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          rawList = parsed;
        } else {
          rawList = [trimmed];
        }
      } catch {
        rawList = [trimmed];
      }
    } else if (trimmed.includes(',') && !trimmed.includes('base64')) {
      rawList = trimmed.split(',').map((s) => s.trim());
    } else if (trimmed.length > 0) {
      rawList = [trimmed];
    }
  } else if (candidate && typeof candidate === 'object') {
    // Single image object
    const src = candidate.src || candidate.url || candidate.image_url || candidate.image;
    if (src) rawList = [src];
  }

  const cleanUrls: string[] = [];

  for (const item of rawList) {
    if (!item) continue;
    let url = '';

    if (typeof item === 'string') {
      url = item.trim();
    } else if (typeof item === 'object') {
      url = String(item.src || item.url || item.image_url || item.image || '').trim();
    }

    if (!url || url === '[object Object]') continue;

    // Fix protocol-relative URLs (e.g. //cdn.shopify.com)
    if (url.startsWith('//')) {
      url = `https:${url}`;
    }

    // Clean up Shopify thumbnail dimensions to get high-res images if possible
    url = url.replace(/_(small|compact|medium|grande)\./i, '.');

    if (!cleanUrls.includes(url)) {
      cleanUrls.push(url);
    }
  }

  return cleanUrls.length > 0 ? cleanUrls : [DEFAULT_PRODUCT_IMAGE];
}

/**
 * Returns primary single image URL for a product or image input
 */
export function getPrimaryImage(input: any): string {
  const imgs = normalizeProductImages(input);
  return imgs[0] || DEFAULT_PRODUCT_IMAGE;
}

/**
 * Normalizes title by removing supplier/vendor prefixes for a clean storefront presentation
 */
export function cleanProductTitle(rawTitle: string = ''): string {
  if (!rawTitle) return 'Curated Essential';
  return rawTitle
    .replace(/^(DeoDap|Deodap|Baapstore|CJdropshipping|CJ|Meesho|AliExpress)\s*[-–—:|]*\s*/gi, '')
    .trim();
}

/**
 * Normalizes HTML description to clean readable text
 */
export function cleanProductDescription(rawHtml: string = ''): string {
  if (!rawHtml) return 'Verified quality product inspected and dispatched with priority tracking.';
  return rawHtml
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .replace(/DeoDap/gi, 'Curated Direct')
    .trim();
}
