import { Header, StickyHeader, Footer } from '@components/views';
import { PropsWithChildren } from 'react';

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
