import type { ReactNode } from "react";
import { cabinetHeading } from "@/lib/typography";

/** CRM logos / phase badges between Core features and waitlist CTA on the landing page. */
export function LandingCrmIntegrationsSection() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20 text-center">
      <p className="text-xs font-normal uppercase tracking-widest text-[#7C6FFF]">Integrations</p>
      <h2 className={`${cabinetHeading} mt-3 text-balance text-3xl md:text-4xl`}>Works with your CRM.</h2>
      <p className="mt-2 mb-10 text-base text-zinc-400">
        HubSpot is live today. Pipedrive, Close, Zoho, and Salesforce are coming in phase 2.
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        <CrmCard
          letter="H"
          circleClass="bg-[#FF7A59]"
          label="HubSpot"
          labelClass="text-white"
          badge={<span className="rounded-full bg-[#1D9E75]/20 px-2 py-0.5 text-xs font-medium text-[#86efac]">Live</span>}
        />
        <CrmCard
          letter="P"
          circleClass="bg-[#22a06b]"
          label="Pipedrive"
          labelClass="text-zinc-300"
          badge={<Phase2Badge />}
        />
        <CrmCard
          letter="C"
          circleClass="bg-zinc-700"
          label="Close"
          labelClass="text-zinc-300"
          badge={<Phase2Badge />}
        />
        <CrmCard
          letter="Z"
          circleClass="bg-[#E42527]"
          label="Zoho"
          labelClass="text-zinc-300"
          badge={<Phase2Badge />}
        />
        <CrmCard
          letter="S"
          circleClass="bg-[#00A1E0]"
          label="Salesforce"
          labelClass="text-zinc-300"
          badge={<Phase2Badge />}
        />
      </div>

      <p className="mt-6 text-center text-xs text-zinc-500">
        More integrations planned. Join the waitlist to be notified when yours ships.
      </p>
    </section>
  );
}

function Phase2Badge() {
  return (
    <span className="rounded-full bg-[#7C6FFF]/15 px-2 py-0.5 text-xs font-medium text-[#b9b0ff]">Phase 2</span>
  );
}

function CrmCard({
  letter,
  circleClass,
  label,
  labelClass,
  badge,
}: {
  letter: string;
  circleClass: string;
  label: string;
  labelClass: string;
  badge: ReactNode;
}) {
  return (
    <div className="flex w-[120px] flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-4">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white ${circleClass}`}
      >
        {letter}
      </div>
      <span className={`text-sm font-medium ${labelClass}`}>{label}</span>
      {badge}
    </div>
  );
}
