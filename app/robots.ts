import type { MetadataRoute } from 'next';

import { PRIVATE_ROBOTS_PREFIXES } from '@/lib/public-metadata';
import { siteOrigin } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...PRIVATE_ROBOTS_PREFIXES],
    },
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
