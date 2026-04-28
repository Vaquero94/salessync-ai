"use client";

import { useState, useTransition } from "react";

type Props = {
  unlocked: boolean;
  initialAutoPilot: boolean;
  approvedCount: number;
};

export function AutoPilotToggle({ unlocked, initialAutoPilot, approvedCount }: Props) {
  const [autoPilot, setAutoPilot] = useState(initialAutoPilot);
  const [isPending, startTransition] = useTransition();
  const progress = Math.min(100, Math.round((approvedCount / 10) * 100));

  function onToggle() {
    if (!unlocked || isPending) return;
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
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-lg font-semibold text-white">Auto-pilot mode</h2>
      <p className="mt-2 text-sm text-zinc-400">
        When enabled, Zero Entry AI pushes extractions directly to HubSpot without asking for your review.
      </p>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-300">{autoPilot ? "Enabled" : "Disabled"}</p>
        <button
          type="button"
          onClick={onToggle}
          disabled={!unlocked || isPending}
          className={`relative h-6 w-11 rounded-full transition ${
            autoPilot ? "bg-[#7C6FFF]" : "bg-zinc-700"
          } ${!unlocked ? "cursor-not-allowed opacity-60" : ""}`}
          aria-label="Toggle auto-pilot mode"
          aria-pressed={autoPilot}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
              autoPilot ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {!unlocked ? (
        <div className="mt-4">
          <p className="text-xs text-zinc-500">
            Complete 10 approved extractions to unlock auto-pilot.
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            {approvedCount} of 10 approvals completed
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
            <div
              className="h-1.5 rounded-full bg-[#7C6FFF]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
