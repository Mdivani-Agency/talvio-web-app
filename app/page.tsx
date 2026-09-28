import { homeMetadata } from '@/lib/public-metadata';

import { HomePage } from './home/home-page';
import { HomeShell } from './home/home-shell';

export const metadata = homeMetadata;

export default function AppPage() {
  return (
    <HomeShell>
      <HomePage />
    </HomeShell>
  );
}
