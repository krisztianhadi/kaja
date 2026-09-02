import type { Page } from "@playwright/test";

/**
 * Shared e2e helpers. The demo user is seeded in CI via the USERS_JSON
 * env var (see .github/workflows/ci.yml); locally it comes from
 * users.config.json.
 */
export const DEMO_USER = process.env.E2E_USER ?? "demo";
export const DEMO_PASS = process.env.E2E_PASS ?? "demo123";

export async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.fill("#username", DEMO_USER);
  await page.fill("#password", DEMO_PASS);
  await Promise.all([
    page.waitForURL("**/logbook", { timeout: 20_000 }),
    page.click('button[type="submit"]'),
  ]);
}
