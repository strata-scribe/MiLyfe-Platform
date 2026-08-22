import * as React from 'react';

/**
 * MiLyfe Email Templates — Built with React for use with Resend.
 * These render to HTML via @react-email/render on the server side.
 * 
 * Usage in API routes:
 * ```ts
 * import { render } from '@react-email/render';
 * import { WelcomeEmail } from '@/lib/email/templates';
 * import { resend } from '@/lib/email/client';
 * 
 * const html = await render(<WelcomeEmail name="John" />);
 * await resend.emails.send({ to, subject, html });
 * ```
 */

// ═══════════════════════════════════════════════════════════
// Shared Layout
// ═══════════════════════════════════════════════════════════

function EmailLayout({ children, preview }: { children: React.ReactNode; preview?: string }) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {preview && <meta name="description" content={preview} />}
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f8fafc', fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif" }}>
        {preview && <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>{preview}</div>}
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#f8fafc' }}>
          <tr>
            <td align="center" style={{ padding: '40px 20px' }}>
              <table width="100%" cellPadding="0" cellSpacing="0" style={{ maxWidth: '560px', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                {/* Header */}
                <tr>
                  <td style={{ backgroundColor: '#1e3a6e', padding: '24px 32px', textAlign: 'center' as const }}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff' }}>MiLyfe</span>
                    <span style={{ fontSize: '12px', color: '#00C1AE', display: 'block', marginTop: '4px' }}>Community Platform</span>
                  </td>
                </tr>
                {/* Content */}
                <tr>
                  <td style={{ padding: '32px' }}>
                    {children}
                  </td>
                </tr>
                {/* Footer */}
                <tr>
                  <td style={{ backgroundColor: '#f1f5f9', padding: '20px 32px', textAlign: 'center' as const, borderTop: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      MiLyfe Platform — Community-powered, people-first.
                    </p>
                    <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                      You received this because you&apos;re a MiLyfe community member.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

function EmailButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0">
      <tr>
        <td align="center" style={{ padding: '24px 0' }}>
          <a
            href={href}
            style={{
              display: 'inline-block',
              backgroundColor: '#00C1AE',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 'bold',
              textDecoration: 'none',
              padding: '12px 32px',
              borderRadius: '8px',
            }}
          >
            {children}
          </a>
        </td>
      </tr>
    </table>
  );
}

// ═══════════════════════════════════════════════════════════
// Welcome Email
// ═══════════════════════════════════════════════════════════

interface WelcomeEmailProps {
  name: string;
  city?: string;
}

export function WelcomeEmail({ name, city = 'Jacksonville' }: WelcomeEmailProps) {
  return (
    <EmailLayout preview={`Welcome to MiLyfe, ${name}! Your community awaits.`}>
      <h1 style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: 'bold', color: '#1e3a6e' }}>
        Welcome to MiLyfe, {name}! 🎉
      </h1>
      <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
        You&apos;re now part of the {city} community. MiLyfe is where neighbors connect, support each other, and build together — no corporations, no middlemen.
      </p>
      <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
        Here&apos;s what you can do right now:
      </p>
      <ul style={{ margin: '0 0 16px', padding: '0 0 0 20px', fontSize: '14px', color: '#334155', lineHeight: '1.8' }}>
        <li><strong>Earn $MLY</strong> by completing courses and helping neighbors</li>
        <li><strong>Join the forum</strong> to meet your community</li>
        <li><strong>Set up MiHome</strong> to manage your household</li>
        <li><strong>Browse the market</strong> for local goods and services</li>
      </ul>
      <EmailButton href="https://milyfe-platform.vercel.app/home">
        Get Started →
      </EmailButton>
      <p style={{ margin: '16px 0 0', fontSize: '12px', color: '#64748b' }}>
        Your starting balance: <strong style={{ color: '#FFC107' }}>10 $MLY</strong> — earn more by participating!
      </p>
    </EmailLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// Notification Email
// ═══════════════════════════════════════════════════════════

interface NotificationEmailProps {
  name: string;
  title: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
}

export function NotificationEmail({ name, title, body, actionUrl, actionLabel }: NotificationEmailProps) {
  return (
    <EmailLayout preview={title}>
      <h1 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 'bold', color: '#1e3a6e' }}>
        {title}
      </h1>
      <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#64748b' }}>Hi {name},</p>
      <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
        {body}
      </p>
      {actionUrl && (
        <EmailButton href={actionUrl}>
          {actionLabel || 'View Now'}
        </EmailButton>
      )}
    </EmailLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// MLY Transaction Email
// ═══════════════════════════════════════════════════════════

interface TransactionEmailProps {
  name: string;
  type: 'received' | 'sent' | 'earned';
  amount: number;
  from?: string;
  to?: string;
  reason?: string;
}

export function TransactionEmail({ name, type, amount, from, to, reason }: TransactionEmailProps) {
  const titles = {
    received: `You received $${amount} MLY`,
    sent: `You sent $${amount} MLY`,
    earned: `You earned $${amount} MLY! 🏆`,
  };

  return (
    <EmailLayout preview={titles[type]}>
      <h1 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 'bold', color: '#1e3a6e' }}>
        {titles[type]}
      </h1>
      <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '20px', textAlign: 'center' as const, margin: '0 0 16px' }}>
        <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#d97706' }}>
          {type === 'sent' ? '-' : '+'}${amount} MLY
        </p>
        {reason && <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#92400e' }}>{reason}</p>}
      </div>
      <table width="100%" cellPadding="0" cellSpacing="0" style={{ fontSize: '13px', color: '#475569' }}>
        {from && (
          <tr>
            <td style={{ padding: '6px 0' }}>From:</td>
            <td style={{ padding: '6px 0', textAlign: 'right' as const, fontWeight: 'bold' }}>{from}</td>
          </tr>
        )}
        {to && (
          <tr>
            <td style={{ padding: '6px 0' }}>To:</td>
            <td style={{ padding: '6px 0', textAlign: 'right' as const, fontWeight: 'bold' }}>{to}</td>
          </tr>
        )}
      </table>
      <EmailButton href="https://milyfe-platform.vercel.app/wallet">
        View Wallet →
      </EmailButton>
    </EmailLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// Newsletter / Blog Digest Email
// ═══════════════════════════════════════════════════════════

interface NewsletterEmailProps {
  name: string;
  posts: { title: string; excerpt: string; slug: string; author: string }[];
}

export function NewsletterEmail({ name, posts }: NewsletterEmailProps) {
  return (
    <EmailLayout preview={`${posts.length} new posts from your MiLyfe community`}>
      <h1 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 'bold', color: '#1e3a6e' }}>
        Community Digest 📰
      </h1>
      <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>
        Hey {name}, here&apos;s what&apos;s new from your community:
      </p>
      {posts.map((post, i) => (
        <div key={i} style={{ borderBottom: i < posts.length - 1 ? '1px solid #e2e8f0' : 'none', padding: '16px 0' }}>
          <a href={`https://milyfe-platform.vercel.app/media/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 'bold', color: '#1e3a6e' }}>
              {post.title}
            </h3>
          </a>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
            {post.excerpt}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>By {post.author}</p>
        </div>
      ))}
      <EmailButton href="https://milyfe-platform.vercel.app/media/blog">
        Read More →
      </EmailButton>
    </EmailLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// Emergency Alert Email
// ═══════════════════════════════════════════════════════════

interface AlertEmailProps {
  name: string;
  alertType: string;
  message: string;
  location?: string;
}

export function AlertEmail({ name, alertType, message, location }: AlertEmailProps) {
  return (
    <EmailLayout preview={`⚠️ ${alertType}: ${message}`}>
      <div style={{ backgroundColor: '#fef2f2', border: '2px solid #fecaca', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>
          ⚠️ {alertType}
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#991b1b', lineHeight: '1.5' }}>
          {message}
        </p>
        {location && (
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#b91c1c' }}>
            📍 {location}
          </p>
        )}
      </div>
      <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#475569' }}>
        Hi {name}, this alert was issued for your community. Stay safe and follow any instructions from local authorities.
      </p>
      <EmailButton href="https://milyfe-platform.vercel.app/broadcast">
        View All Alerts →
      </EmailButton>
    </EmailLayout>
  );
}
