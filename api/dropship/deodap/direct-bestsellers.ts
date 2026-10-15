import { DEODAP_CATEGORIES_DATA } from '../../../src/data/deodapCategories';
import { DROPSHIP_CATALOG_ITEMS } from '../../../src/data/dropshipSuppliersData';

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const markupMultiplier = Number(req.query?.markup) || 1.4;
  let collection = String(req.query?.collection || 'best-selling-products').trim();

  // Extract collection handle if full URL passed
  if (collection.includes('/collections/')) {
    const match = collection.match(/\/collections\/([^/?#]+)/i);
    if (match) collection = match[1];
  }
  collection = collection.replace(/[^a-zA-Z0-9_\-]/g, '') || 'best-selling-products';

  const INR_RATE = 86.5;
  const marginPercent = Math.round((markupMultiplier - 1) * 100);

  // Helper to build fallback list from our authentic category catalog
  const getFallbackProducts = () => {
    const list: any[] = [];

    // First include all category items
    for (const cat of DEODAP_CATEGORIES_DATA) {
      for (const p of cat.sampleProducts) {
        const wholesaleINR = p.wholesaleINR;
        const retailINR = Math.round(wholesaleINR * markupMultiplier);
        const profitINR = retailINR - wholesaleINR;
        const costUSD = Number((wholesaleINR / INR_RATE).toFixed(2));
        const priceUSD = Number((costUSD * markupMultiplier).toFixed(2));

        list.push({
          deodapId: Math.floor(10000 + Math.random() * 90000),
          handle: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: p.title,
          cleanDescription: p.description,
          wholesaleINR,
          compareINR: Math.round(wholesaleINR * 1.5),
          retailINR,
          profitINR,
          marginPercent,
          deliveryChargeINR: 49,
          costUSD,
          priceUSD,
          sku: p.sku,
          stock: p.stock,
          isAvailable: true,
          images: [p.image],
          primaryImage: p.image,
          supplierLink: p.supplierLink,
          isLinkedToAdmin: true,
          isPublished: false,
          alreadyInStore: false,
          tags: ['DeoDap', cat.name, p.subcategory, 'Catalog Direct'],
          vendor: 'DeoDap Dropship Logistics',
          productType: cat.name,
          subcategory: p.subcategory,
        });
      }
    }

    // Also include DROPSHIP_CATALOG_ITEMS from DeoDap
    for (const p of DROPSHIP_CATALOG_ITEMS) {
      if (p.platform === 'DeoDap') {
        const wholesaleINR = Math.round(p.costUSD * INR_RATE);
        const retailINR = Math.round(wholesaleINR * markupMultiplier);
        const profitINR = retailINR - wholesaleINR;

        list.push({
          deodapId: Math.floor(10000 + Math.random() * 90000),
          handle: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: p.title,
          cleanDescription: p.description,
          wholesaleINR,
          compareINR: Math.round(wholesaleINR * 1.6),
          retailINR,
          profitINR,
          marginPercent,
          deliveryChargeINR: 49,
          costUSD: p.costUSD,
          priceUSD: Number((p.costUSD * markupMultiplier).toFixed(2)),
          sku: p.sku || `DD-${Date.now()}`,
          stock: p.stock || 120,
          isAvailable: true,
          images: p.images,
          primaryImage: p.images[0],
          supplierLink: p.supplierLink,
          isLinkedToAdmin: true,
          isPublished: false,
          alreadyInStore: false,
          tags: p.tags,
          vendor: 'DeoDap Dropship Logistics',
          productType: p.category,
        });
      }
    }

    return list;
  };

  // Try live fetch with short timeout to protect against hang or Cloudflare 403
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const fetchUrl = `https://deodap.in/collections/${encodeURIComponent(collection)}/products.json?limit=250&page=1`;
    const resp = await fetch(fetchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (resp.ok) {
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json: any = await resp.json();
        const rawProducts = Array.isArray(json.products) ? json.products : [];

        if (rawProducts.length > 0) {
          const formattedList = rawProducts.map((p: any) => {
            const mainVariant = p.variants?.[0] || {};
            const wholesaleINR = Number(mainVariant.price) || 120;
            const compareINR = Number(mainVariant.compare_at_price) || Math.round(wholesaleINR * 1.5);
            const marginAmountINR = Math.round(wholesaleINR * (marginPercent / 100));
            const retailINR = wholesaleINR + marginAmountINR;
            const costUSD = Number((wholesaleINR / INR_RATE).toFixed(2));
            const priceUSD = Number((costUSD * markupMultiplier).toFixed(2));
            const sku = mainVariant.sku || (p.handle ? `DD-${p.handle.slice(0, 10).toUpperCase()}` : `DD-${p.id}`);

            const images = Array.isArray(p.images)
              ? p.images.map((img: any) => (typeof img === 'string' ? img : img.src)).filter(Boolean)
              : [p.image?.src || 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800'];

            return {
              deodapId: p.id,
              handle: p.handle || sku.toLowerCase(),
              title: (p.title || 'Curated Essential').replace(/^(DeoDap|Deodap)\s*[-–—:]*\s*/gi, '').trim(),
              cleanDescription: (p.body_html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || 'Factory direct item from DeoDap Central Logistics Hub, Gujarat.',
              wholesaleINR,
              compareINR,
              retailINR,
              profitINR: marginAmountINR,
              marginPercent,
              deliveryChargeINR: 49,
              costUSD,
              priceUSD,
              sku,
              stock: mainVariant.inventory_quantity ?? 150,
              isAvailable: mainVariant.available !== false,
              images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800'],
              primaryImage: images[0] || 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800',
              supplierLink: `https://deodap.in/products/${p.handle}`,
              isLinkedToAdmin: true,
              isPublished: false,
              alreadyInStore: false,
              tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? p.tags.split(',') : ['DeoDap']),
              vendor: p.vendor || 'DeoDap',
              productType: p.product_type || 'Lifestyle Essentials',
            };
          });

          return res.status(200).json({
            success: true,
            collection,
            count: formattedList.length,
            isLive: true,
            products: formattedList,
          });
        }
      }
    }
  } catch (err) {
    // Network/timeout error - fall through to curated backup
    console.warn('Live DeoDap fetch fell back to curated products:', err);
  }

  // Graceful fallback to rich curated catalog
  const fallbackList = getFallbackProducts();
  return res.status(200).json({
    success: true,
    collection,
    count: fallbackList.length,
    isLive: false,
    message: 'Loaded verified authentic DeoDap pipeline items with 40-50% margins',
    products: fallbackList,
  });
}
