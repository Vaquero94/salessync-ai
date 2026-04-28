import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const calendarProviderEnum = pgEnum("calendar_provider", [
  "google",
  "microsoft",
]);

// Enums for type-safe column values
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "free",
  "starter",
  "pro",
]);

export const crmTypeEnum = pgEnum("crm_type", [
  "hubspot",
  "salesforce",
  "pipedrive",
]);

export const recordingSourceEnum = pgEnum("recording_source", [
  "zoom",
  "meet",
  "voice_note",
]);

export const recordingStatusEnum = pgEnum("recording_status", [
  "processing",
  "complete",
  "failed",
]);

export const emailProviderEnum = pgEnum("email_provider", [
  "gmail",
  "outlook",
]);

/**
 * App users table. Sync with Supabase auth.users - id should match auth.users.id
 * for Row Level Security to work correctly.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status")
    .default("free")
    .notNull(),
  subscriptionEndDate: timestamp("subscription_end_date", {
    withTimezone: true,
  }),
  autoPilot: boolean("auto_pilot").default(false).notNull(),
  autoPilotUnlocked: boolean("auto_pilot_unlocked").default(false).notNull(),
  approvedExtractionCount: integer("approved_extraction_count").default(0).notNull(),
});

/**
 * CRM OAuth connections. Tokens should be encrypted at rest (application-level).
 */
export const crmConnections = pgTable("crm_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  crmType: crmTypeEnum("crm_type").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  connectedAt: timestamp("connected_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
});

/**
 * Call/meeting recordings and voice notes.
 */
export const recordings = pgTable("recordings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  source: recordingSourceEnum("source").notNull(),
  durationMinutes: integer("duration_minutes"),
  transcriptText: text("transcript_text"),
  status: recordingStatusEnum("status").default("processing").notNull(),
  errorDetails: text("error_details"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * AI-extracted data from recordings. Approved extractions can be pushed to CRM.
 */
export const extractions = pgTable("extractions", {
  id: uuid("id").defaultRandom().primaryKey(),
  recordingId: uuid("recording_id")
    .notNull()
    .references(() => recordings.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rawJson: jsonb("raw_json").notNull(),
  approved: boolean("approved").default(false).notNull(),
  pushedToCrm: boolean("pushed_to_crm").default(false).notNull(),
  pushedAt: timestamp("pushed_at", { withTimezone: true }),
  dismissed: boolean("dismissed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Waitlist signups from the landing page.
 */
export const waitlist = pgTable("waitlist", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Google Calendar via direct OAuth. Tokens are encrypted application-side (see @/lib/crypto).
 */
export const googleCalendarConnections = pgTable("google_calendar_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  connectedAt: timestamp("connected_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * One row per Google event we already sent a Recall bot for (avoids duplicate bots each cron tick).
 */
export const googleCalendarBotDispatches = pgTable(
  "google_calendar_bot_dispatches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    googleEventId: text("google_event_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("google_calendar_bot_dispatches_user_event_idx").on(
      t.userId,
      t.googleEventId
    ),
  ]
);

/**
 * Recall.ai calendar connections for automatic bot joining.
 */
export const calendarConnections = pgTable("calendar_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  recallCalendarId: text("recall_calendar_id").notNull(),
  calendarProvider: calendarProviderEnum("calendar_provider").notNull(),
  connectedAt: timestamp("connected_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Synced emails with AI-extracted data.
 */
export const emailSyncs = pgTable("email_syncs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  emailProvider: emailProviderEnum("email_provider").notNull(),
  messageId: text("message_id").notNull(),
  subject: text("subject"),
  extractedData: jsonb("extracted_data"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
