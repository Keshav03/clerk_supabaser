import Link from "next/link";
import { Lock, Database as DatabaseIcon } from "lucide-react";
import { SignUpButton, Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black sm:py-28">
      <main className="w-full max-w-[1100px] rounded-2xl border bg-gradient-to-b from-zinc-50 to-white px-6 py-14 text-center dark:from-zinc-950 dark:to-zinc-950 sm:px-10 sm:py-20">
        <div className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full bg-primary-tint px-3 py-1.5 text-xs font-semibold text-primary-tint-foreground">
          New · Built on Supabase + Clerk
        </div>

        <h1 className="mx-auto max-w-xl text-4xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-[44px] dark:text-zinc-50">
          Ship your product&apos;s backend in an afternoon
        </h1>

        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Auth, database, and billing wired up — you focus on the part only
          you can build.
        </p>

        <div className="mt-7 flex justify-center gap-3">
          <Show when="signed-out">
            <SignUpButton mode="modal">
              <Button size="lg">Get started</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button size="lg">Go to dashboard</Button>
            </Link>
          </Show>
          <Link href="/pricing">
            <Button size="lg" variant="outline">
              View pricing
            </Button>
          </Link>
        </div>

        <div className="mt-11 grid gap-4 text-left sm:grid-cols-2">
          <div className="rounded-xl border bg-white p-6 dark:bg-zinc-900">
            <div className="mb-3.5 flex size-9 items-center justify-center rounded-[9px] bg-primary-tint">
              <Lock className="size-4.5 text-primary" />
            </div>
            <div className="mb-1.5 text-[15px] font-semibold">
              Teams and roles
            </div>
            <p className="text-[13px] leading-5 text-zinc-500">
              Sign in, switch organizations, and split access between admins
              and members.
            </p>
          </div>
          <div className="rounded-xl border bg-white p-6 dark:bg-zinc-900">
            <div className="mb-3.5 flex size-9 items-center justify-center rounded-[9px] bg-primary-tint">
              <DatabaseIcon className="size-4.5 text-primary" />
            </div>
            <div className="mb-1.5 text-[15px] font-semibold">
              Isolated by default
            </div>
            <p className="text-[13px] leading-5 text-zinc-500">
              Postgres row level security scopes every task to your
              organization.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
