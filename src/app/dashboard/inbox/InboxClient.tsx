"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { CapturePreferences } from "@/lib/capture-preferences";
import { StatusBar } from "@/app/dashboard/StatusBar";

type Json = Record<string, unknown>;

export type InboxRow = {
  extractionId: string;
  recordingId: string;
  createdAt: string;
  rawJson: Json;
  recording: {
    source: string;
    durationMinutes: number | null;
    createdAt: string;
  };
  pushedAt: string | null;
};

type Props = {
  initialPending: InboxRow[];
  initialDone: InboxRow[];
  preferences: CapturePreferences;
  processingCount: number;
  failedCount: number;
  autoPilot: boolean;
  hasCrmConnection: boolean;
};

export function InboxClient({
  initialPending,
  initialDone,
  preferences,
  processingCount,
  failedCount,
  autoPilot,
  hasCrmConnection,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(initialPending);
  const [done, setDone] = useState(initialDone);
  const [exiting, setExiting] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const pendingCount = pending.length;

  useEffect(() => {
    if (processingCount <= 0) return;
    const interval = setInterval(() => {
      router.refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [processingCount, router]);

  function fadeOut(id: string, then: () => void) {
    setExiting((s) => ({ ...s, [id]: true }));
    window.setTimeout(() => {
      then();
      setExiting((s) => {
        const next = { ...s };
        delete next[id];
        return next;
      });
    }, 200);
  }

  async function onApprove(row: InboxRow) {
    setBusyId(row.extractionId);
    try {
      const res = await fetch(`/api/extractions/${row.extractionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawJson: row.rawJson }),
      });
      const data = (await res.json()) as { pushedToCrm?: boolean; success?: boolean };
      if (!res.ok) throw new Error("Approve failed");

      fadeOut(row.extractionId, () => {
        setPending((list) => list.filter((r) => r.extractionId !== row.extractionId));
        const pushedAt =
          data.pushedToCrm ? new Date().toISOString() : row.pushedAt;
        setDone((list) => [
          {
            ...row,
            pushedAt,
            rawJson: row.rawJson,
          },
          ...list,
        ]);
        startTransition(() => router.refresh());
      });
    } catch {
      setBusyId(null);
    } finally {
      setBusyId(null);
    }
  }

  async function onDismiss(extractionId: string) {
    setBusyId(extractionId);
    try {
      const res = await fetch(`/api/extractions/${extractionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss" }),
      });
      if (!res.ok) throw new Error("Dismiss failed");
      fadeOut(extractionId, () => {
        setPending((list) => list.filter((r) => r.extractionId !== extractionId));
        startTransition(() => router.refresh());
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D10]">
      <div className="mx-auto max-w-5xl px-6 pb-12 pt-20">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-[22px] font-bold tracking-tight text-white">Inbox</h1>
          {pendingCount > 0 ? (
            <span className="text-sm text-zinc-500">
              {pendingCount} pending
            </span>
          ) : null}
        </div>
        <StatusBar
          processingCount={processingCount}
          failedCount={failedCount}
          pendingCount={pendingCount}
          autoPilot={autoPilot}
          hasCrmConnection={hasCrmConnection}
        />

        {pending.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-zinc-700" strokeWidth={1.25} />
            <p className="mt-4 text-lg font-semibold text-white">You&apos;re all caught up</p>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              New extractions will appear here automatically after your next call.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((row) => (
              <div
                key={row.extractionId}
                className={`mb-3 rounded-xl border border-[#7C6FFF]/25 bg-[#7C6FFF]/[0.06] p-4 transition duration-200 hover:border-[#7C6FFF]/40 ${
                  exiting[row.extractionId] ? "scale-95 opacity-0" : "opacity-100"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] text-zinc-300">
                      {sourceBadge(row.recording.source)}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {fmtDate(row.recording.createdAt)}
                      {row.recording.durationMinutes != null ? ` · ${row.recording.durationMinutes} min` : ""}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-[#7C6FFF]">New</span>
                </div>

                <InboxCardBody raw={row.rawJson} preferences={preferences} />

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === row.extractionId}
                    onClick={() => onApprove(row)}
                    className="flex flex-1 items-center justify-center rounded-lg bg-[#7C6FFF] py-2 text-[13px] font-semibold text-white disabled:opacity-60"
                  >
                    {busyId === row.extractionId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve & push to HubSpot"}
                  </button>
                  <Link
                    href={`/dashboard/recordings/${row.recordingId}`}
                    className="rounded-lg border border-white/10 px-3 py-2 text-center text-[13px] text-zinc-400"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === row.extractionId}
                    onClick={() => onDismiss(row.extractionId)}
                    className="rounded-lg border border-white/10 px-3 py-2 text-[13px] text-zinc-400 disabled:opacity-60"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="my-6 border-t border-white/[0.05]" />

        <p className="mb-3 text-[11px] uppercase tracking-widest text-zinc-600">
          Done · {done.length} records
        </p>
        <div className="space-y-1.5">
          {done.map((row) => {
            const raw = row.rawJson;
            const contact = firstContactName(raw);
            const label =
              contact ??
              `${sourceBadge(row.recording.source)} · ${shortDate(row.recording.createdAt)}`;
            return (
              <Link
                key={row.extractionId}
                href={`/dashboard/recordings/${row.recordingId}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg bg-white/[0.02] px-4 py-3 transition hover:bg-white/[0.04]"
              >
                <span className="h-1.5 w-1.5 min-w-[6px] rounded-full bg-[#86efac]" />
                <span className="flex-1 text-[13px] text-zinc-400">{label}</span>
                <span className="text-[11px] text-zinc-600">
                  {row.pushedAt ? `Pushed ${fmtShort(row.pushedAt)}` : `Approved ${shortDate(row.recording.createdAt)}`}
                </span>
                <span className="text-[11px] text-[#86efac]">✓</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InboxCardBody({ raw, preferences }: { raw: Json; preferences: CapturePreferences }) {
  const blocks: ReactNode[] = [];

  const contacts = Array.isArray(raw.contacts) ? (raw.contacts as Json[]) : [];
  const c0 = contacts[0] ?? {};
  if (preferences.contact && c0.name != null && String(c0.name).trim()) {
    const role = c0.role != null ? String(c0.role) : "";
    const company = c0.company != null ? String(c0.company) : "";
    const sub = [role, company].filter(Boolean).join(" · ");
    blocks.push(
      <FieldBlock
        key="contact"
        label="Contact"
        value={String(c0.name)}
        sub={sub || undefined}
      />
    );
  }

  const deal = (raw.dealInfo as Json | undefined) ?? {};
  if (preferences.deal && deal.value != null && String(deal.value).trim() !== "") {
    const num = Number(deal.value);
    const valueStr = Number.isFinite(num)
      ? `$${num.toLocaleString()}`
      : `$${String(deal.value)}`;
    const sub =
      deal.stageChange != null && String(deal.stageChange).trim()
        ? String(deal.stageChange)
        : deal.closeDate != null && String(deal.closeDate).trim()
          ? String(deal.closeDate)
          : undefined;
    blocks.push(<FieldBlock key="deal" label="Deal" value={valueStr} sub={sub} />);
  }

  const items = Array.isArray(raw.actionItems) ? (raw.actionItems as Json[]) : [];
  const tasks = items.map((i) => i.task).filter((t): t is string => typeof t === "string" && !!t.trim());
  if (preferences.action_items && tasks.length > 0) {
    blocks.push(
      <div key="actions" className="col-span-2 rounded-lg bg-white/[0.04] px-3 py-2">
        <p className="mb-1 text-[10px] uppercase tracking-widest text-zinc-600">Action items</p>
        <ul className="space-y-1">
          {tasks.map((t) => (
            <li key={t} className="text-[12px] text-zinc-300">
              · {t}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (preferences.summary && raw.summary != null && String(raw.summary).trim()) {
    blocks.push(
      <div key="summary" className="col-span-2 rounded-lg bg-white/[0.04] px-3 py-2">
        <p className="mb-1 text-[10px] uppercase tracking-widest text-zinc-600">Summary</p>
        <p className="text-[12px] leading-relaxed text-zinc-400">{String(raw.summary)}</p>
      </div>
    );
  }

  if (preferences.sentiment && raw.sentiment != null && String(raw.sentiment).trim()) {
    const s = String(raw.sentiment).toLowerCase();
    const pill =
      s === "positive"
        ? "bg-[#86efac]/15 text-[#86efac]"
        : s === "negative"
          ? "bg-red-900/30 text-red-400"
          : "bg-zinc-700 text-zinc-300";
    blocks.push(
      <div key="sent" className="rounded-lg bg-white/[0.04] px-3 py-2">
        <p className="mb-1 text-[10px] uppercase tracking-widest text-zinc-600">Sentiment</p>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[12px] font-medium ${pill}`}>
          {String(raw.sentiment)}
        </span>
      </div>
    );
  }

  const objections = Array.isArray(raw.objections) ? (raw.objections as string[]) : [];
  if (preferences.objections && objections.length > 0) {
    blocks.push(
      <div key="obj" className="rounded-lg bg-white/[0.04] px-3 py-2">
        <p className="mb-1 text-[10px] uppercase tracking-widest text-zinc-600">Objections</p>
        <p className="text-[13px] font-medium text-white">{objections.join(", ")}</p>
      </div>
    );
  }

  const nextMeeting = raw.next_meeting ?? raw.nextMeeting;
  if (preferences.next_meeting && nextMeeting != null && String(nextMeeting).trim()) {
    blocks.push(
      <div key="next" className="rounded-lg bg-white/[0.04] px-3 py-2">
        <p className="mb-1 text-[10px] uppercase tracking-widest text-zinc-600">Next meeting</p>
        <p className="text-[13px] font-medium text-white">{fmtDate(String(nextMeeting))}</p>
      </div>
    );
  }

  if (blocks.length === 0) {
    return <p className="py-2 text-sm italic text-zinc-600">No sales data detected in this recording.</p>;
  }

  return <div className="grid grid-cols-2 gap-2">{blocks}</div>;
}

function FieldBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-white/[0.04] px-3 py-2">
      <p className="mb-1 text-[10px] uppercase tracking-widest text-zinc-600">{label}</p>
      <p className="text-[13px] font-medium text-white">{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-zinc-500">{sub}</p> : null}
    </div>
  );
}

function firstContactName(raw: Json) {
  const contacts = Array.isArray(raw.contacts) ? (raw.contacts as Json[]) : [];
  const n = contacts[0]?.name;
  return typeof n === "string" && n.trim() ? n : null;
}

function sourceBadge(source: string) {
  if (source === "meet") return "Meet";
  if (source === "voice_note") return "Phone";
  return "Zoom";
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function shortDate(iso: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function fmtShort(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}
