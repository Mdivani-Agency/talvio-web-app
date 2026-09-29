import { Footer, Header, StickyHeader } from '@components/views';
import { ATS_PAGE_DESCRIPTION, ATS_PAGE_TITLE, ATS_PATH } from '@/lib/ats-page-copy';
import { publicPageMetadata } from '@/lib/public-metadata';
import { PropsWithChildren } from 'react';

export const metadata = publicPageMetadata(ATS_PATH, ATS_PAGE_TITLE, ATS_PAGE_DESCRIPTION);

export default function AtsFriendlyResumeLayout({ children }: Readonly<PropsWithChildren>) {
  return (
    <section className="flex min-h-screen flex-col justify-between">
      <StickyHeader size="large" />
      <Header size="large" className="absolute z-50 shadow-sm" />
      {children}
      <Footer />
    </section>
  );
}
