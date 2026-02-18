/**
 * Playwright global setup: when E2E_CLERK_EMAIL and E2E_CLERK_PASSWORD are set,
 * signs in via Clerk and saves storage state so authenticated E2E tests can run.
 * When not set, writes empty storage state so tests run unauthenticated (sign-in page).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_STORAGE_PATH = path.join(__dirname, '../playwright/.auth/user.json');

export default async function globalSetup(): Promise<void> {
  const email = process.env['E2E_CLERK_EMAIL'];
  const password = process.env['E2E_CLERK_PASSWORD'];
  const baseURL =
    process.env['BASE_URL'] ??
    process.env['PLAYWRIGHT_BASE_URL'] ??
    'http://localhost:5173';

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  if (email && password) {
    await page.goto(baseURL);
    await clerk.signIn({
      page,
      signInParams: { strategy: 'password', identifier: email, password },
    });
    await page.waitForSelector('[data-testid="app-root"]', { timeout: 15000 });
  }

  fs.mkdirSync(path.dirname(AUTH_STORAGE_PATH), { recursive: true });
  await context.storageState({ path: AUTH_STORAGE_PATH });
  await browser.close();
}
