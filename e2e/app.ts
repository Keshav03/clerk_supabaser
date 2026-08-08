import { clerk } from "@clerk/testing/playwright";
import { expect, type Page } from "@playwright/test";
import type { SeededTenant } from "./fixtures";

export async function signInAs(page: Page, tenant: SeededTenant) {
  // Clerk must be loaded on an unprotected page before signing in
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: tenant.email });

  // A session with no active organization has no org_id claim, and the
  // dashboard bounces it straight back to the landing page
  await page.evaluate(async (orgId) => {
    await (
      window as unknown as {
        Clerk: { setActive: (opts: { organization: string }) => Promise<void> };
      }
    ).Clerk.setActive({ organization: orgId });
  }, tenant.orgId);

  await page.goto("/dashboard");
  await waitForBoard(page);
}

/**
 * A token minted moments ago can carry an `nbf` a second or two ahead of
 * Postgres' clock, and Supabase rejects it as "JWT not yet valid" until the
 * clocks agree. Reload until the query actually succeeds.
 */
async function waitForBoard(page: Page) {
  await expect(async () => {
    if (await page.getByText("JWT not yet valid").count()) {
      await page.reload();
      throw new Error("Supabase rejected the token as not yet valid");
    }
    await expect(page.getByText(/tasks used$/)).toBeVisible();
  }).toPass({ timeout: 30_000 });
}

export async function signOut(page: Page) {
  await page.goto("/");
  await clerk.signOut({ page });
}

const deleteButtons = (page: Page) =>
  page.getByRole("button", { name: "Delete task" });

/**
 * The usage meter is rendered from a count query, so it is the authority on
 * how many tasks the org has. Counting rows directly races the render.
 */
async function reportedTaskCount(page: Page): Promise<number> {
  const meter = await page.getByText(/tasks used$/).innerText();
  const match = meter.match(/^(\d+)/);
  if (!match) throw new Error(`Could not read task count from "${meter}"`);
  return Number(match[1]);
}

/** Empties the active org's board so each run starts from a known state. */
export async function clearTasks(page: Page) {
  let remaining = await reportedTaskCount(page);

  // Wait for the rows to catch up with the count before touching them
  await expect(deleteButtons(page)).toHaveCount(remaining);

  while (remaining > 0) {
    await deleteButtons(page).first().click();
    await expect(deleteButtons(page)).toHaveCount(remaining - 1);
    remaining -= 1;
  }

  await expect(page.getByText("No tasks yet")).toBeVisible();
}

export async function addTask(page: Page, name: string) {
  await page.getByPlaceholder("Add a task...").fill(name);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText(name)).toBeVisible();
}
