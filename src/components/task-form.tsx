"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createTask } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TaskForm({
  atLimit,
  planLabel,
}: {
  atLimit: boolean;
  planLabel: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const result = await createTask(name);
    if (result.error) {
      setError(result.error);
      return;
    }

    setError(null);
    setName("");
    startTransition(() => router.refresh());
  }

  if (atLimit) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-primary-tint bg-primary-tint px-5 py-4.5">
        <div>
          <p className="text-sm font-semibold text-primary-tint-foreground">
            You&apos;ve hit your {planLabel} plan limit
          </p>
          <p className="text-[13px] text-primary-tint-foreground/80">
            Upgrade for more room to work.
          </p>
        </div>
        <Link href="/pricing">
          <Button size="sm">Upgrade</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a task..."
        />
        <Button type="submit" disabled={isPending}>
          Add
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
}
