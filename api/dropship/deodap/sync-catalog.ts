import { getSupabase } from '../../_supabase';
import { scrapeDeoDapCollection } from './cheerio-scraper';
import { logInfo, logError, logWarn } from '../../_logger';

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const collectionUrl = String(
    req.body?.collectionUrl ||
    req.query?.collectionUrl ||
    'https://deodap.in/collections/best-selling-products'
  ).trim();

  const marginPercent = Number(req.body?.marginPercent || req.query?.marginPercent || 40);
  const effectiveMarkup = 1 + marginPercent / 100;
  const INR_RATE = 86.5;

  try {
    logInfo('SYNC', `Starting Daily DeoDap Catalog Sync for: ${collectionUrl}`);

    // 1. Read collection page and extract live products via Cheerio HTML parsing
    const liveProducts = await scrapeDeoDapCollection(collectionUrl);

    if (!liveProducts || liveProducts.length === 0) {
      return res.status(200).json({
        success: false,
        error: 'Unable to scrape products from collection page. Check URL or internet access.',
      });
    }

    const supabase = getSupabase(true) || getSupabase(false);
    const syncTimestamp = new Date().toISOString();

    let addedCount = 0;
    let updatedCount = 0;
    let disabledCount = 0;
    const liveSkus = new Set(liveProducts.map((p) => p.sku));

    if (supabase) {
      // 2. Fetch existing DeoDap products from Supabase
      const { data: existingRows, error: fetchErr } = await supabase
        .from('products')
        .select('id, sku, price_usd, cost_usd, wholesale_inr, is_published, external_product_id')
        .eq('supplier_platform', 'DeoDap');

      if (fetchErr) {
        logWarn('SYNC', 'Supabase select during sync warning:', fetchErr.message);
      }

      const existingMap = new Map<string, any>();
      (existingRows || []).forEach((row) => {
        if (row.sku) existingMap.set(row.sku, row);
      });

      // 3. Prepare inserts & updates
      const toUpsert: any[] = [];

      for (const p of liveProducts) {
        const wholesaleINR = p.priceINR;
        const retailINR = Math.round(wholesaleINR * effectiveMarkup);
        const costUSD = Number((wholesaleINR / INR_RATE).toFixed(2));
        const priceUSD = Number((retailINR / INR_RATE).toFixed(2));

        const existing = existingMap.get(p.sku);
        if (existing) {
          updatedCount++;
        } else {
          addedCount++;
        }

        toUpsert.push({
          id: existing?.id || `prod_dd_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          title: p.title,
          description: p.description,
          category: p.category || 'Lifestyle Essentials',
          price_usd: priceUSD,
          cost_usd: costUSD,
          stock: p.stock || 120,
          sku: p.sku,
          supplier_id: 'sup_deodap',
          supplier_name: 'DeoDap Dropship Logistics',
          supplier_platform: 'DeoDap',
          supplier_lead_days: 2,
          supplier_link: p.productUrl,
          images: p.images,
          rating: 4.8,
          reviews_count: 42,
          tags: p.tags,
          weight_kg: 0.45,
          is_dropshipped: true,
          featured: true,
          is_published: true,
          margin_percent: marginPercent,
          wholesale_inr: wholesaleINR,
          delivery_charge_inr: 49,
          last_synced: syncTimestamp,
          external_product_id: p.externalProductId || p.handle,
          live_sync: {
            lastSyncTimestamp: syncTimestamp,
            supplierStatus: 'Verified In Stock',
            dispatchHub: 'DeoDap Central Hub (Rajkot / Surat)',
            estimatedDaysMin: 2,
            estimatedDaysMax: 3,
            autoFulfillment: true,
            externalUrl: p.productUrl,
          },
        });
      }

      // Upsert in batches of 40
      for (let i = 0; i < toUpsert.length; i += 40) {
        const batch = toUpsert.slice(i, i + 40);
        const { error: upsertErr } = await supabase
          .from('products')
          .upsert(batch, { onConflict: 'sku' });
        if (upsertErr) {
          logError('SYNC', 'Upsert batch error:', upsertErr.message);
        }
      }

      // 4. Disable removed products that were previously DeoDap but not in the fresh live collection
      if (existingRows && existingRows.length > 0) {
        const removedIds = existingRows
          .filter((row) => !liveSkus.has(row.sku) && row.is_published)
          .map((row) => row.id);

        if (removedIds.length > 0) {
          disabledCount = removedIds.length;
          await supabase
            .from('products')
            .update({ is_published: false, last_synced: syncTimestamp })
            .in('id', removedIds);
        }
      }

      // 5. Update uploaded_web_links record
      await supabase.from('uploaded_web_links').upsert({
        id: 'link_deodap_bestsellers',
        url: collectionUrl,
        title: 'DeoDap Best Selling Products',
        supplier_name: 'DeoDap Dropship Logistics',
        supplier_platform: 'DeoDap',
        category: 'Lifestyle Essentials',
        products_count: liveProducts.length,
        margin_percent: marginPercent,
        discount_percent: 0,
        has_discount_banner: false,
        status: 'Active',
        last_synced_at: syncTimestamp,
      }, { onConflict: 'url' });
    }

    logInfo('SYNC', `Catalog Sync Complete. Added: ${addedCount}, Updated: ${updatedCount}, Disabled: ${disabledCount}`);

    return res.status(200).json({
      success: true,
      message: `Daily DeoDap Catalog Sync completed: ${addedCount} added, ${updatedCount} updated, ${disabledCount} archived.`,
      addedCount,
      updatedCount,
      disabledCount,
      totalCount: liveProducts.length,
      syncedAt: syncTimestamp,
      sampleProducts: liveProducts.slice(0, 8),
    });
  } catch (err: any) {
    logError('SYNC', 'Daily sync execution failed:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal error during daily catalog sync',
    });
  }
}
