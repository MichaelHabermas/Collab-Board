import { test, expect } from "@playwright/test";

test.describe("App", () => {
  test("renders app root and example button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("app-root")).toBeVisible();
    await expect(page.getByTestId("shadcn-button-example")).toBeVisible();
    await expect(page.getByTestId("shadcn-button-example")).toHaveText("Click me");
  });
});
