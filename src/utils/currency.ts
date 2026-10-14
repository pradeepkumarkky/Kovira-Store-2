import { CurrencyCode, CurrencyRate } from '../types';

export const DEFAULT_CURRENCY: CurrencyCode = 'INR';

export const CURRENCIES: Record<CurrencyCode, CurrencyRate> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹ / Rs)', rate: 86.5, shippingBase: 0 },
  USD: { code: 'USD', symbol: '₹', name: 'Indian Rupee (₹ / Rs)', rate: 86.5, shippingBase: 0 },
  EUR: { code: 'EUR', symbol: '₹', name: 'Indian Rupee (₹ / Rs)', rate: 86.5, shippingBase: 0 },
  GBP: { code: 'GBP', symbol: '₹', name: 'Indian Rupee (₹ / Rs)', rate: 86.5, shippingBase: 0 },
  CAD: { code: 'CAD', symbol: '₹', name: 'Indian Rupee (₹ / Rs)', rate: 86.5, shippingBase: 0 },
  AUD: { code: 'AUD', symbol: '₹', name: 'Indian Rupee (₹ / Rs)', rate: 86.5, shippingBase: 0 },
  JPY: { code: 'JPY', symbol: '₹', name: 'Indian Rupee (₹ / Rs)', rate: 86.5, shippingBase: 0 },
};

export function convertPrice(amountUSD: number, _currency?: CurrencyCode): number {
  const rate = 86.5;
  const num = Number(amountUSD) || 0;
  // If amount is already in thousands/hundreds (already in INR), don't double convert
  if (num > 99) {
    return Math.round(num);
  }
  return Math.round(num * rate);
}

export function formatPrice(amountUSD: number, _currency?: CurrencyCode): string {
  const converted = convertPrice(amountUSD);
  return `₹${converted.toLocaleString('en-IN')}`;
}

export function formatPriceRs(amountUSD: number, _currency?: CurrencyCode): string {
  const converted = convertPrice(amountUSD);
  return `Rs. ${converted.toLocaleString('en-IN')}`;
}
