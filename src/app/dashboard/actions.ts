"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTaskLimit } from "@/lib/plans";
import { isTaskStatus, type TaskStatus } from "@/lib/tasks";

export async function createTask(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return { error: "Task name is required" };
  }

  const { orgId, userId, has } = await auth();
  if (!userId) {
    return { error: "Not signed in" };
  }
  if (!orgId) {
    return { error: "No active organization" };
  }

  const supabase = createSupabaseServerClient();

  // The dashboard hides the form at the limit, but the action is a public
  // endpoint — the plan has to be enforced here too.
  const [{ count }, limit] = await Promise.all([
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    getTaskLimit(supabase, has),
  ]);

  if ((count ?? 0) >= limit) {
    return { error: "You've hit your plan limit. Upgrade to add more tasks." };
  }

  const { error } = await supabase.from("tasks").insert({
    name: trimmed,
    org_id: orgId,
    user_id: userId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateTaskStatus(taskId: number, status: TaskStatus) {
  if (!isTaskStatus(status)) {
    return { error: "Invalid status" };
  }

  const { orgId, userId } = await auth();
  if (!userId) return { error: "Not signed in" };
  if (!orgId) return { error: "No active organization" };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("org_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteTask(taskId: number) {
  const { orgId, userId, has } = await auth();
  if (!userId) return { error: "Not signed in" };
  if (!orgId) return { error: "No active organization" };
  if (!has({ permission: "org:tasks:delete" })) {
    return { error: "You don't have permission to delete tasks" };
  }
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("org_id", orgId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { error: null };
}