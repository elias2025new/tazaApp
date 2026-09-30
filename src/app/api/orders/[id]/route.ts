import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';
import { serverEnv, publicEnv } from '@/lib/env';
import type { Database } from '@/lib/supabase/types';

async function getProfileId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('taza-auth')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(serverEnv.SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  const supabase = createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, status, fulfillment_type,
      subtotal_santim, delivery_fee_santim, total_santim,
      customer_note, placed_at,
      order_items (id, name_snapshot, quantity, line_total_santim)
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabase = createClient<Database>(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify order exists
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, profile_id')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const profileId = await getProfileId();

    // If order has an owner profile, require authentication and match
    if (order.profile_id && (!profileId || order.profile_id !== profileId)) {
      return NextResponse.json({ error: 'Unauthorized to delete this order' }, { status: 403 });
    }

    // Delete dependent records first to satisfy foreign key constraints
    await supabase.from('order_events').delete().eq('order_id', orderId);
    await supabase.from('order_items').delete().eq('order_id', orderId);

    // Delete the order record
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (deleteError) {
      console.error('Failed to delete order:', deleteError);
      return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, deleted_id: orderId });
  } catch (err) {
    console.error('DELETE /api/orders/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
