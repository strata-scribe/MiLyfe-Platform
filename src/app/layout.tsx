import type { Metadata, Viewport } from 'next';
import './globals.css';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://milyfe-platform.vercel.app';

export const metadata: Metadata = {
  title: {
    default: 'MiLyfe — Your City. Your Life. Your Platform.',
    template: '%s | MiLyfe',
  },
  description: 'Community-owned civic platform. Earn $MLY, govern together, connect with neighbors, access resources. No ads. No algorithms. Just people.',
  metadataBase: new URL(BASE_URL),
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'MiLyfe',
    title: 'MiLyfe — Your City. Your Life. Your Platform.',
    description: 'Community-owned civic platform powered by $MLY community currency. Free. Open source. People-powered.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MiLyfe — Your City. Your Life. Your Platform.',
    description: 'Community-owned civic platform. Earn $MLY, govern together, connect with neighbors.',
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1e3a6e' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1b33' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
