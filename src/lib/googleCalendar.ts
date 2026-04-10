/**
 * Google Calendar API helpers: token refresh, upcoming events, meeting URL extraction.
 * Used by OAuth callback, cron sync, and connect redirect construction.
 */
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_EVENTS =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export const GOOGLE_CALENDAR_BOT_EMAIL = "bot@zeroentryai.co";

export function getGoogleCalendarRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("NEXT_PUBLIC_APP_URL is required for Google Calendar OAuth");
  }
  return `${base}/api/google/calendar/callback`;
}

export async function exchangeGoogleAuthCode(
  code: string
): Promise<{ access_token: string; refresh_token?: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
  }
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getGoogleCalendarRedirectUri(),
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google token exchange failed (${res.status}): ${t}`);
  }
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
  };
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
  }
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google token refresh failed (${res.status}): ${t}`);
  }
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
  };
}

export interface GoogleCalendarEvent {
  id?: string;
  hangoutLink?: string;
  location?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  attendees?: { email?: string; responseStatus?: string }[];
  conferenceData?: {
    entryPoints?: { entryPointType?: string; uri?: string }[];
  };
}

interface EventsListResponse {
  items?: GoogleCalendarEvent[];
}

export function eventInvitesBotEmail(event: GoogleCalendarEvent): boolean {
  const target = GOOGLE_CALENDAR_BOT_EMAIL.toLowerCase();
  return (event.attendees ?? []).some(
    (a) => a.email?.toLowerCase() === target
  );
}

/** Pulls Meet, Zoom, or Teams join links from a Calendar event. */
export function extractMeetingUrlFromEvent(event: GoogleCalendarEvent): string | null {
  if (event.hangoutLink) return event.hangoutLink;
  const video = event.conferenceData?.entryPoints?.find(
    (e) => e.entryPointType === "video"
  )?.uri;
  if (video) return video;
  const text = `${event.location ?? ""} ${event.description ?? ""}`;
  const zoom = text.match(/https:\/\/[\w.-]*zoom\.us\/j\/[^\s)<>"']+/i);
  if (zoom) return zoom[0];
  const teams = text.match(
    /https:\/\/teams\.microsoft\.com\/[^\s)<>"']+/i
  );
  if (teams) return teams[0];
  const meet = text.match(/https:\/\/meet\.google\.com\/[^\s)<>"']+/i);
  if (meet) return meet[0];
  return null;
}

export function eventStartIsFuture(event: GoogleCalendarEvent): boolean {
  const iso = event.start?.dateTime ?? event.start?.date;
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return t > Date.now();
}

export async function listUpcomingCalendarEvents(
  accessToken: string,
  opts: { timeMin: Date; timeMax: Date }
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: opts.timeMin.toISOString(),
    timeMax: opts.timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
  });
  const res = await fetch(`${CALENDAR_EVENTS}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google Calendar list failed (${res.status}): ${t}`);
  }
  const data = (await res.json()) as EventsListResponse;
  return data.items ?? [];
}
