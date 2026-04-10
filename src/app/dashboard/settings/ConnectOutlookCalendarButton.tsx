"use client";

import { Button } from "@/components/ui/button";

export function ConnectOutlookCalendarButton() {
  return (
    <Button asChild>
      <a href="/api/recall/calendar/connect?provider=microsoft">Connect Outlook Calendar</a>
    </Button>
  );
}
