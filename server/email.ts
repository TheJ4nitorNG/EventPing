import { Resend } from 'resend';

// Resend integration - connection:conn_resend_01KF6XAQBFG8W2MYNRF1P6XS8K
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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

export async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendReminderEmail(
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
    const { client, fromEmail } = await getResendClient();
    
    const subject = isDay === "before" 
      ? `Reminder: "${eventTitle}" is tomorrow!`
      : `Today's the day: "${eventTitle}"`;
    
    const dateStr = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
    
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">${subject}</h1>
        <p>Here's the RSVP summary for <strong>${eventTitle}</strong>:</p>
        <p style="color: #666;">Scheduled for: ${dateStr}</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Response Summary</h3>
          <p style="font-size: 18px; margin: 8px 0;">
            <span style="color: #22c55e;">✓ Yes: ${yesCount}</span> &nbsp;|&nbsp;
            <span style="color: #ef4444;">✗ No: ${noCount}</span> &nbsp;|&nbsp;
            <span style="color: #eab308;">? Maybe: ${maybeCount}</span>
          </p>
          <p><strong>Total responses: ${yesCount + noCount + maybeCount}</strong></p>
        </div>
        
        <p>
          <a href="${organizerUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View All Responses
          </a>
        </p>
        
        <p style="color: #888; font-size: 12px; margin-top: 30px;">
          This reminder was sent by EventPing.
        </p>
      </div>
    `;
    
    await client.emails.send({
      from: fromEmail || 'EventPing <onboarding@resend.dev>',
      to: [to],
      subject,
      html
    });
    
    console.log(`Reminder email sent to ${to} for event "${eventTitle}"`);
    return true;
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    return false;
  }
}

export async function sendGuestReminderEmail(
  to: string,
  guestName: string,
  eventTitle: string,
  eventDate: Date,
  eventUrl: string,
  location?: string | null
) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const subject = `Reminder: "${eventTitle}" is tomorrow!`;
    
    const dateStr = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
    
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">${subject}</h1>
        <p>Hi ${guestName || 'there'},</p>
        <p>Just a friendly reminder that <strong>${eventTitle}</strong> is happening tomorrow!</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Event Details</h3>
          <p><strong>When:</strong> ${dateStr}</p>
          ${location ? `<p><strong>Where:</strong> ${location}</p>` : ''}
        </div>
        
        <p>
          <a href="${eventUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Event
          </a>
        </p>
        
        <p style="color: #888; font-size: 12px; margin-top: 30px;">
          This reminder was sent by EventPing because you signed up for it.
        </p>
      </div>
    `;
    
    await client.emails.send({
      from: fromEmail || 'EventPing <onboarding@resend.dev>',
      to: [to],
      subject,
      html
    });
    
    console.log(`Guest reminder email sent to ${to} for event "${eventTitle}"`);
    return true;
  } catch (error) {
    console.error('Failed to send guest reminder email:', error);
    return false;
  }
}

export async function sendRsvpNotificationEmail(
  to: string,
  eventTitle: string,
  responderName: string | null,
  choice: string,
  comment: string | null,
  organizerUrl: string
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const choiceEmoji = choice === 'yes' ? '✓' : choice === 'no' ? '✗' : '?';
    const choiceText = choice === 'yes' ? 'Yes' : choice === 'no' ? 'No' : 'Maybe';
    const displayName = responderName || 'Someone';
    
    const subject = `New RSVP: ${displayName} responded ${choiceText} to "${eventTitle}"`;
    
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">New RSVP for ${eventTitle}</h2>
        
        <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 10px 0; font-size: 16px;">
            <strong>${displayName}</strong> responded: 
            <span style="color: ${choice === 'yes' ? '#22c55e' : choice === 'no' ? '#ef4444' : '#f59e0b'}; font-weight: bold;">
              ${choiceEmoji} ${choiceText}
            </span>
          </p>
          ${comment ? `<p style="margin: 10px 0 0 0; color: #666; font-style: italic;">"${comment}"</p>` : ''}
        </div>
        
        <p style="margin: 20px 0;">
          <a href="${organizerUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View All Responses
          </a>
        </p>
        
        <p style="color: #666; font-size: 14px;">
          You're receiving this because someone responded to your event on EventPing.
        </p>
      </div>
    `;

    await client.emails.send({
      from: fromEmail,
      to,
      subject,
      html
    });
    
    console.log(`RSVP notification email sent to ${to} for event "${eventTitle}"`);
    return true;
  } catch (error) {
    console.error('Failed to send RSVP notification email:', error);
    return false;
  }
}
