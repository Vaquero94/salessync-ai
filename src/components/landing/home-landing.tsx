import { DM_Sans, Syne } from "next/font/google";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WaitlistForm } from "@/app/WaitlistForm";

const syne = Syne({ subsets: ["latin"], weight: "800" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"] });

const stats = ["5hrs saved weekly", "30s review time", "8x cheaper than VAs", "100% rep-controlled"];
const steps = [
  "Connect your CRM and calendar in under 2 minutes.",
  "Zero Entry AI listens to calls, emails, and meetings.",
  "AI extracts contacts, deal changes, tasks, and risks.",
  "Rep approves in one click before anything syncs.",
];
const pains = [
  { pain: "Manual CRM updates after every call", fix: "Auto-captured data appears instantly for approval." },
  { pain: "Inconsistent deal notes and missing context", fix: "Standardized summaries and structured fields every time." },
  { pain: "Reps lose selling time to admin work", fix: "Admin shrinks from hours to minutes each week." },
  { pain: "Leaders cannot trust pipeline hygiene", fix: "Rep-controlled reviews keep every update accurate." },
];
const features = [
  "CRM-ready contact and deal extraction",
  "Action item detection with owner + due date",
  "Call summary and sentiment tagging",
  "One-click approve, edit, or dismiss",
  "Duplicate-safe waitlist and onboarding flow",
  "Built for teams that value data quality",
];

type HomeLandingProps = { waitlistCount: number };

export function HomeLanding({ waitlistCount }: HomeLandingProps) {
  return (
    <main className={`${dmSans.className} min-h-screen bg-[#0D0D10] text-white`}>
      {/* Fixed navigation for quick top-level actions */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0D0D10]/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo variant="compact" priority />
          <Button asChild className="bg-[#7C6FFF] text-white hover:bg-[#7C6FFF]/90">
            <Link href="#waitlist">Get early access</Link>
          </Button>
        </div>
      </nav>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-20 pt-28 sm:px-6 lg:gap-16">
        <section className="grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="inline-flex rounded-full border border-[#7C6FFF]/50 bg-[#7C6FFF]/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-[#b9b0ff]">
              Zero Entry AI for modern revenue teams
            </p>
            <h1 className={`${syne.className} text-balance text-4xl leading-tight sm:text-5xl lg:text-6xl`}>
              Your CRM updates itself. Your reps stay in flow.
            </h1>
            <p className="max-w-xl text-lg text-zinc-300">
              Zero Entry AI auto-logs every call, email, and meeting into your CRM, then gives reps a fast review
              step before syncing.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-[#7C6FFF] text-white hover:bg-[#7C6FFF]/90">
                <Link href="#waitlist">Get early access</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent hover:bg-white/10">
                <Link href="#demo">See demo review</Link>
              </Button>
            </div>
          </div>
          <Card id="demo" className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className={`${syne.className} text-2xl`}>Demo extraction review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-200">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Contact detected</p>
                <p>Jordan Kim, VP Sales, Northstar Logistics</p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Deal update</p>
                <p>$48,000 renewal moved from Discovery to Proposal.</p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Action items</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>Alex - send pricing options by Friday</li>
                  <li>Jordan - confirm security questionnaire owner</li>
                </ul>
              </div>
              <p className="rounded-md border border-[#7C6FFF]/40 bg-[#7C6FFF]/15 px-3 py-2 text-[#d2ccff]">
                Rep review time: 27 seconds to approve and sync.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-center text-sm">
              {stat}
            </div>
          ))}
        </section>

        <section id="how-it-works" className="space-y-4">
          <h2 className={`${syne.className} text-3xl sm:text-4xl`}>How it works</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((step, index) => (
              <Card key={step} className="border-white/10 bg-white/5 text-white">
                <CardContent className="pt-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#b9b0ff]">Step {index + 1}</p>
                  <p className="text-zinc-200">{step}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className={`${syne.className} text-3xl sm:text-4xl`}>What we fix</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pains.map((item) => (
              <Card key={item.pain} className="border-white/10 bg-white/5 text-white">
                <CardContent className="space-y-2 pt-6">
                  <p className="text-base font-semibold text-zinc-100">{item.pain}</p>
                  <p className="text-sm text-zinc-300">{item.fix}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className={`${syne.className} text-3xl sm:text-4xl`}>Core features</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-200">
                {feature}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className={`${syne.className} text-3xl sm:text-4xl`}>Simple pricing</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className={`${syne.className} text-2xl`}>Starter - $19</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-200">
                <p>Ideal for individual reps and founders.</p>
                <p>Includes extraction review, approve/dismiss control, and CRM sync.</p>
              </CardContent>
            </Card>
            <Card className="border-[#7C6FFF]/40 bg-[#7C6FFF]/10 text-white">
              <CardHeader>
                <CardTitle className={`${syne.className} text-2xl`}>Pro - $29</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-100">
                <p>Built for teams that need consistency and speed at scale.</p>
                <p>Everything in Starter plus advanced controls and priority onboarding.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="waitlist" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className={`${syne.className} text-3xl sm:text-4xl`}>Get early access</h2>
          <p className="mt-2 max-w-2xl text-zinc-300">
            Join the waitlist and we will invite you as we roll out onboarding.
            {waitlistCount > 0 ? ` ${waitlistCount.toLocaleString()} people are already in line.` : ""}
          </p>
          <div className="mt-6 max-w-md">
            <WaitlistForm />
          </div>
        </section>
      </div>
    </main>
  );
}
