import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InboxClient, type InboxRow } from "@/app/dashboard/inbox/InboxClient";
import { normalizeCapturePreferences } from "@/lib/capture-preferences";

export const metadata = {
  title: "Inbox — Zero Entry AI",
};

/** Single recording row joined to an extraction (same shape as former embed). */
type RecordingEmbed = {
  id: string;
  source: string;
  duration_minutes: number | null;
  created_at: string;
};

type ExtractionRow = {
  id: string;
  recording_id: string;
  approved: boolean | null;
  dismissed: boolean | null;
  pushed_to_crm: boolean | null;
  pushed_at: string | null;
  raw_json: Record<string, unknown>;
  created_at: string;
  recordings: RecordingEmbed | null;
};

function recordingEmbed(rows: ExtractionRow["recordings"]) {
  if (!rows) return null;
  return {
    source: rows.source,
    durationMinutes: rows.duration_minutes,
    createdAt: rows.created_at,
  };
}

function toInboxRow(row: ExtractionRow): InboxRow | null {
  const rec = recordingEmbed(row.recordings);
  if (!rec) return null;
  return {
    extractionId: row.id,
    recordingId: row.recording_id,
    createdAt: row.created_at,
    rawJson: row.raw_json ?? {},
    recording: {
      source: rec.source,
      durationMinutes: rec.durationMinutes,
      createdAt: rec.createdAt,
    },
    pushedAt: row.pushed_at,
  };
}

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  try {
    // Preferences: isolated query — failures don't block inbox list
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("capture_preferences")
      .eq("id", user.id)
      .maybeSingle();

    if (userError) {
      console.error("[InboxPage] users capture_preferences query failed:", userError);
    }

    // Extractions only — no nested resource embed (avoids PostgREST relationship/schema issues in prod)
    const { data: extractionsData, error: extractionsError } = await supabase
      .from("extractions")
      .select(
        `
        id,
        recording_id,
        approved,
        dismissed,
        pushed_to_crm,
        pushed_at,
        raw_json,
        created_at
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (extractionsError) {
      console.error("[InboxPage] extractions query failed:", extractionsError);
      return (
        <div className="mx-auto max-w-2xl px-6 pt-20 text-sm text-red-300">
          Could not load inbox. Please refresh.
        </div>
      );
    }

    const extractionRows = extractionsData ?? [];
    const recordingIds = [
      ...new Set(extractionRows.map((e) => e.recording_id).filter(Boolean)),
    ] as string[];

    const recordingsById = new Map<string, RecordingEmbed>();
    if (recordingIds.length > 0) {
      const { data: recordingsData, error: recordingsError } = await supabase
        .from("recordings")
        .select("id, source, duration_minutes, created_at")
        .eq("user_id", user.id)
        .in("id", recordingIds);

      if (recordingsError) {
        console.error("[InboxPage] recordings batch query failed:", recordingsError);
        return (
          <div className="mx-auto max-w-2xl px-6 pt-20 text-sm text-red-300">
            Could not load inbox. Please refresh.
          </div>
        );
      }

      for (const r of recordingsData ?? []) {
        recordingsById.set(r.id, r as RecordingEmbed);
      }
    }

    const preferences = normalizeCapturePreferences(userRow?.capture_preferences ?? null);

    const rows: ExtractionRow[] = extractionRows.map((e) => ({
      ...e,
      recordings: recordingsById.get(e.recording_id) ?? null,
    }));

    const mapped = rows.map(toInboxRow).filter((r): r is InboxRow => r !== null);

    const pending = mapped
      .filter((r) => {
        const row = rows.find((x) => x.id === r.extractionId);
        return row && row.approved === false && row.dismissed !== true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const done = mapped
      .filter((r) => {
        const row = rows.find((x) => x.id === r.extractionId);
        return row && (row.approved === true || row.pushed_to_crm === true);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
      <InboxClient initialPending={pending} initialDone={done} preferences={preferences} />
    );
  } catch (error) {
    console.error("[InboxPage] unexpected error:", error);
    return (
      <div className="mx-auto max-w-2xl px-6 pt-20 text-sm text-red-300">
        Could not load inbox. Please refresh.
      </div>
    );
  }
}
