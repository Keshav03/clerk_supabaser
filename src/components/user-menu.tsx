"use client";

import { CreditCard } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export function UserMenu({ planLabel }: { planLabel: string }) {
  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link
          label={`Plan: ${planLabel}`}
          labelIcon={<CreditCard className="size-4" />}
          href="/pricing"
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}
