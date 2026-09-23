import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { serverEnv, publicEnv } from '@/lib/env';
import { calcOrderTotals } from '@/lib/money';
import type { Database } from '@/lib/supabase/types';
import { jwtVerify } from 'jose';

type OrderItem = { id: string; quantity: number };

async function getProfileId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('taza-auth')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(serverEnv.SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const profileId = await getProfileId();
  if (!profileId) return NextResponse.json({ orders: [] });

  const supabase = createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, fulfillment_type, total_santim, placed_at')
    .eq('profile_id', profileId)
    .order('placed_at', { ascending: false });

  return NextResponse.json({ orders: orders ?? [] });
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, fulfillment_type, landmark, notes, idempotency_key } = body as {
      items: OrderItem[];
      fulfillment_type: 'delivery' | 'pickup';
      landmark?: string;
      notes?: string;
      idempotency_key: string;
    };

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }
    if (fulfillment_type === 'delivery' && !landmark?.trim()) {
      return NextResponse.json({ error: 'Landmark is required for delivery.' }, { status: 400 });
    }

    // Get profile from JWT cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('taza-auth')?.value;
    let profileId: string | null = null;

    if (token) {
      try {
        const secret = new TextEncoder().encode(serverEnv.SUPABASE_JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        profileId = payload.sub ?? null;
      } catch {
        // Token invalid, but we still allow ordering (guest)
      }
    }

    // Use admin client to compute prices server-side (never trust client prices)
    const supabaseAdmin = createClient<Database>(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch current prices from DB
    const itemIds = items.map((i) => i.id);
    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from('menu_items')
      .select('id, name_en, base_price_santim, is_available')
      .in('id', itemIds);

    if (menuError || !menuItems) {
      return NextResponse.json({ error: 'Failed to verify menu items.' }, { status: 500 });
    }

    // Verify all items are available and compute server-side subtotal
    const orderLines = [];
    let subtotalSantim = 0;

    for (const cartItem of items) {
      const menuItem = menuItems.find((m) => m.id === cartItem.id);
      if (!menuItem) {
        return NextResponse.json({ error: `Item not found: ${cartItem.id}` }, { status: 400 });
      }
      if (!menuItem.is_available) {
        return NextResponse.json({ error: `"${menuItem.name_en}" is currently unavailable.` }, { status: 400 });
      }

      const lineTotal = menuItem.base_price_santim * cartItem.quantity;
      subtotalSantim += lineTotal;

      orderLines.push({
        menu_item_id: menuItem.id,
        name_snapshot: menuItem.name_en,
        unit_price_santim: menuItem.base_price_santim,
        quantity: cartItem.quantity,
        options_snapshot: {},
        line_total_santim: lineTotal,
      });
    }

    // Server-computed totals (4% transaction fee, free delivery)
    const { transactionFee, deliveryFee, total: totalSantim } = calcOrderTotals(subtotalSantim);

    // Create the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        profile_id: profileId,
        status: 'pending',
        fulfillment_type,
        subtotal_santim: subtotalSantim,
        delivery_fee_santim: deliveryFee,
        total_santim: totalSantim,
        currency: 'ETB',
        customer_note: notes ?? null,
        idempotency_key,
        placed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (orderError) {
      // Idempotency key conflict — return existing order
      if (orderError.code === '23505') {
        const { data: existing } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('idempotency_key', idempotency_key)
          .single();
        return NextResponse.json({ ok: true, order_id: existing?.id, duplicate: true });
      }
      console.error('Order insert error:', orderError);
      return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
    }

    // Insert order items
    await supabaseAdmin.from('order_items').insert(
      orderLines.map((line) => ({ ...line, order_id: order.id }))
    );

    // Notify staff via Telegram
    const deliveryInfo = fulfillment_type === 'pickup'
      ? '🏃 *Pickup*'
      : `🛵 *Delivery*\n📍 ${landmark}`;

    const itemsList = orderLines
      .map((l) => `• ${l.name_snapshot} x${l.quantity} — ${Math.round(l.line_total_santim / 100)} birr`)
      .join('\n');

    const message = `🔔 *New Order!*\n\n${itemsList}\n\n` +
      `Subtotal: ${Math.round(subtotalSantim / 100)} birr\n` +
      `Fee: ${Math.round(transactionFee / 100)} birr\n` +
      `*Total: ${Math.round(totalSantim / 100)} birr*\n\n` +
      `${deliveryInfo}${notes ? `\n📝 ${notes}` : ''}\n\n` +
      `Order ID: \`${order.id.slice(0, 8)}\``;

    // Fire-and-forget staff notification
    fetch(`https://api.telegram.org/bot${serverEnv.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: serverEnv.TELEGRAM_STAFF_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    }).catch((e) => console.error('Staff notification failed:', e));

    return NextResponse.json({ ok: true, order_id: order.id });
  } catch (err) {
    console.error('Order API error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
