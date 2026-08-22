import { Resend } from 'resend';

/**
 * Resend email client — sends transactional emails using React Email templates.
 * 
 * Usage:
 * ```ts
 * import { sendEmail } from '@/lib/email/send';
 * import { WelcomeEmail } from '@/lib/email/templates';
 * 
 * await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome to MiLyfe!',
 *   react: WelcomeEmail({ name: 'John' }),
 * });
 * ```
 */

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export async function sendEmail({ to, subject, react, from, replyTo, tags }: SendEmailOptions) {
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
