import Link from "next/link";

import { Button } from "@components/ui";
import {
  BLOG_BREADCRUMB_HOME,
  BLOG_BREADCRUMB_INDEX,
  BLOG_BREADCRUMB_LABEL,
  BLOG_PATH,
  BLOG_PUBLISHED_LABEL,
  BLOG_UPDATED_LABEL,
  blogUpdatedDate,
  formatBlogDate,
} from "@/lib/blog-copy";
import type { BlogPost } from "@/lib/blog/contract";
import type { BlogMarkdownOrigins } from "@/lib/blog/markdown-urls";
import {
  CTA_BODY,
  CTA_TITLE,
  PRIMARY_CTA_HREF,
  PRIMARY_CTA_LABEL,
  SECONDARY_CTA_HREF,
  SECONDARY_CTA_LABEL,
} from "@/lib/homepage-copy";

import { BlogMarkdown } from "./blog-markdown";

const BREADCRUMB_LINK_CLASS =
  "underline underline-offset-[0.3rem] hover:text-foreground";

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
    <main className="w-full pt-8 pb-12 text-primary lg:pt-14 lg:pb-24">
      <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-8 px-4 lg:px-0">
        <nav
          aria-label={BLOG_BREADCRUMB_LABEL}
          className="text-md text-muted-foreground"
        >
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className={BREADCRUMB_LINK_CLASS}>
                {BLOG_BREADCRUMB_HOME}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={BLOG_PATH} className={BREADCRUMB_LINK_CLASS}>
                {BLOG_BREADCRUMB_INDEX}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li
              aria-current="page"
              className="min-w-0 break-words text-foreground"
            >
              {post.title}
            </li>
          </ol>
        </nav>

        <article className="flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <h1 className="text-[3.2rem] leading-[1.2] font-semibold tracking-[-0.01em] break-words text-primary lg:text-3xl">
              {post.title}
            </h1>
            <p className="text-md leading-[1.556] break-words text-muted-foreground lg:text-lg">
              {post.description}
            </p>
            <p className="text-md text-muted-foreground">
              {BLOG_PUBLISHED_LABEL}{" "}
              <time dateTime={post.publishedAt}>
                {formatBlogDate(post.publishedAt)}
              </time>
              {updatedAt ? (
                <>
                  {" · "}
                  {BLOG_UPDATED_LABEL}{" "}
                  <time dateTime={updatedAt}>{formatBlogDate(updatedAt)}</time>
                </>
              ) : null}
            </p>
          </header>

          {coverUrl ? (
            <div className="aspect-[1200/630] w-full overflow-hidden rounded-xl bg-popover dark:bg-accent">
              {/* Decorative: the API has no alt text for covers. Loaded by the browser from the API origin. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt=""
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          <BlogMarkdown content={post.content} origins={origins} />
        </article>
      </div>

      {/* The same closing panel as the homepage: a bordered panel with no fill. */}
      <section className="mx-auto mt-12 w-full max-w-[120rem] px-4 lg:mt-24 lg:px-10">
        <div className="flex flex-col items-start gap-4 rounded-xl border border-input px-6 py-8 lg:px-14 lg:py-12">
          <h2 className="text-[2.4rem] leading-[1.333] font-semibold text-primary lg:text-[2.8rem]">
            {CTA_TITLE}
          </h2>
          <p className="max-w-[56rem] text-md text-muted-foreground lg:text-lg">
            {CTA_BODY}
          </p>
          <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg">
              <Link href={PRIMARY_CTA_HREF}>{PRIMARY_CTA_LABEL}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-input"
            >
              <Link href={SECONDARY_CTA_HREF}>{SECONDARY_CTA_LABEL}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
