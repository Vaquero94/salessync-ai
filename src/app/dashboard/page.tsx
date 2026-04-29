import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InboxClient, type InboxRow } from "@/app/dashboard/inbox/InboxClient";
import { normalizeCapturePreferences } from "@/lib/capture-preferences";

export const metadata = {
  title: "Inbox — Zero Entry AI",
};

/** Row from `recordings` table (query 2). */
type RecordingRow = {
  id: string;
  source: string;
  duration_minutes: number | null;
  created_at: string;
  status?: "processing" | "complete" | "failed" | null;
};

/** Extraction row merged with optional recording (no PostgREST embed). */
type EnrichedExtraction = {
  id: string;
  recording_id: string;
  user_id: string;
  raw_json: Record<string, unknown>;
  approved: boolean | null;
  dismissed: boolean | null;
  pushed_to_crm: boolean | null;
  pushed_at: string | null;
  created_at: string;
  recording: RecordingRow | null;
};

function toInboxRow(e: EnrichedExtraction): InboxRow | null {
  const rec = e.recording;
  if (!rec) return null;
  return {
    extractionId: e.id,
    recordingId: e.recording_id,
    createdAt: e.created_at,
    rawJson: e.raw_json ?? {},
    recording: {
      source: rec.source,
      durationMinutes: rec.duration_minutes,
      createdAt: rec.created_at,
    },
    pushedAt: e.pushed_at,
  };
}

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  try {
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("capture_preferences, auto_pilot")
      .eq("id", user.id)
      .maybeSingle();

    if (userError) {
      console.error("[InboxPage] users capture_preferences query failed:", userError);
    }

    const { data: extractions, error: extractionsError } = await supabase
      .from("extractions")
      .select(
        "id, recording_id, user_id, raw_json, approved, dismissed, pushed_to_crm, pushed_at, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (extractionsError) {
      console.error("[InboxPage] extractions query failed:", extractionsError);
      return (
        <div className="mx-auto max-w-5xl px-6 pt-20 text-sm text-red-300">
          Could not load inbox. Please refresh.
        </div>
      );
    }

    const recordingIds = extractions?.map((e) => e.recording_id).filter(Boolean) ?? [];
    const [{ data: statusRows, error: statusRowsError }, { data: crmRows, error: crmRowsError }] =
      await Promise.all([
        supabase.from("recordings").select("id, status").eq("user_id", user.id),
        supabase.from("crm_connections").select("id").eq("user_id", user.id).limit(1),
      ]);

    if (statusRowsError) {
      console.error("[InboxPage] recordings status query failed:", statusRowsError);
    }
    if (crmRowsError) {
      console.error("[InboxPage] crm_connections query failed:", crmRowsError);
    }

    let recordings: RecordingRow[] | null = [];
    if (recordingIds.length > 0) {
      const { data, error } = await supabase
        .from("recordings")
        .select("id, source, duration_minutes, created_at")
        .in("id", recordingIds);
      recordings = (data as RecordingRow[] | null) ?? [];
      if (error) {
        console.error("[InboxPage] recordings batch query failed:", error);
        return (
          <div className="mx-auto max-w-5xl px-6 pt-20 text-sm text-red-300">
            Could not load inbox. Please refresh.
          </div>
        );
      }
    }

    const recordingMap = new Map(recordings?.map((r) => [r.id, r]) ?? []);

    const enrichedExtractions: EnrichedExtraction[] =
      extractions?.map((e) => ({
        ...e,
        recording: recordingMap.get(e.recording_id) ?? null,
      })) ?? [];

    const preferences = normalizeCapturePreferences(userRow?.capture_preferences ?? null);

    const mapped = enrichedExtractions
      .map(toInboxRow)
      .filter((r): r is InboxRow => r !== null);

    const pending = mapped
      .filter((r) => {
        const row = enrichedExtractions.find((x) => x.id === r.extractionId);
        return row && row.approved === false && row.dismissed !== true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const done = mapped
      .filter((r) => {
        const row = enrichedExtractions.find((x) => x.id === r.extractionId);
        return row && (row.approved === true || row.pushed_to_crm === true);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const processingCount =
      statusRows?.filter((r) => r.status === "processing").length ?? 0;
    const failedCount = statusRows?.filter((r) => r.status === "failed").length ?? 0;
    const hasCrmConnection = (crmRows?.length ?? 0) > 0;
    const autoPilot = Boolean(userRow?.auto_pilot);

    return (
      <InboxClient
        initialPending={pending}
        initialDone={done}
        preferences={preferences}
        processingCount={processingCount}
        failedCount={failedCount}
        autoPilot={autoPilot}
        hasCrmConnection={hasCrmConnection}
      />
    );
  } catch (error) {
    console.error("[InboxPage] unexpected error:", error);
    return (
      <div className="mx-auto max-w-5xl px-6 pt-20 text-sm text-red-300">
        Could not load inbox. Please refresh.
      </div>
    );
  }
}
