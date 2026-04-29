"use client";

import { useCallback, useEffect, useState } from "react";
import type { CapturePreferences } from "@/lib/capture-preferences";
import { DEFAULT_CAPTURE_PREFERENCES } from "@/lib/capture-preferences";

const ROWS: {
  key: keyof CapturePreferences;
  label: string;
  description: string;
}[] = [
  { key: "contact", label: "Contact details", description: "Name, role, company, email" },
  { key: "deal", label: "Deal information", description: "Value, stage change, close date" },
  { key: "action_items", label: "Action items", description: "Tasks, owners, due dates" },
  { key: "summary", label: "Call summary", description: "2–3 sentence AI summary" },
  { key: "sentiment", label: "Sentiment", description: "Positive / neutral / negative tone" },
  { key: "objections", label: "Objections raised", description: "Budget, timing, competition, etc." },
  { key: "next_meeting", label: "Next meeting", description: "Scheduled follow-up date and time" },
];

export function CapturePreferencesSection() {
  const [prefs, setPrefs] = useState<CapturePreferences>(DEFAULT_CAPTURE_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/preferences");
        if (!res.ok) throw new Error("load failed");
        const data = (await res.json()) as { preferences: CapturePreferences };
        if (!cancelled) {
          setPrefs({ ...DEFAULT_CAPTURE_PREFERENCES, ...data.preferences });
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(async (key: keyof CapturePreferences) => {
    const prevVal = prefs[key];
    const nextVal = !prevVal;
    setPrefs((p) => ({ ...p, [key]: nextVal }));
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { [key]: nextVal } }),
      });
      if (!res.ok) throw new Error("patch failed");
      const data = (await res.json()) as { preferences: CapturePreferences };
      setPrefs({ ...DEFAULT_CAPTURE_PREFERENCES, ...data.preferences });
    } catch {
      setPrefs((p) => ({ ...p, [key]: prevVal }));
    }
  }, [prefs]);

  if (!loaded) {
    return (
      <section className="space-y-3">
        <div className="h-4 w-36 animate-pulse rounded bg-white/[0.07]" />
        <div className="h-3 w-80 animate-pulse rounded bg-white/[0.05]" />
        <div className="h-14 animate-pulse rounded-xl bg-white/[0.05]" />
        <div className="h-14 animate-pulse rounded-xl bg-white/[0.05]" />
      </section>
    );
  }

  return (
    <section>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        Capture preferences
      </p>
      <p className="mb-2 text-xs text-zinc-600">
        Shown on inbox cards. Everything is always stored in the full record.
      </p>

      <div className="mb-6 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03]">
        {ROWS.map((row) => (
          <button
            key={row.key}
            type="button"
            onClick={() => toggle(row.key)}
            className="flex w-full items-center justify-between border-b border-white/[0.05] px-4 py-3.5 text-left transition last:border-b-0 hover:bg-white/[0.03]"
          >
            <div>
              <p className="text-sm font-medium text-white">{row.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{row.description}</p>
            </div>
            <span
              className={`relative ml-4 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                prefs[row.key] ? "bg-[#7C6FFF]" : "bg-zinc-700"
              }`}
              aria-checked={prefs[row.key]}
              role="switch"
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
                  prefs[row.key] ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
