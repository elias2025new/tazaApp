/**
 * tests/e2e/smoke.test.ts — Smoke test: app loads and title is correct.
 * Run with: pnpm test:e2e
 * Requires: pnpm dev running (or webServer in playwright.config.ts handles it)
 */
import { test, expect } from '@playwright/test';

test('homepage loads with correct title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Taza Greens/i);
});
