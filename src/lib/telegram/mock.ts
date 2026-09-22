/**
 * lib/telegram/mock.ts — Dev mock for running outside Telegram.
 * Only active when NEXT_PUBLIC_DEV_MOCK_TELEGRAM=true AND NODE_ENV=development.
 * Production builds will throw if this is ever imported in a way that would activate.
 */
'use client';

import type { TelegramUser } from './validate-init-data';

export const MOCK_USER: TelegramUser = {
  id: 999999999,
  first_name: 'Dev',
  last_name: 'User',
  username: 'devuser',
  language_code: 'en',
};

/** Generate a mock initData string that passes local validation when using the dev mock flow */
export function getMockInitData(): string {
  const user = JSON.stringify(MOCK_USER);
  const auth_date = Math.floor(Date.now() / 1000).toString();
  const params = new URLSearchParams({
    user,
    auth_date,
    // hash is intentionally empty for mock — the server mock mode bypasses hash check
    hash: 'dev_mock_hash_not_validated',
  });
  return params.toString();
}
