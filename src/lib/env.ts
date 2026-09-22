/**
 * lib/env.ts — Zod-validated environment.
 * Fails fast at boot if any required variable is missing.
 * Never import server-only vars in client code.
 */
import 'server-only';
import { z } from 'zod';

const serverSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_BOT_USERNAME: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(32),
  TELEGRAM_STAFF_CHAT_ID: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),
  SUPABASE_DB_PASSWORD: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(['en', 'am']).default('en'),
  NEXT_PUBLIC_DEV_MOCK_TELEGRAM: z
    .string()
    .transform((v) => v === 'true')
    .pipe(z.boolean())
    .default('false'),
});

// Parse server vars — will throw at module load time if invalid
const _serverEnv = serverSchema.safeParse(process.env);
const _publicEnv = publicSchema.safeParse(process.env);

if (!_serverEnv.success) {
  console.error('❌ Invalid server environment variables:', _serverEnv.error.format());
  throw new Error('Invalid server environment variables. Check server console.');
}
if (!_publicEnv.success) {
  console.error('❌ Invalid public environment variables:', _publicEnv.error.format());
  throw new Error('Invalid public environment variables. Check server console.');
}

// Safety rail: DEV_MOCK_TELEGRAM must be false in production
if (
  _publicEnv.data.NEXT_PUBLIC_DEV_MOCK_TELEGRAM === true &&
  _serverEnv.data.NODE_ENV === 'production'
) {
  throw new Error(
    'NEXT_PUBLIC_DEV_MOCK_TELEGRAM must be false in production builds. This is a security violation.'
  );
}

export const serverEnv = _serverEnv.data;
export const publicEnv = _publicEnv.data;
