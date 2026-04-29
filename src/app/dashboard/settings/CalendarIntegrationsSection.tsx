import { CalendarCheck } from "lucide-react";
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
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Calendar</p>
      <div className="mb-6 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03]">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center">
            <div className="mr-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#7C6FFF]/30">
              <CalendarCheck className="h-3.5 w-3.5 text-[#c4b5fd]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Google Calendar</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {googleCalConnected
                  ? `Connected ${googleConnectedAt ? googleConnectedAt.toLocaleDateString() : ""}`
                  : "Invite bot@zeroentryai.co to meetings you want recorded"}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            {googleCalConnected ? (
              <>
                <span className="mr-3 inline-flex items-center gap-1 text-xs text-[#86efac]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#86efac]" />
                  Connected
                </span>
                <DisconnectGoogleCalendarButton />
              </>
            ) : (
              <ConnectGoogleCalendarButton />
            )}
          </div>
        </div>
        <div className="border-t border-white/[0.05]">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center">
              <div className="mr-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#60a5fa]/25">
                <CalendarCheck className="h-3.5 w-3.5 text-[#93c5fd]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Outlook Calendar</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {outlookCalConnected
                    ? `Connected ${outlookConnectedAt ? outlookConnectedAt.toLocaleDateString() : ""}`
                    : "Auto-join Zoom meetings from your Outlook calendar"}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              {outlookCalConnected ? (
                <>
                  <span className="mr-3 inline-flex items-center gap-1 text-xs text-[#86efac]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#86efac]" />
                    Connected
                  </span>
                  <DisconnectOutlookCalendarButton />
                </>
              ) : (
                <ConnectOutlookCalendarButton />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
