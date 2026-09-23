import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverEnv, publicEnv } from '@/lib/env';
import type { Database } from '@/lib/supabase/types';

export async function POST(req: Request) {
  try {
    const { id, is_available, base_price_santim, staff_secret } = await req.json();

    if (staff_secret !== serverEnv.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!id) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const supabase = createClient<Database>(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );

    const updates: any = {};
    if (typeof is_available === 'boolean') updates.is_available = is_available;
    if (typeof base_price_santim === 'number') updates.base_price_santim = base_price_santim;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true });
    }

    const { error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Menu update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
