/**
 * lib/telegram/bot.ts
 * grammY instance for the Taza Greens bot.
 * We extract this so both the webhook handler and server actions (for staff alerts)
 * can share the exact same bot instance and logic.
 */
import { Bot, webhookCallback } from 'grammy';
import { serverEnv, publicEnv } from '@/lib/env';

// Initialize the bot
export const bot = new Bot(serverEnv.TELEGRAM_BOT_TOKEN);

// Welcome message
const WELCOME_TEXT = `Welcome to Taza Greens! 🌿\n\nFresh starts here. Tap the button below to order your favorite Ethiopian breakfast, brunch, or coffee.`;

// Setup commands
bot.command('start', (ctx) => {
  return ctx.reply(WELCOME_TEXT, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Order now',
            web_app: { url: publicEnv.NEXT_PUBLIC_APP_URL },
          },
        ],
      ],
    },
  });
});

bot.command('orders', (ctx) => {
  return ctx.reply('To view your orders, open the Mini App and go to "My Orders".', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'View Orders',
            web_app: { url: `${publicEnv.NEXT_PUBLIC_APP_URL}/orders` },
          },
        ],
      ],
    },
  });
});

bot.command('help', (ctx) => {
  return ctx.reply('Need help? Contact us at the café or reply to this bot.');
});

bot.command('admin', (ctx) => {
  // Simple check for staff chat ID
  if (ctx.chat.id.toString() !== serverEnv.TELEGRAM_STAFF_CHAT_ID) {
    return ctx.reply('You do not have admin access.');
  }
  return ctx.reply('Admin dashboard:', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Open Admin panel',
            web_app: { url: `${publicEnv.NEXT_PUBLIC_APP_URL}/admin/orders` },
          },
        ],
      ],
    },
  });
});
