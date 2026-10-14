/**
 * Robust CSV Parser supporting RFC-4180 quotes, multiline fields, and Shopify/DeoDap export mapping.
 */

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function parseDeoDapShopifyCSV(csvText: string) {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const findCol = (keywords: string[]) =>
    headers.findIndex((h) => keywords.some((k) => h === k || h.includes(k)));

  const handleIdx = findCol(['handle', 'slug', 'product handle', 'item id', 'id']);
  const titleIdx = findCol(['title', 'name', 'product title', 'product name', 'item name']);
  const bodyIdx = findCol(['body (html)', 'body', 'description', 'desc', 'details']);
  const skuIdx = findCol(['variant sku', 'sku', 'item code', 'code']);
  const priceIdx = findCol(['variant price', 'price', 'retail price', 'selling price', 'mrp']);
  const compareAtIdx = findCol(['variant compare at price', 'compare at price', 'compare at']);
  const costIdx = findCol(['cost per item', 'cost', 'wholesale price', 'wholesale', 'buying price']);
  const qtyIdx = findCol(['variant inventory qty', 'inventory qty', 'stock', 'qty', 'quantity']);
  // Handle ALL variations: image, images, image src, image url, photo, photos, img, pic
  const imageIdx = findCol(['image src', 'image', 'images', 'image url', 'image_url', 'img', 'photo', 'photos', 'src', 'pic']);
  const tagsIdx = findCol(['tags', 'keywords']);
  const weightIdx = findCol(['variant grams', 'grams', 'weight']);
  const categoryIdx = findCol(['custom product type', 'product type', 'type', 'category']);

  const productsByHandle: Record<string, any> = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    let handle = handleIdx !== -1 ? row[handleIdx] : '';
    const title = titleIdx !== -1 ? row[titleIdx] : '';
    if (!handle && title) {
      handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (!handle) continue;

    let imageSrc = imageIdx !== -1 ? (row[imageIdx] || '').trim() : '';
    if (imageSrc.startsWith('//')) {
      imageSrc = `https:${imageSrc}`;
    }

    if (!productsByHandle[handle]) {
      const rawBody = bodyIdx !== -1 ? row[bodyIdx] : '';
      const cleanDesc = rawBody
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const wholesaleINR = parseFloat(row[costIdx] || row[priceIdx]) || 150;
      const retailINR = parseFloat(row[compareAtIdx] || row[priceIdx]) || Math.round(wholesaleINR * 1.5);
      const sku = (skuIdx !== -1 && row[skuIdx]) ? row[skuIdx] : `DD-${handle.slice(0, 10).toUpperCase()}`;
      const stock = parseInt(row[qtyIdx] || '100', 10);
      const weightGrams = parseFloat(row[weightIdx]) || 350;
      const tags = (tagsIdx !== -1 && row[tagsIdx])
        ? row[tagsIdx].split(',').map((t) => t.trim())
        : [];
      const category = (categoryIdx !== -1 && row[categoryIdx] && row[categoryIdx].trim())
        ? row[categoryIdx].trim()
        : 'Smart Kitchen';

      const initialImages = imageSrc ? [imageSrc] : ['https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&auto=format&fit=crop&q=80'];

      productsByHandle[handle] = {
        handle,
        title: title || handle,
        description: cleanDesc || 'Official DeoDap wholesale catalog product.',
        sku,
        wholesaleINR,
        priceINR: retailINR,
        costUSD: Number((wholesaleINR / 86.5).toFixed(2)),
        priceUSD: Number((retailINR / 86.5).toFixed(2)),
        stock: isNaN(stock) || stock <= 0 ? 50 : stock,
        weightKg: Number((weightGrams / 1000).toFixed(2)),
        category: category.includes('Kitchen') ? 'Smart Kitchen' : category.includes('Beauty') || category.includes('Personal') ? 'Personal Care' : category || 'Lifestyle Essentials',
        tags: ['DeoDap', ...tags],
        images: initialImages,
        image: initialImages[0],
        supplierLink: `https://deodap.in/products/${handle}`,
      };
    } else {
      // Additional image for this product handle
      if (imageSrc && !productsByHandle[handle].images.includes(imageSrc)) {
        productsByHandle[handle].images.push(imageSrc);
      }
    }
  }

  return Object.values(productsByHandle);
}

