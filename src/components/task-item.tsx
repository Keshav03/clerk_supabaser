"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteTask, updateTaskStatus } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "@/lib/tasks";
import { cn } from "@/lib/utils";

type Task = { id: number; name: string; status: TaskStatus };

export function TaskItem({
  task,
  canDelete,
}: {
  task: Task;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleStatusChange(status: TaskStatus) {
    if (status === task.status) return;

    const { error } = await updateTaskStatus(task.id, status);
    if (error) {
      setError(error);
      return;
    }

    setError(null);
    startTransition(() => router.refresh());
  }

  async function handleDelete() {
    const { error } = await deleteTask(task.id);
    if (error) {
      setError(error);
      return;
    }

    setError(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col">
      <div className="group flex items-center gap-3 rounded-xl border bg-white px-4.5 py-4 transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-900/60">
        <span
          className={cn(
            "flex-1 text-sm font-medium",
            task.status === "done" && "text-zinc-400 line-through",
          )}
        >
          {task.name}
        </span>

        <div className="flex gap-1">
          {TASK_STATUSES.map((status) => (
            <Button
              key={status}
              size="xs"
              variant={task.status === status ? "secondary" : "ghost"}
              disabled={isPending}
              onClick={() => handleStatusChange(status)}
            >
              {TASK_STATUS_LABELS[status]}
            </Button>
          ))}
        </div>

        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete task"
            disabled={isPending}
            onClick={handleDelete}
            className="text-zinc-400 opacity-60 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-red-500"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
      {error && <p className="px-1 pt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
}
