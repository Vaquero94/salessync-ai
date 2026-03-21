import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserMenu } from "@/components/user-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="font-semibold">
            SalesSync
          </a>
          <a
            href="/pricing"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Pricing
          </a>
          <a
            href="/dashboard/settings"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Settings
          </a>
        </div>
        <UserMenu user={user} />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
