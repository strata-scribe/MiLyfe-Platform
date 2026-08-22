import { type Metadata } from 'next';

const BASE_URL = 'https://milyfe-platform.vercel.app';
const SITE_NAME = 'MiLyfe Platform';
const DEFAULT_DESCRIPTION = 'Community-powered platform for mutual aid, civic engagement, and collective prosperity. No corporations. No middlemen. Just people helping people.';

/**
 * SEO metadata helper — generates consistent meta tags across all pages.
 * 
 * Usage in page.tsx (Server Component):
 * ```ts
 * import { generateMetadata } from '@/lib/seo/metadata';
 * export const metadata = generateMetadata({ title: 'Forum', description: '...' });
 * ```
 * 
 * Or for dynamic pages:
 * ```ts
 * export async function generateMetadata({ params }) {
 *   const post = await fetchPost(params.id);
 *   return seoMeta({ title: post.title, description: post.excerpt, image: post.cover });
 * }
 * ```
 */
export function seoMeta({
  title,
  description,
  image,
  path,
  type = 'website',
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  type?: 'website' | 'article' | 'profile';
  noIndex?: boolean;
}): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullDescription = description || DEFAULT_DESCRIPTION;
  const url = path ? `${BASE_URL}${path}` : BASE_URL;
  const ogImage = image || `${BASE_URL}/og-default.png`;

  return {
    title: fullTitle,
    description: fullDescription,
    ...(noIndex && { robots: { index: false, follow: false } }),
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url,
      siteName: SITE_NAME,
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * JSON-LD structured data for rich search results.
 */
export function jsonLd(data: Record<string, any>) {
  return {
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      ...data,
    }),
  };
}

/**
 * Article structured data for blog posts / news.
 */
export function articleJsonLd({
  title,
  description,
  author,
  publishedAt,
  image,
  url,
}: {
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  image?: string;
  url: string;
}) {
  return jsonLd({
    '@type': 'Article',
    headline: title,
    description,
    author: { '@type': 'Person', name: author },
    datePublished: publishedAt,
    image: image || `${BASE_URL}/og-default.png`,
    url,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
    },
  });
}
