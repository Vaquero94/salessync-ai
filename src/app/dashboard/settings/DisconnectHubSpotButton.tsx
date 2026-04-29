"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  connectionId: string;
};

export function DisconnectHubSpotButton({ connectionId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    if (!confirm("Disconnect HubSpot? You can reconnect anytime.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/crm/hubspot/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to disconnect");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDisconnect}
      disabled={loading}
      className="h-auto rounded-lg border-white/10 bg-transparent px-3 py-1.5 text-xs text-zinc-500 shadow-none hover:border-white/20 hover:bg-transparent hover:text-zinc-300"
    >
      {loading ? "Disconnecting…" : "Disconnect"}
    </Button>
  );
}
