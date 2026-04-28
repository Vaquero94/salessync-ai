import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InboxClient, type InboxRow } from "@/app/dashboard/inbox/InboxClient";
import { normalizeCapturePreferences } from "@/lib/capture-preferences";

export const metadata = {
  title: "Inbox — Zero Entry AI",
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
  recordings:
    | {
        id: string;
        source: string;
        duration_minutes: number | null;
        created_at: string;
      }
    | Array<{
        id: string;
        source: string;
        duration_minutes: number | null;
        created_at: string;
      }>
    | null;
};

function recordingEmbed(rows: ExtractionRow["recordings"]) {
  if (!rows) return null;
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row) return null;
  return {
    source: row.source,
    durationMinutes: row.duration_minutes,
    createdAt: row.created_at,
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

  const [{ data: userRow }, { data: extractionRows, error }] = await Promise.all([
    supabase.from("users").select("capture_preferences").eq("id", user.id).single(),
    supabase
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
        created_at,
        recordings (
          id,
          source,
          duration_minutes,
          created_at
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 pt-20 text-sm text-red-300">
        Could not load inbox. Please refresh.
      </div>
    );
  }

  const rows = (extractionRows ?? []) as ExtractionRow[];
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

  const preferences = normalizeCapturePreferences(userRow?.capture_preferences ?? null);

  return (
    <InboxClient initialPending={pending} initialDone={done} preferences={preferences} />
  );
}
