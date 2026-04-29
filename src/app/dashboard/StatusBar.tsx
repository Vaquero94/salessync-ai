"use client";

import Link from "next/link";

type Props = {
  processingCount: number;
  failedCount: number;
  pendingCount: number;
  autoPilot: boolean;
  hasCrmConnection: boolean;
};

export function StatusBar({
  processingCount,
  failedCount,
  pendingCount,
  autoPilot,
  hasCrmConnection,
}: Props) {
  if (processingCount > 0) {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#7C6FFF]/20 bg-[#7C6FFF]/10 px-4 py-3">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7C6FFF] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7C6FFF]" />
        </span>
        <div>
          <p className="text-sm font-medium text-white">
            {autoPilot ? "Auto-piloting" : "Processing your call"}
          </p>
          <p className={`mt-0.5 text-xs ${autoPilot ? "text-[#86efac]" : "text-zinc-500"}`}>
            {autoPilot
              ? "Extracting and pushing to HubSpot automatically — no review needed."
              : "Transcribing and extracting — your review card will appear shortly."}
          </p>
        </div>
      </div>
    );
  }

  if (failedCount > 0) {
    const plural = failedCount === 1 ? "" : "s";
    return (
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
        <span className="h-2 w-2 min-w-[8px] rounded-full bg-red-500" />
        <div>
          <p className="text-sm font-medium text-white">
            Processing failed on {failedCount} recording{plural}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Something went wrong. The recording was saved but could not be extracted. Check History for
            details.
          </p>
        </div>
      </div>
    );
  }

  if (pendingCount > 0) {
    return null;
  }

  if (!hasCrmConnection) {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
        <span className="text-sm text-amber-400">⚠</span>
        <div>
          <p className="text-sm font-medium text-white">HubSpot not connected</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Connect HubSpot in Settings to start auto-logging your calls.
          </p>
        </div>
        <Link href="/dashboard/settings" className="ml-auto text-xs font-medium text-[#7C6FFF]">
          Go to Settings →
        </Link>
      </div>
    );
  }

  if (processingCount === 0 && failedCount === 0 && pendingCount === 0) {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#86efac]/15 bg-[#86efac]/[0.06] px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-[#86efac]" />
        <div>
          <p className="text-sm font-medium text-white">Zero Entry AI is running</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Your bot is armed and will join your next scheduled call automatically.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
