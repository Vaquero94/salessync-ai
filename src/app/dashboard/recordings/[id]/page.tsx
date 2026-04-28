import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RecordingDetailClient } from "./RecordingDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecordingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: recording }, { data: extraction }, { data: userRow }] = await Promise.all([
    supabase
      .from("recordings")
      .select("id, source, created_at, duration_minutes")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("extractions")
      .select("id, approved, pushed_to_crm, pushed_at, raw_json")
      .eq("recording_id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("users")
      .select("auto_pilot")
      .eq("id", user.id)
      .single(),
  ]);

  if (!recording || !extraction) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
        Recording not found or extraction is still processing.
      </div>
    );
  }

  return (
    <RecordingDetailClient
      extractionId={extraction.id}
      recordingId={recording.id}
      source={recording.source}
      createdAt={recording.created_at}
      durationMinutes={recording.duration_minutes}
      approved={extraction.approved}
      pushedToCrm={extraction.pushed_to_crm}
      pushedAt={extraction.pushed_at}
      autoPilot={Boolean(userRow?.auto_pilot)}
      rawJson={(extraction.raw_json as Record<string, unknown>) ?? {}}
    />
  );
}
