import { PublicShell } from '@components/views';
import { PropsWithChildren } from 'react';

// Metadata lives on each page, not here, so article and not-found pages never inherit the index's canonical.
export default function BlogLayout({ children }: Readonly<PropsWithChildren>) {
  return <PublicShell>{children}</PublicShell>;
}
