import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3005/cart', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: 'C:/Users/IT PC 2/.gemini/antigravity/brain/4fecc5b2-b689-451a-958c-dde9f489e2e5/screenshot_empty_cart.png',
  });
  await browser.close();
  console.log('Screenshot of cart taken successfully!');
}

main().catch(console.error);
