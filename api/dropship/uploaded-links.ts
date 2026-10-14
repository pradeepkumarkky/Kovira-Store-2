import { getSupabase } from '../_supabase';

// In-memory fallback if Supabase table is not yet migrated or credentials not set
let fallbackUploadedLinks: any[] = [];

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getSupabase(true);

  // GET: Retrieve list of uploaded web links
  if (req.method === 'GET') {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('uploaded_web_links')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const links = data.map((d: any) => ({
            id: d.id,
            url: d.url,
            supplierName: d.supplier_name || 'DeoDap Direct Dropshipping',
            detectedDomain: d.url ? (() => { try { return new URL(d.url).hostname; } catch { return 'deodap.in'; } })() : 'deodap.in',
            uploadedAt: d.last_synced_at || d.created_at || new Date().toISOString(),
            marginPercent: Number(d.margin_percent) || 50,
            productsCount: Number(d.products_count) || 1,
            productTitles: [d.title],
            status: d.status === 'Active' ? 'Active in Store' : 'Synced',
            sampleImage: d.sample_image || '',
            discountPercent: Number(d.discount_percent) || 0,
            discountBanner: d.discount_banner_text || '',
          }));

          // Merge any fallback links
          for (const fl of fallbackUploadedLinks) {
            if (!links.some((l: any) => l.id === fl.id || l.url === fl.url)) {
              links.push(fl);
            }
          }

          return res.status(200).json({
            success: true,
            links,
            count: links.length,
            source: 'supabase',
          });
        }
      } catch (err: any) {
        console.warn('Supabase get uploaded_web_links error:', err.message);
      }
    }

    return res.status(200).json({
      success: true,
      links: fallbackUploadedLinks,
      count: fallbackUploadedLinks.length,
      source: 'fallback',
    });
  }

  // PUT: Update margin, discount percentage and promotional banner for link
  if (req.method === 'PUT') {
    const { id, marginPercent, discountPercent, discountBanner, title } = req.body || {};
    const linkId = id || req.query?.id || req.url?.split('/').pop();

    if (!linkId) {
      return res.status(400).json({ success: false, error: 'Link ID is required for update' });
    }

    const marginVal = marginPercent !== undefined ? Number(marginPercent) : 50;
    const discountVal = discountPercent !== undefined ? Number(discountPercent) : 0;
    const bannerVal = discountBanner || (discountVal > 0 ? `FLAT ${discountVal}% OFF` : '');

    // Update in Supabase
    if (supabase) {
      try {
        await supabase
          .from('uploaded_web_links')
          .update({
            margin_percent: marginVal,
            discount_percent: discountVal,
            has_discount_banner: Boolean(bannerVal || discountVal > 0),
            discount_banner_text: bannerVal,
            supplier_name: title || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', linkId);
      } catch (err: any) {
        console.warn('Supabase update link error:', err.message);
      }
    }

    // Update in-memory fallback
    const idx = fallbackUploadedLinks.findIndex((l) => l.id === linkId);
    if (idx >= 0) {
      fallbackUploadedLinks[idx].marginPercent = marginVal;
      fallbackUploadedLinks[idx].discountPercent = discountVal;
      fallbackUploadedLinks[idx].discountBanner = bannerVal;
      if (title) fallbackUploadedLinks[idx].supplierName = title;
    }

    return res.status(200).json({
      success: true,
      message: 'Uploaded link and product discount banner updated successfully with cost protection!',
      link: idx >= 0 ? fallbackUploadedLinks[idx] : { id: linkId, marginPercent: marginVal, discountPercent: discountVal, discountBanner: bannerVal },
    });
  }

  // DELETE: Remove uploaded web link
  if (req.method === 'DELETE') {
    const linkId = req.body?.id || req.query?.id || req.url?.split('/').pop();

    if (supabase && linkId) {
      try {
        await supabase.from('uploaded_web_links').delete().eq('id', linkId);
      } catch (err: any) {
        console.warn('Supabase delete link error:', err.message);
      }
    }

    fallbackUploadedLinks = fallbackUploadedLinks.filter((l) => l.id !== linkId);

    return res.status(200).json({
      success: true,
      message: 'Uploaded link record removed from list.',
      links: fallbackUploadedLinks,
    });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
