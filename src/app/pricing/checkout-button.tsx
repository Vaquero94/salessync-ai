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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create checkout session");
      }

      const { url } = await res.json();
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
