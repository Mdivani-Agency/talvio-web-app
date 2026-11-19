import Link from 'next/link';
import { Newspaper } from 'lucide-react';

import { Button } from '@components/ui';
import { BLOG_EMPTY_BODY, BLOG_EMPTY_HEADING, BLOG_PAGE_DESCRIPTION, BLOG_PAGE_TITLE, BLOG_PATH } from '@/lib/blog-copy';
import { blogAssetUrl, getBlogPosts } from '@/lib/blog/reader';
import { PRIMARY_CTA_HREF, PRIMARY_CTA_LABEL, SECONDARY_CTA_HREF, SECONDARY_CTA_LABEL } from '@/lib/homepage-copy';
import { publicPageMetadata, SHARE_IMAGE_BLOG } from '@/lib/public-metadata';

import { BlogUnavailableError } from './blog-unavailable';
import { BLOG_INDEX_CLASS, BlogIndexHeader } from './views/blog-index-header';
import { BlogPostList } from './views/blog-post-list';
import { BlogStatePanel } from './views/blog-state-panel';
import { PageContainer } from '@components/views';

// Rendered per request through the cached reader: no ISR, so no rendered HTML outlives the 300 s freshness budget.
export const dynamic = 'force-dynamic';

export const metadata = publicPageMetadata(BLOG_PATH, BLOG_PAGE_TITLE, BLOG_PAGE_DESCRIPTION, SHARE_IMAGE_BLOG);

export default async function BlogPage() {
  const result = await getBlogPosts();
  if (result.status === 'unavailable') {
    // Never an empty blog on an outage. The error reaches the route's error boundary with a non-200 status.
    throw new BlogUnavailableError(result.reason);
  }
  const posts = result.status === 'ok' ? result.data : [];

  return (
    <PageContainer as="main" className={BLOG_INDEX_CLASS}>
      <BlogIndexHeader />

      {posts.length > 0 ? (
        <BlogPostList posts={posts} coverUrl={(post) => (post.coverImagePath ? blogAssetUrl(post.coverImagePath) : null)} />
      ) : (
        <BlogStatePanel
          icon={Newspaper}
          iconClassName="text-secondary dark:text-secondary-hover"
          title={BLOG_EMPTY_HEADING}
          titleLevel="h2"
          body={BLOG_EMPTY_BODY}
        >
          <Button asChild size="lg">
            <Link href={PRIMARY_CTA_HREF}>{PRIMARY_CTA_LABEL}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-input">
            <Link href={SECONDARY_CTA_HREF}>{SECONDARY_CTA_LABEL}</Link>
          </Button>
        </BlogStatePanel>
      )}
    </PageContainer>
  );
}
