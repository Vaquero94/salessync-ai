"use client";

import { Button } from "@/components/ui/button";

export function ConnectGoogleCalendarButton() {
  return (
    <Button asChild className="h-auto rounded-lg bg-[#7C6FFF] px-3 py-1.5 text-xs text-white hover:bg-[#7C6FFF]/90">
      <a href="/api/google/calendar/connect">Connect</a>
    </Button>
  );
}
