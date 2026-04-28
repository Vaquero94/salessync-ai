import { Card, CardContent } from "@/components/ui/card";
import { cabinetHeading } from "@/lib/typography";
import { pains } from "./home-landing-data";

const painTagStyle = {
  background: "rgba(239,68,68,0.1)",
  color: "#FCA5A5",
  fontSize: "11px",
  padding: "2px 8px",
  borderRadius: "4px",
} as const;

/** Vertical timeline: CRM connect → listen → extract → approve (anchor #how-it-works). */
export function LandingHowItWorksSection() {
  return (
    <section id="how-it-works" className="mx-auto max-w-4xl px-6 py-20">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#7C6FFF]">How it works</p>
      <h2 className={`${cabinetHeading} mb-10 text-balance text-3xl text-white md:text-4xl`}>
        From call to CRM in under 30 seconds.
      </h2>

      <div className="relative pl-10 md:pl-12">
        {/* Vertical axis — shortened top/bottom so dots meet the gradient */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-6 left-[15px] top-6 w-0.5"
          style={{
            background: "linear-gradient(to bottom, #7C6FFF, rgba(124,111,255,0.1))",
          }}
        />

        <div className="flex flex-col gap-0">
          {/* Step 1 */}
          <div className="relative mb-8">
            <div
              className="absolute -left-10 top-0 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-[#0D0D10] bg-[#7C6FFF] text-sm font-bold text-white md:-left-12"
              aria-hidden
            >
              1
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#7C6FFF]">CONNECT</p>
              <p className="mb-1 text-[15px] font-semibold text-white">
                Connect your CRM and calendar in under 2 minutes.
              </p>
              <p className="text-sm text-zinc-500">OAuth in one click. No setup wizard, no IT ticket.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative mb-8">
            <div
              className="absolute -left-10 top-0 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-[#0D0D10] bg-[#7C6FFF] text-sm font-bold text-white md:-left-12"
              aria-hidden
            >
              2
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#7C6FFF]">LISTEN</p>
              <p className="mb-1 text-[15px] font-semibold text-white">
                Zero Entry AI joins your calls, emails, and meetings.
              </p>
              <p className="text-sm text-zinc-500">Sits quietly in the background. Reps don&apos;t change how they work.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative mb-8">
            <div
              className="absolute -left-10 top-0 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-[#0D0D10] bg-[#7C6FFF] text-sm font-bold text-white md:-left-12"
              aria-hidden
            >
              3
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#7C6FFF]">EXTRACT</p>
              <p className="mb-1 text-[15px] font-semibold text-white">
                AI extracts contacts, deal changes, tasks, and risks.
              </p>
              <p className="text-sm text-zinc-500">
                Structured data pulled from every conversation automatically.
              </p>
            </div>
          </div>

          {/* Step 4 — Done */}
          <div className="relative">
            <div
              className="absolute -left-10 top-0 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-[#0D0D10] bg-[#86efac] text-sm font-bold text-[#0D0D10] md:-left-12"
              aria-hidden
            >
              ✓
            </div>
            <div className="rounded-xl border border-[#86efac]/20 bg-[#86efac]/[0.06] p-5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#86efac]">DONE</p>
              <p className="mb-1 text-[15px] font-semibold text-white">
                Rep approves in one click before anything syncs.
              </p>
              <p className="text-sm text-zinc-500">
                Review time: 27 seconds. CRM updated. Rep back to selling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Pain vs fix cards with tags and green Zero Entry line. */
export function LandingWhatWeFixSection({ headingClassName }: { headingClassName: string }) {
  return (
    <section className="space-y-4">
      <h2 className={headingClassName}>What we fix</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {pains.map((item) => (
          <Card key={item.pain} className="border-white/10 bg-white/5 text-white">
            <CardContent className="space-y-3 px-6 pb-6 pt-6">
              <span
                className="inline-block font-medium uppercase tracking-wide"
                style={painTagStyle}
              >
                Pain point
              </span>
              <p className="text-base font-semibold text-zinc-100">{item.pain}</p>
              <p className="text-sm text-zinc-300">{item.context}</p>
              <p className="text-sm font-medium" style={{ color: "#86efac" }}>
                Zero Entry fix: {item.fix}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
