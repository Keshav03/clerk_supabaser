import fs from "node:fs";
import path from "node:path";

/**
 * Two tenants that must never see each other's data. Emails use the
 * +clerk_test suffix so Clerk skips email verification on dev instances.
 */
export const TENANTS = {
  alpha: {
    email: "e2e.alpha+clerk_test@example.com",
    orgName: "E2E Alpha",
    taskName: "Alpha private task",
  },
  beta: {
    email: "e2e.beta+clerk_test@example.com",
    orgName: "E2E Beta",
    taskName: "Beta private task",
  },
} as const;

export type TenantKey = keyof typeof TENANTS;

export type SeededTenant = (typeof TENANTS)[TenantKey] & {
  userId: string;
  orgId: string;
};

const FIXTURES_FILE = path.join(__dirname, ".fixtures.json");
const CLERK_API = "https://api.clerk.com/v1";

async function clerkApi<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${CLERK_API}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(
      `Clerk ${init?.method ?? "GET"} ${endpoint} failed: ${JSON.stringify(body)}`,
    );
  }
  return body as T;
}

// Some Clerk list endpoints return a bare array, others wrap it in `data`
function listOf<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  return ((body as { data?: T[] }).data ?? []) as T[];
}

async function findOrCreateUser(email: string): Promise<string> {
  const existing = listOf<{ id: string }>(
    await clerkApi(`/users?email_address=${encodeURIComponent(email)}`),
  );
  if (existing.length > 0) return existing[0].id;

  const created = await clerkApi<{ id: string }>("/users", {
    method: "POST",
    body: JSON.stringify({
      email_address: [email],
      password: `e2e-${crypto.randomUUID()}`,
      skip_password_checks: true,
    }),
  });
  return created.id;
}

// Matched by name rather than slug, since slugs are an opt-in instance feature
async function findOrCreateOrg(
  name: string,
  createdBy: string,
): Promise<string> {
  const matches = listOf<{ id: string; name: string }>(
    await clerkApi(`/organizations?query=${encodeURIComponent(name)}&limit=50`),
  );
  const existing = matches.find((org) => org.name === name);
  if (existing) return existing.id;

  const created = await clerkApi<{ id: string }>("/organizations", {
    method: "POST",
    body: JSON.stringify({ name, created_by: createdBy }),
  });
  return created.id;
}

async function ensureAdminMembership(orgId: string, userId: string) {
  try {
    await clerkApi(`/organizations/${orgId}/memberships`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, role: "org:admin" }),
    });
  } catch {
    // Already a member, which is the state we wanted anyway
  }
}

/**
 * Provisions both tenants in Clerk as org admins. Idempotent, so repeated
 * local runs reuse the same users and organizations.
 */
export async function provisionTenants(): Promise<
  Record<TenantKey, SeededTenant>
> {
  const provisioned = {} as Record<TenantKey, SeededTenant>;

  for (const [key, tenant] of Object.entries(TENANTS) as [
    TenantKey,
    (typeof TENANTS)[TenantKey],
  ][]) {
    const userId = await findOrCreateUser(tenant.email);
    const orgId = await findOrCreateOrg(tenant.orgName, userId);
    await ensureAdminMembership(orgId, userId);
    provisioned[key] = { ...tenant, userId, orgId };
  }

  fs.writeFileSync(FIXTURES_FILE, JSON.stringify(provisioned, null, 2));
  return provisioned;
}

export function readTenants(): Record<TenantKey, SeededTenant> {
  return JSON.parse(fs.readFileSync(FIXTURES_FILE, "utf8"));
}
