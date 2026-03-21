"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  user: {
    email?: string | null;
    user_metadata?: { full_name?: string } | null;
  };
};

/**
 * User profile dropdown with name display and logout.
 */
export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const supabase = createClient();

  const displayName =
    user.user_metadata?.full_name || user.email || "User";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
        <User className="h-4 w-4" />
        {displayName}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem className="flex flex-col items-start gap-0.5 py-2">
          <span className="font-medium">{displayName}</span>
          {user.email && (
            <span className="text-xs text-muted-foreground">{user.email}</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
