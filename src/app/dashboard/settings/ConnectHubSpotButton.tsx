"use client";

import { Button } from "@/components/ui/button";

export function ConnectHubSpotButton() {
  return (
    <Button asChild>
      <a href="/api/crm/hubspot/connect">Connect HubSpot</a>
    </Button>
  );
}
