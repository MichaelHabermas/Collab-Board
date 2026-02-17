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

  test('object creation: sticky note tool click creates sticky on canvas', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });
    await page.goto('/');
    const appRoot = page.getByTestId('app-root');
    const signInPage = page.getByTestId('sign-in-page');
    await expect(appRoot.or(signInPage)).toBeVisible({ timeout: 15000 });
    const onSignInPage = await signInPage.isVisible();
    if (onSignInPage) {
      test.skip(true, 'Sign-in page shown; cannot test creation without board');
      return;
    }
    await expect(page.getByTestId('canvas-infinite-canvas')).toBeVisible();
    await page.getByRole('button', { name: 'Sticky note' }).click();
    const canvasArea = page.getByTestId('canvas-board-container');
    await expect(canvasArea).toBeVisible();
    const box = await canvasArea.boundingBox();
    expect(box).not.toBeNull();
    const centerX = (box as { x: number; width: number }).x + (box as { width: number }).width / 2;
    const centerY = (box as { y: number; height: number }).y + (box as { height: number }).height / 2;
    await page.mouse.click(centerX, centerY);
    await expect(canvasArea).toHaveAttribute('data-object-count', '1', { timeout: 5000 });
  });
});
