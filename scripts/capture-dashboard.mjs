import { chromium } from "@playwright/test";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import dotenv from "dotenv";
import fs from "node:fs";

dotenv.config({ path: ".env.local" });
process.env.CLERK_PUBLISHABLE_KEY ??=
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const tenants = JSON.parse(fs.readFileSync("e2e/.fixtures.json", "utf8"));
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3100";

await clerkSetup();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`${baseURL}/`);
await clerk.signIn({ page, emailAddress: tenants.alpha.email });
await page.evaluate(async (orgId) => {
  await window.Clerk.setActive({ organization: orgId });
}, tenants.alpha.orgId);
await page.goto(`${baseURL}/dashboard`);
await page.getByText(/tasks used$/).waitFor({ timeout: 30_000 });
await page.waitForTimeout(800);
fs.mkdirSync("docs", { recursive: true });
await page.screenshot({ path: "docs/dashboard.png", fullPage: true });
await browser.close();
console.log("wrote docs/dashboard.png");
