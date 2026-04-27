import { createAdminClient } from "@/lib/supabase/admin";
import { HomeLanding } from "@/components/landing/home-landing";

async function getWaitlistCount(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function Home() {
  const count = await getWaitlistCount();
  return <HomeLanding waitlistCount={count} />;
}
