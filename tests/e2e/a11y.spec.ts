import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { login } from "./helpers";

/**
 * Accessibility audit with axe on the key routes. Runs in CI with the
 * rest of the browser suite, so regressions fail the build.
 */
async function audit(page: import("@playwright/test").Page, name: string) {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations;
  expect(
    violations,
    `${name}: ${violations
      .map((v) => `${v.id} (${v.impact}) x${v.nodes.length}`)
      .join(", ")}`,
  ).toEqual([]);
}

test("a11y: login page", async ({ page }) => {
  await page.goto("/login");
  await audit(page, "/login");
});

test("a11y: logbook + dashboard + settings", async ({ page }) => {
  await login(page);

  // logbook home - wait for the budget card to render
  await page.waitForSelector("text=Today");
  await audit(page, "/");

  // dashboard - wait for a stat to render
  await page.goto("/dashboard");
  await page.waitForSelector("text=Meals");
  await audit(page, "/dashboard");

  // settings
  await page.goto("/settings");
  await page.waitForSelector("text=Settings");
  await audit(page, "/settings");
});
