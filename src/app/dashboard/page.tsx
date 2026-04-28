import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cabinetHeading } from "@/lib/typography";

type JsonRecord = Record<string, unknown>;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { data: userRow, error: userError },
    { data: recordings, error: recordingsError },
    { data: extractions, error: extractionsError },
    { count: monthCount, error: monthCountError },
  ] = await Promise.all([
    supabase.from("users").select("auto_pilot").eq("id", user.id).single(),
    supabase
      .from("recordings")
      .select("id, source, duration_minutes, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("extractions")
      .select("recording_id, approved, pushed_to_crm, raw_json")
      .eq("user_id", user.id),
    supabase
      .from("recordings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStart),
  ]);

  if (userError || recordingsError || extractionsError || monthCountError) {
    return (
      <section className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        Failed to load dashboard data. Please refresh.
      </section>
    );
  }

  const extractionByRecording = new Map((extractions ?? []).map((ex) => [ex.recording_id, ex]));
  const pendingCount = (extractions ?? []).filter((ex) => ex.approved === false).length;
  const pushedCount = (extractions ?? []).filter((ex) => ex.pushed_to_crm === true).length;
  const autoPilotOn = Boolean(userRow?.auto_pilot);
  const totalRecordings = recordings?.length ?? 0;

  return (
    <div className="space-y-8 bg-[#0D0D10]">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending reviews">
          <div className="flex items-center gap-2">
            <span className={`${cabinetHeading} text-3xl ${pendingCount > 0 ? "text-[#7C6FFF]" : "text-zinc-500"}`}>
              {pendingCount}
            </span>
            {pendingCount > 0 ? <span className="h-2 w-2 animate-pulse rounded-full bg-[#7C6FFF]" /> : null}
          </div>
        </StatCard>
        <StatCard label="Calls logged this month">
          <span className={`${cabinetHeading} text-3xl text-white`}>{monthCount ?? 0}</span>
        </StatCard>
        <StatCard label="Pushed to HubSpot">
          <span className={`${cabinetHeading} text-3xl text-white`}>{pushedCount}</span>
        </StatCard>
        <Link href="/dashboard/settings">
          <StatCard label="Auto-pilot">
            <span className={`${cabinetHeading} text-3xl ${autoPilotOn ? "text-[#86efac]" : "text-zinc-500"}`}>
              {autoPilotOn ? "On" : "Off"}
            </span>
          </StatCard>
        </Link>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent recordings</h2>
          <p className="text-sm text-zinc-500">
            {totalRecordings} recording{totalRecordings === 1 ? "" : "s"}
          </p>
        </div>
        {totalRecordings === 0 ? (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-6 py-14 text-center">
            <Mic className="mx-auto h-12 w-12 text-zinc-700" />
            <h3 className="mt-4 text-lg font-semibold text-white">No recordings yet</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-500">
              Zero Entry AI will appear here automatically after your first Zoom or Google Meet call.
            </p>
            <Button asChild className="mt-6 rounded-lg bg-[#7C6FFF] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#7C6FFF]/90">
              <Link href="/dashboard/settings">Go to Settings</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
            {recordings?.map((recording) => {
              const extraction = extractionByRecording.get(recording.id);
              const raw = (extraction?.raw_json as JsonRecord | null) ?? null;
              const contactName = getContactName(raw);
              const noSalesData = raw ? !hasSalesData(raw) : false;

              return (
                <Link
                  key={recording.id}
                  href={`/dashboard/recordings/${recording.id}`}
                  className="flex items-center gap-4 border-b border-white/[0.06] px-5 py-4 transition hover:bg-white/[0.05] last:border-b-0"
                >
                  <StatusDot approved={Boolean(extraction?.approved)} pushedToCrm={Boolean(extraction?.pushed_to_crm)} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300">
                        {formatSource(recording.source)}
                      </span>
                      <p className="text-sm text-zinc-400">
                        {formatDate(recording.created_at)}
                        {recording.duration_minutes ? ` · ${recording.duration_minutes} min` : ""}
                      </p>
                    </div>
                    {contactName ? (
                      <p className="truncate text-sm text-zinc-300">{contactName} → HubSpot Contact</p>
                    ) : noSalesData ? (
                      <p className="text-xs italic text-zinc-600">No sales data detected</p>
                    ) : !extraction ? (
                      <p className="text-xs text-zinc-600">Processing...</p>
                    ) : (
                      <p className="text-xs text-zinc-600">No contact detected</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5">
      <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">{label}</p>
      {children}
    </div>
  );
}

function StatusDot({ approved, pushedToCrm }: { approved: boolean; pushedToCrm: boolean }) {
  if (pushedToCrm) return <span className="h-3 w-3 rounded-full bg-emerald-400" />;
  if (approved) return <span className="h-3 w-3 rounded-full bg-amber-300" />;
  return <span className="h-3 w-3 rounded-full bg-[#7C6FFF]" />;
}

function formatSource(source: string) {
  if (source === "meet") return "Meet";
  if (source === "voice_note") return "Phone";
  return "Zoom";
}

function formatDate(date: string | null) {
  if (!date) return "Unknown date";
  return new Date(date).toLocaleString();
}

function getContactName(raw: JsonRecord | null) {
  const contacts = Array.isArray(raw?.contacts) ? (raw.contacts as JsonRecord[]) : [];
  return typeof contacts[0]?.name === "string" ? contacts[0].name : null;
}

function hasSalesData(raw: JsonRecord) {
  const contacts = Array.isArray(raw.contacts) ? (raw.contacts as JsonRecord[]) : [];
  const dealInfo = (raw.dealInfo as JsonRecord | undefined) ?? {};
  const actionItems = Array.isArray(raw.actionItems) ? (raw.actionItems as JsonRecord[]) : [];
  return Boolean(
    (typeof contacts[0]?.name === "string" && contacts[0].name.trim()) ||
      (dealInfo.value != null && String(dealInfo.value).trim()) ||
      (typeof actionItems[0]?.task === "string" && actionItems[0].task.trim())
  );
}
