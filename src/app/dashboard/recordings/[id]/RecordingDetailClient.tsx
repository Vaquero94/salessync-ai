"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type JsonRecord = Record<string, unknown>;

type Props = {
  extractionId: string;
  recordingId: string;
  source: string;
  createdAt: string | null;
  durationMinutes: number | null;
  approved: boolean;
  pushedToCrm: boolean;
  pushedAt: string | null;
  autoPilot: boolean;
  rawJson: JsonRecord;
};

export function RecordingDetailClient(props: Props) {
  const [raw, setRaw] = useState<JsonRecord>(props.rawJson ?? {});
  const [approved, setApproved] = useState(props.approved);
  const [pushedToCrm, setPushedToCrm] = useState(props.pushedToCrm);
  const [pushedAt, setPushedAt] = useState<string | null>(props.pushedAt);
  const [isPending, startTransition] = useTransition();

  const contacts = Array.isArray(raw.contacts) ? (raw.contacts as JsonRecord[]) : [];
  const actionItems = Array.isArray(raw.actionItems) ? (raw.actionItems as JsonRecord[]) : [];
  const objections = Array.isArray(raw.objections) ? (raw.objections as string[]) : [];
  const dealInfo = (raw.dealInfo as JsonRecord | undefined) ?? {};
  const contactName = typeof contacts[0]?.name === "string" ? contacts[0].name : null;
  const statusLabel = pushedToCrm ? "Pushed to HubSpot" : approved ? "Approved" : "Pending review";

  const sentimentClass = useMemo(() => {
    const value = String(raw.sentiment ?? "").toLowerCase();
    if (value === "positive") return "bg-emerald-400/20 text-emerald-300";
    if (value === "negative") return "bg-red-400/20 text-red-300";
    return "bg-zinc-500/20 text-zinc-300";
  }, [raw.sentiment]);

  async function saveRawJson(nextRaw: JsonRecord) {
    setRaw(nextRaw);
    startTransition(async () => {
      await fetch(`/api/extractions/${props.extractionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", rawJson: nextRaw }),
      });
    });
  }

  function updatePath(path: string[], value: string | null) {
    const next = structuredClone(raw);
    let cursor: JsonRecord = next;
    for (let i = 0; i < path.length - 1; i += 1) {
      const key = path[i];
      cursor[key] = (cursor[key] as JsonRecord) ?? {};
      cursor = cursor[key] as JsonRecord;
    }
    cursor[path[path.length - 1]] = value;
    void saveRawJson(next);
  }

  async function onApprove() {
    startTransition(async () => {
      const response = await fetch(`/api/extractions/${props.extractionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawJson: raw }),
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
        window.location.href = "/dashboard";
      }
    });
  }

  return (
    <div className="space-y-6 text-white">
      <div className="space-y-3">
        <Link href="/dashboard" className="inline-block text-sm text-zinc-400 hover:text-white">
          ← Recordings
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300">{formatSource(props.source)}</span>
            <span>{formatDate(props.createdAt)}</span>
            {props.durationMinutes ? <span>· {props.durationMinutes} min</span> : null}
          </div>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-zinc-300">{statusLabel}</span>
        </div>
      </div>

      <section className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">Source</p>
            <p className="mt-1 text-sm text-zinc-300">{formatSource(props.source)} call</p>
            <p className="text-xs text-zinc-500">{formatDate(props.createdAt)} {props.durationMinutes ? `· ${props.durationMinutes} min` : ""}</p>
          </div>
          <p className="text-center text-zinc-600">→</p>
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">Destination</p>
            <p className="mt-1 text-sm text-zinc-300">HubSpot</p>
            <p className="text-xs text-zinc-500">{contactName ? `Contact: ${contactName}` : "No contact detected"}</p>
          </div>
        </div>
      </section>

      <EditableSection label="Summary" value={String(raw.summary ?? "")} onBlurSave={(v) => updatePath(["summary"], v || null)} />
      <FieldGrid
        title="Contacts"
        fields={[
          { label: "Name", value: valueOrNull(contacts[0]?.name), path: ["contacts", "0", "name"] },
          { label: "Role", value: valueOrNull(contacts[0]?.role), path: ["contacts", "0", "role"] },
          { label: "Company", value: valueOrNull(contacts[0]?.company), path: ["contacts", "0", "company"] },
          { label: "Email", value: valueOrNull(contacts[0]?.email), path: ["contacts", "0", "email"] },
        ]}
        onSave={updateArrayPath}
      />
      <FieldGrid
        title="Deal info"
        fields={[
          { label: "Value", value: valueOrNull(dealInfo.value), path: ["dealInfo", "value"] },
          { label: "Stage change", value: valueOrNull(dealInfo.stageChange), path: ["dealInfo", "stageChange"] },
          { label: "Close date", value: valueOrNull(dealInfo.closeDate), path: ["dealInfo", "closeDate"] },
        ]}
        onSave={updatePath}
      />
      <FieldGrid
        title="Action items"
        fields={[
          { label: "Task", value: valueOrNull(actionItems[0]?.task), path: ["actionItems", "0", "task"] },
          { label: "Owner", value: valueOrNull(actionItems[0]?.owner), path: ["actionItems", "0", "owner"] },
          { label: "Due date", value: valueOrNull(actionItems[0]?.dueDate), path: ["actionItems", "0", "dueDate"] },
        ]}
        emptyLabel="None detected"
        onSave={updateArrayPath}
      />

      <section className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
        <p className="text-sm font-medium text-white">Sentiment</p>
        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs ${sentimentClass}`}>
          {String(raw.sentiment ?? "neutral")}
        </span>
      </section>

      <section className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
        <p className="text-sm font-medium text-white">Objections</p>
        {objections.length ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
            {objections.map((objection) => <li key={objection}>{objection}</li>)}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-600">None detected</p>
        )}
      </section>

      {props.autoPilot ? (
        <div className="rounded-lg border border-[#86efac]/20 bg-[#86efac]/10 p-3 text-xs text-[#86efac]">
          Auto-pilot is on — extractions push automatically without review
        </div>
      ) : null}

      {!approved ? (
        <div className="flex flex-wrap gap-3">
          <Button onClick={onApprove} disabled={isPending} className="bg-[#7C6FFF] text-white hover:bg-[#7C6FFF]/90">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Approve & Push to HubSpot
          </Button>
          <Button onClick={onDismiss} disabled={isPending} variant="outline" className="border-white/20 bg-transparent text-zinc-400 hover:bg-white/10 hover:text-white">
            Dismiss
          </Button>
        </div>
      ) : pushedToCrm ? (
        <p className="text-sm text-emerald-300">✓ Pushed to HubSpot {pushedAt ? `at ${formatDate(pushedAt)}` : ""}</p>
      ) : (
        <p className="inline-flex items-center text-sm text-zinc-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Approved — pushing to HubSpot...
        </p>
      )}
    </div>
  );

  function updateArrayPath(path: string[], value: string | null) {
    const next = structuredClone(raw);
    const [root, indexStr, field] = path;
    const idx = Number(indexStr);
    const arr = Array.isArray(next[root]) ? (next[root] as JsonRecord[]) : [];
    const target = (arr[idx] ?? {}) as JsonRecord;
    target[field] = value;
    arr[idx] = target;
    next[root] = arr;
    void saveRawJson(next);
  }
}

function EditableSection({ label, value, onBlurSave }: { label: string; value: string; onBlurSave: (value: string) => void }) {
  return (
    <section className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
      <p className="text-sm font-medium text-white">{label}</p>
      <textarea
        defaultValue={value}
        onBlur={(event) => onBlurSave(event.target.value)}
        className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-[#0D0D10] px-3 py-2 text-sm text-zinc-200 outline-none"
      />
    </section>
  );
}

function FieldGrid({
  title,
  fields,
  onSave,
  emptyLabel,
}: {
  title: string;
  fields: { label: string; value: string | null; path: string[] }[];
  onSave: (path: string[], value: string | null) => void;
  emptyLabel?: string;
}) {
  const allEmpty = fields.every((field) => !field.value);
  return (
    <section className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
      <p className="text-sm font-medium text-white">{title}</p>
      {allEmpty && emptyLabel ? (
        <p className="mt-2 text-sm text-zinc-600">{emptyLabel}</p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <label key={field.label} className="text-xs text-zinc-500">
              {field.label}
              <input
                defaultValue={field.value ?? ""}
                placeholder="Not detected"
                onBlur={(event) => onSave(field.path, event.target.value || null)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0D0D10] px-3 py-2 text-sm text-zinc-200 outline-none"
              />
            </label>
          ))}
        </div>
      )}
    </section>
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

function valueOrNull(value: unknown) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
}
