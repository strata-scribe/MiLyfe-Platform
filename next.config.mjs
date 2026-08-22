import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ],
};

export default withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  org: process.env.SENTRY_ORG || 'milyfe',
  project: process.env.SENTRY_PROJECT || 'milyfe-platform',

  // Suppress source map upload logs during build
  silent: !process.env.CI,

  // Upload source maps for better error traces
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry SDK when DSN is not set
  disableLogger: true,

  // Hide source maps from client bundles
  hideSourceMaps: true,

  // Disable Sentry telemetry
  telemetry: false,
});
