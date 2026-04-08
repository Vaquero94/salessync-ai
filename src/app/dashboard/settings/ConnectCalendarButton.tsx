"use client";

import { Button } from "@/components/ui/button";

type Props = {
  provider: "google" | "microsoft";
};

export function ConnectCalendarButton({ provider }: Props) {
  return (
    <Button asChild>
      <a href={`/api/recall/calendar/connect?provider=${provider}`}>
        Connect {provider === "google" ? "Google" : "Outlook"} Calendar
      </a>
    </Button>
  );
}
