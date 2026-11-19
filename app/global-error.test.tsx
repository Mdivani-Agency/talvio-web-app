import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
// Vitest does not transform the SVG icon imports.
vi.mock('@components/icons', () => ({ Icon: () => <svg data-testid="logo" /> }));

import GlobalError from './global-error';

describe('GlobalError', () => {
  it('renders its own document with the message, Reload the page and the support email', () => {
    const html = renderToStaticMarkup(<GlobalError error={new Error('layout failed')} />);
    expect(html).toMatch(/^<html lang="en">/);
    expect(html).toContain('<title>Talvio hit a problem</title>');
    expect(html).toContain('<h1>Talvio hit a problem</h1>');
    expect(html).toContain('Reload the page. Your saved work is safe.');
    expect(html).toMatch(/<button type="button" class="tg-button">Reload the page<\/button>/);
    expect(html).toContain('href="mailto:contact@talvio.co"');
    // It cannot rely on the app's stylesheet, so it carries its own, with a dark variant.
    expect(html).toContain('prefers-color-scheme:dark');
    expect(html).toContain('data-testid="logo"');
  });
});
