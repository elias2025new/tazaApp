/**
 * lib/telegram/validate-init-data.ts
 * Validates Telegram initData per the official spec:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Algorithm:
 * 1. secret_key = HMAC_SHA256(key="WebAppData", data=BOT_TOKEN)
 * 2. data_check_string = sorted fields (excluding hash) joined by "\n"
 * 3. hash = HMAC_SHA256(key=secret_key, data=data_check_string)
 * 4. Compare computed hash with initData.hash in constant time
 * 5. Check auth_date freshness (max 24h)
 */
import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

export type ValidatedInitData = {
  user: TelegramUser;
  auth_date: number;
  query_id?: string;
  chat_instance?: string;
  chat_type?: string;
  start_param?: string;
};

export type InitDataValidationError =
  | 'MISSING_HASH'
  | 'INVALID_HASH'
  | 'EXPIRED'
  | 'MISSING_USER'
  | 'INVALID_USER';

export type InitDataResult =
  | { ok: true; data: ValidatedInitData }
  | { ok: false; error: InitDataValidationError };

const MAX_AGE_SECONDS = 24 * 60 * 60; // 24 hours

export function validateInitData(
  initDataRaw: string,
  botToken: string,
  nowMs: number = Date.now()
): InitDataResult {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initDataRaw);
  } catch {
    return { ok: false, error: 'MISSING_HASH' };
  }

  const hash = params.get('hash');
  if (!hash) {
    return { ok: false, error: 'MISSING_HASH' };
  }

  // Build data_check_string: all fields except "hash", sorted alphabetically, joined by \n
  const entries: string[] = [];
  for (const [key, value] of params.entries()) {
    if (key !== 'hash') {
      entries.push(`${key}=${value}`);
    }
  }
  entries.sort();
  const dataCheckString = entries.join('\n');

  // Derive the secret key
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // Constant-time comparison
  const computedBuf = Buffer.from(computedHash, 'utf8');
  const receivedBuf = Buffer.from(hash, 'utf8');
  if (
    computedBuf.length !== receivedBuf.length ||
    !timingSafeEqual(computedBuf, receivedBuf)
  ) {
    return { ok: false, error: 'INVALID_HASH' };
  }

  // Check auth_date freshness
  const authDateStr = params.get('auth_date');
  const authDate = authDateStr ? parseInt(authDateStr, 10) : NaN;
  if (isNaN(authDate) || nowMs / 1000 - authDate > MAX_AGE_SECONDS) {
    return { ok: false, error: 'EXPIRED' };
  }

  // Parse user
  const userStr = params.get('user');
  if (!userStr) {
    return { ok: false, error: 'MISSING_USER' };
  }

  let user: unknown;
  try {
    user = JSON.parse(userStr);
  } catch {
    return { ok: false, error: 'INVALID_USER' };
  }

  if (
    typeof user !== 'object' ||
    user === null ||
    typeof (user as Record<string, unknown>)['id'] !== 'number' ||
    typeof (user as Record<string, unknown>)['first_name'] !== 'string'
  ) {
    return { ok: false, error: 'INVALID_USER' };
  }

  return {
    ok: true,
    data: {
      user: user as TelegramUser,
      auth_date: authDate,
      query_id: params.get('query_id') ?? undefined,
      chat_instance: params.get('chat_instance') ?? undefined,
      chat_type: params.get('chat_type') ?? undefined,
      start_param: params.get('start_param') ?? undefined,
    },
  };
}
