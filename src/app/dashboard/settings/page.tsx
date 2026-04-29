import { createClient } from "@/lib/supabase/server";
import { createDb } from "@/db";
import {
  calendarConnections,
  crmConnections,
  googleCalendarConnections,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { CalendarIntegrationsSection } from "./CalendarIntegrationsSection";
import { ConnectHubSpotButton } from "./ConnectHubSpotButton";
import { DisconnectHubSpotButton } from "./DisconnectHubSpotButton";
import { AutoPilotToggle } from "./AutoPilotToggle";
import { CapturePreferencesSection } from "./CapturePreferencesSection";

export default async function DashboardSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    hubspot?: string;
    calendar?: string;
    google_calendar?: string;
  }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const db = createDb();
  const [hubspotConnection, outlookConnection, googleConnection] = await Promise.all([
    db
      .select({ id: crmConnections.id, connectedAt: crmConnections.connectedAt })
      .from(crmConnections)
      .where(and(eq(crmConnections.userId, user.id), eq(crmConnections.crmType, "hubspot")))
      .limit(1),
    db
      .select({
        id: calendarConnections.id,
        connectedAt: calendarConnections.connectedAt,
      })
      .from(calendarConnections)
      .where(
        and(
          eq(calendarConnections.userId, user.id),
          eq(calendarConnections.calendarProvider, "microsoft")
        )
      )
      .limit(1),
    db
      .select({
        id: googleCalendarConnections.id,
        connectedAt: googleCalendarConnections.connectedAt,
      })
      .from(googleCalendarConnections)
      .where(eq(googleCalendarConnections.userId, user.id))
      .limit(1),
  ]);

  const { data: userRow } = await supabase
    .from("users")
    .select("auto_pilot")
    .eq("id", user.id)
    .single();

  const connected = hubspotConnection.length > 0;
  const googleCalConnected = googleConnection.length > 0;
  const outlookCalConnected = outlookConnection.length > 0;
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-5xl px-6 pb-16 pt-8 text-white">
      <div>
        <h1 className="mb-1 text-xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mb-8 text-sm text-zinc-500">
          Manage your account and integrations
        </p>
      </div>

      {/* Status messages from OAuth callback */}
      {params.hubspot === "connected" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-emerald-300">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>HubSpot connected successfully.</span>
        </div>
      )}
      {params.calendar === "connected" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-emerald-300">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>Outlook calendar connected. The bot will automatically join your Zoom meetings.</span>
        </div>
      )}
      {params.google_calendar === "connected" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-emerald-300">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>
            Google Calendar connected. Invite bot@zeroentryai.co to meetings you want recorded; a
            scheduled job will send the notetaker bot to those calls.
          </span>
        </div>
      )}
      {params.error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300">
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
                          : params.error === "google_not_configured"
                            ? "Google Calendar is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
                            : params.error === "google_no_refresh_token"
                              ? "Google did not return a refresh token. Remove app access in Google Account settings and connect again."
                              : params.error === "google_token_exchange_failed"
                                ? "Failed to complete Google sign-in. Check OAuth client and redirect URI."
                                : params.error === "google_calendar_connect_failed"
                                  ? "Could not start Google Calendar connection. Check NEXT_PUBLIC_APP_URL."
                                  : `Connection failed: ${params.error}`}
          </span>
        </div>
      )}

      {/* Connected CRMs */}
      <section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">CRM</p>
        <div className="mb-6 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03]">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center">
              <div className="mr-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF7A59] text-[10px] font-bold text-white">
                H
              </div>
              <div>
                <p className="text-sm font-medium text-white">HubSpot</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {connected
                    ? `Connected ${hubspotConnection[0].connectedAt ? new Date(hubspotConnection[0].connectedAt).toLocaleDateString() : ""}`
                    : "Connect to sync contacts, deals, and activities"}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              {connected ? (
                <>
                  <span className="mr-3 inline-flex items-center gap-1 text-xs text-[#86efac]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#86efac]" />
                    Connected
                  </span>
                  <DisconnectHubSpotButton connectionId={hubspotConnection[0].id} />
                </>
              ) : (
                <ConnectHubSpotButton />
              )}
            </div>
          </div>
        </div>
      </section>

      <CalendarIntegrationsSection
        googleCalConnected={googleCalConnected}
        googleConnectedAt={
          googleCalConnected ? new Date(googleConnection[0].connectedAt) : null
        }
        outlookCalConnected={outlookCalConnected}
        outlookConnectedAt={
          outlookCalConnected ? new Date(outlookConnection[0].connectedAt) : null
        }
      />

      <CapturePreferencesSection />

      <AutoPilotToggle
        initialAutoPilot={Boolean(userRow?.auto_pilot)}
      />
    </div>
  );
}
