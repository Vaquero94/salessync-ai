import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ensureUserExists } from "@/lib/ensure-user";
import { cabinetBold } from "@/lib/typography";

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

  await ensureUserExists(user);
  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "User";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#0D0D10] text-white">
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-white/10 bg-[#0D0D10]">
        <div className="mx-auto flex h-full w-full max-w-[1100px] items-center justify-between px-6">
          <Link href="/" className={`${cabinetBold} text-lg text-white`}>
            ZeroEntryAI
          </Link>
          <nav className="flex items-center gap-6 text-sm text-zinc-400">
            <Link href="/dashboard" className="transition hover:text-white">
              Dashboard
            </Link>
            <Link href="/dashboard/settings" className="transition hover:text-white">
              Settings
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <p className="max-w-[180px] truncate text-sm text-zinc-300">{displayName}</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xs font-semibold text-white">
              {avatarInitial}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1100px] px-6 py-8 pt-16">{children}</main>
    </div>
  );
}
