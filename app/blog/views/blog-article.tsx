import Link from 'next/link';

import { Button, Card } from '@components/ui';
import {
  BLOG_BREADCRUMB_HOME,
  BLOG_BREADCRUMB_INDEX,
  BLOG_BREADCRUMB_LABEL,
  BLOG_PATH,
  BLOG_PUBLISHED_LABEL,
  BLOG_UPDATED_LABEL,
  blogUpdatedDate,
  formatBlogDate,
} from '@/lib/blog-copy';
import type { BlogPost } from '@/lib/blog/contract';
import type { BlogMarkdownOrigins } from '@/lib/blog/markdown-urls';
import {
  CTA_BODY,
  CTA_TITLE,
  PRIMARY_CTA_HREF,
  PRIMARY_CTA_LABEL,
  SECONDARY_CTA_HREF,
  SECONDARY_CTA_LABEL,
} from '@/lib/homepage-copy';

import { BlogMarkdown } from './blog-markdown';

type BlogArticleProps = {
  post: BlogPost;
  origins: BlogMarkdownOrigins;
  /** Absolute cover URL, or `null` to render without one. */
  coverUrl: string | null;
};

/** One article, fully server-rendered: the body is in the HTML without client JavaScript. */
export function BlogArticle({ post, origins, coverUrl }: BlogArticleProps) {
  const updatedAt = blogUpdatedDate(post);
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 pb-12 pt-24 text-primary lg:px-6">
      <nav aria-label={BLOG_BREADCRUMB_LABEL} className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="underline-offset-4 hover:underline">
              {BLOG_BREADCRUMB_HOME}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={BLOG_PATH} className="underline-offset-4 hover:underline">
              {BLOG_BREADCRUMB_INDEX}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="min-w-0 break-words text-primary">
            {post.title}
          </li>
        </ol>
      </nav>

      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold break-words">{post.title}</h1>
          <p className="text-lg break-words text-muted-foreground">{post.description}</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              {BLOG_PUBLISHED_LABEL} <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
            </span>
            {updatedAt ? (
              <span>
                {BLOG_UPDATED_LABEL} <time dateTime={updatedAt}>{formatBlogDate(updatedAt)}</time>
              </span>
            ) : null}
          </p>
        </header>

        {coverUrl ? (
          <div className="aspect-[1200/630] w-full overflow-hidden rounded-lg bg-muted">
            {/* Decorative: the API has no alt text for covers. Loaded by the browser from the API origin. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="" decoding="async" className="h-full w-full object-cover" />
          </div>
        ) : null}

        <BlogMarkdown content={post.content} origins={origins} />
      </article>

      <Card className="flex flex-col gap-4 p-6">
        <h2 className="text-xl font-semibold">{CTA_TITLE}</h2>
        <p className="text-md text-muted-foreground">{CTA_BODY}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild size="lg">
            <Link href={PRIMARY_CTA_HREF}>{PRIMARY_CTA_LABEL}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={SECONDARY_CTA_HREF}>{SECONDARY_CTA_LABEL}</Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}
