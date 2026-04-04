import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, Mic } from "lucide-react";
import { ReviewCard } from "@/components/ReviewCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const hasActiveSubscription = subscriptionStatus === "starter" || subscriptionStatus === "pro";

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
  const hasRecordings = (recordings?.length ?? 0) > 0;

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

      {!hasActiveSubscription && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Unlock AI call logging</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Upgrade your plan to start logging calls and syncing to your CRM automatically.
              </p>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/dashboard/settings">Upgrade plan</Link>
            </Button>
          </CardContent>
        </Card>
      )}

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
        {hasRecordings ? (
          <Card>
            <CardHeader>
              <CardTitle>Recordings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Call and meeting recordings with AI extraction status
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recordings!.map((r) => (
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
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Mic className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Ready to log your first call?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connect your meeting tool to get started.
                </p>
              </div>
              <Button asChild variant="outline" className="mt-2">
                <Link href="/dashboard/settings">Go to Settings</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
