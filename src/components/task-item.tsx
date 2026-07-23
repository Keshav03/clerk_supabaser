"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Task = { id: number; name: string; completed: boolean };

export function TaskItem({ task }: { task: Task }) {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleToggle(checked: boolean) {
    const { error } = await supabase
      .from("tasks")
      .update({ completed: checked })
      .eq("id", task.id);
    if (error) {
      setError(error.message);
      return;
    }

    setError(null);
    startTransition(() => router.refresh());
  }

  async function handleDelete() {
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) {
      setError(error.message);
      return;
    }

    setError(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col">
      <div className="group flex items-center gap-3 rounded-xl border bg-white px-4.5 py-4 transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-900/60">
        <Checkbox
          checked={task.completed}
          disabled={isPending}
          onCheckedChange={(checked) => handleToggle(checked === true)}
        />
        <span
          className={cn(
            "flex-1 text-sm font-medium",
            task.completed && "text-zinc-400 line-through",
          )}
        >
          {task.name}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete task"
          disabled={isPending}
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {error && <p className="px-1 pt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
}
