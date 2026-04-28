"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hubSpotDestinationLabel } from "@/lib/recording-detail-destination";

type JsonRecord = Record<string, unknown>;

type Props = {
  extractionId: string;
  source: string;
  createdAt: string | null;
  durationMinutes: number | null;
  approved: boolean;
  pushedToCrm: boolean;
  pushedAt: string | null;
  dismissed: boolean;
  rawJson: JsonRecord;
};

export function RecordingDetailClient(props: Props) {
  const [raw, setRaw] = useState<JsonRecord>(props.rawJson ?? {});
  const rawRef = useRef(raw);
  rawRef.current = raw;

  const [approved, setApproved] = useState(props.approved);
  const [pushedToCrm, setPushedToCrm] = useState(props.pushedToCrm);
  const [pushedAt, setPushedAt] = useState<string | null>(props.pushedAt);
  const [dismissed, setDismissed] = useState(props.dismissed);
  const [savedFlash, setSavedFlash] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  const contacts = Array.isArray(raw.contacts) ? (raw.contacts as JsonRecord[]) : [];
  const actionItems = Array.isArray(raw.actionItems) ? (raw.actionItems as JsonRecord[]) : [];
  const objections = Array.isArray(raw.objections) ? (raw.objections as string[]) : [];
  const dealInfo = (raw.dealInfo as JsonRecord | undefined) ?? {};
  const contactName =
    typeof contacts[0]?.name === "string" && contacts[0].name.trim()
      ? contacts[0].name
      : null;
  const breadcrumb = contactName ?? formatDate(props.createdAt);
  const nextMeetingVal = raw.next_meeting ?? raw.nextMeeting;

  function flashSaved() {
    setSavedFlash(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedFlash(false), 500);
  }

  async function persistSnapshot(snapshot: JsonRecord) {
    setRaw(snapshot);
    const res = await fetch(`/api/extractions/${props.extractionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", rawJson: snapshot }),
    });
    if (res.ok) flashSaved();
  }

  function blurPersist() {
    void persistSnapshot(structuredClone(rawRef.current));
  }

  function setDealField(key: string, text: string) {
    const next = structuredClone(rawRef.current);
    const deal = { ...((next.dealInfo as JsonRecord) ?? {}) };
    deal[key] = text || null;
    next.dealInfo = deal;
    void persistSnapshot(next);
  }

  function setContactField(field: string, text: string) {
    const next = structuredClone(rawRef.current);
    const arr = Array.isArray(next.contacts) ? [...(next.contacts as JsonRecord[])] : [{}];
    arr[0] = { ...(arr[0] ?? {}), [field]: text || null };
    next.contacts = arr;
    void persistSnapshot(next);
  }

  function setActionTask(index: number, task: string) {
    const next = structuredClone(rawRef.current);
    const arr = Array.isArray(next.actionItems) ? [...(next.actionItems as JsonRecord[])] : [];
    arr[index] = { ...(arr[index] ?? {}), task: task || null };
    next.actionItems = arr;
    void persistSnapshot(next);
  }

  function setSentiment(value: string) {
    const next = structuredClone(rawRef.current);
    next.sentiment = value || null;
    void persistSnapshot(next);
  }

  function setNextMeeting(text: string) {
    const next = structuredClone(rawRef.current);
    next.next_meeting = text || null;
    if ("nextMeeting" in next) delete next.nextMeeting;
    void persistSnapshot(next);
  }

  function setObjectionsFromLines(text: string) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const next = structuredClone(rawRef.current);
    next.objections = lines;
    void persistSnapshot(next);
  }

  async function onApprove() {
    startTransition(async () => {
      const response = await fetch(`/api/extractions/${props.extractionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawJson: rawRef.current }),
      });
      if (response.ok) {
        const data = (await response.json()) as { pushedToCrm?: boolean };
        setApproved(true);
        setPushedToCrm(Boolean(data.pushedToCrm));
        if (data.pushedToCrm) setPushedAt(new Date().toISOString());
      }
    });
  }

  async function onDismiss() {
    startTransition(async () => {
      const response = await fetch(`/api/extractions/${props.extractionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss" }),
      });
      if (response.ok) {
        setDismissed(true);
        window.location.href = "/dashboard";
      }
    });
  }

  const sentimentClass = (() => {
    const value = String(raw.sentiment ?? "").toLowerCase();
    if (value === "positive") return "bg-[#86efac]/15 text-[#86efac]";
    if (value === "negative") return "bg-red-900/30 text-red-400";
    return "bg-zinc-700 text-zinc-300";
  })();

  const destinationLine = hubSpotDestinationLabel(raw);
  const showPendingActions = !dismissed && !pushedToCrm && !approved;

  return (
    <div className="relative mx-auto max-w-2xl px-6 pb-12 pt-20">
      {savedFlash ? (
        <p className="pointer-events-none fixed right-8 top-24 z-50 text-xs text-zinc-500 transition-opacity">
          Saved
        </p>
      ) : null}

      <Link href="/dashboard" className="text-sm text-zinc-400 transition hover:text-white">
        ← Inbox
      </Link>
      <p className="mt-3 text-[15px] font-medium text-white">{breadcrumb}</p>

      {pushedToCrm ? (
        <div className="mt-5 rounded-xl border border-[#86efac]/20 bg-[#86efac]/[0.08] px-4 py-3 text-sm text-[#86efac]">
          ✓ Pushed to HubSpot · {pushedAt ? formatDate(pushedAt) : "Recently"}
        </div>
      ) : approved ? (
        <div className="mt-5 rounded-xl border border-[#7C6FFF]/20 bg-[#7C6FFF]/[0.08] px-4 py-3 text-sm text-[#b9b0ff]">
          Approved — syncing to HubSpot...
        </div>
      ) : dismissed ? (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-400">
          This extraction was dismissed from your inbox.
        </div>
      ) : null}

      <div className="mt-5 flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] uppercase tracking-widest text-zinc-600">Source</p>
          <p className="text-[13px] font-medium text-zinc-300">
            {formatSource(props.source)} · {props.durationMinutes != null ? `${props.durationMinutes} min · ` : ""}
            {formatDate(props.createdAt)}
          </p>
        </div>
        <span className="shrink-0 text-xl text-[#7C6FFF]">→</span>
        <div className="min-w-0 flex-1 text-right">
          <p className="mb-1 text-[10px] uppercase tracking-widest text-zinc-600">Destination</p>
          <p className="text-[13px] font-medium text-zinc-300">HubSpot · {destinationLine}</p>
        </div>
      </div>

      <section className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-600">Summary</p>
        <textarea
          value={String(raw.summary ?? "")}
          onChange={(e) =>
            setRaw((prev) => ({ ...structuredClone(prev), summary: e.target.value || null }))
          }
          onBlur={blurPersist}
          rows={5}
          className="w-full resize-y rounded-lg border border-white/10 bg-[#0D0D10] px-3 py-2 text-[12px] leading-relaxed text-zinc-400 outline-none placeholder:text-zinc-600"
        />
      </section>

      <section className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
        <p className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">Contact</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Name"
            value={String(contacts[0]?.name ?? "")}
            onChange={(v) =>
              setRaw((prev) => {
                const next = structuredClone(prev);
                const arr = Array.isArray(next.contacts) ? [...(next.contacts as JsonRecord[])] : [{}];
                arr[0] = { ...(arr[0] ?? {}), name: v };
                next.contacts = arr;
                return next;
              })
            }
            onBlur={(v) => setContactField("name", v)}
          />
          <Field
            label="Role"
            value={String(contacts[0]?.role ?? "")}
            onChange={(v) =>
              setRaw((prev) => {
                const next = structuredClone(prev);
                const arr = Array.isArray(next.contacts) ? [...(next.contacts as JsonRecord[])] : [{}];
                arr[0] = { ...(arr[0] ?? {}), role: v };
                next.contacts = arr;
                return next;
              })
            }
            onBlur={(v) => setContactField("role", v)}
          />
          <Field
            label="Company"
            value={String(contacts[0]?.company ?? "")}
            onChange={(v) =>
              setRaw((prev) => {
                const next = structuredClone(prev);
                const arr = Array.isArray(next.contacts) ? [...(next.contacts as JsonRecord[])] : [{}];
                arr[0] = { ...(arr[0] ?? {}), company: v };
                next.contacts = arr;
                return next;
              })
            }
            onBlur={(v) => setContactField("company", v)}
          />
          <Field
            label="Email"
            value={String(contacts[0]?.email ?? "")}
            onChange={(v) =>
              setRaw((prev) => {
                const next = structuredClone(prev);
                const arr = Array.isArray(next.contacts) ? [...(next.contacts as JsonRecord[])] : [{}];
                arr[0] = { ...(arr[0] ?? {}), email: v };
                next.contacts = arr;
                return next;
              })
            }
            onBlur={(v) => setContactField("email", v)}
          />
        </div>
      </section>

      <section className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
        <p className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">Deal</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label="Value"
            value={String(dealInfo.value ?? "")}
            onChange={(v) =>
              setRaw((prev) => {
                const next = structuredClone(prev);
                const deal = { ...((next.dealInfo as JsonRecord) ?? {}), value: v };
                next.dealInfo = deal;
                return next;
              })
            }
            onBlur={(v) => setDealField("value", v)}
          />
          <Field
            label="Stage change"
            value={String(dealInfo.stageChange ?? "")}
            onChange={(v) =>
              setRaw((prev) => {
                const next = structuredClone(prev);
                const deal = { ...((next.dealInfo as JsonRecord) ?? {}), stageChange: v };
                next.dealInfo = deal;
                return next;
              })
            }
            onBlur={(v) => setDealField("stageChange", v)}
          />
          <Field
            label="Close date"
            value={String(dealInfo.closeDate ?? "")}
            onChange={(v) =>
              setRaw((prev) => {
                const next = structuredClone(prev);
                const deal = { ...((next.dealInfo as JsonRecord) ?? {}), closeDate: v };
                next.dealInfo = deal;
                return next;
              })
            }
            onBlur={(v) => setDealField("closeDate", v)}
          />
        </div>
      </section>

      <section className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
        <p className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">Action items</p>
        {actionItems.length === 0 ? (
          <p className="text-sm italic text-zinc-600">None detected</p>
        ) : (
          <ul className="space-y-2">
            {actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-1.5 h-4 w-4 shrink-0 rounded border border-white/20 bg-white/[0.06]"
                  aria-hidden
                />
                <input
                  value={String(item.task ?? "")}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRaw((prev) => {
                      const next = structuredClone(prev);
                      const arr = Array.isArray(next.actionItems)
                        ? [...(next.actionItems as JsonRecord[])]
                        : [];
                      arr[i] = { ...(arr[i] ?? {}), task: v };
                      next.actionItems = arr;
                      return next;
                    });
                  }}
                  onBlur={(e) => setActionTask(i, e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-[#0D0D10] px-3 py-2 text-[13px] text-zinc-200 outline-none"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-600">Sentiment</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${sentimentClass}`}>
            {String(raw.sentiment ?? "neutral")}
          </span>
          <select
            value={String(raw.sentiment ?? "neutral")}
            onChange={(e) => setSentiment(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#0D0D10] px-2 py-1 text-xs text-zinc-300 outline-none"
          >
            <option value="positive">positive</option>
            <option value="neutral">neutral</option>
            <option value="negative">negative</option>
          </select>
        </div>
      </section>

      <section className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-600">Objections</p>
        {objections.length === 0 ? (
          <p className="text-sm italic text-zinc-600">None detected</p>
        ) : (
          <textarea
            value={objections.join("\n")}
            onChange={(e) => {
              const lines = e.target.value.split("\n");
              setRaw((prev) => ({
                ...structuredClone(prev),
                objections: lines,
              }));
            }}
            onBlur={(e) => setObjectionsFromLines(e.target.value)}
            rows={Math.min(8, Math.max(3, objections.length + 1))}
            className="w-full rounded-lg border border-white/10 bg-[#0D0D10] px-3 py-2 text-sm text-zinc-300 outline-none"
          />
        )}
      </section>

      <section className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-600">Next meeting</p>
        <input
          value={nextMeetingVal != null ? String(nextMeetingVal) : ""}
          onChange={(e) => {
            const v = e.target.value;
            setRaw((prev) => ({ ...structuredClone(prev), next_meeting: v || null }));
          }}
          onBlur={(e) => setNextMeeting(e.target.value)}
          placeholder="Not mentioned"
          className="w-full rounded-lg border border-white/10 bg-[#0D0D10] px-3 py-2 text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600"
        />
      </section>

      {showPendingActions ? (
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            onClick={onApprove}
            disabled={isPending}
            className="flex-1 bg-[#7C6FFF] text-white hover:bg-[#7C6FFF]/90 sm:flex-none"
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Approve & push to HubSpot
          </Button>
          <Button
            onClick={onDismiss}
            disabled={isPending}
            variant="outline"
            className="border-white/10 bg-transparent text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            Dismiss
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: (v: string) => void;
}) {
  return (
    <label className="block text-[11px] text-zinc-500">
      <span className="mb-1 block uppercase tracking-wider text-[10px] text-zinc-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-[#0D0D10] px-3 py-2 text-[13px] text-zinc-200 outline-none"
      />
    </label>
  );
}

function formatSource(source: string) {
  if (source === "meet") return "Google Meet";
  if (source === "voice_note") return "Phone";
  return "Zoom";
}

function formatDate(date: string | null) {
  if (!date) return "Unknown date";
  return new Date(date).toLocaleString();
}
