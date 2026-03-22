import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { ReviewCard } from "@/components/ReviewCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulateRecordingButton } from "./SimulateRecordingButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: appUser } = await supabase
    .from("users")
    .select("subscription_status")
    .eq("id", user.id)
    .single();
  const subscriptionStatus = appUser?.subscription_status ?? "free";
  const hasActiveSubscription = subscriptionStatus !== "free";

  const { data: recordings } = await supabase
    .from("recordings")
    .select("id, source, status, duration_minutes, created_at, error_details")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: pendingExtractions } = await supabase
    .from("extractions")
    .select("id, recording_id, raw_json, created_at")
    .eq("user_id", user.id)
    .eq("approved", false)
    .eq("dismissed", false)
    .order("created_at", { ascending: false });

  const pendingCount = pendingExtractions?.length ?? 0;

  function statusIcon(status: string) {
    switch (status) {
      case "complete":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back. You have{" "}
          <span className="font-medium text-foreground">{pendingCount}</span>{" "}
          pending review{pendingCount !== 1 ? "s" : ""}.
        </p>
      </div>

      {pendingCount > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Pending reviews</h2>
          <div className="space-y-4">
            {pendingExtractions?.map((ex) => (
              <ReviewCard
                key={ex.id}
                extractionId={ex.id}
                recordingId={ex.recording_id}
                data={(ex.raw_json as Record<string, unknown>) ?? {}}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Recent recordings</h2>
        <Card>
          <CardHeader>
            <CardTitle>Recordings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Call and meeting recordings with AI extraction status
            </p>
          </CardHeader>
          <CardContent>
            {!recordings?.length ? (
              <p className="py-8 text-center text-muted-foreground">
                No recordings yet. Process a recording via the API to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {recordings.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {statusIcon(r.status)}
                      <div>
                        <p className="font-medium capitalize">{r.source}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.created_at
                            ? new Date(r.created_at).toLocaleString()
                            : "—"}
                          {r.duration_minutes != null &&
                            ` • ${r.duration_minutes} min`}
                        </p>
                        {r.status === "failed" && r.error_details && (
                          <p className="mt-1 text-xs text-destructive">
                            {r.error_details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Process a recording</CardTitle>
            <p className="text-sm text-muted-foreground">
              Simulate a Recall.ai-style webhook or send an audio URL to transcribe and extract
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasActiveSubscription ? (
              <SimulateRecordingButton />
            ) : (
              <p className="text-sm text-muted-foreground">
                Subscribe to a plan to process recordings.
                <Link href="/pricing" className="ml-2 font-medium text-primary underline underline-offset-4">
                  View pricing →
                </Link>
              </p>
            )}
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
              {`POST /api/recordings/process
{ "audioUrl": "https://...", "source": "zoom" }
# Or Recall.ai payload: { "recording": { "url": "..." } }`}
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}