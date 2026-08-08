import { expect, test } from "@playwright/test";
import { signInAs, signOut } from "./app";
import { readTenants, type SeededTenant, type TenantKey } from "./fixtures";

// Playwright collects test files before the setup project runs, so the seeded
// ids can only be read once tests actually start
let tenants: Record<TenantKey, SeededTenant>;

test.beforeAll(() => {
  tenants = readTenants();
});

test.describe("organization isolation", () => {
  test("Alpha sees only its own task", async ({ page }) => {
    await signInAs(page, tenants.alpha);

    await expect(page.getByText(tenants.alpha.taskName)).toBeVisible();
    await expect(page.getByText(tenants.beta.taskName)).toHaveCount(0);
  });

  test("Beta sees only its own task", async ({ page }) => {
    await signInAs(page, tenants.beta);

    await expect(page.getByText(tenants.beta.taskName)).toBeVisible();
    await expect(page.getByText(tenants.alpha.taskName)).toHaveCount(0);
  });

  test("signing out locks the dashboard again", async ({ page }) => {
    await signInAs(page, tenants.alpha);
    await expect(page.getByText(tenants.alpha.taskName)).toBeVisible();

    await signOut(page);

    await page.goto("/dashboard");
    await expect(page.getByText(tenants.alpha.taskName)).toHaveCount(0);
  });
});
