import { Card, CardContent } from "@/components/ui/card";
import { pains, steps } from "./home-landing-data";

const painTagStyle = {
  background: "rgba(239,68,68,0.1)",
  color: "#FCA5A5",
  fontSize: "11px",
  padding: "2px 8px",
  borderRadius: "4px",
} as const;

type SectionProps = { headingClassName: string };

/** Step cards with oversized background index (01–04). */
export function LandingHowItWorksSection({ headingClassName }: SectionProps) {
  return (
    <section id="how-it-works" className="space-y-4">
      <h2 className={headingClassName}>How it works</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((step, index) => (
          <Card key={step} className="border-white/10 bg-white/5 text-white">
            <CardContent className="relative overflow-hidden px-6 pb-6 pt-6">
              <span
                aria-hidden
                className="pointer-events-none absolute right-2 top-1 select-none font-bold tabular-nums leading-none"
                style={{ fontSize: "48px", color: "rgba(124,111,255,0.15)" }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="relative z-10">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#b9b0ff]">
                  Step {index + 1}
                </p>
                <p className="text-zinc-200">{step}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/** Pain vs fix cards with tags and green Zero Entry line. */
export function LandingWhatWeFixSection({ headingClassName }: SectionProps) {
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
