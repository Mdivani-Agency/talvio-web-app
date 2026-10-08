import type { JSONContent } from '@tiptap/react';

/** TipTap doc written when a profile experience list becomes resume rich text. */
export function markedBulletDoc(
  items: Array<{ text: string; mark: string }>,
): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'bulletList',
        content: items.map(({ text, mark }) => ({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              marks: [{ type: mark }],
              content: [{ type: 'text', text }],
            },
          ],
        })),
      },
    ],
  };
}

/** Richer description that must survive as JSON. Marks sit on the text node. */
export function richParagraphDoc(text: string): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Led ' },
          { type: 'text', text, marks: [{ type: 'bold' }] },
          { type: 'text', text: ' across two teams.' },
        ],
      },
    ],
  };
}
