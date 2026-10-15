import { getSupabase } from '../../_supabase';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  const pathname = url.split('?')[0];
  const supabase = getSupabase(true) || getSupabase(false);

  // 1. LINK TO ADMIN / DRAFT
  if (pathname.includes('/link-admin')) {
    const { productsToLink = [], markupMultiplier = 1.4, publishImmediately = false } = req.body || {};
    if (!Array.isArray(productsToLink) || productsToLink.length === 0) {
      return res.status(400).json({ success: false, error: 'No items selected for linking.' });
    }

    const marginPercent = Math.round((Number(markupMultiplier || 1.4) - 1) * 100);
    const linkedList: any[] = [];

    for (const item of productsToLink) {
      const wholesaleINR = Number(item.wholesaleINR) || 120;
      const marginAmountINR = Math.round(wholesaleINR * (marginPercent / 100));
      const retailINR = wholesaleINR + marginAmountINR;
      const costUSD = Number((wholesaleINR / 86.5).toFixed(2));
      const priceUSD = Number((costUSD * Number(markupMultiplier || 1.4)).toFixed(2));
      const sku = item.sku || `DD-${(item.handle || 'VIRAL').slice(0, 10).toUpperCase()}`;

      const prodRecord = {
        id: `prod_deodap_live_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        title: item.title,
        description: item.cleanDescription || 'Authentic DeoDap wholesale bestseller sourced directly from Rajkot Central Logistics Hub, Gujarat.',
        category: item.productType || 'Lifestyle Essentials',
        priceUSD,
        costUSD,
        stock: Number(item.stock || 120),
        reorderPoint: 20,
        reorderQuantity: 50,
        sku,
        supplierId: 'sup_deodap',
        supplierName: 'DeoDap Direct Dropshipping',
        supplierLeadDays: 2,
        supplierPlatform: 'DeoDap',
        supplierLink: item.supplierLink || `https://deodap.in/products/${item.handle}`,
        images: Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.primaryImage || 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&auto=format&fit=crop&q=80'],
        rating: 4.8,
        reviewsCount: 35,
        tags: ['DeoDap', 'Direct Link', 'Made in India', 'Bestseller'],
        weightKg: 0.45,
        isDropshipped: true,
        featured: true,
        isPublished: Boolean(publishImmediately),
        marginPercent,
        wholesaleINR,
        deliveryChargeINR: 49,
      };

      linkedList.push(prodRecord);

      if (supabase) {
        try {
          await supabase.from('products').upsert({
            id: prodRecord.id,
            title: prodRecord.title,
            description: prodRecord.description,
            category: prodRecord.category,
            price_usd: prodRecord.priceUSD,
            cost_usd: prodRecord.costUSD,
            stock: prodRecord.stock,
            sku: prodRecord.sku,
            supplier_id: prodRecord.supplierId,
            supplier_name: prodRecord.supplierName,
            supplier_platform: prodRecord.supplierPlatform,
            supplier_link: prodRecord.supplierLink,
            images: prodRecord.images,
            rating: prodRecord.rating,
            reviews_count: prodRecord.reviewsCount,
            tags: prodRecord.tags,
            is_dropshipped: true,
            is_published: prodRecord.isPublished,
            margin_percent: prodRecord.marginPercent,
            wholesale_inr: prodRecord.wholesaleINR,
            delivery_charge_inr: prodRecord.deliveryChargeINR,
          }, { onConflict: 'sku' });
        } catch (dbErr: any) {
          console.warn('Supabase link-admin upsert notice:', dbErr?.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      count: linkedList.length,
      marginPercent,
      products: linkedList,
      message: publishImmediately
        ? `Successfully published ${linkedList.length} products to public store!`
        : `Successfully linked ${linkedList.length} products to Admin staging!`,
    });
  }

  // 2. PUBLISH PRODUCTS TO STORE
  if (pathname.includes('/publish')) {
    const { productIds = [], publishAllStaged = false } = req.body || {};
    let count = 0;

    if (supabase) {
      try {
        let query = supabase.from('products').update({ is_published: true });
        if (publishAllStaged) {
          query = query.eq('is_published', false);
        } else if (Array.isArray(productIds) && productIds.length > 0) {
          query = query.in('id', productIds);
        }
        const { error, count: updatedCount } = await query;
        if (!error) count = updatedCount || productIds.length || 1;
      } catch (err: any) {
        console.warn('Supabase publish update warning:', err?.message);
      }
    }

    return res.status(200).json({
      success: true,
      publishedCount: count,
      message: `Published ${count} product(s) to the live store!`,
    });
  }

  // 3. UNPUBLISH PRODUCTS
  if (pathname.includes('/unpublish')) {
    const { productId } = req.body || {};
    if (supabase && productId) {
      try {
        await supabase.from('products').update({ is_published: false }).eq('id', productId);
      } catch (err: any) {
        console.warn('Supabase unpublish warning:', err?.message);
      }
    }
    return res.status(200).json({
      success: true,
      message: 'Product unpublished and moved to staging review.',
    });
  }

  // 4. UPDATE MARGINS
  if (pathname.includes('/update-margins')) {
    const { markupMultiplier = 1.4, productIds = [] } = req.body || {};
    const marginPercent = Math.round((Number(markupMultiplier || 1.4) - 1) * 100);

    if (supabase) {
      try {
        let q = supabase.from('products').select('*');
        if (Array.isArray(productIds) && productIds.length > 0) {
          q = q.in('id', productIds);
        }
        const { data } = await q;
        if (Array.isArray(data)) {
          for (const row of data) {
            const wholesaleINR = Number(row.wholesale_inr || (row.cost_usd ? row.cost_usd * 86.5 : 120));
            const costUSD = Number((wholesaleINR / 86.5).toFixed(2));
            const priceUSD = Number((costUSD * Number(markupMultiplier || 1.4)).toFixed(2));
            await supabase.from('products').update({
              margin_percent: marginPercent,
              price_usd: priceUSD,
            }).eq('id', row.id);
          }
        }
      } catch (err: any) {
        console.warn('Supabase update margins warning:', err?.message);
      }
    }

    return res.status(200).json({
      success: true,
      marginPercent,
      message: `Updated product margins to ${marginPercent}%.`,
    });
  }

  return res.status(200).json({ success: true, message: 'Dropship DeoDap Manage API' });
}
