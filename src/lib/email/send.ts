import { Resend } from 'resend';
import { render } from '@react-email/render';

/**
 * Email sending — supports SMTP (Mailpit/Postal) and Resend.
 * Uses SMTP when SMTP_HOST is set, falls back to Resend.
 * 
 * Mailpit UI: http://localhost:8025 (see all sent emails)
 */

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '1025');
const SMTP_FROM = process.env.SMTP_FROM || 'MiLyfe <noreply@milyfe.fun>';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export async function sendEmail({ to, subject, react, from, replyTo, tags }: SendEmailOptions) {
  const fromAddress = from || SMTP_FROM;
  const recipients = Array.isArray(to) ? to : [to];

  // If SMTP is configured (Mailpit/Postal), use it
  if (SMTP_HOST) {
    try {
      const html = await render(react);
      const net = await import('net');
      
      return new Promise<{ success: boolean; error?: any }>((resolve) => {
        const socket = net.createConnection(SMTP_PORT, SMTP_HOST, () => {
          const commands = [
            `EHLO milyfe.fun\r\n`,
            `MAIL FROM:<${fromAddress.match(/<(.+)>/)?.[1] || 'noreply@milyfe.fun'}>\r\n`,
            ...recipients.map(r => `RCPT TO:<${r}>\r\n`),
            `DATA\r\n`,
            `From: ${fromAddress}\r\nTo: ${recipients.join(', ')}\r\nSubject: ${subject}\r\nContent-Type: text/html; charset=utf-8\r\nMIME-Version: 1.0\r\n\r\n${html}\r\n.\r\n`,
            `QUIT\r\n`,
          ];
          let cmdIndex = 0;
          socket.on('data', () => {
            if (cmdIndex < commands.length) {
              socket.write(commands[cmdIndex++]);
            }
          });
          socket.on('end', () => resolve({ success: true }));
          socket.on('error', (err) => resolve({ success: false, error: err }));
        });
        socket.on('error', (err) => resolve({ success: false, error: err }));
      });
    } catch (err) {
      console.error('[MiLyfe Email] SMTP failed:', err);
      return { success: false, error: err };
    }
  }

  // Fallback to Resend
  if (!resend) {
    console.warn('[MiLyfe Email] No email provider configured (set SMTP_HOST or RESEND_API_KEY)');
    return { success: false, error: 'No email provider configured' };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: from || 'MiLyfe <noreply@milyfe.fun>',
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
      replyTo,
      tags,
    });

    if (error) {
      console.error('[MiLyfe Email] Send failed:', error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[MiLyfe Email] Exception:', err);
    return { success: false, error: err };
  }
}

/**
 * Send welcome email to new user.
 */
export async function sendWelcomeEmail(email: string, name: string, city?: string) {
  const { WelcomeEmail } = await import('./templates');
  return sendEmail({
    to: email,
    subject: `Welcome to MiLyfe, ${name}! 🎉`,
    react: WelcomeEmail({ name, city }),
    tags: [{ name: 'type', value: 'welcome' }],
  });
}

/**
 * Send transaction notification.
 */
export async function sendTransactionEmail(
  email: string,
  name: string,
  type: 'received' | 'sent' | 'earned',
  amount: number,
  details?: { from?: string; to?: string; reason?: string }
) {
  const { TransactionEmail } = await import('./templates');
  return sendEmail({
    to: email,
    subject: type === 'earned' ? `You earned $${amount} MLY! 🏆` : `$MLY Transaction: ${type === 'received' ? '+' : '-'}$${amount}`,
    react: TransactionEmail({ name, type, amount, ...details }),
    tags: [{ name: 'type', value: 'transaction' }],
  });
}

/**
 * Send emergency alert email.
 */
export async function sendAlertEmail(
  emails: string[],
  alertType: string,
  message: string,
  location?: string
) {
  const { AlertEmail } = await import('./templates');
  // Batch send — Resend supports up to 100 recipients
  return sendEmail({
    to: emails,
    subject: `⚠️ ${alertType}: ${message.substring(0, 50)}`,
    react: AlertEmail({ name: 'Community Member', alertType, message, location }),
    tags: [{ name: 'type', value: 'alert' }],
  });
}
