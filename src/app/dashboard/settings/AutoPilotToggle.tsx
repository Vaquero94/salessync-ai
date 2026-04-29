"use client";

import { useState, useTransition } from "react";
import { Lock } from "lucide-react";

type Props = {
  unlocked: boolean;
  initialAutoPilot: boolean;
  approvedCount: number;
};

export function AutoPilotToggle({ unlocked, initialAutoPilot, approvedCount }: Props) {
  const [autoPilot, setAutoPilot] = useState(initialAutoPilot);
  const [isPending, startTransition] = useTransition();
  const clampedCount = Math.max(0, Math.min(approvedCount, 10));
  const progress = Math.min(100, Math.round((clampedCount / 10) * 100));

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
    <section>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Auto-pilot</p>
      <div className="mb-6 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03]">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-sm font-medium text-white">Auto-pilot mode</p>
            {!unlocked ? (
              <p className="mt-0.5 text-xs text-zinc-500">
                Complete {clampedCount} of 10 approvals to unlock
              </p>
            ) : autoPilot ? (
              <p className="mt-0.5 text-xs text-[#86efac]">
                Extractions push automatically without review
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-zinc-500">
                Review each extraction before it pushes
              </p>
            )}
          </div>
          {!unlocked ? (
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-zinc-600" />
              <button
                type="button"
                disabled
                className="relative h-6 w-11 cursor-not-allowed rounded-full bg-zinc-800"
                aria-label="Auto-pilot locked"
                aria-pressed={false}
              >
                <span className="absolute top-1 h-4 w-4 translate-x-0.5 rounded-full bg-zinc-500" />
              </button>
            </div>
          ) : (
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
                  autoPilot ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          )}
        </div>
        {!unlocked ? (
          <div className="px-4 pb-3">
            <div className="h-1 w-full rounded-full bg-white/[0.05]">
              <div className="h-1 rounded-full bg-[#7C6FFF]" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-zinc-600">{clampedCount} / 10 approvals</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
