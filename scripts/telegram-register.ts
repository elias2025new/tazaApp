import { loadEnvConfig } from '@next/env';
import { Bot } from 'grammy';
import * as path from 'path';

// Load environment variables from .env.local
const projectDir = path.resolve(process.cwd());
loadEnvConfig(projectDir);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

if (!BOT_TOKEN || !WEBHOOK_SECRET || !APP_URL) {
  console.error('❌ Missing environment variables. Make sure .env.local is filled out.');
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);
const webhookUrl = `${APP_URL}/api/telegram/webhook`;

async function register() {
  console.log(`Setting webhook to: ${webhookUrl}`);
  
  try {
    // 1. Set Webhook
    await bot.api.setWebhook(webhookUrl, {
      secret_token: WEBHOOK_SECRET,
      allowed_updates: ['message', 'callback_query', 'my_chat_member'],
      drop_pending_updates: true,
    });
    console.log('✅ Webhook set successfully.');

    // 2. Verify webhook status
    const info = await bot.api.getWebhookInfo();
    console.log('Webhook info:', info);
    if (info.last_error_message) {
      console.warn('⚠️ Warning: Telegram reported a previous error:', info.last_error_message);
    }

    // 3. Set Commands
    await bot.api.setMyCommands([
      { command: 'start', description: 'Start the bot and open the menu' },
      { command: 'orders', description: 'View your order history' },
      { command: 'help', description: 'Get help or contact support' },
    ]);
    console.log('✅ Commands set successfully.');

    // 4. Set Menu Button
    await bot.api.setChatMenuButton({
      menu_button: {
        type: 'web_app',
        text: 'Order now',
        web_app: { url: APP_URL },
      }
    });
    console.log('✅ Menu button set successfully.');

    console.log('🎉 Telegram setup complete! Send /start to your bot to test it.');

  } catch (error) {
    console.error('❌ Failed to register with Telegram:', error);
    process.exit(1);
  }
}

register();
