/**
 * Article Markdown fixtures for the renderer. Hostile entries are what a compromised or careless editor could save
 * through the write API; none of them may produce script, event handlers, unsafe URLs or images from other hosts.
 */

export const HOSTILE_MARKDOWN = [
  '<script>window.__pwned = 1</script>',
  '<img src="x" onerror="window.__pwned = 1">',
  '<a href="javascript:window.__pwned = 1">raw html link</a>',
  '<iframe src="https://evil.test"></iframe>',
  '<style>body { display: none }</style>',
  '[plain javascript](javascript:window.__pwned=1)',
  '[upper case](JAVASCRIPT:window.__pwned=1)',
  '[entity encoded](&#106;avascript:window.__pwned=1)',
  '[hex entity](&#x6A;avascript:window.__pwned=1)',
  '[tab inside](java&#9;script:window.__pwned=1)',
  '[percent encoded](java%0Ascript:window.__pwned=1)',
  '[vbscript](vbscript:msgbox(1))',
  '[data html](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
  '[protocol relative](//evil.test/phish)',
  '<javascript:window.__pwned=1>',
  '![tracker](https://evil.test/pixel.png)',
  '![metadata](http://169.254.169.254/latest/meta-data)',
  '![svg data](data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+)',
  '![png data](data:image/png;base64,iVBORw0KGgo=)',
  '![relative](pixel.png)',
  '[link with attrs](https://example.test/ "title\\" onclick=\\"window.__pwned=1")',
  '`<script>window.__pwned = 1</script>`',
  '```html\n<script>window.__pwned = 1</script>\n```',
  '{process.exit(1)}',
  'import Danger from "./danger"\n\n<Danger />',
].join('\n\n');

/** Long, structured content for layout checks: headings from h1 down, a table, code, lists, quotes and images. */
export const RICH_MARKDOWN = `# Content heading one

Intro paragraph with **bold**, _emphasis_, ~~strike~~, \`inline code\` and a [Talvio link](https://www.talvio.co/templates).
Autolinked https://example.test/autolink and an [in-page link](#content-heading-two).

## Content heading two

1. First step
2. Second step

- Tight item
- Another item

> A quoted line.

| Left | Center | Right |
| :--- | :----: | ----: |
| a | b | c |

\`\`\`ts
const veryLongLine = '${'x'.repeat(200)}';
\`\`\`

![Allowed cover](/uploads/inline.png)

---

Line one\\
Line two after a hard break.
`;
