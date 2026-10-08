import { homeMetadata } from '@/lib/public-metadata';
import { homeStructuredData, serializeJsonLd } from '@/lib/structured-data';

import { HomePage } from './home/home-page';
import { HomeShell } from './home/home-shell';

export const metadata = homeMetadata;

export default function AppPage() {
  return (
    <HomeShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(homeStructuredData()) }} />
      <HomePage />
    </HomeShell>
  );
}
