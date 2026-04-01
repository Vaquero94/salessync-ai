"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }

      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-5 text-center dark:border-green-800 dark:bg-green-950">
        <p className="text-lg font-semibold text-green-800 dark:text-green-300">
          You&apos;re on the list!
        </p>
        <p className="mt-1 text-sm text-green-700 dark:text-green-400">
          We&apos;ll email you at <span className="font-medium">{email}</span> when we&apos;re ready.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3">
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="rounded-md border bg-background px-4 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
      />
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="rounded-md border bg-background px-4 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
      />
      <Button type="submit" size="lg" disabled={state === "loading"}>
        {state === "loading" ? "Joining…" : "Join the Waitlist"}
      </Button>
      {state === "error" && (
        <p className="text-center text-sm text-destructive">{errorMsg}</p>
      )}
    </form>
  );
}
