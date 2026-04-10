"use client";

import { Button } from "@/components/ui/button";

export function ConnectGoogleCalendarButton() {
  return (
    <Button asChild>
      <a href="/api/google/calendar/connect">Connect Google Calendar</a>
    </Button>
  );
}
