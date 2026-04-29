import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ensureUserExists } from "@/lib/ensure-user";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const { count: pendingCount } = await supabase
    .from("extractions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("approved", false)
    .eq("dismissed", false);

  return (
    <div className="min-h-screen bg-[#0D0D10] text-white">
      <DashboardNav pendingCount={pendingCount ?? 0} avatarInitial={avatarInitial} />
      <main className="w-full pt-16">
        <div className="mx-auto max-w-5xl px-6">{children}</div>
      </main>
    </div>
  );
}
