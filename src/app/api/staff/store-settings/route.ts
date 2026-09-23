import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverEnv, publicEnv } from '@/lib/env';
import type { Database } from '@/lib/supabase/types';

export async function POST(req: Request) {
  try {
    const { is_open, staff_secret } = await req.json();

    if (staff_secret !== serverEnv.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient<Database>(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from('store_settings')
      .update({ is_open, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (error) {
      return NextResponse.json({ error: 'Failed to update store settings' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Store settings update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
