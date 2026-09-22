import { webhookCallback } from 'grammy';
import { NextResponse } from 'next/server';
import { bot } from '@/lib/telegram/bot';
import { serverEnv } from '@/lib/env';

// Wrap grammY's callback to handle the Next.js Request object
const handleWebhook = webhookCallback(bot, 'std/http');

export async function POST(req: Request) {
  // 1. Verify the secret token header (Rule 03)
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
  if (secretToken !== serverEnv.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Pass the request to grammY
    return await handleWebhook(req);
  } catch (err) {
    console.error('Webhook error:', err);
    // Always return 200 to Telegram so it doesn't retry endlessly for bad messages
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
