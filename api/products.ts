import { getSupabase } from './_supabase';

const DEFAULT_PRODUCTS = [
  {
    id: 'prod_deodap_garlic_press',
    title: 'Garlic Press – Rocking Stainless Steel Ginger Mincer for Kitchen | GripChef',
    description: 'Rocking stainless steel garlic press mincer with ergonomic grip plate.',
    category: 'Smart Kitchen',
    priceUSD: 0.65,
    costUSD: 0.46,
    stock: 450,
    reorderPoint: 30,
    reorderQuantity: 100,
    sku: '2350_loose_round_garlic_press',
    supplierId: 'sup_deodap',
    supplierName: 'DeoDap Direct Dropshipping',
    supplierLeadDays: 2,
    supplierPlatform: 'DeoDap',
    images: [
      'https://cdn.shopify.com/s/files/1/0782/3284/6646/products/3_b4de9637-77e7-4abb-acf4-1c539cd20dfd.jpg?v=1737634830',
      'https://cdn.shopify.com/s/files/1/0782/3284/6646/products/1_6b4e60cc-1620-467c-a9b2-3fc6ad869a18.jpg?v=1737634830'
    ],
    rating: 4.9,
    reviewsCount: 312,
    tags: ['DeoDap', 'Bestseller', 'GripChef', 'Kitchen Tools'],
    weightKg: 0.18,
    isDropshipped: true,
    featured: true,
    isPublished: true,
    marginPercent: 40,
    wholesaleINR: 40,
    deliveryChargeINR: 49,
  },
  {
    id: 'prod_2',
    title: '4-in-1 Handheld Electric Vegetable Cutter & Meat Mincer Set',
    description: 'Wireless USB rechargeable electric food chopper with ergonomic grip.',
    category: 'Smart Kitchen',
    priceUSD: 3.88,
    costUSD: 2.77,
    stock: 480,
    reorderPoint: 30,
    reorderQuantity: 100,
    sku: 'DEODAP-KIT-101',
    supplierId: 'sup_deodap',
    supplierName: 'DeoDap Direct Dropshipping',
    supplierLeadDays: 2,
    supplierPlatform: 'DeoDap',
    images: [
      'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&auto=format&fit=crop&q=80',
    ],
    rating: 4.9,
    reviewsCount: 142,
    tags: ['Hot Seller', 'DeoDap', 'Smart Kitchen'],
    weightKg: 0.45,
    isDropshipped: true,
    featured: true,
    isPublished: true,
    marginPercent: 40,
    wholesaleINR: 240,
    deliveryChargeINR: 49,
  },
  {
    id: 'prod_deodap_baby_buddha',
    title: 'Baby Buddha Showpiece Set – Peaceful Home & Office Decor | Styleva',
    description: 'Set of 4 charming baby monk Buddha figurines in meditative poses.',
    category: 'Home & Living',
    priceUSD: 1.43,
    costUSD: 1.02,
    stock: 260,
    reorderPoint: 25,
    reorderQuantity: 80,
    sku: '4781_baby_buddha_4pc',
    supplierId: 'sup_deodap',
    supplierName: 'DeoDap Direct Dropshipping',
    supplierLeadDays: 2,
    supplierPlatform: 'DeoDap',
    images: [
      'https://cdn.shopify.com/s/files/1/0782/3284/6646/files/2image_6e9f0fea-3dab-4a36-9db5-1324ae1ab09a.jpg?v=1750933642',
    ],
    rating: 4.9,
    reviewsCount: 240,
    tags: ['DeoDap', 'Styleva', 'Bestseller', 'Home Decor'],
    weightKg: 0.32,
    isDropshipped: true,
    featured: true,
    isPublished: true,
    marginPercent: 40,
    wholesaleINR: 88,
    deliveryChargeINR: 49,
  },
  {
    id: 'prod_deodap_usb_star',
    title: 'USB Star Projector – Dual Mode Disco Light for Car & Home | Styleva',
    description: 'Plug-and-play USB star galaxy atmosphere projector with 360-degree neck.',
    category: 'Smart Gadgets',
    priceUSD: 1.22,
    costUSD: 0.87,
    stock: 520,
    reorderPoint: 40,
    reorderQuantity: 120,
    sku: '7397_car_star_galaxy_light_1pc',
    supplierId: 'sup_deodap',
    supplierName: 'DeoDap Direct Dropshipping',
    supplierLeadDays: 2,
    supplierPlatform: 'DeoDap',
    images: [
      'https://cdn.shopify.com/s/files/1/0782/3284/6646/files/7397_1500x1500_c9375e48-b802-473c-91fa-74f7d8e5dbdb.jpg?v=1786165361',
    ],
    rating: 4.8,
    reviewsCount: 195,
    tags: ['DeoDap', 'Styleva', 'Star Projector', 'Smart Gadgets'],
    weightKg: 0.12,
    isDropshipped: true,
    featured: true,
    isPublished: true,
    marginPercent: 40,
    wholesaleINR: 75,
    deliveryChargeINR: 49,
  },
];

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const country = String(req.query?.country || 'India');
  const includeDrafts = req.query?.admin === 'true' || req.query?.includeDrafts === 'true';

  try {
    const supabase = getSupabase(true) || getSupabase(false);
    let supabaseProducts: any[] = [];

    if (supabase) {
      let data: any[] | null = null;
      let error: any = null;

      // First try query with is_published filter if not admin
      if (!includeDrafts) {
        try {
          const res = await supabase.from('products').select('*').or('is_published.is.null,is_published.eq.true');
          data = res.data;
          error = res.error;
        } catch (e: any) {
          error = e;
        }
      }

      // If error (e.g. column is_published does not exist) or includeDrafts is true, query all products
      if (error || !data || includeDrafts) {
        try {
          const res = await supabase.from('products').select('*');
          if (!res.error && res.data) {
            data = res.data;
            error = null;
          }
        } catch (e: any) {
          console.warn('Fallback select * from products notice:', e?.message);
        }
      }

      if (!error && Array.isArray(data) && data.length > 0) {
        supabaseProducts = data.map((row: any) => {
          const priceUSD = Number(
            row.price_usd ??
            row.priceUSD ??
            row.price ??
            row.retail_price ??
            (row.wholesale_inr ? (Number(row.wholesale_inr) * 1.4) / 86.5 : 2.5)
          );
          const costUSD = Number(
            row.cost_usd ??
            row.costUSD ??
            row.cost ??
            (row.wholesale_inr ? Number(row.wholesale_inr) / 86.5 : priceUSD * 0.65)
          );

          // Support all image column variants: images, Images, image, Image, image_url, imageUrl, photos, photo
          const rawImages =
            row.images ??
            row.Images ??
            row.image ??
            row.Image ??
            row.image_url ??
            row.imageUrl ??
            row.photo ??
            row.photos ??
            row.primary_image ??
            row.thumbnail;

          let images: string[] = [];
          if (Array.isArray(rawImages)) {
            for (const item of rawImages) {
              if (typeof item === 'string' && item.trim()) {
                const u = item.trim();
                images.push(u.startsWith('//') ? `https:${u}` : u);
              } else if (item && typeof item === 'object') {
                const src = item.src || item.url || item.image_url || item.image;
                if (src) {
                  const u = String(src).trim();
                  images.push(u.startsWith('//') ? `https:${u}` : u);
                }
              }
            }
          } else if (typeof rawImages === 'string') {
            const trimmed = rawImages.trim();
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
              try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                  images = parsed.map((x: any) => typeof x === 'string' ? x : (x.src || x.url || '')).filter(Boolean);
                }
              } catch {
                images = [trimmed];
              }
            } else if (trimmed.includes(',') && !trimmed.includes('data:')) {
              images = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
            } else if (trimmed.length > 0) {
              images = [trimmed.startsWith('//') ? `https:${trimmed}` : trimmed];
            }
          }
          if (images.length === 0) {
            images = ['https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&auto=format&fit=crop&q=80'];
          }

          const rawTitle = row.title ?? row.name ?? row.product_name ?? row.product ?? 'Curated Essential';
          const cleanTitle = String(rawTitle).replace(/^(DeoDap|Baapstore|CJdropshipping|CJ)\s*[-–—:]*\s*/gi, '').trim();

          return {
            id: String(row.id || row.sku || `prod_${Date.now()}`),
            title: cleanTitle || 'Curated Essential',
            description: String(row.description || row.body_html || 'Verified lifestyle essential with express priority delivery.'),
            category: String(row.category || row.product_type || 'Lifestyle Essentials'),
            priceUSD: priceUSD > 0 ? priceUSD : 2.5,
            costUSD: costUSD > 0 ? costUSD : 1.5,
            stock: Number(row.stock ?? row.inventory_quantity ?? 50),
            reorderPoint: Number(row.reorder_point ?? 10),
            reorderQuantity: Number(row.reorder_quantity ?? 30),
            sku: String(row.sku || row.id || `KOV-${Math.floor(100 + Math.random() * 900)}`),
            supplierId: String(row.supplier_id || 'sup_deodap'),
            supplierName: String(row.supplier_name || 'Kovira Logistics Hub'),
            supplierPlatform: String(row.supplier_platform || 'DeoDap'),
            supplierLeadDays: Number(row.supplier_lead_days ?? 2),
            supplierLink: String(row.supplier_link || ''),
            images,
            image: images[0],
            rating: Number(row.rating ?? 4.8),
            reviewsCount: Number(row.reviews_count ?? 32),
            tags: Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : ['Bestseller', row.category || 'Lifestyle'],
            weightKg: Number(row.weight_kg ?? 0.4),
            isDropshipped: Boolean(row.is_dropshipped ?? true),
            featured: Boolean(row.featured ?? false),
            isPublished: Boolean(row.is_published ?? true),
            marginPercent: Number(row.margin_percent ?? 40),
            wholesaleINR: Number(row.wholesale_inr ?? Math.round(priceUSD * 60)),
            deliveryChargeINR: Number(row.delivery_charge_inr ?? 49),
            liveSync: {
              destinationCountry: country,
              stock: Number(row.stock ?? row.inventory_quantity ?? 50),
              leadDaysMin: 2,
              leadDaysMax: 4,
              leadDaysLabel: '2–4 business days',
              deliveryEstimate: '2–4 Days Express',
              warehouseOrigin: 'Central Logistics Hub (Rajkot / Surat)',
              carrier: 'Delhivery / Blue Dart Express',
              shippingFeeUSD: 0,
              supplierLink: String(row.supplier_link || ''),
              supplierPlatform: String(row.supplier_platform || 'DeoDap'),
              syncedAt: new Date().toISOString(),
              status: 'Verified Live',
            },
          };
        });
    }

    if (supabaseProducts.length > 0) {
      return res.status(200).json({
        success: true,
        source: 'supabase',
        total: supabaseProducts.length,
        products: supabaseProducts,
        destinationCountry: country,
      });
    }

    // Return default items if Supabase table is not yet populated
    return res.status(200).json({
      success: true,
      source: 'curated_fallback',
      total: DEFAULT_PRODUCTS.length,
      products: DEFAULT_PRODUCTS,
      destinationCountry: country,
    });
  } catch (err: any) {
    console.error('Error in /api/products handler:', err);
    return res.status(200).json({
      success: true,
      source: 'curated_fallback',
      total: DEFAULT_PRODUCTS.length,
      products: DEFAULT_PRODUCTS,
      destinationCountry: country,
    });
  }
}
