import type { MetadataRoute } from 'next';

import { INDEXABLE_PUBLIC_PATHS } from '@/lib/public-metadata';
import { siteOrigin } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return INDEXABLE_PUBLIC_PATHS.map((path) => ({
    url: path === '/' ? origin : `${origin}${path}`,
  }));
}
