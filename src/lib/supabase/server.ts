/**
 * lib/supabase/server.ts — Per-request Supabase client for Server Components and Route Handlers.
 * Uses the caller's JWT (user session). RLS applies.
 * Import this in server-only code only.
 */
import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const customToken = cookieStore.get('taza-auth')?.value;

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: customToken ? { Authorization: `Bearer ${customToken}` } : undefined,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method is called from a Server Component. Can be safely ignored.
          }
        },
      },
    }
  );
}
