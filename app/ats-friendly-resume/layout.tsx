import { PublicShell } from '@components/views';
import { ATS_PATH } from '@/lib/ats-page-copy';
import { ATS_DESCRIPTION, ATS_TITLE, publicPageMetadata } from '@/lib/public-metadata';
import { PropsWithChildren } from 'react';

export const metadata = publicPageMetadata(ATS_PATH, ATS_TITLE, ATS_DESCRIPTION);

export default function AtsFriendlyResumeLayout({ children }: Readonly<PropsWithChildren>) {
  return <PublicShell>{children}</PublicShell>;
}
