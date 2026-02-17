import { test, expect } from '@playwright/test';

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 800;
const MIN_CANVAS_HEIGHT_RATIO = 0.5;

test.describe('App', () => {
  test('renders app root or sign-in page', async ({ page }) => {
    await page.goto('/');
    const appRoot = page.getByTestId('app-root');
    const signInPage = page.getByTestId('sign-in-page');
    await expect(appRoot.or(signInPage)).toBeVisible({ timeout: 15000 });
    if (await appRoot.isVisible()) {
      await expect(page.getByTestId('canvas-infinite-canvas')).toBeVisible();
    }
  });

  test('canvas area fills most of viewport height when board is shown (layout regression)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });
    await page.goto('/');
    const canvasEl = page.getByTestId('canvas-infinite-canvas');
    const signInPage = page.getByTestId('sign-in-page');
    await expect(canvasEl.or(signInPage)).toBeVisible({ timeout: 15000 });
    if (!(await canvasEl.isVisible())) {
      return;
    }
    const box = await canvasEl.boundingBox();
    expect(box).not.toBeNull();
    const canvasHeight = (box as { height: number }).height;
    const minHeight = VIEWPORT_HEIGHT * MIN_CANVAS_HEIGHT_RATIO;
    expect(canvasHeight).toBeGreaterThanOrEqual(minHeight);
  });
});
