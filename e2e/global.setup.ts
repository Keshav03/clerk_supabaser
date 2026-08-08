import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { seedTenants } from "./fixtures";

// Setup must run serially even when the suite is configured to run in parallel
setup.describe.configure({ mode: "serial" });

setup("global setup", async () => {
  await clerkSetup();
  await seedTenants();
});
