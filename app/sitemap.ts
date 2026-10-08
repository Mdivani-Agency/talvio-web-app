import type { MetadataRoute } from 'next';

import { publicSitemap } from '@/lib/public-metadata';

export default function sitemap(): MetadataRoute.Sitemap {
  return publicSitemap();
}
