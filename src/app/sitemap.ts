import { MetadataRoute } from 'next';

const BASE_URL = 'https://milyfe-platform.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const mainRoutes = [
    '/',
    '/home',
    '/city',
    '/health',
    '/wallet',
    '/shop',
    '/connect',
    '/media',
    '/learn',
    '/career',
    '/forum',
    '/social',
    '/news',
    '/market',
    '/nav',
    '/auto',
    '/academia',
    '/wiki',
    '/achievements',
    '/tokenomics',
    '/privacy',
    '/transparency',
    '/govern',
    '/guild',
    '/family',
    '/housing',
    '/rideshare',
    '/safety',
    '/rights',
    '/vault',
    '/twin',
    '/dev-portal',
    '/broadcast',
    '/accountability',
    '/record',
    '/apps',
    '/mihome',
  ];

  const financeRoutes = [
    '/finance/circles',
    '/finance/lending',
    '/finance/emergency',
    '/finance/credit',
    '/finance/health-pool',
    '/finance/risk-pool',
    '/finance/coaching',
    '/finance/predatory',
    '/finance/will',
    '/finance/split',
  ];

  const communityRoutes = [
    '/reentry',
    '/shelter',
    '/elders',
    '/youth',
    '/safety-mode',
    '/recovery',
    '/veterans',
    '/access',
    '/immigrant',
    '/parents',
  ];

  const mediaRoutes = [
    '/media/tv',
    '/media/blog',
    '/media/vlog',
    '/media/podcast',
    '/media/radio',
    '/media/analytics',
    '/media/schedule',
  ];

  const mainEntries: MetadataRoute.Sitemap = mainRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const subEntries: MetadataRoute.Sitemap = [
    ...financeRoutes,
    ...communityRoutes,
    ...mediaRoutes,
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...mainEntries, ...subEntries];
}
