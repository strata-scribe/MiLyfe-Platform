/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://milyfe-platform.vercel.app',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: [
    '/api/*',
    '/auth/*',
    '/safety-mode', // Protect DV survivors from search indexing
  ],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/api/', '/auth/', '/safety-mode'] },
    ],
    additionalSitemaps: [],
  },
  transform: async (config, path) => {
    // Higher priority for main routes
    const highPriority = ['/', '/home', '/forum', '/market', '/news', '/social', '/learn'];
    const medPriority = ['/media', '/finance', '/wallet', '/city', '/mihome'];

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: highPriority.includes(path) ? 1.0 : medPriority.some(p => path.startsWith(p)) ? 0.8 : 0.7,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
