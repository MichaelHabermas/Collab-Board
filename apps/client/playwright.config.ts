import { defineConfig, devices } from "@playwright/test";

const defaultBaseURL = "http://localhost:5173";
const baseURL = process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? defaultBaseURL;
const isTargetingProduction = baseURL !== defaultBaseURL;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // When targeting production, do not start local dev server
  ...(isTargetingProduction
    ? {}
    : {
        webServer: {
          command: "bun run dev",
          url: defaultBaseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120000,
        },
      }),
  timeout: 10000,
  expect: { timeout: 10000 },
});
