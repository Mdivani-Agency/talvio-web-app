import { Fragment, type ReactNode } from 'react';

/**
 * Renders a note's stored HTML (the note editor's output: paragraphs, bullet and numbered lists, line breaks) as React
 * elements. Only those elements are kept, and no attribute is copied, so a note cannot inject markup, links, styles or
 * scripts; anything else renders as its text. The HTML is never passed to `dangerouslySetInnerHTML`.
 */
export function NoteContent({ html, className }: { html: string; className?: string }) {
  return <div className={className}>{renderNoteHtml(html)}</div>;
}

export function renderNoteHtml(html: string): ReactNode {
  if (typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  return renderChildren(body);
}

function renderChildren(node: Node): ReactNode[] {
  return Array.from(node.childNodes).map((child, index) => renderNode(child, index));
}

function renderNode(node: Node, key: number): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }
  const children = renderChildren(node);
  switch ((node as Element).tagName) {
    case 'P':
      return <p key={key}>{children}</p>;
    case 'UL':
      return (
        <ul key={key} className="list-disc pl-5">
          {children}
        </ul>
      );
    case 'OL':
      return (
        <ol key={key} className="list-decimal pl-5">
          {children}
        </ol>
      );
    case 'LI':
      return <li key={key}>{children}</li>;
    case 'BR':
      return <br key={key} />;
    case 'SCRIPT':
    case 'STYLE':
    case 'TEMPLATE':
      return null;
    default:
      return <Fragment key={key}>{children}</Fragment>;
  }
}
