"use client";

import { useState, useTransition } from "react";

type Props = {
  initialAutoPilot: boolean;
};

export function AutoPilotToggle({ initialAutoPilot }: Props) {
  const [autoPilot, setAutoPilot] = useState(initialAutoPilot);
  const [isPending, startTransition] = useTransition();

  function onToggle() {
    if (isPending) return;
    const next = !autoPilot;
    setAutoPilot(next);
    startTransition(async () => {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_pilot: next }),
      });
      if (!response.ok) {
        setAutoPilot(!next);
      }
    });
  }

  return (
    <section>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Auto-pilot</p>
      <div className="mb-6 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03]">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-sm font-medium text-white">Auto-pilot mode</p>
            {autoPilot ? (
              <p className="mt-0.5 text-xs text-[#86efac]">
                Extractions push automatically without review
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-zinc-500">
                Review each extraction before it pushes
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onToggle}
            disabled={isPending}
            className={`relative h-6 w-11 rounded-full transition ${
              autoPilot ? "bg-[#7C6FFF]" : "bg-zinc-700"
            }`}
            aria-label="Toggle auto-pilot mode"
            aria-pressed={autoPilot}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                autoPilot ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        <div className="border-t border-white/[0.05] bg-amber-500/[0.06] px-4 py-3">
          <div className="flex items-start">
            <span className="mr-2 text-sm text-amber-400">⚠</span>
            <div>
              <p className="text-xs leading-relaxed text-amber-400/80">
                AI extractions can occasionally hallucinate — inventing contacts, deal values, or
                action items that weren&apos;t mentioned. With auto-pilot on, errors go straight to
                HubSpot without a human check.
              </p>
              <p className="mt-1.5 text-xs text-zinc-600">
                Every push is logged in History. You can review and correct any entry in HubSpot at any
                time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
