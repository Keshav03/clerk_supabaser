import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for requests that carry no user session, such as Clerk
 * webhooks. Bypasses RLS, so it must never be imported into client code.
 */
export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
