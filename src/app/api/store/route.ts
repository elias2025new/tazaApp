import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { publicEnv } from '@/lib/env';
import type { Database } from '@/lib/supabase/types';

export async function GET() {
  const supabase = createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: settings } = await supabase
    .from('store_settings')
    .select('is_open')
    .eq('id', 1)
    .single();

  return NextResponse.json({ is_open: settings?.is_open ?? true });
}
