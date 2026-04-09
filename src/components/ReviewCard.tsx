"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type ExtractionData = {
  contacts?: Array<{
    name?: string | null;
    role?: string | null;
    company?: string | null;
    email?: string | null;
  }>;
  dealInfo?: {
    value?: string | null;
    stageChange?: string | null;
    closeDate?: string | null;
  };
  actionItems?: Array<{
    owner?: string | null;
    task?: string | null;
    dueDate?: string | null;
  }>;
  objections?: string[] | null;
  summary?: string | null;
  sentiment?: string | null;
};

type ReviewCardProps = {
  extractionId: string;
  recordingId: string;
  data: ExtractionData;
  onApprove?: () => void;
  onDismiss?: () => void;
};

export function ReviewCard({
  extractionId,
  recordingId,
  data,
  onApprove,
  onDismiss,
}: ReviewCardProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ExtractionData>({
    contacts: data.contacts ?? [{}],
    dealInfo: data.dealInfo ?? {},
    actionItems: data.actionItems ?? [{}],
    objections: data.objections ?? [],
    summary: data.summary ?? "",
    sentiment: data.sentiment ?? "",
  });
  const [loading, setLoading] = useState(false);

  function updateContact(index: number, field: string, value: string) {
    const next = [...(formData.contacts ?? [{}])];
    if (!next[index]) next[index] = {};
    (next[index] as Record<string, string | null>)[field] = value || null;
    setFormData((p) => ({ ...p, contacts: next }));
  }

  function updateDealInfo(field: string, value: string) {
    setFormData((p) => ({
      ...p,
      dealInfo: { ...(p.dealInfo ?? {}), [field]: value || null },
    }));
  }

  function updateActionItem(index: number, field: string, value: string) {
    const next = [...(formData.actionItems ?? [{}])];
    if (!next[index]) next[index] = {};
    (next[index] as Record<string, string | null>)[field] = value || null;
    setFormData((p) => ({ ...p, actionItems: next }));
  }

  async function handleApprove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/extractions/${extractionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", rawJson: formData }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      const data = (await res.json()) as { pushedToCrm?: boolean; pushError?: string };
      if (data.pushError && !data.pushedToCrm) {
        alert(`Saved locally, but push to CRM failed: ${data.pushError}`);
      }
      onApprove?.();
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to approve");
    } finally {
      setLoading(false);
    }
  }

  async function handleDismiss() {
    setLoading(true);
    try {
      const res = await fetch(`/api/extractions/${extractionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss" }),
      });
      if (!res.ok) throw new Error("Failed to dismiss");
      onDismiss?.();
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to dismiss");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review extraction</CardTitle>
        <CardDescription>
          Edit any field, then approve or dismiss
          <span className="mt-1 block font-mono text-xs text-muted-foreground">
            Recording {recordingId}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contacts */}
        <div>
          <h4 className="mb-2 text-sm font-medium">Contacts</h4>
          <div className="space-y-2">
            {(formData.contacts ?? [{}]).map((c, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                <Input
                  placeholder="Name"
                  value={(c as Record<string, string>).name ?? ""}
                  onChange={(e) => updateContact(i, "name", e.target.value)}
                />
                <Input
                  placeholder="Role"
                  value={(c as Record<string, string>).role ?? ""}
                  onChange={(e) => updateContact(i, "role", e.target.value)}
                />
                <Input
                  placeholder="Company"
                  value={(c as Record<string, string>).company ?? ""}
                  onChange={(e) => updateContact(i, "company", e.target.value)}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={(c as Record<string, string>).email ?? ""}
                  onChange={(e) => updateContact(i, "email", e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Deal info */}
        <div>
          <h4 className="mb-2 text-sm font-medium">Deal info</h4>
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              placeholder="Value"
              value={formData.dealInfo?.value ?? ""}
              onChange={(e) => updateDealInfo("value", e.target.value)}
            />
            <Input
              placeholder="Stage change"
              value={formData.dealInfo?.stageChange ?? ""}
              onChange={(e) => updateDealInfo("stageChange", e.target.value)}
            />
            <Input
              placeholder="Close date"
              value={formData.dealInfo?.closeDate ?? ""}
              onChange={(e) => updateDealInfo("closeDate", e.target.value)}
            />
          </div>
        </div>

        {/* Action items */}
        <div>
          <h4 className="mb-2 text-sm font-medium">Action items</h4>
          <div className="space-y-2">
            {(formData.actionItems ?? [{}]).map((a, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-3">
                <Input
                  placeholder="Owner"
                  value={(a as Record<string, string>).owner ?? ""}
                  onChange={(e) => updateActionItem(i, "owner", e.target.value)}
                />
                <Input
                  placeholder="Task"
                  value={(a as Record<string, string>).task ?? ""}
                  onChange={(e) => updateActionItem(i, "task", e.target.value)}
                />
                <Input
                  placeholder="Due date"
                  value={(a as Record<string, string>).dueDate ?? ""}
                  onChange={(e) =>
                    updateActionItem(i, "dueDate", e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Summary & sentiment */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Summary</label>
            <Input
              placeholder="2-sentence summary"
              value={formData.summary ?? ""}
              onChange={(e) =>
                setFormData((p) => ({ ...p, summary: e.target.value || null }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Sentiment</label>
            <Input
              placeholder="Sentiment"
              value={formData.sentiment ?? ""}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  sentiment: e.target.value || null,
                }))
              }
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={handleApprove} disabled={loading}>
          {loading ? "Saving…" : "Approve & Push to CRM"}
        </Button>
        <Button variant="outline" onClick={handleDismiss} disabled={loading}>
          Dismiss
        </Button>
      </CardFooter>
    </Card>
  );
}
