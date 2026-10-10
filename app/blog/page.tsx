import {
  BLOG_EMPTY_BODY,
  BLOG_EMPTY_HEADING,
  BLOG_PAGE_DESCRIPTION,
  BLOG_PAGE_HEADING,
  BLOG_PAGE_INTRO,
  BLOG_PAGE_TITLE,
  BLOG_PATH,
} from '@/lib/blog-copy';
import { blogAssetUrl, getBlogPosts } from '@/lib/blog/reader';
import { publicPageMetadata } from '@/lib/public-metadata';

import { BlogUnavailableError } from './blog-unavailable';
import { BlogPostList } from './views/blog-post-list';

// Rendered per request through the cached reader: no ISR, so no rendered HTML outlives the 300 s freshness budget.
export const dynamic = 'force-dynamic';

export const metadata = publicPageMetadata(BLOG_PATH, BLOG_PAGE_TITLE, BLOG_PAGE_DESCRIPTION);

export default async function BlogPage() {
  const result = await getBlogPosts();
  if (result.status === 'unavailable') {
    // Never an empty blog on an outage. The error reaches the route's error boundary with a non-200 status.
    throw new BlogUnavailableError(result.reason);
  }
  const posts = result.status === 'ok' ? result.data : [];

  return (
    <main className="mx-auto flex w-full max-w-container-3xl flex-col gap-12 px-4 pb-12 pt-24 text-primary lg:px-6">
      <header className="flex max-w-3xl flex-col gap-4">
        <h1 className="text-2xl font-semibold">{BLOG_PAGE_HEADING}</h1>
        <p className="text-lg text-muted-foreground">{BLOG_PAGE_INTRO}</p>
      </header>

      {posts.length > 0 ? (
        <BlogPostList posts={posts} coverUrl={(post) => (post.coverImagePath ? blogAssetUrl(post.coverImagePath) : null)} />
      ) : (
        <section className="flex max-w-3xl flex-col gap-2">
          <h2 className="text-xl font-semibold">{BLOG_EMPTY_HEADING}</h2>
          <p className="text-md text-muted-foreground">{BLOG_EMPTY_BODY}</p>
        </section>
      )}
    </main>
  );
}
