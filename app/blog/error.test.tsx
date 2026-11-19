import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BLOG_GO_HOME_LABEL, BLOG_PAGE_HEADING, BLOG_RETRY_LABEL, BLOG_UNAVAILABLE_BODY, BLOG_UNAVAILABLE_TITLE } from '@/lib/blog-copy';

import BlogError from './error';

describe('blog outage view', () => {
  it('names the outage as the only h1 and offers retry and home', () => {
    const reset = vi.fn();
    render(<BlogError error={new Error('upstream_error')} reset={reset} />);

    expect(screen.getAllByRole('heading', { level: 1 }).map((heading) => heading.textContent)).toEqual([BLOG_UNAVAILABLE_TITLE]);
    expect(screen.getByText(BLOG_PAGE_HEADING).tagName).toBe('P');
    expect(screen.getByText(BLOG_UNAVAILABLE_BODY)).toBeTruthy();
    expect(screen.getByRole('link', { name: BLOG_GO_HOME_LABEL }).getAttribute('href')).toBe('/');

    fireEvent.click(screen.getByRole('button', { name: BLOG_RETRY_LABEL }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
