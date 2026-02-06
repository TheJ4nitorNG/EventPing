import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  timezone: text("timezone").default("America/New_York"),
  location: text("location"),
  note: text("note"),
  organizerToken: text("organizer_token").notNull(),
  organizerEmail: text("organizer_email"),
  organizerPhone: text("organizer_phone"),
  reminderDayBefore: boolean("reminder_day_before").default(false),
  reminderDayOf: boolean("reminder_day_of").default(false),
  reminderDayBeforeSent: boolean("reminder_day_before_sent").default(false),
  reminderDayOfSent: boolean("reminder_day_of_sent").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const responses = pgTable("responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name"),
  choice: text("choice").notNull(),
  comment: text("comment"),
  email: text("email"),
  phone: text("phone"),
  wantsReminder: boolean("wants_reminder").default(false),
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const eventsRelations = relations(events, ({ many }) => ({
  responses: many(responses),
}));

export const responsesRelations = relations(responses, ({ one }) => ({
  event: one(events, {
    fields: [responses.eventId],
    references: [events.id],
  }),
}));

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  organizerToken: true,
  reminderDayBeforeSent: true,
  reminderDayOfSent: true,
  createdAt: true,
}).extend({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  startsAt: z.string().or(z.date()),
  timezone: z.string().optional(),
  location: z.string().max(200).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  organizerEmail: z.string().email().optional().nullable().or(z.literal("")),
  organizerPhone: z.string().max(20).optional().nullable(),
  reminderDayBefore: z.boolean().optional(),
  reminderDayOf: z.boolean().optional(),
});

export const insertResponseSchema = createInsertSchema(responses).omit({
  id: true,
  reminderSent: true,
  createdAt: true,
}).extend({
  eventId: z.string().uuid(),
  name: z.string().max(50).optional().nullable(),
  choice: z.enum(["yes", "no", "maybe"]),
  comment: z.string().max(140).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(20).optional().nullable(),
  wantsReminder: z.boolean().optional(),
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type Response = typeof responses.$inferSelect;

export type EventWithCounts = Event & {
  yesCount: number;
  noCount: number;
  maybeCount: number;
  responses: Response[];
};
