import type { BlogUnavailableReason } from '@/lib/blog/server';

/** Thrown by a blog route when the API is unavailable, so the response is an error, never an empty or missing page. */
export class BlogUnavailableError extends Error {
  constructor(readonly reason: BlogUnavailableReason) {
    super(`Blog unavailable: ${reason}`);
    this.name = 'BlogUnavailableError';
  }
}
