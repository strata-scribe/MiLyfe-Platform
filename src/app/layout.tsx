import type { Metadata, Viewport } from 'next';
import { ServiceWorkerRegister } from '@/components/shell/sw-register';
import './globals.css';

export const metadata: Metadata = {
  title: 'MiLyfe — Your City. Your Life. Your Platform.',
  description: 'The decentralized civic engagement platform connecting communities through mutual aid, health, commerce, and governance.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
      </head>
      <body className="font-sans antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
