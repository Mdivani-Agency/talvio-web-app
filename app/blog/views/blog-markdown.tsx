import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';
import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';

import { type BlogMarkdownOrigins, safeBlogImageSrc, safeBlogLink } from '@/lib/blog/markdown-urls';

/**
 * Article Markdown rendered as React elements from markdown-it tokens. Nothing from the content reaches the page as
 * HTML: raw HTML is off, text is escaped by React, only the token types below become elements, and every URL passes
 * through `markdown-urls.ts`. Content is never compiled or executed (no MDX, no components).
 *
 * Headings are shifted so the highest one is an `h2`: the page title is the only `h1`. Each heading gets an `id` from
 * its text (lowercase, words joined by `-`, `-2`, `-3` for repeats), so `#fragment` links in the content reach it.
 */

const parser = new MarkdownIt('default', { html: false, linkify: true, typographer: false });

type Context = BlogMarkdownOrigins & { headingShift: number; headingIds: Map<Token, string>; key: number };

const HEADING_CLASS: Record<number, string> = {
  2: 'mt-10 text-2xl font-semibold',
  3: 'mt-8 text-xl font-semibold',
  4: 'mt-6 text-lg font-semibold',
  5: 'mt-6 text-md font-semibold',
  6: 'mt-6 text-md font-semibold',
};

const ALIGN_CLASS: Record<string, string> = {
  'text-align:left': 'text-left',
  'text-align:center': 'text-center',
  'text-align:right': 'text-right',
};

function textOf(tokens: Token[] | null): string {
  return (tokens ?? []).map((token) => (token.children ? textOf(token.children) : token.content)).join('');
}

/** Moves the highest heading to `h2`, up or down. Levels are clamped to `h2`..`h6` when rendered. */
function headingShift(tokens: Token[]): number {
  const levels = tokens.filter((token) => token.type === 'heading_open').map((token) => Number(token.tag.slice(1)));
  return levels.length > 0 ? 2 - Math.min(...levels) : 0;
}

function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

/** A unique `id` per heading, from the text of the inline token that follows its opening token. */
function headingIds(tokens: Token[]): Map<Token, string> {
  const ids = new Map<Token, string>();
  const seen = new Map<string, number>();
  tokens.forEach((token, index) => {
    if (token.type !== 'heading_open') {
      return;
    }
    const base = headingSlug(textOf(tokens[index + 1]?.children ?? null));
    if (!base) {
      return;
    }
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    ids.set(token, count === 1 ? base : `${base}-${count}`);
  });
  return ids;
}

function element(open: Token, children: ReactNode[], ctx: Context): ReactNode {
  const key = ctx.key++;
  switch (open.type) {
    case 'paragraph_open':
      // Tight list items mark their paragraphs hidden.
      return open.hidden ? <Fragment key={key}>{children}</Fragment> : <p key={key}>{children}</p>;
    case 'heading_open': {
      const level = Math.min(6, Math.max(2, Number(open.tag.slice(1)) + ctx.headingShift)) as 2 | 3 | 4 | 5 | 6;
      const Heading = `h${level}` as const;
      return (
        <Heading key={key} id={ctx.headingIds.get(open)} className={`scroll-mt-24 ${HEADING_CLASS[level]}`}>
          {children}
        </Heading>
      );
    }
    case 'bullet_list_open':
      return (
        <ul key={key} className="list-disc space-y-2 pl-6">
          {children}
        </ul>
      );
    case 'ordered_list_open': {
      const start = Number(open.attrGet('start') ?? 1);
      return (
        <ol key={key} start={Number.isSafeInteger(start) && start >= 0 ? start : undefined} className="list-decimal space-y-2 pl-6">
          {children}
        </ol>
      );
    }
    case 'list_item_open':
      return <li key={key}>{children}</li>;
    case 'blockquote_open':
      return (
        <blockquote key={key} className="border-l-4 border-border pl-4 text-muted-foreground">
          {children}
        </blockquote>
      );
    case 'table_open':
      return (
        <div key={key} className="overflow-x-auto" role="region" aria-label="Table" tabIndex={0}>
          <table className="w-full border-collapse text-left text-md">{children}</table>
        </div>
      );
    case 'thead_open':
      return <thead key={key}>{children}</thead>;
    case 'tbody_open':
      return <tbody key={key}>{children}</tbody>;
    case 'tr_open':
      return (
        <tr key={key} className="border-b border-border">
          {children}
        </tr>
      );
    case 'th_open':
    case 'td_open': {
      const Cell = open.type === 'th_open' ? 'th' : 'td';
      const align = ALIGN_CLASS[open.attrGet('style') ?? ''] ?? '';
      return (
        <Cell key={key} className={`px-3 py-2 align-top ${Cell === 'th' ? 'font-semibold' : ''} ${align}`}>
          {children}
        </Cell>
      );
    }
    case 'strong_open':
      return <strong key={key}>{children}</strong>;
    case 'em_open':
      return <em key={key}>{children}</em>;
    case 's_open':
      return <s key={key}>{children}</s>;
    case 'link_open': {
      const link = safeBlogLink(open.attrGet('href') ?? '', ctx);
      if (!link) {
        return <Fragment key={key}>{children}</Fragment>;
      }
      const className = 'font-medium underline underline-offset-4';
      return link.external ? (
        <a key={key} href={link.href} rel="noopener noreferrer" className={className}>
          {children}
        </a>
      ) : (
        <Link key={key} href={link.href} className={className}>
          {children}
        </Link>
      );
    }
    default:
      // A token type this renderer does not know keeps its text and loses its element.
      return <Fragment key={key}>{children}</Fragment>;
  }
}

