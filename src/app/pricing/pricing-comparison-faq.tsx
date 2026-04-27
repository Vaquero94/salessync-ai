"use client";

import Link from "next/link";
import { Syne } from "next/font/google";
import { DM_Sans } from "next/font/google";
import { Button } from "@/components/ui/button";
import { faqItems } from "./pricing-data";

const syne = Syne({ subsets: ["latin"], weight: "800" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export function PricingComparisonFaqCtaFooter() {
  return (
    <>
      <section className="mx-auto mt-24 max-w-6xl overflow-x-auto px-4 sm:px-6">
        <h2 className={`${syne.className} mb-8 text-center text-3xl font-bold`}>Feature comparison</h2>
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3 pr-4 font-medium text-zinc-400">Feature</th>
              <th className="py-3 px-4 font-semibold text-white">Starter</th>
              <th className="py-3 px-4 font-semibold text-[#c4b5fd]">Pro</th>
              <th className="py-3 px-4 font-semibold text-white">Team</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            <CmpRow feature="HubSpot CRM sync" s="✓" p="✓" t="✓" />
            <CmpRow feature="Recording minutes / seat" s="400/mo" p="800/mo" t="Pooled" />
            <CmpRow feature="Email capture" s="✓" p="Unlimited" t="Unlimited" />
            <CmpRow feature="Zoom + Meet" s="✓" p="✓" t="✓" />
            <CmpRow feature="Phone recording" s="—" p="—" t="Coming soon" />
            <CmpRow feature="Priority support" s="—" p="✓" t="✓" />
            <CmpRow feature="Org policies & roles" s="—" p="—" t="✓" />
            <CmpRow feature="Minimum seats" s="1" p="1" t="5" />
          </tbody>
        </table>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <h2 className={`${syne.className} mb-10 text-center text-3xl font-bold`}>FAQ</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {faqItems.map((item) => (
            <div key={item.q} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="font-semibold text-white">{item.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl border border-[#7C6FFF]/40 bg-gradient-to-br from-[#7C6FFF]/20 to-transparent px-8 py-12 text-center">
          <h2 className={`${syne.className} text-2xl font-bold sm:text-3xl`}>Ready to zero out CRM busywork?</h2>
          <p className="mx-auto mt-2 max-w-xl text-zinc-400">Join the waitlist for early access and onboarding.</p>
          <Button asChild size="lg" className="mt-6 bg-white font-semibold text-[#5B4FE8] hover:bg-white/90">
            <Link href="/#waitlist">Get early access</Link>
          </Button>
        </div>
      </section>

      <footer className={`${dmSans.className} mx-auto mt-20 max-w-6xl border-t border-white/10 px-4 pt-10 sm:px-6`}>
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <p className={`${syne.className} text-lg font-bold text-white`}>Zero Entry AI</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-400">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="/#how-it-works" className="hover:text-white">
              How it works
            </Link>
            <Link href="/#waitlist" className="hover:text-white">
              Waitlist
            </Link>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-zinc-600">© {new Date().getFullYear()} Zero Entry AI. All rights reserved.</p>
      </footer>
    </>
  );
}

function CmpRow({ feature, s, p, t }: { feature: string; s: string; p: string; t: string }) {
  return (
    <tr className="border-b border-white/5">
      <td className="py-3 pr-4 text-zinc-400">{feature}</td>
      <td className="py-3 px-4">{s}</td>
      <td className="py-3 px-4">{p}</td>
      <td className="py-3 px-4">{t}</td>
    </tr>
  );
}
