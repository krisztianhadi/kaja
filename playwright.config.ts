import { defineConfig, devices } from "@playwright/test";

/**
 * E2E + accessibility checks. The a11y job in CI (see
 * .github/workflows/ci.yml) runs the full browser suite against the
 * built app with a fresh Postgres. Locally it reuses the running dev
 * server on :3100 (set PLAYWRIGHT_BROWSERS_PATH to an existing browser
 * install to avoid re-downloading).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Port 3000 is taken by the environment's nginx — use 3100.
    command: "pnpm dev --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
