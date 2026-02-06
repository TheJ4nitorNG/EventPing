import { events, responses, type Event, type InsertEvent, type Response, type InsertResponse, type EventWithCounts } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  createEvent(event: InsertEvent): Promise<{ eventId: string; organizerToken: string }>;
  getEvent(id: string): Promise<Event | undefined>;
  getEventWithCounts(id: string): Promise<EventWithCounts | undefined>;
  getEventByOrganizerToken(id: string, token: string): Promise<EventWithCounts | undefined>;
  createResponse(response: InsertResponse): Promise<Response>;
  getResponsesByEventId(eventId: string): Promise<Response[]>;
}

export class DatabaseStorage implements IStorage {
  async createEvent(insertEvent: InsertEvent): Promise<{ eventId: string; organizerToken: string }> {
    const organizerToken = randomUUID();
    const [event] = await db
      .insert(events)
      .values({
        title: insertEvent.title,
        startsAt: new Date(insertEvent.startsAt),
        timezone: insertEvent.timezone || 'America/New_York',
        location: insertEvent.location || null,
        note: insertEvent.note || null,
        organizerEmail: insertEvent.organizerEmail || null,
        organizerPhone: insertEvent.organizerPhone || null,
        reminderDayBefore: insertEvent.reminderDayBefore || false,
        reminderDayOf: insertEvent.reminderDayOf || false,
        organizerToken,
      })
      .returning();
    return { eventId: event.id, organizerToken };
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEventWithCounts(id: string): Promise<EventWithCounts | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event) return undefined;

    const eventResponses = await this.getResponsesByEventId(id);
    const yesCount = eventResponses.filter(r => r.choice === "yes").length;
    const noCount = eventResponses.filter(r => r.choice === "no").length;
    const maybeCount = eventResponses.filter(r => r.choice === "maybe").length;

    return {
      ...event,
      yesCount,
      noCount,
      maybeCount,
      responses: eventResponses,
    };
  }

  async getEventByOrganizerToken(id: string, token: string): Promise<EventWithCounts | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event || event.organizerToken !== token) return undefined;

    const eventResponses = await this.getResponsesByEventId(id);
    const yesCount = eventResponses.filter(r => r.choice === "yes").length;
    const noCount = eventResponses.filter(r => r.choice === "no").length;
    const maybeCount = eventResponses.filter(r => r.choice === "maybe").length;

    return {
      ...event,
      yesCount,
      noCount,
      maybeCount,
      responses: eventResponses,
    };
  }

  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const [response] = await db
      .insert(responses)
      .values({
        eventId: insertResponse.eventId,
        name: insertResponse.name || null,
        choice: insertResponse.choice,
        comment: insertResponse.comment || null,
      })
      .returning();
    return response;
  }

  async getResponsesByEventId(eventId: string): Promise<Response[]> {
    return db
      .select()
      .from(responses)
      .where(eq(responses.eventId, eventId))
      .orderBy(desc(responses.createdAt));
  }
}

export const storage = new DatabaseStorage();
