import { PublicShell } from '@components/views';
import { PRICING_PAGE_DESCRIPTION, PRICING_PAGE_TITLE, PRICING_PATH } from '@/lib/pricing-page-copy';
import { publicPageMetadata } from '@/lib/public-metadata';
import { PUBLIC_PAGE_LINKS, withCurrentPage } from '@/lib/public-nav';
import { PropsWithChildren } from 'react';

export const metadata = publicPageMetadata(PRICING_PATH, PRICING_PAGE_TITLE, PRICING_PAGE_DESCRIPTION);

export default function PricingLayout({ children }: Readonly<PropsWithChildren>) {
  return <PublicShell links={withCurrentPage(PUBLIC_PAGE_LINKS, PRICING_PATH)}>{children}</PublicShell>;
}
