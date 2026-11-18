import { BLOG_PAGE_HEADING, BLOG_PAGE_INTRO } from '@/lib/blog-copy';

/** Container shared by the index, its empty state and the outage view. The site header already takes its own height in the flow. */
export const BLOG_INDEX_CLASS =
  'mx-auto flex w-full max-w-[120rem] flex-col gap-[3.2rem] px-4 pt-[3.2rem] pb-[4.8rem] text-primary lg:gap-[4.8rem] lg:px-[4rem] lg:pt-[5.6rem] lg:pb-[9.6rem]';

/**
 * The blog's title and intro. The outage view renders the title as a paragraph because its own message is the page's
 * `h1`.
 */
export function BlogIndexHeader({ headingLevel = 'h1' }: { headingLevel?: 'h1' | 'p' }) {
  const Heading = headingLevel;
  return (
    <header className="flex max-w-[72rem] flex-col gap-3">
      <Heading className="text-[3.2rem] leading-[1.2] font-semibold tracking-[-0.01em] text-primary lg:text-3xl">
        {BLOG_PAGE_HEADING}
      </Heading>
      <p className="text-md leading-[1.556] text-muted-foreground lg:text-lg">{BLOG_PAGE_INTRO}</p>
    </header>
  );
}
