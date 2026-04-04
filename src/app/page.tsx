import { createAdminClient } from "@/lib/supabase/admin";
import { WaitlistForm } from "./WaitlistForm";

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Stop Wasting 5 Hours a Week on CRM Data Entry
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          AI auto-logs your calls, emails, and meetings — directly into your CRM.
        </p>

        {count > 0 && (
          <p className="text-sm font-medium text-muted-foreground">
            <span className="text-foreground font-semibold">{count.toLocaleString()}</span>{" "}
            {count === 1 ? "person has" : "people have"} already joined the waitlist.
          </p>
        )}

        <WaitlistForm />

      </section>
    </main>
  );
}
