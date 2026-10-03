import { PublicShell } from '@components/views';
import { ATS_PAGE_DESCRIPTION, ATS_PAGE_TITLE, ATS_PATH } from '@/lib/ats-page-copy';
import { publicPageMetadata } from '@/lib/public-metadata';
import { PropsWithChildren } from 'react';

export const metadata = publicPageMetadata(ATS_PATH, ATS_PAGE_TITLE, ATS_PAGE_DESCRIPTION);

export default function AtsFriendlyResumeLayout({ children }: Readonly<PropsWithChildren>) {
  return <PublicShell>{children}</PublicShell>;
}
