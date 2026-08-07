import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  SignInButton,
  SignUpButton,
  Show,
  OrganizationSwitcher,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { getPlanLabel } from "@/lib/plans";

export async function Header() {
  const { has } = await auth();
  const planLabel = getPlanLabel(has);

  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <Link href="/" className="font-semibold">
        clerk-supabaser
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link href="/pricing">
          <Button variant="ghost">Pricing</Button>
        </Link>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button variant="ghost">Sign in</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button>Sign up</Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <OrganizationSwitcher />
          <UserMenu planLabel={planLabel} />
        </Show>
      </div>
    </header>
  );
}

