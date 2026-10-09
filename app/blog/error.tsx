'use client';

import { ErrorView } from '@components/views';
import { BLOG_UNAVAILABLE_BODY, BLOG_UNAVAILABLE_TITLE } from '@/lib/blog-copy';

/** Blog outage view, inside the public shell. The response status comes from the thrown error, not from this view. */
export default function BlogError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView title={BLOG_UNAVAILABLE_TITLE} error={BLOG_UNAVAILABLE_BODY} reset={reset} />;
}
