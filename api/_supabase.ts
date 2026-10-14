import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let cachedServiceClient: SupabaseClient | null = null;

function isValidHttpUrl(stringToTest: string): boolean {
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

export function getSupabase(useServiceRole = false): SupabaseClient | null {
  const rawUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';

  const rawAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

  const rawServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    rawAnonKey;

  const url = (rawUrl || '').trim();
  const anonKey = (rawAnonKey || '').trim();
  const serviceKey = (rawServiceKey || '').trim();
  const keyToUse = useServiceRole ? (serviceKey || anonKey) : anonKey;

  // Validate that url is a real HTTP/HTTPS URL
  if (!isValidHttpUrl(url) || !keyToUse) {
    return null;
  }

  try {
    if (useServiceRole) {
      if (!cachedServiceClient) {
        cachedServiceClient = createClient(url, keyToUse, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });
      }
      return cachedServiceClient;
    }

    if (!cachedClient) {
      cachedClient = createClient(url, keyToUse, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
    return cachedClient;
  } catch (err: any) {
    console.warn('Failed to initialize Supabase client safely:', err?.message || err);
    return null;
  }
}
