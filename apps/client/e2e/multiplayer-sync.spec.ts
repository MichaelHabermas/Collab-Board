import { expect, test } from '@playwright/test';

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 800;

async function skipWhenSignInPageVisible(pageA: import('@playwright/test').Page, pageB: import('@playwright/test').Page): Promise<void> {
  const signInA = pageA.getByTestId('sign-in-page');
  const signInB = pageB.getByTestId('sign-in-page');
  const hasSignInA = await signInA.isVisible();
  const hasSignInB = await signInB.isVisible();
  if (hasSignInA || hasSignInB) {
    test.skip(true, 'Sign-in page shown in at least one context; multiplayer board requires authenticated sessions.');
  }
}

test.describe('Multiplayer Sync', () => {
  test('syncs object creation across two browser contexts and updates presence panel', async ({
    browser,
  }) => {
    const contextA = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
    const contextB = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto('/');
    await pageB.goto('/');

    await expect(pageA.getByTestId('app-root').or(pageA.getByTestId('sign-in-page'))).toBeVisible({
      timeout: 15000,
    });
    await expect(pageB.getByTestId('app-root').or(pageB.getByTestId('sign-in-page'))).toBeVisible({
      timeout: 15000,
    });

    await skipWhenSignInPageVisible(pageA, pageB);

    const canvasA = pageA.getByTestId('canvas-board-container');
    const canvasB = pageB.getByTestId('canvas-board-container');
    await expect(canvasA).toBeVisible();
    await expect(canvasB).toBeVisible();

    const initialCount = Number((await canvasA.getAttribute('data-object-count')) ?? '0');

    await pageA.getByRole('button', { name: 'Sticky note' }).click();
    const box = await canvasA.boundingBox();
    expect(box).not.toBeNull();
    const centerX = (box as { x: number; width: number }).x + (box as { width: number }).width / 2;
    const centerY = (box as { y: number; height: number }).y + (box as { height: number }).height / 2;
    await pageA.mouse.click(centerX, centerY);

    const expectedCount = String(initialCount + 1);
    await expect(canvasA).toHaveAttribute('data-object-count', expectedCount, { timeout: 5000 });
    await expect(canvasB).toHaveAttribute('data-object-count', expectedCount, { timeout: 5000 });

    const presencePanelA = pageA.getByTestId('presence-panel');
    const presencePanelB = pageB.getByTestId('presence-panel');
    await expect(presencePanelA).toBeVisible();
    await expect(presencePanelB).toBeVisible();

    const usersA = presencePanelA.locator("[data-testid^='presence-user-']");
    const usersB = presencePanelB.locator("[data-testid^='presence-user-']");
    await expect(usersA.first()).toBeVisible({ timeout: 5000 });
    await expect(usersB.first()).toBeVisible({ timeout: 5000 });

    await contextA.close();
    await contextB.close();
  });
});
