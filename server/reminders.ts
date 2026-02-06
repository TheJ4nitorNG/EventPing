import { db } from "./db";
import { events, responses } from "@shared/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import { sendReminderEmail, sendGuestReminderEmail } from "./email";
import { sendReminderSMS, sendGuestReminderSMS } from "./sms";

// Check and send reminders for events
export async function checkAndSendReminders() {
  const now = new Date();
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);
  
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  try {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.REPLIT_DEPLOYMENT_URL 
      ? `https://${process.env.REPLIT_DEPLOYMENT_URL}`
      : 'http://localhost:5000';

    // ===== ORGANIZER REMINDERS =====
    
    // Find events needing day-before reminders for organizers
    const eventsDayBefore = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.reminderDayBefore, true),
          eq(events.reminderDayBeforeSent, false),
          gte(events.startsAt, tomorrowStart),
          lte(events.startsAt, tomorrowEnd)
        )
      );

    for (const event of eventsDayBefore) {
      const eventResponses = await db
        .select()
        .from(responses)
        .where(eq(responses.eventId, event.id));

      const yesCount = eventResponses.filter(r => r.choice === "yes").length;
      const noCount = eventResponses.filter(r => r.choice === "no").length;
      const maybeCount = eventResponses.filter(r => r.choice === "maybe").length;

      const organizerUrl = `${baseUrl}/o/${event.id}?token=${event.organizerToken}`;

      let emailSent = true;
      let smsSent = true;

      if (event.organizerEmail) {
        emailSent = await sendReminderEmail(
          event.organizerEmail,
          event.title,
          event.startsAt,
          yesCount,
          noCount,
          maybeCount,
          organizerUrl,
          "before"
        );
      }

      if (event.organizerPhone) {
        smsSent = await sendReminderSMS(
          event.organizerPhone,
          event.title,
          event.startsAt,
          yesCount,
          noCount,
          maybeCount,
          organizerUrl,
          "before"
        );
      }

      if ((event.organizerEmail && emailSent) || (event.organizerPhone && smsSent)) {
        await db
          .update(events)
          .set({ reminderDayBeforeSent: true })
          .where(eq(events.id, event.id));
      }
    }

    // Find events needing day-of reminders for organizers
    const eventsDayOf = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.reminderDayOf, true),
          eq(events.reminderDayOfSent, false),
          gte(events.startsAt, todayStart),
          lte(events.startsAt, todayEnd)
        )
      );

    for (const event of eventsDayOf) {
      const eventResponses = await db
        .select()
        .from(responses)
        .where(eq(responses.eventId, event.id));

      const yesCount = eventResponses.filter(r => r.choice === "yes").length;
      const noCount = eventResponses.filter(r => r.choice === "no").length;
      const maybeCount = eventResponses.filter(r => r.choice === "maybe").length;

      const organizerUrl = `${baseUrl}/o/${event.id}?token=${event.organizerToken}`;

      let emailSent = true;
      let smsSent = true;

      if (event.organizerEmail) {
        emailSent = await sendReminderEmail(
          event.organizerEmail,
          event.title,
          event.startsAt,
          yesCount,
          noCount,
          maybeCount,
          organizerUrl,
          "of"
        );
      }

      if (event.organizerPhone) {
        smsSent = await sendReminderSMS(
          event.organizerPhone,
          event.title,
          event.startsAt,
          yesCount,
          noCount,
          maybeCount,
          organizerUrl,
          "of"
        );
      }

      if ((event.organizerEmail && emailSent) || (event.organizerPhone && smsSent)) {
        await db
          .update(events)
          .set({ reminderDayOfSent: true })
          .where(eq(events.id, event.id));
      }
    }

    // ===== GUEST REMINDERS =====
    
    // Find all events happening tomorrow
    const eventsTomorrow = await db
      .select()
      .from(events)
      .where(
        and(
          gte(events.startsAt, tomorrowStart),
          lte(events.startsAt, tomorrowEnd)
        )
      );

    for (const event of eventsTomorrow) {
      const eventUrl = `${baseUrl}/e/${event.id}`;
      
      // Find guests who want reminders but haven't received them yet
      const guestsNeedingReminders = await db
        .select()
        .from(responses)
        .where(
          and(
            eq(responses.eventId, event.id),
            eq(responses.wantsReminder, true),
            eq(responses.reminderSent, false)
          )
        );

      for (const guest of guestsNeedingReminders) {
        let emailSent = true;
        let smsSent = true;

        if (guest.email) {
          emailSent = await sendGuestReminderEmail(
            guest.email,
            guest.name || '',
            event.title,
            event.startsAt,
            eventUrl,
            event.location
          );
        }

        if (guest.phone) {
          smsSent = await sendGuestReminderSMS(
            guest.phone,
            guest.name || '',
            event.title,
            event.startsAt,
            eventUrl,
            event.location
          );
        }

        // Mark reminder as sent if at least one method succeeded
        if ((guest.email && emailSent) || (guest.phone && smsSent)) {
          await db
            .update(responses)
            .set({ reminderSent: true })
            .where(eq(responses.id, guest.id));
        }
      }
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
}

// Start reminder check interval (every hour)
export function startReminderScheduler() {
  console.log('Starting reminder scheduler...');
  
  // Check immediately on startup
  checkAndSendReminders();
  
  // Then check every hour
  setInterval(() => {
    checkAndSendReminders();
  }, 60 * 60 * 1000);
}
