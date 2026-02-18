import { expect, test } from '@playwright/test';

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 800;

test.describe('Production MVP (authenticated)', () => {
  test('socket shows Connected when on board', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });
    await page.goto('/');
    const signInPage = page.getByTestId('sign-in-page');
    const appRoot = page.getByTestId('app-root');
    await expect(appRoot.or(signInPage)).toBeVisible({ timeout: 15000 });
    if (await signInPage.isVisible()) {
      test.skip(true, 'Not signed in; set E2E_CLERK_EMAIL and E2E_CLERK_PASSWORD to run');
      return;
    }
    await expect(page.getByTestId('canvas-infinite-canvas')).toBeVisible();
    await expect(page.getByTestId('connection-status-connected')).toBeVisible({ timeout: 10000 });
  });

  test('created object persists after reload', async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });
    await page.goto('/');
    const signInPage = page.getByTestId('sign-in-page');
    const appRoot = page.getByTestId('app-root');
    await expect(appRoot.or(signInPage)).toBeVisible({ timeout: 15000 });
    if (await signInPage.isVisible()) {
      test.skip(true, 'Not signed in; set E2E_CLERK_EMAIL and E2E_CLERK_PASSWORD to run');
      return;
    }
    const canvasArea = page.getByTestId('canvas-board-container');
    await expect(canvasArea).toBeVisible();
    const countBefore = Number((await canvasArea.getAttribute('data-object-count')) ?? '0');
    await page.getByRole('button', { name: 'Sticky note' }).click();
    const box = await canvasArea.boundingBox();
    expect(box).not.toBeNull();
    const centerX = (box as { x: number; width: number }).x + (box as { width: number }).width / 2;
    const centerY = (box as { y: number; height: number }).y + (box as { height: number }).height / 2;
    await page.mouse.click(centerX, centerY);
    await expect(canvasArea).toHaveAttribute('data-object-count', String(countBefore + 1), {
      timeout: 5000,
    });
    await page.reload();
    await expect(page.getByTestId('canvas-board-container')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('canvas-board-container')).toHaveAttribute(
      'data-object-count',
      String(countBefore + 1),
      { timeout: 5000 }
    );
  });
});
