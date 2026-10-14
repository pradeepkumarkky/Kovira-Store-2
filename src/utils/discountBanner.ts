export interface DiscountBannerSettings {
  enabled: boolean;
  minPercent: number;
  maxPercent: number;
  bannerText: string;
  badgeTheme: 'rose' | 'amber' | 'cyan' | 'emerald';
  productCoveragePercent: number;
}

export const DEFAULT_DISCOUNT_CONFIG: DiscountBannerSettings = {
  enabled: true,
  minPercent: 10,
  maxPercent: 15,
  bannerText: 'SPECIAL {pct}% OFF',
  badgeTheme: 'rose',
  productCoveragePercent: 70,
};

const STORAGE_KEY = 'kovira_discount_banner_config';

export function getActiveDiscountConfig(): DiscountBannerSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_DISCOUNT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_DISCOUNT_CONFIG;
}

export function saveActiveDiscountConfig(config: DiscountBannerSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('discount-banner-updated'));
  } catch (e) {
    console.error('Failed to save discount config to storage', e);
  }
}

/**
 * Deterministically assigns a random discount (10-15% default) to a product
 * based on its ID so the discount remains consistent on page reloads.
 */
export function getProductRandomDiscount(
  productId: string,
  customConfig?: DiscountBannerSettings
): { hasDiscount: boolean; percent: number; label: string; theme: string } {
  const config = customConfig || getActiveDiscountConfig();
  if (!config.enabled) {
    return { hasDiscount: false, percent: 0, label: '', theme: config.badgeTheme || 'rose' };
  }

  let hash = 0;
  const str = String(productId || 'prod');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  // Coverage percentage (e.g. 70% of catalog)
  const coverageSlot = positiveHash % 100;
  if (coverageSlot >= (config.productCoveragePercent ?? 70)) {
    return { hasDiscount: false, percent: 0, label: '', theme: config.badgeTheme || 'rose' };
  }

  const min = Math.max(1, config.minPercent || 10);
  const max = Math.max(min, config.maxPercent || 15);
  const range = max - min + 1;
  const percent = min + (positiveHash % range);

  const template = config.bannerText || 'SPECIAL {pct}% OFF';
  const label = template.replace('{pct}', String(percent));

  return { hasDiscount: true, percent, label, theme: config.badgeTheme || 'rose' };
}
