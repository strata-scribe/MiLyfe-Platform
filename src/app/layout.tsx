import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'MiLyfe — Your City. Your Life. Your Platform.',
    template: '%s | MiLyfe',
  },
  description: 'Community-owned civic platform. Earn $MLY, govern together, connect with neighbors, access resources.',
  icons: {
    icon: '/favicon.ico',
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
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
