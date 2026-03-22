"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

/** Deepgram sample audio - short speech for testing transcription + extraction */
const SAMPLE_AUDIO_URL = "https://dpgr.am/spacewalk.wav";

export function SimulateRecordingButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSimulate() {
    setLoading(true);
    try {
      const res = await fetch("/api/recordings/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl: SAMPLE_AUDIO_URL,
          source: "zoom",
          durationMinutes: 1,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? data.details ?? "Failed to process");
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to simulate recording");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSimulate}
      disabled={loading}
    >
      <Mic className="mr-2 h-4 w-4" />
      {loading ? "Processing…" : "Simulate recording"}
    </Button>
  );
}
