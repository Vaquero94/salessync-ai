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
      <Card>
        <CardHeader>
          <CardTitle>Calendar Integration</CardTitle>
          <CardDescription>
            Google: invite bot@zeroentryai.co to meetings you want recorded. Outlook: Recall connects
            your calendar for automatic Zoom joins.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <CalendarCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Google Calendar</p>
                <p className="text-sm text-muted-foreground">
                  {googleCalConnected
                    ? `Connected ${googleConnectedAt ? `on ${googleConnectedAt.toLocaleDateString()}` : ""}. Meetings that include bot@zeroentryai.co get a Recall bot automatically.`
                    : "Connect to scan your calendar every 15 minutes for meetings with the notetaker bot invited."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {googleCalConnected ? (
                <>
                  <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
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

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
                <CalendarCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="font-medium">Outlook Calendar</p>
                <p className="text-sm text-muted-foreground">
                  {outlookCalConnected
                    ? `Connected ${outlookConnectedAt ? `on ${outlookConnectedAt.toLocaleDateString()}` : ""}. Bot joins Zoom meetings via Recall.ai.`
                    : "Connect via Recall.ai so the bot joins Zoom meetings from your Outlook calendar."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {outlookCalConnected ? (
                <>
                  <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
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
