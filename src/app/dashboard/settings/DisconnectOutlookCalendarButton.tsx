"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DisconnectOutlookCalendarButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    if (!confirm("Disconnect Outlook calendar? The bot will stop joining meetings from Recall.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/recall/calendar/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("Failed to disconnect");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to disconnect Outlook calendar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={loading}>
      {loading ? "Disconnecting…" : "Disconnect"}
    </Button>
  );
}
