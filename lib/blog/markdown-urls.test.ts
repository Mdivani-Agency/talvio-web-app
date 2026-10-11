import { describe, expect, it } from 'vitest';

import { safeBlogImageSrc, safeBlogLink, type BlogMarkdownOrigins } from './markdown-urls';

const origins: BlogMarkdownOrigins = { contentOrigin: 'https://content.example.test', siteOrigin: 'https://www.talvio.co' };

describe('safeBlogLink', () => {
  it.each([
    ['https://example.test/a?b=1#c', { href: 'https://example.test/a?b=1#c', external: true }],
    ['http://example.test/', { href: 'http://example.test/', external: true }],
    ['mailto:hello@example.test', { href: 'mailto:hello@example.test', external: true }],
    ['#section', { href: '#section', external: false }],
    ['/blog/other-post', { href: '/blog/other-post', external: false }],
    ['/blog', { href: '/blog', external: false }],
    ['https://www.talvio.co/templates', { href: '/templates', external: false }],
    ['/services', { href: 'https://content.example.test/services', external: true }],
  ])('keeps %s', (raw, expected) => {
    expect(safeBlogLink(raw, origins)).toEqual(expected);
  });

  it.each([
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'java%0Ascript:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    'file:///etc/passwd',
    'ftp://example.test/',
    '//evil.test/path',
    '/\\evil.test/path',
    'relative/path',
    '../up',
    '?query',
    '#',
    '',
  ])('drops %j', (raw) => {
    expect(safeBlogLink(raw, origins)).toBeNull();
  });

  it('drops content-relative paths when the content origin is unknown', () => {
    expect(safeBlogLink('/services', { ...origins, contentOrigin: null })).toBeNull();
    expect(safeBlogLink('/blog/post', { ...origins, contentOrigin: null })).toEqual({ href: '/blog/post', external: false });
  });
});

describe('safeBlogImageSrc', () => {
  it.each([
    ['/uploads/a.png', 'https://content.example.test/uploads/a.png'],
    ['https://content.example.test/uploads/a.png', 'https://content.example.test/uploads/a.png'],
    ['https://www.talvio.co/share-image-v1.png', 'https://www.talvio.co/share-image-v1.png'],
  ])('loads %s', (raw, expected) => {
    expect(safeBlogImageSrc(raw, origins)).toBe(expected);
  });

  it.each([
    'https://evil.test/a.png',
    'http://content.example.test/a.png',
    'https://content.example.test.evil.test/a.png',
    'https://content.example.test@evil.test/a.png',
    '//evil.test/a.png',
    '/\\evil.test/a.png',
    'javascript:alert(1)',
    'data:image/png;base64,iVBORw0KGgo=',
    'data:image/svg+xml,<svg onload=alert(1)>',
    'http://169.254.169.254/latest/meta-data',
    'relative.png',
  ])('refuses %s', (raw) => {
    expect(safeBlogImageSrc(raw, origins)).toBeNull();
  });

  it('refuses content-relative images when the content origin is unknown', () => {
    expect(safeBlogImageSrc('/uploads/a.png', { ...origins, contentOrigin: null })).toBeNull();
  });
});
