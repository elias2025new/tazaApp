/**
 * lib/supabase/browser.ts — Supabase client for browser (client components).
 * Uses anon key + user JWT. Protected by RLS.
 * Set the user session via setSession() after auth.
 */
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
