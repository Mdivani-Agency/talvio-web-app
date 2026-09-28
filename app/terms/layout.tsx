import { Header, StickyHeader, Footer } from '@components/views';
import { publicPageMetadata, TERMS_DESCRIPTION, TERMS_TITLE } from '@/lib/public-metadata';
import { PropsWithChildren } from 'react';

export const metadata = publicPageMetadata('/terms', TERMS_TITLE, TERMS_DESCRIPTION);

export default function PrivacyPolicyLayout({ children }: Readonly<PropsWithChildren>) {
  return (
    <section className={'flex h-screen flex-col justify-between'}>
      <StickyHeader size="large" />
      <Header size="large" className={'absolute z-50 shadow-sm'} />
      {children}
      <Footer />
    </section>
  );
}
