import { homeMetadata } from '@/lib/public-metadata';

import { HomeShell } from './home-shell';

export const metadata = homeMetadata;

export default function LandingPage({ children }: { children: React.ReactNode }) {
  return <HomeShell>{children}</HomeShell>;
}
