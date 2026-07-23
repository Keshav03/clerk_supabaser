import type { SupabaseClient } from "@supabase/supabase-js";

type HasChecker = (params: { plan: string }) => boolean;

const PLAN_SLUGS_BY_PRIORITY = ["pro_max", "pro"] as const;
const FREE_PLAN_SLUG = "free_user";
const FALLBACK_TASK_LIMIT = 0;

const PLAN_LABELS: Record<string, string> = {
  free_user: "Free",
  pro: "Pro",
  pro_max: "Pro Max",
};

export function getActivePlanSlug(has: HasChecker): string {
  return (
    PLAN_SLUGS_BY_PRIORITY.find((slug) => has({ plan: slug })) ??
    FREE_PLAN_SLUG
  );
}

export function getPlanLabel(has: HasChecker): string {
  return PLAN_LABELS[getActivePlanSlug(has)];
}

export async function getTaskLimit(
  supabase: SupabaseClient,
  has: HasChecker,
): Promise<number> {
  const activeSlug = getActivePlanSlug(has);

  const { data } = await supabase
    .from("plan_task_limits")
    .select("task_limit")
    .eq("plan_slug", activeSlug)
    .maybeSingle();

  if (!data) return FALLBACK_TASK_LIMIT;
  return data.task_limit ?? Infinity;
}
