/**
 * Backend Centralized Logger for Supabase and API routes
 */

export function logError(category: 'SUPABASE' | 'API' | 'SYNC' | 'AUTH', message: string, details?: any) {
  const ts = new Date().toISOString();
  console.error(`[${ts}] [KOVIRA ${category} ERROR]: ${message}`, details || '');
}

export function logWarn(category: 'SUPABASE' | 'API' | 'SYNC' | 'AUTH', message: string, details?: any) {
  const ts = new Date().toISOString();
  console.warn(`[${ts}] [KOVIRA ${category} WARN]: ${message}`, details || '');
}

export function logInfo(category: 'SUPABASE' | 'API' | 'SYNC' | 'AUTH', message: string, details?: any) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [KOVIRA ${category} INFO]: ${message}`, details || '');
}
