import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return new Response("Verification failed", { status: 400 });
  }

  switch (evt.type) {
    case "subscription.created":
    case "subscription.updated":
    case "subscription.active":
    case "subscription.pastDue": {
      const { id, payer, items, status } = evt.data;
      const orgId = payer?.organization_id;

      // Personal subscriptions still fire these events; only orgs own tasks.
      if (!orgId) break;

      const supabase = createSupabaseAdminClient();
      const { error } = await supabase.from("org_subscriptions").upsert(
        {
          org_id: orgId,
          subscription_id: id,
          plan_slug: items?.[0]?.plan?.slug ?? null,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "org_id" },
      );

      if (error) {
        console.error("Failed to sync org subscription:", error.message);
        return new Response("Sync failed", { status: 500 });
      }
      break;
    }
  }

  return new Response("OK", { status: 200 });
}
