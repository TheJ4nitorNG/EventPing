import twilio from 'twilio';

export async function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;

  if (!accountSid || !apiKey || !apiKeySecret) {
    throw new Error('Twilio credentials are missing in environment variables');
  }

  return twilio(apiKey, apiKeySecret, {
    accountSid: accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!phoneNumber) {
    throw new Error('TWILIO_PHONE_NUMBER environment variable is missing');
  }
  return phoneNumber;
}

export async function sendReminderSMS(
  to: string,
  eventTitle: string,
  eventDate: Date,
  yesCount: number,
  noCount: number,
  maybeCount: number,
  organizerUrl: string,
  isDay: "before" | "of"
) {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();
    
    const dateStr = eventDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
    
    const timeLabel = isDay === "before" ? "tomorrow" : "today";
    
    const message = `EventPing Reminder: "${eventTitle}" is ${timeLabel} (${dateStr}). RSVPs: ${yesCount} Yes, ${noCount} No, ${maybeCount} Maybe. View details: ${organizerUrl}`;
    
    await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });
    
    console.log(`Reminder SMS sent to ${to} for event "${eventTitle}"`);
    return true;
  } catch (error) {
    console.error('Failed to send reminder SMS:', error);
    return false;
  }
}

export async function sendGuestReminderSMS(
  to: string,
  guestName: string,
  eventTitle: string,
  eventDate: Date,
  eventUrl: string,
  location?: string | null
) {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();
    
    const dateStr = eventDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
    
    let message = `Hi ${guestName || 'there'}! Reminder: "${eventTitle}" is tomorrow (${dateStr}).`;
    if (location) {
      message += ` Location: ${location}.`;
    }
    message += ` Details: ${eventUrl}`;
    
    await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });
    
    console.log(`Guest reminder SMS sent to ${to} for event "${eventTitle}"`);
    return true;
  } catch (error) {
    console.error('Failed to send guest reminder SMS:', error);
    return false;
  }
}

export async function sendRsvpNotificationSms(
  to: string,
  eventTitle: string,
  responderName: string | null,
  choice: string
): Promise<boolean> {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();
    
    const choiceText = choice === 'yes' ? 'Yes' : choice === 'no' ? 'No' : 'Maybe';
    const displayName = responderName || 'Someone';
    
    const body = `New RSVP for "${eventTitle}": ${displayName} responded ${choiceText}`;

    await client.messages.create({
      body,
      from: fromNumber,
      to: to
    });
    
    console.log(`RSVP notification SMS sent to ${to} for event "${eventTitle}"`);
    return true;
  } catch (error) {
    console.error('Failed to send RSVP notification SMS:', error);
    return false;
  }
}
