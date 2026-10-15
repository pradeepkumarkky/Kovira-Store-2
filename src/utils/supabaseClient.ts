import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

function isValidHttpUrl(stringToTest?: string): boolean {
  if (!stringToTest || typeof stringToTest !== 'string') return false;
  const trimmed = stringToTest.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getClientSupabase(): SupabaseClient | null {
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (!isValidHttpUrl(url) || !anonKey) {
    return null;
  }

  if (!cachedClient) {
    try {
      cachedClient = createClient(url, anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        },
      });
    } catch (err) {
      console.warn('Failed to initialize client-side Supabase:', err);
      return null;
    }
  }

  return cachedClient;
}
