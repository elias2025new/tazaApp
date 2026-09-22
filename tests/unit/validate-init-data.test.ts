/**
 * tests/unit/validate-init-data.test.ts
 * Mandatory unit tests for initData validation per rule 03.
 * Covers: valid, tampered, expired, missing hash, missing user.
 *
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest';
import { createHmac } from 'crypto';
import { validateInitData } from '@/lib/telegram/validate-init-data';

const BOT_TOKEN = 'test:AABBCCtestTokenForUnitTests1234567890';

function buildValidInitData(
  overrides: Record<string, string> = {},
  nowMs?: number
): { initData: string; nowMs: number } {
  const authDate = Math.floor((nowMs ?? Date.now()) / 1000) - 60; // 1 min ago
  const user = JSON.stringify({ id: 123456789, first_name: 'Test', language_code: 'en' });
  const params: Record<string, string> = {
    user,
    auth_date: String(authDate),
    query_id: 'AABB==',
    ...overrides,
  };

  // Build data_check_string
  const entries = Object.entries(params)
    .filter(([k]) => k !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`);
  const dataCheckString = entries.join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const searchParams = new URLSearchParams({ ...params, hash });
  return { initData: searchParams.toString(), nowMs: Date.now() };
}

describe('validateInitData', () => {
  it('accepts valid initData', () => {
    const { initData, nowMs } = buildValidInitData();
    const result = validateInitData(initData, BOT_TOKEN, nowMs);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.user.id).toBe(123456789);
      expect(result.data.user.first_name).toBe('Test');
    }
  });

  it('rejects tampered initData (wrong hash)', () => {
    const { initData, nowMs } = buildValidInitData();
    const params = new URLSearchParams(initData);
    params.set('hash', 'aabbccdd11223344556677889900aabbccdd11223344556677889900aabbccdd');
    const result = validateInitData(params.toString(), BOT_TOKEN, nowMs);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('INVALID_HASH');
  });

  it('rejects tampered initData (modified user field)', () => {
    const { initData, nowMs } = buildValidInitData();
    const params = new URLSearchParams(initData);
    // Modify user after hashing
    params.set('user', JSON.stringify({ id: 999, first_name: 'Hacker' }));
    const result = validateInitData(params.toString(), BOT_TOKEN, nowMs);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('INVALID_HASH');
  });

  it('rejects expired initData (auth_date > 24h ago)', () => {
    const staleMs = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
    const { initData } = buildValidInitData({}, staleMs);
    const result = validateInitData(initData, BOT_TOKEN, Date.now());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('EXPIRED');
  });

  it('rejects initData with missing hash', () => {
    const { initData, nowMs } = buildValidInitData();
    const params = new URLSearchParams(initData);
    params.delete('hash');
    const result = validateInitData(params.toString(), BOT_TOKEN, nowMs);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('MISSING_HASH');
  });

  it('rejects initData with missing user', () => {
    const { initData, nowMs } = buildValidInitData();
    // Rebuild without user field and rehash
    const params = new URLSearchParams(initData);
    params.delete('user');
    params.delete('hash');

    const entries = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`);
    const dataCheckString = entries.join('\n');
    const secretKey = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    params.set('hash', hash);

    const result = validateInitData(params.toString(), BOT_TOKEN, nowMs);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('MISSING_USER');
  });

  it('rejects a different bot token', () => {
    const { initData, nowMs } = buildValidInitData();
    const result = validateInitData(initData, 'wrong:token', nowMs);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('INVALID_HASH');
  });
});
