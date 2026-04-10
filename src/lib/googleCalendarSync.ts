/**
 * Polls Google Calendar for each connected user and dispatches Recall bots when the bot email is invited.
 * Invoked by the cron route (every ~15 minutes).
 */
import { and, eq } from "drizzle-orm";
import { createDb } from "@/db";
import { decrypt, encrypt } from "@/lib/crypto";
import {
  eventInvitesBotEmail,
  eventStartIsFuture,
  extractMeetingUrlFromEvent,
  listUpcomingCalendarEvents,
  refreshGoogleAccessToken,
} from "@/lib/googleCalendar";
import { createBotForMeeting } from "@/lib/recall";
import {
  googleCalendarBotDispatches,
  googleCalendarConnections,
} from "@/db/schema";

type Db = ReturnType<typeof createDb>;

export async function runGoogleCalendarBotSync(db: Db): Promise<{
  usersProcessed: number;
  botsScheduled: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let botsScheduled = 0;
  const rows = await db.select().from(googleCalendarConnections);
  const timeMin = new Date();
  const timeMax = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  for (const row of rows) {
    try {
      let accessToken = decrypt(row.accessToken);
      let refreshEnc = row.refreshToken;

      const fetchEvents = async () =>
        listUpcomingCalendarEvents(accessToken, { timeMin, timeMax });

      let events: Awaited<ReturnType<typeof fetchEvents>>;
      try {
        events = await fetchEvents();
      } catch (e) {
        const refreshPlain = decrypt(refreshEnc);
        const refreshed = await refreshGoogleAccessToken(refreshPlain);
        accessToken = refreshed.access_token;
        const newRefresh = refreshed.refresh_token ?? refreshPlain;
        refreshEnc = encrypt(newRefresh);
        await db
          .update(googleCalendarConnections)
          .set({
            accessToken: encrypt(accessToken),
            refreshToken: refreshEnc,
          })
          .where(eq(googleCalendarConnections.id, row.id));
        events = await fetchEvents();
      }

      for (const event of events) {
        if (!event.id) continue;
        if (!eventInvitesBotEmail(event)) continue;
        const meetingUrl = extractMeetingUrlFromEvent(event);
        if (!meetingUrl) continue;
        if (!eventStartIsFuture(event)) continue;

        const [existing] = await db
          .select({ id: googleCalendarBotDispatches.id })
          .from(googleCalendarBotDispatches)
          .where(
            and(
              eq(googleCalendarBotDispatches.userId, row.userId),
              eq(googleCalendarBotDispatches.googleEventId, event.id)
            )
          )
          .limit(1);
        if (existing) continue;

        const joinAtIso = event.start?.dateTime ?? null;
        await createBotForMeeting({
          meetingUrl,
          userId: row.userId,
          joinAtIso,
        });

        await db.insert(googleCalendarBotDispatches).values({
          userId: row.userId,
          googleEventId: event.id,
        });
        botsScheduled += 1;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`user ${row.userId}: ${msg}`);
      console.error("[google-calendar-sync]", row.userId, err);
    }
  }

  return { usersProcessed: rows.length, botsScheduled, errors };
}
