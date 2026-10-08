import { PublicShell } from '@components/views';
import { publicPageMetadata, TERMS_DESCRIPTION, TERMS_TITLE } from '@/lib/public-metadata';
import { PropsWithChildren } from 'react';

export const metadata = publicPageMetadata('/terms', TERMS_TITLE, TERMS_DESCRIPTION);

export default function TermsLayout({ children }: Readonly<PropsWithChildren>) {
  return <PublicShell>{children}</PublicShell>;
}
