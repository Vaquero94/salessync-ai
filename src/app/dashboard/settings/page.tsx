import { createClient } from "@/lib/supabase/server";
import { createDb } from "@/db";
import { crmConnections, calendarConnections } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Link2, CalendarCheck } from "lucide-react";
import { ConnectHubSpotButton } from "./ConnectHubSpotButton";
import { DisconnectHubSpotButton } from "./DisconnectHubSpotButton";
import { ConnectCalendarButton } from "./ConnectCalendarButton";
import { DisconnectCalendarButton } from "./DisconnectCalendarButton";

export default async function DashboardSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; hubspot?: string; calendar?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const db = createDb();
  const [hubspotConnection, calendarConnection] = await Promise.all([
    db
      .select({ id: crmConnections.id, connectedAt: crmConnections.connectedAt })
      .from(crmConnections)
      .where(and(eq(crmConnections.userId, user.id), eq(crmConnections.crmType, "hubspot")))
      .limit(1),
    db
      .select({
        id: calendarConnections.id,
        calendarProvider: calendarConnections.calendarProvider,
        connectedAt: calendarConnections.connectedAt,
      })
      .from(calendarConnections)
      .where(eq(calendarConnections.userId, user.id))
      .limit(1),
  ]);

  const connected = hubspotConnection.length > 0;
  const calendarConnected = calendarConnection.length > 0;
  const params = await searchParams;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account and integrations
        </p>
      </div>

      {/* Status messages from OAuth callback */}
      {params.hubspot === "connected" && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>HubSpot connected successfully.</span>
        </div>
      )}
      {params.calendar === "connected" && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>Calendar connected. The bot will automatically join your Zoom meetings.</span>
        </div>
      )}
      {params.error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <XCircle className="h-5 w-5 shrink-0" />
          <span>
            {params.error === "hubspot_not_configured"
              ? "HubSpot app is not configured. Set HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET."
              : params.error === "invalid_state"
                ? "Invalid or expired connection request. Please try again."
                : params.error === "token_exchange_failed"
                  ? "Failed to exchange authorization code. Check your HubSpot app settings."
                  : params.error === "missing_code"
                    ? "Missing authorization code from HubSpot."
                    : params.error === "recall_not_configured"
                      ? "Recall.ai is not configured. Set RECALL_API_KEY."
                      : params.error === "calendar_connect_failed"
                        ? "Failed to start calendar connection. Please try again."
                        : params.error === "calendar_callback_failed"
                          ? "Failed to complete calendar connection. Please try again."
                          : `Connection failed: ${params.error}`}
          </span>
        </div>
      )}

      {/* Connected CRMs */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Connected CRMs</CardTitle>
            <CardDescription>
              Connect your CRM to push approved extractions from sales calls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Link2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-medium">HubSpot</p>
                  <p className="text-sm text-muted-foreground">
                    {connected
                      ? `Connected ${hubspotConnection[0].connectedAt ? `on ${new Date(hubspotConnection[0].connectedAt).toLocaleDateString()}` : ""}`
                      : "Connect to sync contacts, deals, and notes"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {connected ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      Connected
                    </span>
                    <DisconnectHubSpotButton connectionId={hubspotConnection[0].id} />
                  </>
                ) : (
                  <ConnectHubSpotButton />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Calendar Integration */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Calendar Integration</CardTitle>
            <CardDescription>
              Connect your calendar so the bot automatically joins Zoom meetings — no manual trigger needed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <CalendarCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">
                    {calendarConnected
                      ? `${calendarConnection[0].calendarProvider === "microsoft" ? "Outlook" : "Google"} Calendar`
                      : "Google Calendar / Outlook"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {calendarConnected
                      ? `Connected ${calendarConnection[0].connectedAt ? `on ${new Date(calendarConnection[0].connectedAt).toLocaleDateString()}` : ""}. Bot joins Zoom meetings automatically.`
                      : "Bot joins Zoom meetings from your calendar without manual setup"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {calendarConnected ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      Connected
                    </span>
                    <DisconnectCalendarButton />
                  </>
                ) : (
                  <div className="flex gap-2">
                    <ConnectCalendarButton provider="google" />
                    <ConnectCalendarButton provider="microsoft" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>Back to your main dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
