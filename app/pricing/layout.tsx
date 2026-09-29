import { Footer, Header, StickyHeader } from '@components/views';
import { PRICING_PAGE_DESCRIPTION, PRICING_PAGE_TITLE, PRICING_PATH } from '@/lib/pricing-page-copy';
import { publicPageMetadata } from '@/lib/public-metadata';
import { PropsWithChildren } from 'react';

export const metadata = publicPageMetadata(PRICING_PATH, PRICING_PAGE_TITLE, PRICING_PAGE_DESCRIPTION);

export default function PricingLayout({ children }: Readonly<PropsWithChildren>) {
  return (
    <section className="flex min-h-screen flex-col justify-between">
      <StickyHeader size="large" />
      <Header size="large" className="absolute z-50 shadow-sm" />
      {children}
      <Footer />
    </section>
  );
}
