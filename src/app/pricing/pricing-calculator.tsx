"use client";

import { Syne } from "next/font/google";
import { useMemo, useState } from "react";
import { ANNUAL_MONTHLY_EQ, MONTHLY_PRICE } from "./pricing-data";

const syne = Syne({ subsets: ["latin"], weight: "800" });

function monthlyEq(plan: keyof typeof MONTHLY_PRICE, annual: boolean) {
  return annual ? ANNUAL_MONTHLY_EQ[plan] : MONTHLY_PRICE[plan];
}

export function PricingCalculator({ annualBilling }: { annualBilling: boolean }) {
  const [reps, setReps] = useState(3);
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(100);
  const [planIndex, setPlanIndex] = useState<0 | 1 | 2>(1);

  const starterPrice = monthlyEq("starter", annualBilling);
  const proPrice = monthlyEq("pro", annualBilling);
  const teamPrice = monthlyEq("team", annualBilling);
  const teamSeats = Math.max(reps, 5);

  const monthlyAdminCost = useMemo(() => {
    const weeksPerMonth = 4.33;
    return Math.round(reps * hoursPerWeek * hourlyRate * weeksPerMonth);
  }, [reps, hoursPerWeek, hourlyRate]);

  const planMonthlyCost = useMemo(() => {
    if (planIndex === 0) return starterPrice * reps;
    if (planIndex === 1) return proPrice * reps;
    return teamPrice * teamSeats;
  }, [planIndex, starterPrice, proPrice, teamPrice, reps, teamSeats]);

  const netBenefit = monthlyAdminCost - planMonthlyCost;

  const recommendation = useMemo(() => {
    if (reps === 1) {
      return {
        title: "Recommended: Pro",
        body: "Solo reps get the best balance of minutes, email capture, and review workflow on Pro.",
      };
    }
    if (reps >= 2 && reps <= 4) {
      const proTotal = proPrice * reps;
      const teamTotal = teamPrice * Math.max(reps, 5);
      const saveVsTeam = proTotal - teamTotal;
      return {
        title: "Recommended: Pro",
        body: `For ${reps} reps, Pro covers everyone without the Team five-seat minimum. Team starts at five seats (${teamPrice}/seat × 5 = $${(teamPrice * 5).toLocaleString()}/mo)—${saveVsTeam > 0 ? `about $${saveVsTeam.toLocaleString()}/mo less than committing to Team until you truly need five seats.` : `compare totals in the calculator above.`}`,
      };
    }
    const proTotalAll = proPrice * reps;
    const teamTotalAll = teamPrice * teamSeats;
    const save = proTotalAll - teamTotalAll;
    return {
      title: "Recommended: Team",
      body:
        save > 0
          ? `At ${reps} reps, Team saves about $${save.toLocaleString()}/mo versus buying individual Pro seats, with pooled minutes and org-wide controls (Team uses ${teamSeats} seats at $${teamPrice}/seat).`
          : `At ${reps} reps, Team aligns pricing with pooled minutes and admin controls (${teamSeats} seats × $${teamPrice}).`,
    };
  }, [reps, proPrice, teamPrice, teamSeats]);

  return (
    <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
      <h2 className={`${syne.className} mb-2 text-center text-3xl font-bold`}>ROI calculator</h2>
      <p className="mx-auto mb-10 max-w-2xl text-center text-zinc-400">
        Estimate admin labor going into CRM hygiene versus your Zero Entry AI subscription.
      </p>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <SliderRow label="Sales reps" min={1} max={50} value={reps} onChange={setReps} />
          <SliderRow
            label="CRM admin hours / rep / week"
            min={1}
            max={40}
            value={hoursPerWeek}
            onChange={setHoursPerWeek}
            suffix=" hrs"
          />
          <SliderRow
            label="Fully loaded hourly rate"
            min={25}
            max={500}
            step={5}
            value={hourlyRate}
            onChange={setHourlyRate}
            prefix="$"
          />
          <div>
            <p className="mb-3 text-sm font-medium text-zinc-300">Compare plan</p>
            <div className="flex flex-wrap gap-2">
              {(["Starter", "Pro", "Team"] as const).map((name, i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setPlanIndex(i as 0 | 1 | 2)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    planIndex === i ? "bg-[#7C6FFF] text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            {planIndex === 2 && (
              <p className="mt-2 text-xs text-zinc-500">
                Team billing uses max(reps, 5) seats ({teamSeats} seats).
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
            <p className="text-sm text-zinc-400">Est. monthly admin labor cost</p>
            <p className="mt-1 text-3xl font-bold text-white">${monthlyAdminCost.toLocaleString()}</p>
            <p className="mt-4 text-sm text-zinc-400">Zero Entry AI plan ({["Starter", "Pro", "Team"][planIndex]})</p>
            <p className="mt-1 text-3xl font-bold text-[#c4b5fd]">${planMonthlyCost.toLocaleString()}/mo</p>
            <p className="mt-4 border-t border-white/10 pt-4 text-sm text-zinc-400">Estimated net vs manual CRM work</p>
            <p className={`mt-1 text-2xl font-bold ${netBenefit >= 0 ? "text-emerald-400" : "text-amber-300"}`}>
              ${netBenefit.toLocaleString()}/mo
            </p>
          </div>

          <div className="rounded-2xl border border-[#7C6FFF]/30 bg-[#7C6FFF]/10 p-6">
            <p className="text-sm font-semibold text-[#e0dcff]">{recommendation.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{recommendation.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SliderRow({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  prefix = "",
  suffix = "",
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-zinc-300">{label}</span>
        <span className="font-medium text-white">
          {prefix}
          {value}
          {suffix}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
