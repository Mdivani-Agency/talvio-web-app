import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card } from "@components/ui";
import {
  BLOG_PUBLISHED_LABEL,
  BLOG_READ_ARTICLE_LABEL,
  blogPostPath,
  formatBlogDate,
} from "@/lib/blog-copy";
import type { BlogPostSummary } from "@/lib/blog/contract";
import { cn } from "@lib/utils";

type BlogPostListProps = {
  posts: BlogPostSummary[];
  /** Absolute cover URL for a post, or `null` to show the card without an image. */
  coverUrl: (post: BlogPostSummary) => string | null;
};

/**
 * Cards use the shared `Card`; the `article` inside is `display: contents`, so it keeps the semantics without adding a
 * box. The title link covers the whole card, so each card is one link named by its title.
 */
const titleLinkClassName =
  "after:absolute after:inset-0 after:rounded-[inherit] focus-visible:outline-none hover:underline hover:underline-offset-[0.3rem]";
const cardFocusClassName =
  "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background";

/** Dates, descriptions and Read article stay at 16px: public pages keep text at 16px or more (PUB-07). */
function PublishedDate({ iso }: { iso: string }) {
  return (
    <p className="text-md text-muted-foreground">
      <span className="sr-only">{BLOG_PUBLISHED_LABEL} </span>
      <time dateTime={iso}>{formatBlogDate(iso)}</time>
    </p>
  );
}

/** Decorative: the title is the link text. Covers come from the API origin and are not optimised here. */
function Cover({
  src,
  sizes,
  className,
}: {
  src: string;
  sizes: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[1200/630] w-full overflow-hidden bg-popover dark:bg-accent",
        className,
      )}
    >
      <Image
        src={src}
        alt=""
        fill
        unoptimized
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}

function LeadCard({
  post,
  cover,
}: {
  post: BlogPostSummary;
  cover: string | null;
}) {
  return (
    <Card
      className={cn(
        "relative grid items-center gap-5 rounded-xl lg:gap-10",
        cover
          ? "p-3 pb-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:p-6"
          : "p-6 lg:px-10 lg:py-8",
        cardFocusClassName,
      )}
    >
      <article className="contents">
        {cover ? (
          <Cover
            src={cover}
            sizes="(min-width: 1024px) 600px, 100vw"
            className="rounded-lg"
          />
        ) : null}
        <div
          className={cn("flex min-w-0 flex-col gap-3", cover && "px-3 lg:px-0")}
        >
          <PublishedDate iso={post.publishedAt} />
          <h2 className="text-[2.2rem] leading-[1.333] font-semibold break-words text-primary lg:text-[2.8rem]">
            <Link href={blogPostPath(post.slug)} className={titleLinkClassName}>
              {post.title}
            </Link>
          </h2>
          <p className="text-md break-words text-muted-foreground">
            {post.description}
          </p>
          <span
            aria-hidden="true"
            className="inline-flex items-center gap-1.5 text-md font-semibold text-secondary dark:text-secondary-hover"
          >
            {BLOG_READ_ARTICLE_LABEL}
            <ArrowRight className="size-[1.6rem]" />
          </span>
        </div>
      </article>
    </Card>
  );
}

function PostCard({
  post,
  cover,
}: {
  post: BlogPostSummary;
  cover: string | null;
}) {
  return (
    <Card
      className={cn(
        "relative h-full gap-0 overflow-hidden py-0",
        cardFocusClassName,
      )}
    >
      <article className="contents">
        {cover ? (
          <Cover
            src={cover}
            sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw"
          />
        ) : null}
        <div className="flex flex-1 flex-col gap-2.5 p-6">
          <PublishedDate iso={post.publishedAt} />
          <h2 className="text-[2rem] leading-[1.4] font-semibold break-words text-primary">
            <Link href={blogPostPath(post.slug)} className={titleLinkClassName}>
              {post.title}
            </Link>
          </h2>
          <p className="text-md break-words text-muted-foreground">
            {post.description}
          </p>
        </div>
      </article>
    </Card>
  );
}

/**
 * Every post in the order given, each with a plain link so the whole list is crawlable without JavaScript. The first
 * post is the lead card and the rest form the grid, so no post is shown twice. The `featured` flag is the agency site's
 * presentation choice and is not used here.
 */
export function BlogPostList({ posts, coverUrl }: BlogPostListProps) {
  const [lead, ...rest] = posts;
  if (!lead) {
    return null;
  }
  return (
    <>
      <LeadCard post={lead} cover={coverUrl(lead)} />
      {rest.length > 0 ? (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <li key={post.slug} className="min-w-0">
              <PostCard post={post} cover={coverUrl(post)} />
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
