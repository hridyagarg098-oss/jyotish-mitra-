import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _adminClient: SupabaseClient | null = null;

// Service role client — lazy singleton, ONLY use in API routes
export function getAdminClient(): SupabaseClient {
  if (!_adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    _adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _adminClient;
}

// Keep backward compat — lazy proxy
export const adminClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getAdminClient() as any)[prop];
  },
});
