import { Header, StickyHeader, Footer } from '@components/views';
import { PRIVACY_DESCRIPTION, PRIVACY_TITLE, publicPageMetadata } from '@/lib/public-metadata';
import { PropsWithChildren } from 'react';

export const metadata = publicPageMetadata('/privacy-policy', PRIVACY_TITLE, PRIVACY_DESCRIPTION);

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
