import type { ExtractionData } from "@/components/ReviewCard";

/**
 * Prevents noisy/non-sales recordings from triggering CRM writes.
 */
export function hasExtractableSalesData(raw: ExtractionData): boolean {
  const firstContact = raw.contacts?.[0];
  const firstActionItem = raw.actionItems?.[0];
  return Boolean(
    firstContact?.name?.trim() ||
      raw.dealInfo?.value?.toString().trim() ||
      firstActionItem?.task?.trim()
  );
}
