import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema } from "@shared/schema";
import { z } from "zod";
import { sendRsvpNotificationEmail } from "./email";
import { sendRsvpNotificationSms } from "./sms";

// Convert a datetime-local string (YYYY-MM-DDTHH:MM) in a specific timezone to a UTC Date
function parseLocalDateTimeInTimezone(dateTimeStr: string, timezone: string): Date {
  // The dateTimeStr is like "2026-01-30T14:00" - this is the local time in the selected timezone
  // We need to interpret this as being in the selected timezone and convert to UTC
  
  // Parse the components
  const [datePart, timePart] = dateTimeStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  
  // Create a date string that explicitly states the timezone
  // Format: "January 30, 2026 14:00" then interpret in the given timezone
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  
  // Get the UTC time by calculating the offset for the given timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // Create a reference date at the given local time
  // We'll use a trick: create dates and find when they match
  const targetDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  
  // Try different UTC times until we find one that shows the correct local time
  // Start with an estimate based on typical offsets (-12 to +14 hours)
  for (let offsetHours = -14; offsetHours <= 14; offsetHours++) {
    const testDate = new Date(targetDate.getTime() - offsetHours * 60 * 60 * 1000);
    const parts = formatter.formatToParts(testDate);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value;
    
    const testYear = Number(getPart('year'));
    const testMonth = Number(getPart('month'));
    const testDay = Number(getPart('day'));
    const testHour = Number(getPart('hour'));
    const testMinute = Number(getPart('minute'));
    
    if (testYear === year && testMonth === month && testDay === day && 
        testHour === hour && testMinute === minute) {
      return testDate;
    }
  }
  
  // Fallback: just return the date as-is (shouldn't happen)
  return targetDate;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Create a new event
  app.post("/api/events", async (req, res) => {
    try {
      const parsed = insertEventSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid request", 
          errors: parsed.error.errors 
        });
      }

      // Convert the startsAt from the selected timezone to UTC
      const { startsAt, timezone, ...rest } = parsed.data;
      const tz = timezone || 'America/New_York';
      const startsAtUtc = typeof startsAt === 'string' 
        ? parseLocalDateTimeInTimezone(startsAt, tz)
        : startsAt;

      const result = await storage.createEvent({
        ...rest,
        timezone: tz,
        startsAt: startsAtUtc,
      });
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating event:", error);
      return res.status(500).json({ message: "Failed to create event" });
    }
  });

  // Get event details (public)
  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEventWithCounts(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Hide the organizer token from public responses
      const { organizerToken, ...publicEvent } = event;
      return res.json(publicEvent);
    } catch (error) {
      console.error("Error fetching event:", error);
      return res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  // Get event details (organizer view)
  app.get("/api/events/:id/organizer", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(401).json({ message: "Token required" });
      }

      const event = await storage.getEventByOrganizerToken(req.params.id, token);
      if (!event) {
        return res.status(401).json({ message: "Invalid token or event not found" });
      }

      // Hide the organizer token even from organizer view
      const { organizerToken, ...publicEvent } = event;
      return res.json(publicEvent);
    } catch (error) {
      console.error("Error fetching organizer event:", error);
      return res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  // Submit a vote for an event
  app.post("/api/events/:id/vote", async (req, res) => {
    try {
      const eventId = req.params.id;
      
      // Get the event first
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Check if voting is closed (event has started)
      const now = new Date();
      if (event.startsAt <= now) {
        return res.status(400).json({ message: "Voting is closed for this event" });
      }

      // Validate the vote data
      const voteSchema = z.object({
        choice: z.enum(["yes", "no", "maybe"]),
        name: z.string().max(50).optional().nullable(),
        comment: z.string().max(140).optional().nullable(),
      });

      const parsed = voteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid request", 
          errors: parsed.error.errors 
        });
      }

      const response = await storage.createResponse({
        eventId,
        choice: parsed.data.choice,
        name: parsed.data.name || null,
        comment: parsed.data.comment || null,
      });

      // Send RSVP notification to organizer (don't await - fire and forget)
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const organizerUrl = `${baseUrl}/o/${event.id}?token=${event.organizerToken}`;
      
      if (event.organizerEmail) {
        sendRsvpNotificationEmail(
          event.organizerEmail,
          event.title,
          parsed.data.name || null,
          parsed.data.choice,
          parsed.data.comment || null,
          organizerUrl
        ).catch(err => console.error('Failed to send RSVP email notification:', err));
      }
      
      if (event.organizerPhone) {
        sendRsvpNotificationSms(
          event.organizerPhone,
          event.title,
          parsed.data.name || null,
          parsed.data.choice
        ).catch(err => console.error('Failed to send RSVP SMS notification:', err));
      }

      return res.status(201).json(response);
    } catch (error) {
      console.error("Error creating vote:", error);
      return res.status(500).json({ message: "Failed to submit vote" });
    }
  });

  return httpServer;
}
