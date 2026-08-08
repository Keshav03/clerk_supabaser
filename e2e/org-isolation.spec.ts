import { clerk } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readTenants, type SeededTenant, type TenantKey } from "./fixtures";

// Playwright collects test files before the setup project runs, so the seeded
// ids can only be read once tests actually start
let tenants: Record<TenantKey, SeededTenant>;

test.beforeAll(() => {
  tenants = readTenants();
});

async function signInAs(page: Page, tenant: SeededTenant) {
  // Clerk must be loaded on an unprotected page before signing in
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: tenant.email });

  // A session with no active organization has no org_id claim, and the
  // dashboard bounces it back to the landing page
  await page.evaluate(async (orgId) => {
    await (
      window as unknown as {
        Clerk: { setActive: (opts: { organization: string }) => Promise<void> };
      }
    ).Clerk.setActive({ organization: orgId });
  }, tenant.orgId);

  await page.goto("/dashboard");
}

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

    await page.goto("/");
    await clerk.signOut({ page });

    await page.goto("/dashboard");
    await expect(page.getByText(tenants.alpha.taskName)).toHaveCount(0);
  });
});
