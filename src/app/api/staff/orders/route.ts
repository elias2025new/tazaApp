import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverEnv, publicEnv } from '@/lib/env';
import type { Database } from '@/lib/supabase/types';

export async function GET(req: Request) {
  const staffSecret = req.headers.get('x-staff-secret');
  if (staffSecret !== serverEnv.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, fulfillment_type, total_santim, placed_at, customer_note,
      order_items (name_snapshot, quantity, line_total_santim)
    `)
    .order('placed_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ orders: orders ?? [] });
}
