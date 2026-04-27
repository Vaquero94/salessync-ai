"use client";

import Link from "next/link";
import { DM_Sans, Syne } from "next/font/google";
import { useState, type ReactNode } from "react";
import { Nav } from "@/components/layout/Nav";
import { Button } from "@/components/ui/button";
import { MONTHLY_PRICE, ANNUAL_MONTHLY_EQ } from "./pricing-data";
import { PricingCalculator } from "./pricing-calculator";
import { PricingComparisonFaqCtaFooter } from "./pricing-comparison-faq";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const syne = Syne({ subsets: ["latin"], weight: "800" });

function monthlyEquivalent(plan: keyof typeof MONTHLY_PRICE, annual: boolean) {
  return annual ? ANNUAL_MONTHLY_EQ[plan] : MONTHLY_PRICE[plan];
}

export function PricingExperience() {
  const [annualBilling, setAnnualBilling] = useState(false);

  const starterPrice = monthlyEquivalent("starter", annualBilling);
  const proPrice = monthlyEquivalent("pro", annualBilling);
  const teamPrice = monthlyEquivalent("team", annualBilling);

  return (
    <>
      <Nav activePage="pricing" />

      <main className={`${dmSans.className} min-h-screen bg-[#0D0D10] pb-20 pt-28 text-white`}>
        <section className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="mx-auto mb-4 inline-flex rounded-full border border-[#7C6FFF]/50 bg-[#7C6FFF]/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-[#b9b0ff]">
            Transparent pricing
          </p>
          <h1 className={`${syne.className} mb-4 text-balance text-4xl tracking-tight sm:text-5xl`}>
            Pay for outcomes, not busywork
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            Simple per-seat pricing with annual savings. Start on Starter or Pro; scale to Team when five or more reps need pooled
            capacity and governance.
          </p>
        </section>

        <section className="mx-auto mt-10 flex max-w-6xl flex-col items-center px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!annualBilling ? "text-white" : "text-zinc-500"}`}>Monthly</span>
            <button
              type="button"
              role="switch"
              aria-checked={annualBilling}
              onClick={() => setAnnualBilling((v) => !v)}
              className="relative h-9 w-16 shrink-0 rounded-full border border-white/10 bg-white/10 transition-colors"
              style={{ background: annualBilling ? "#7C6FFF" : undefined }}
            >
              <span
                className="absolute left-1 top-1 h-7 w-7 rounded-full bg-white shadow transition-transform"
                style={{ transform: annualBilling ? "translateX(28px)" : "translateX(0)" }}
              />
            </button>
            <span className={`text-sm font-medium ${annualBilling ? "text-white" : "text-zinc-500"}`}>Annual</span>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: "rgba(124,111,255,0.2)", color: "#c4b5fd" }}
            >
              Save ~20%
            </span>
          </div>
          <p className="mt-2 text-center text-xs text-zinc-500">
            Annual shown as effective monthly rate when billed yearly.
          </p>
        </section>

        <section className="mx-auto mt-12 grid max-w-6xl gap-6 px-4 md:grid-cols-3 sm:px-6">
          <div className="relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className={`${syne.className} text-xl font-bold`}>Starter</h2>
            <p className="mt-1 text-sm text-zinc-400">Individual reps & founders</p>
            <p className="mt-6">
              <span className="text-4xl font-bold">${starterPrice}</span>
              <span className="text-zinc-500">/seat/mo</span>
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm text-zinc-300">
              <PlanCheck>400 recording mins/mo</PlanCheck>
              <PlanCheck>HubSpot CRM</PlanCheck>
              <PlanCheck>Zoom + Meet</PlanCheck>
              <PlanCheck>Web dashboard</PlanCheck>
            </ul>
            <Button asChild className="mt-8 w-full bg-[#7C6FFF] hover:bg-[#7C6FFF]/90">
              <Link href="/#waitlist">Get early access</Link>
            </Button>
          </div>

          <div
            className="relative flex flex-col rounded-2xl border border-[#7C6FFF]/40 bg-[#7C6FFF]/10 p-6"
            style={{ boxShadow: "0 0 0 1px rgba(124,111,255,0.15)" }}
          >
            <span className="absolute right-4 top-0 z-10 -translate-y-1/2 rounded-full bg-[#7C6FFF] px-3 py-1 text-xs font-semibold text-white shadow-lg">
              Most popular
            </span>
            <h2 className={`${syne.className} text-xl font-bold`}>Pro</h2>
            <p className="mt-1 text-sm text-zinc-300">Power sellers & small teams</p>
            <p className="mt-6">
              <span className="text-4xl font-bold">${proPrice}</span>
              <span className="text-zinc-400">/seat/mo</span>
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm text-zinc-200">
              <PlanCheck>Everything in Starter</PlanCheck>
              <PlanCheck>800 recording mins/mo</PlanCheck>
              <PlanCheck>Unlimited email processing</PlanCheck>
              <PlanCheck>Priority support</PlanCheck>
            </ul>
            <Button asChild className="mt-8 w-full bg-white text-[#5B4FE8] hover:bg-white/90">
              <Link href="/#waitlist">Get early access</Link>
            </Button>
          </div>

          <div className="relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <span className="mb-1 inline-block w-fit rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-[#b9b0ff]">
              5 seat minimum
            </span>
            <h2 className={`${syne.className} text-xl font-bold`}>Team</h2>
            <p className="mt-1 text-sm text-zinc-400">Org-wide rollout</p>
            <p className="mt-6">
              <span className="text-4xl font-bold">${teamPrice}</span>
              <span className="text-zinc-500">/seat/mo</span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              Minimum 5 seats. Add more anytime via Settings → Billing → Add seats. Stripe prorates automatically.
            </p>
            <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm text-zinc-300">
              <PlanCheck>Pooled minutes & admin</PlanCheck>
              <PlanCheck>Org-wide policies</PlanCheck>
              <PlanCheck>Dedicated success (15+ seats)</PlanCheck>
            </ul>
            <Button asChild variant="outline" className="mt-8 w-full border-[#7C6FFF]/50 bg-transparent hover:bg-white/5">
              <Link href="/#waitlist">Talk to us</Link>
            </Button>
          </div>
        </section>

        <PricingCalculator annualBilling={annualBilling} />
        <PricingComparisonFaqCtaFooter />
      </main>

      <style jsx global>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.12);
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #7c6fff;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #7c6fff;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        }
      `}</style>
    </>
  );
}

function PlanCheck({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 text-[#86efac]" aria-hidden>
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}
