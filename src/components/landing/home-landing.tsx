import { DM_Sans } from "next/font/google";
import Link from "next/link";
import { Nav } from "@/components/layout/Nav";
import { Button } from "@/components/ui/button";
import { WaitlistForm } from "@/app/WaitlistForm";
import { cabinetBold, cabinetHeading } from "@/lib/typography";
import { features, stats } from "./home-landing-data";
import { LandingCrmIntegrationsSection } from "./home-landing-crm";
import {
  LandingHowItWorksSection,
  LandingWhatWeFixSection,
} from "./home-landing-how-fix";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"] });

const sectionHeadingClass = `${dmSans.className} text-3xl font-bold sm:text-4xl`;

type HomeLandingProps = { waitlistCount: number };

export function HomeLanding({ waitlistCount }: HomeLandingProps) {
  return (
    <main className={`${dmSans.className} min-h-screen bg-[#0D0D10] text-white`}>
      <Nav activePage="home" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-20 pt-28 sm:px-6 lg:gap-16">
        <section className="mx-auto flex min-h-[80vh] w-full max-w-4xl flex-col items-center justify-center px-6 py-28 text-center md:py-36">
          <p className="mb-6 inline-block rounded-full border border-[#7C6FFF]/50 bg-[#7C6FFF]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#b9b0ff]">
            NOW LIVE — HUBSPOT INTEGRATION
          </p>
          <h1 className={`${cabinetHeading} mb-6 text-balance text-5xl leading-[1.08] tracking-tight text-white md:text-6xl lg:text-7xl`}>
            Your CRM updates itself. Your reps stay in flow.
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 md:text-xl">
            Zero Entry AI auto-logs every call, email, and meeting into your CRM, then gives reps a fast review step
            before syncing.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              className="rounded-lg bg-[#7C6FFF] px-8 py-3 text-base font-semibold text-white transition hover:opacity-90"
            >
              <Link href="/#waitlist">Get early access</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-lg border border-white/20 bg-transparent px-8 py-3 text-base font-medium text-zinc-300 transition hover:border-white/40 hover:text-white"
            >
              <Link href="/#demo">See demo review</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-zinc-600">No credit card required · 14-day free trial · Cancel anytime</p>
        </section>

        <section className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-center text-sm">
              {stat}
            </div>
          ))}
        </section>

        <LandingHowItWorksSection />
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

        <LandingCrmIntegrationsSection />

        <section
          id="waitlist"
          className="rounded-2xl border border-[#7C6FFF]/30 bg-[#12101e] px-8 py-16 text-center"
        >
          <h2 className={`${cabinetHeading} text-balance text-4xl md:text-5xl`}>Stop logging. Start selling.</h2>
          <p className="mt-3 mb-8 text-base text-zinc-400">
            Join the waitlist and be first to get your CRM updated automatically — in under 30 seconds per call.
          </p>
          <Link
            href="/#waitlist"
            className="inline-flex rounded-lg bg-[#7C6FFF] px-8 py-3 text-base font-semibold text-white transition hover:opacity-90"
          >
            Get early access
          </Link>
          <div className="mx-auto mt-8 max-w-md">
            <WaitlistForm />
          </div>
          {waitlistCount > 0 ? (
            <p className="mt-4 text-sm text-zinc-500">{waitlistCount.toLocaleString()} people are already in line.</p>
          ) : null}
        </section>
      </div>

      <footer className={`${dmSans.className} mx-auto mt-12 max-w-6xl border-t border-white/10 px-4 pb-12 pt-10 sm:px-6`}>
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <p className={`${cabinetBold} text-lg text-white`}>Zero Entry AI</p>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-zinc-400" aria-label="Footer">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="/#waitlist" className="hover:text-white">
              Waitlist
            </Link>
          </nav>
        </div>
        <p className="mt-8 text-center text-xs text-zinc-500">© 2026 Zero Entry AI. All rights reserved.</p>
      </footer>
    </main>
  );
}
