import Link from "next/link";
import { ListTodo } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTaskLimit, getPlanLabel } from "@/lib/plans";
import { TASK_STATUSES, TASK_STATUS_LABELS, isTaskStatus } from "@/lib/tasks";
import { TaskForm } from "@/components/task-form";
import { TaskItem } from "@/components/task-item";
import { cn } from "@/lib/utils";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { has, orgId } = await auth.protect();

  if (!orgId) redirect("/");

  const { status } = await searchParams;
  const activeFilter = isTaskStatus(status) ? status : "all";

  const canDelete = has({ permission: "org:tasks:delete" });

  const supabase = createSupabaseServerClient();

  let tasksQuery = supabase
    .from("tasks")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (activeFilter !== "all") {
    tasksQuery = tasksQuery.eq("status", activeFilter);
  }

  const [{ data: tasks, error }, { count }, limit] = await Promise.all([
    tasksQuery,
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    getTaskLimit(supabase, has),
  ]);

  // Plan limits count every task in the org, not just the filtered view
  const taskCount = count ?? 0;
  const atLimit = taskCount >= limit;
  const planLabel = getPlanLabel(has);
  const isUnlimited = limit === Infinity;
  const usagePct = isUnlimited ? 0 : Math.min(taskCount / limit, 1) * 100;
  const barColor = atLimit
    ? "bg-destructive"
    : usagePct >= 70
      ? "bg-warning"
      : "bg-success";

  const filters = ["all", ...TASK_STATUSES] as const;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-12">
      <h1 className="text-2xl font-semibold">Your tasks</h1>

      <div className="rounded-xl border bg-white p-5 dark:bg-zinc-900">
        <div className="mb-2 flex items-center justify-between text-[13px] font-semibold">
          <span>
            {isUnlimited
              ? `${taskCount} tasks used`
              : `${taskCount} / ${limit} tasks used`}
          </span>
          <span className="font-mono font-normal text-zinc-500">
            {planLabel} plan
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${isUnlimited ? 100 : usagePct}%` }}
          />
        </div>
      </div>

      <TaskForm atLimit={atLimit} planLabel={planLabel} />

      <div className="flex flex-col gap-3">
        <div className="flex gap-1.5">
          {filters.map((filter) => (
            <Link
              key={filter}
              href={filter === "all" ? "/dashboard" : `/dashboard?status=${filter}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                activeFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "text-zinc-500 hover:bg-muted",
              )}
            >
              {filter === "all" ? "All" : TASK_STATUS_LABELS[filter]}
            </Link>
          ))}
        </div>

        {error && <p className="text-sm text-red-500">{error.message}</p>}

        {taskCount === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-[10px] bg-zinc-100 dark:bg-zinc-800">
              <ListTodo className="size-5 text-zinc-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">No tasks yet</p>
              <p className="text-[13px] text-zinc-500">
                Add your first task above to get started.
              </p>
            </div>
          </div>
        ) : tasks?.length === 0 ? (
          <p className="rounded-xl border border-dashed py-8 text-center text-[13px] text-zinc-500">
            No tasks in this view.
          </p>
        ) : (
          tasks?.map((task) => (
            <TaskItem key={task.id} task={task} canDelete={canDelete} />
          ))
        )}
      </div>
    </div>
  );
}
