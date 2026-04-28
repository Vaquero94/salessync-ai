/** JSON shape stored in users.capture_preferences (Supabase). */
export type CapturePreferences = {
  contact: boolean;
  deal: boolean;
  action_items: boolean;
  summary: boolean;
  sentiment: boolean;
  objections: boolean;
  next_meeting: boolean;
};

export const DEFAULT_CAPTURE_PREFERENCES: CapturePreferences = {
  contact: true,
  deal: true,
  action_items: true,
  summary: true,
  sentiment: false,
  objections: false,
  next_meeting: false,
};

export function mergeCapturePreferences(
  stored: unknown,
  patch: Partial<CapturePreferences>
): CapturePreferences {
  const base =
    stored && typeof stored === "object"
      ? { ...DEFAULT_CAPTURE_PREFERENCES, ...(stored as Partial<CapturePreferences>) }
      : { ...DEFAULT_CAPTURE_PREFERENCES };
  return { ...base, ...patch };
}

export function normalizeCapturePreferences(stored: unknown): CapturePreferences {
  return mergeCapturePreferences(stored, {});
}