function image(token: Token, ctx: Context): ReactNode {
  const key = ctx.key++;
  const alt = textOf(token.children);
  const raw = token.attrGet('src') ?? '';
  const src = safeBlogImageSrc(raw, ctx);
  if (!src) {
    // An image from another host is never loaded. It becomes a link to the image, or its text.
    const link = safeBlogLink(raw, ctx);
    return link ? (
      <a key={key} href={link.href} rel="noopener noreferrer" className="font-medium underline underline-offset-4">
        {alt || link.href}
      </a>
    ) : (
      <Fragment key={key}>{alt}</Fragment>
    );
  }
  return (
    // A fixed frame keeps the layout stable, because Markdown carries no image size.
    <span key={key} className="my-6 block aspect-video w-full overflow-hidden rounded-lg bg-muted">
      {/* Loaded by the browser from an allowed origin; the Talvio server never fetches content images. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-contain" />
    </span>
  );
}

function leaf(token: Token, ctx: Context): ReactNode {
  switch (token.type) {
    case 'text':
      return token.content;
    case 'softbreak':
      return '\n';
    case 'hardbreak':
      return <br key={ctx.key++} />;
    case 'code_inline':
      return (
        <code key={ctx.key++} className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
          {token.content}
        </code>
      );
    case 'fence':
    case 'code_block':
      return (
        <pre key={ctx.key++} className="overflow-x-auto rounded-lg bg-muted p-4 text-sm" tabIndex={0}>
          <code className="font-mono">{token.content}</code>
        </pre>
      );
    case 'hr':
      return <hr key={ctx.key++} className="border-border" />;
    case 'image':
      return image(token, ctx);
    case 'inline':
      return <Fragment key={ctx.key++}>{render(token.children ?? [], ctx)}</Fragment>;
    default:
      // `html_block` and `html_inline` cannot occur with `html: false`; anything else unknown renders nothing.
      return null;
  }
}

function render(tokens: Token[], ctx: Context): ReactNode[] {
  const root: ReactNode[] = [];
  const stack: { open: Token; children: ReactNode[] }[] = [];
  const append = (node: ReactNode) => (stack.at(-1)?.children ?? root).push(node);
  for (const token of tokens) {
    if (token.nesting === 1) {
      stack.push({ open: token, children: [] });
    } else if (token.nesting === -1) {
      const frame = stack.pop();
      if (frame) {
        append(element(frame.open, frame.children, ctx));
      }
    } else {
      append(leaf(token, ctx));
    }
  }
  return root;
}

export function BlogMarkdown({ content, origins }: { content: string; origins: BlogMarkdownOrigins }) {
  const tokens = parser.parse(content, {});
  const ctx: Context = { ...origins, headingShift: headingShift(tokens), headingIds: headingIds(tokens), key: 0 };
  return <div className="flex flex-col gap-4 text-md leading-7 break-words">{render(tokens, ctx)}</div>;
}
