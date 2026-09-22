/**
 * lib/supabase/admin.ts — Service-role Supabase client.
 * Bypasses RLS. Use SPARINGLY and only for operations that legitimately need it
 * (e.g. creating a profile during auth after validating initData server-side).
 * NEVER import this in client components. NEVER expose to the client bundle.
 */
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Singleton — one client per server process, not per request
let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getAdminSupabaseClient() {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase admin credentials. Check server environment.');
  }
  adminClient = createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return adminClient;
}
