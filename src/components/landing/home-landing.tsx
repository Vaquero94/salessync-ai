import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import Link from "next/link";
import { Nav } from "@/components/layout/Nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WaitlistForm } from "@/app/WaitlistForm";
import { features, stats } from "./home-landing-data";
import {
  LandingHowItWorksSection,
  LandingWhatWeFixSection,
} from "./home-landing-how-fix";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"] });
const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const sectionHeadingClass = `${dmSans.className} text-3xl font-bold sm:text-4xl`;

type HomeLandingProps = { waitlistCount: number };

export function HomeLanding({ waitlistCount }: HomeLandingProps) {
  return (
    <main className={`${dmSans.className} min-h-screen bg-[#0D0D10] text-white`}>
      <Nav activePage="home" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-20 pt-28 sm:px-6 lg:gap-16">
        <section className="grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="inline-flex rounded-full border border-[#7C6FFF]/50 bg-[#7C6FFF]/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-[#b9b0ff]">
              Now live — HubSpot integration
            </p>
            <h1
              className={`${bricolageGrotesque.className} text-balance text-4xl leading-tight sm:text-5xl lg:text-6xl`}
            >
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
              <CardTitle className={`${dmSans.className} text-2xl font-medium`}>AI review card</CardTitle>
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

        <LandingHowItWorksSection headingClassName={sectionHeadingClass} />
        <LandingWhatWeFixSection headingClassName={sectionHeadingClass} />

        <section className="space-y-4">
          <h2 className={sectionHeadingClass}>Core features</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-200">
                {feature}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className={sectionHeadingClass}>Simple pricing</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className={`${dmSans.className} text-2xl font-bold`}>Starter - $19</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-200">
                <p>Ideal for individual reps and founders.</p>
                <p>Includes extraction review, approve/dismiss control, and CRM sync.</p>
                <ul className="list-inside list-disc space-y-1 text-zinc-300">
                  <li>400 recording mins/mo</li>
                  <li>HubSpot CRM</li>
                  <li>Zoom + Meet</li>
                  <li>web dashboard</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-[#7C6FFF]/40 bg-[#7C6FFF]/10 text-white">
              <CardHeader>
                <CardTitle className={`${dmSans.className} text-2xl font-bold`}>Pro - $29</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-100">
                <p>Built for teams that need consistency and speed at scale.</p>
                <p>Everything in Starter plus advanced controls and priority onboarding.</p>
                <ul className="list-inside list-disc space-y-1 text-zinc-200">
                  <li>Everything in Starter</li>
                  <li>800 recording mins/mo</li>
                  <li>unlimited email processing</li>
                  <li>priority support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="waitlist" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className={sectionHeadingClass}>Get early access</h2>
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
