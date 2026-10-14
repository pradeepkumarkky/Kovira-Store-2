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
  const handleIdx = headers.indexOf('handle');
  const titleIdx = headers.indexOf('title');
  const bodyIdx = headers.indexOf('body (html)');
  const skuIdx = headers.indexOf('variant sku');
  const priceIdx = headers.indexOf('variant price');
  const compareAtIdx = headers.indexOf('variant compare at price');
  const costIdx = headers.indexOf('cost per item');
  const qtyIdx = headers.indexOf('variant inventory qty');
  const imageIdx = headers.indexOf('image src');
  const tagsIdx = headers.indexOf('tags');
  const weightIdx = headers.indexOf('variant grams');
  const categoryIdx = headers.indexOf('custom product type');

  const productsByHandle: Record<string, any> = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const handle = handleIdx !== -1 ? row[handleIdx] : '';
    if (!handle) continue;

    const title = titleIdx !== -1 ? row[titleIdx] : '';
    const imageSrc = imageIdx !== -1 ? row[imageIdx] : '';

    if (!productsByHandle[handle]) {
      const rawBody = bodyIdx !== -1 ? row[bodyIdx] : '';
      const cleanDesc = rawBody
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const wholesaleINR = parseFloat(row[costIdx] || row[priceIdx]) || 150;
      const retailINR = parseFloat(row[compareAtIdx] || row[priceIdx]) || wholesaleINR * 2.2;
      const sku = (skuIdx !== -1 && row[skuIdx]) ? row[skuIdx] : handle;
      const stock = parseInt(row[qtyIdx] || '100', 10);
      const weightGrams = parseFloat(row[weightIdx]) || 350;
      const tags = (tagsIdx !== -1 && row[tagsIdx])
        ? row[tagsIdx].split(',').map((t) => t.trim())
        : [];
      const category = (categoryIdx !== -1 && row[categoryIdx] && row[categoryIdx].trim())
        ? row[categoryIdx].trim()
        : 'Smart Kitchen';

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
        category: category.includes('Kitchen') ? 'Smart Kitchen' : category.includes('Beauty') || category.includes('Personal') ? 'Personal Care' : 'Electronics',
        tags: ['DeoDap', ...tags],
        images: imageSrc ? [imageSrc] : [],
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
