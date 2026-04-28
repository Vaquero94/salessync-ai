import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, CalendarCheck } from "lucide-react";
import { ConnectGoogleCalendarButton } from "./ConnectGoogleCalendarButton";
import { ConnectOutlookCalendarButton } from "./ConnectOutlookCalendarButton";
import { DisconnectGoogleCalendarButton } from "./DisconnectGoogleCalendarButton";
import { DisconnectOutlookCalendarButton } from "./DisconnectOutlookCalendarButton";

type Props = {
  googleCalConnected: boolean;
  googleConnectedAt: Date | null;
  outlookCalConnected: boolean;
  outlookConnectedAt: Date | null;
};

export function CalendarIntegrationsSection({
  googleCalConnected,
  googleConnectedAt,
  outlookCalConnected,
  outlookConnectedAt,
}: Props) {
  return (
    <section>
      <Card className="border-white/10 bg-white/[0.03] text-white">
        <CardHeader>
          <CardTitle>Calendar Integration</CardTitle>
          <CardDescription className="text-zinc-400">
            Google: invite bot@zeroentryai.co to meetings you want recorded. Outlook: Recall connects
            your calendar for automatic Zoom joins.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7C6FFF]/20">
                <CalendarCheck className="h-5 w-5 text-[#c4b5fd]" />
              </div>
              <div>
                <p className="font-medium text-white">Google Calendar</p>
                <p className="text-sm text-zinc-400">
                  {googleCalConnected
                    ? `Connected ${googleConnectedAt ? `on ${googleConnectedAt.toLocaleDateString()}` : ""}. Meetings that include bot@zeroentryai.co get a Recall bot automatically.`
                    : "Connect to scan your calendar every 15 minutes for meetings with the notetaker bot invited."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {googleCalConnected ? (
                <>
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-300">
                    <CheckCircle className="h-4 w-4" />
                    Connected
                  </span>
                  <DisconnectGoogleCalendarButton />
                </>
              ) : (
                <ConnectGoogleCalendarButton />
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7C6FFF]/20">
                <CalendarCheck className="h-5 w-5 text-[#c4b5fd]" />
              </div>
              <div>
                <p className="font-medium text-white">Outlook Calendar</p>
                <p className="text-sm text-zinc-400">
                  {outlookCalConnected
                    ? `Connected ${outlookConnectedAt ? `on ${outlookConnectedAt.toLocaleDateString()}` : ""}. Bot joins Zoom meetings via Recall.ai.`
                    : "Connect via Recall.ai so the bot joins Zoom meetings from your Outlook calendar."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {outlookCalConnected ? (
                <>
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-300">
                    <CheckCircle className="h-4 w-4" />
                    Connected
                  </span>
                  <DisconnectOutlookCalendarButton />
                </>
              ) : (
                <ConnectOutlookCalendarButton />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
