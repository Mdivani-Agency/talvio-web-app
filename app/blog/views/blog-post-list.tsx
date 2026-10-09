import Image from 'next/image';
import Link from 'next/link';

import { Card } from '@components/ui/card';
import { BLOG_PUBLISHED_LABEL, blogPostPath, formatBlogDate } from '@/lib/blog-copy';
import type { BlogPostSummary } from '@/lib/blog/contract';

type BlogPostListProps = {
  posts: BlogPostSummary[];
  /** Absolute cover URL for a post, or `null` to show the card without an image. */
  coverUrl: (post: BlogPostSummary) => string | null;
};

/**
 * Every post in the order given, each with a plain link so the whole list is crawlable without JavaScript. The
 * `featured` flag is the agency site's presentation choice and is not used here, so no post is shown twice or hidden.
 */
export function BlogPostList({ posts, coverUrl }: BlogPostListProps) {
  return (
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => {
        const cover = coverUrl(post);
        return (
          <li key={post.slug} className="min-w-0">
            <Card className="relative h-full gap-0 overflow-hidden py-0 focus-within:ring-2 focus-within:ring-ring">
              {cover ? (
                <div className="relative aspect-[1200/630] w-full bg-muted">
                  {/* Decorative: the title is the link text. Covers come from the API origin and are not optimised here. */}
                  <Image src={cover} alt="" fill unoptimized sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
                </div>
              ) : null}
              <div className="flex flex-col gap-3 p-6">
                <h2 className="text-lg font-semibold break-words text-primary">
                  <Link href={blogPostPath(post.slug)} className="after:absolute after:inset-0 focus-visible:outline-none">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-md break-words text-muted-foreground">{post.description}</p>
                <p className="text-sm text-muted-foreground">
                  <span className="sr-only">{BLOG_PUBLISHED_LABEL} </span>
                  <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
                </p>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
