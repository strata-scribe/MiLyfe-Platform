import type { Metadata, Viewport } from 'next';
import { ServiceWorkerRegister } from '@/components/shell/sw-register';
import './globals.css';

export const metadata: Metadata = {
  title: 'MiLyfe — Your City. Your Life. Your Platform.',
  description: 'The decentralized civic engagement platform. Report issues, earn $MLY, vote on change, connect with neighbors, access resources.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'MiLyfe — Your City. Your Life. Your Platform.',
    description: 'Civic engagement powered by $MLY community currency. Free. Community-owned. People-powered.',
    images: ['/logo.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1e3a6e',
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
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
