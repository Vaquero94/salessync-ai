"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type CheckoutButtonProps = {
  planId: string;
  planName: string;
};

export function CheckoutButton({ planId, planName }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("[checkout] API error:", data);
        const msg =
          data.stripeMessage ??
          data.error ??
          "Failed to create checkout session";
        const detail = data.stripeCode
          ? ` (${data.stripeType}: ${data.stripeCode}${data.stripeParam ? ` param=${data.stripeParam}` : ""})`
          : "";
        throw new Error(`${msg}${detail}`);
      }

      const { url } = data;
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      className="w-full"
      size="lg"
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading ? "Redirecting…" : `Subscribe to ${planName}`}
    </Button>
  );
}
