import { PublicShell } from '@components/views';
import { BLOG_PAGE_DESCRIPTION, BLOG_PAGE_TITLE, BLOG_PATH } from '@/lib/blog-copy';
import { publicPageMetadata } from '@/lib/public-metadata';
import { PropsWithChildren } from 'react';

// Index metadata only. Article metadata, canonical policy and structured data belong to MDI-278.
export const metadata = publicPageMetadata(BLOG_PATH, BLOG_PAGE_TITLE, BLOG_PAGE_DESCRIPTION);

export default function BlogLayout({ children }: Readonly<PropsWithChildren>) {
  return <PublicShell>{children}</PublicShell>;
}
