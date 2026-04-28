import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "History — Zero Entry AI",
};

type ExtractionLite = {
  id: string;
  recording_id: string;
  approved: boolean | null;
  dismissed: boolean | null;
  pushed_to_crm: boolean | null;
  raw_json: Record<string, unknown> | null;
};

function contactName(raw: Record<string, unknown> | null) {
  const contacts = Array.isArray(raw?.contacts) ? (raw.contacts as Record<string, unknown>[]) : [];
  const n = contacts[0]?.name;
  return typeof n === "string" && n.trim() ? n : null;
}

function hasSalesSignals(raw: Record<string, unknown> | null) {
  if (!raw) return false;
  if (contactName(raw)) return true;
  const deal = (raw.dealInfo as Record<string, unknown> | undefined) ?? {};
  if (deal.value != null && String(deal.value).trim()) return true;
  const actions = Array.isArray(raw.actionItems) ? (raw.actionItems as Record<string, unknown>[]) : [];
  return typeof actions[0]?.task === "string" && !!String(actions[0].task).trim();
}

function statusPill(ex: ExtractionLite | undefined) {
  if (!ex) {
    return <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-600">No sales data</span>;
  }
  if (ex.dismissed) {
    return <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-600">Dismissed</span>;
  }
  if (ex.pushed_to_crm) {
    return (
      <span className="rounded-full bg-[#86efac]/15 px-2 py-0.5 text-[11px] text-[#86efac]">Pushed to HubSpot</span>
    );
  }
  if (ex.approved) {
    return <span className="rounded-full bg-[#7C6FFF]/15 px-2 py-0.5 text-[11px] text-[#b9b0ff]">Approved</span>;
  }
  const raw = ex.raw_json;
  if (!hasSalesSignals(raw)) {
    return <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-600">No sales data</span>;
  }
  return <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">Pending review</span>;
}

function sourceLabel(source: string) {
  if (source === "meet") return "Meet";
  if (source === "voice_note") return "Phone";
  return "Zoom";
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: recordings, error: recErr }, { data: extractions, error: exErr }] = await Promise.all([
    supabase
      .from("recordings")
      .select("id, source, duration_minutes, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("extractions")
      .select("id, recording_id, approved, dismissed, pushed_to_crm, raw_json")
      .eq("user_id", user.id),
  ]);

  if (recErr || exErr) {
    return <div className="px-6 pt-20 text-sm text-red-300">Failed to load history.</div>;
  }

  const byRecording = new Map<string, ExtractionLite>();
  for (const ex of extractions ?? []) {
    byRecording.set(ex.recording_id, ex as ExtractionLite);
  }

  const list = recordings ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 pb-12 pt-20">
      <h1 className="text-[22px] font-bold tracking-tight text-white">History</h1>
      <p className="mt-1 text-sm text-zinc-500">All recordings for your account.</p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.02]">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-widest text-zinc-500">
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            {list.map((row) => {
              const ex = byRecording.get(row.id);
              const raw = (ex?.raw_json as Record<string, unknown> | null) ?? null;
              const contact = contactName(raw);
              return (
                <tr key={row.id} className="border-b border-white/[0.05] transition hover:bg-white/[0.03]">
                  <td className="px-4 py-3">{sourceLabel(row.source)}</td>
                  <td className="px-4 py-3">{contact ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-400">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {row.duration_minutes != null ? `${row.duration_minutes} min` : "—"}
                  </td>
                  <td className="px-4 py-3">{statusPill(ex)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/recordings/${row.id}`} className="text-[#7C6FFF] hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">No recordings yet.</p>
        ) : null}
      </div>
    </div>
  );
}
