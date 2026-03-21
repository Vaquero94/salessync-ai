import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
        {/* Hero heading for the core value proposition */}
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Stop Wasting 5 Hours a Week on CRM Data Entry
        </h1>

        {/* Supporting subtitle that explains the product behavior */}
        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          AI auto-logs your calls, emails, and meetings
        </p>

        {/* Primary call-to-action using shadcn/ui button */}
        <div className="flex gap-4">
          <Button asChild size="lg">
            <a href="/signup" aria-label="Start Free Trial">
              Start Free Trial
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="/pricing">View Pricing</a>
          </Button>
        </div>
      </section>
    </main>
  );
}
