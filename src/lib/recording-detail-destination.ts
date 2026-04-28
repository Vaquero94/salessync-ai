type JsonRecord = Record<string, unknown>;

/**
 * Human-readable list of HubSpot targets for the source → destination banner.
 */
export function hubSpotDestinationLabel(raw: JsonRecord): string {
  const parts: string[] = [];
  const contacts = Array.isArray(raw.contacts) ? (raw.contacts as JsonRecord[]) : [];
  const c0 = contacts[0] ?? {};
  const hasContact =
    (c0.email != null && String(c0.email).trim() !== "") ||
    (c0.name != null && String(c0.name).trim() !== "");
  if (hasContact) parts.push("Contact");

  const deal = (raw.dealInfo as JsonRecord | undefined) ?? {};
  if (
    (deal.value != null && String(deal.value).trim() !== "") ||
    (deal.stageChange != null && String(deal.stageChange).trim() !== "") ||
    (deal.closeDate != null && String(deal.closeDate).trim() !== "")
  ) {
    parts.push("Deal");
  }

  const actions = Array.isArray(raw.actionItems) ? (raw.actionItems as JsonRecord[]) : [];
  const hasTasks = actions.some((a) => typeof a.task === "string" && a.task.trim());
  const hasSummary = raw.summary != null && String(raw.summary).trim() !== "";
  if (hasSummary || hasTasks) parts.push("Activity");

  return parts.length > 0 ? parts.join(", ") : "Review fields below";
}
