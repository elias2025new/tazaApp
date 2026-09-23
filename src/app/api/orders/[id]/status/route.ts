import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverEnv, publicEnv } from '@/lib/env';
import type { Database } from '@/lib/supabase/types';

// Allowed status transitions — staff can only move forward
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending:          ['accepted', 'rejected'],
  accepted:         ['preparing'],
  preparing:        ['ready'],
  ready:            ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
};

const STATUS_MESSAGES: Record<string, string> = {
  accepted:         '✅ Your order has been accepted! We\'re getting started.',
  preparing:        '👨‍🍳 Your food is being prepared right now!',
  ready:            '🎉 Your order is ready! It\'s on its way to you.',
  out_for_delivery: '🛵 Your order is out for delivery! It\'ll be there soon.',
  delivered:        '🏠 Your order has been delivered. Enjoy your meal! 🌿',
  rejected:         '❌ Unfortunately your order was rejected. Please contact us for details.',
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  try {
    const { next_status, note, staff_secret } = await req.json();

    // Simple staff auth via shared secret
    if (staff_secret !== serverEnv.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient<Database>(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get current order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, profile_id, fulfillment_type')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(next_status)) {
      return NextResponse.json(
        { error: `Cannot transition from '${order.status}' to '${next_status}'` },
        { status: 400 }
      );
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: next_status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    // Record event
    await supabase.from('order_events').insert({
      order_id: orderId,
      from_status: order.status,
      to_status: next_status,
      note: note ?? null,
    });

    // Notify customer via Telegram if they have a profile
    if (order.profile_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('telegram_id')
        .eq('id', order.profile_id)
        .single();

      if (profile?.telegram_id) {
        const message = STATUS_MESSAGES[next_status] ?? `Your order status: ${next_status}`;
        const trackUrl = `${publicEnv.NEXT_PUBLIC_APP_URL}/?startapp=order_${orderId.slice(0, 8)}`;

        fetch(`https://api.telegram.org/bot${serverEnv.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: profile.telegram_id,
            text: `${message}\n\n[Track your order](${trackUrl})`,
            parse_mode: 'Markdown',
          }),
        }).catch(console.error);
      }
    }

    return NextResponse.json({ ok: true, status: next_status });
  } catch (err) {
    console.error('Status update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
