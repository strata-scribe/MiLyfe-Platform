import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://milyfe-platform.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/login',
    '/signup',
  ];

  const platformRoutes = [
    '/home',
    '/connect',
    '/wallet',
    '/rewards',
    '/standing',
    '/governance',
    '/news',
    '/forum',
    '/health',
    '/wiki',
    '/profile',
    '/apps',
    '/bounties',
    '/onboarding',
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${BASE_URL}${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1 : 0.8,
    })),
    ...platformRoutes.map((route) => ({
      url: `${BASE_URL}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ];
}
