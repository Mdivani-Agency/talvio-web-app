'use client';

import Link from 'next/link';
import { CloudOff } from 'lucide-react';

import { Button } from '@components/ui';
import { BLOG_GO_HOME_LABEL, BLOG_RETRY_LABEL, BLOG_UNAVAILABLE_BODY, BLOG_UNAVAILABLE_TITLE } from '@/lib/blog-copy';

import { BLOG_INDEX_CLASS, BlogIndexHeader } from './views/blog-index-header';
import { BlogStatePanel } from './views/blog-state-panel';
import { PageContainer } from '@components/views';

/** Blog outage view, inside the public shell. The response status comes from the thrown error, not from this view. */
export default function BlogError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageContainer as="main" className={BLOG_INDEX_CLASS}>
      <BlogIndexHeader headingLevel="p" />
      <BlogStatePanel icon={CloudOff} iconClassName="text-destructive" title={BLOG_UNAVAILABLE_TITLE} titleLevel="h1" body={BLOG_UNAVAILABLE_BODY}>
        <Button type="button" size="lg" onClick={reset}>
          {BLOG_RETRY_LABEL}
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link href="/">{BLOG_GO_HOME_LABEL}</Link>
        </Button>
      </BlogStatePanel>
    </PageContainer>
  );
}
