import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { addTask, clearTasks, signInAs, signOut } from "./app";
import { provisionTenants } from "./fixtures";

// Setup must run serially even when the suite is configured to run in parallel
setup.describe.configure({ mode: "serial" });

setup("provision tenants and seed one task each", async ({ page }) => {
  await clerkSetup();
  const tenants = await provisionTenants();

  // Seeding goes through the UI on purpose. It needs no service role key, and
  // it means the tasks under test were created by the same code path a real
  // user hits.
  for (const tenant of Object.values(tenants)) {
    await signInAs(page, tenant);
    await clearTasks(page);
    await addTask(page, tenant.taskName);
    await signOut(page);
  }
});
