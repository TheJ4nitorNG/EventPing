import twilio from 'twilio';

// Twilio integration - connection:conn_twilio_01KG7N8ZQ533FRN4V1NPWYNSDS
let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret)) {
    throw new Error('Twilio not connected');
  }
  return {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number
  };
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, {
    accountSid: accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
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
