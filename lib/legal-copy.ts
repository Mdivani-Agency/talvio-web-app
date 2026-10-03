export type LegalInline = string | { text: string; href: string } | { strong: string };

export type LegalBlock =
  | { type: 'p'; content: LegalInline[] }
  | { type: 'ul'; items: LegalInline[][] };

export type LegalSection = { heading: string; blocks: LegalBlock[] };

export type LegalDocument = {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
};

/** Month and year each document was last changed. Update the one whose text you change. */
export const TERMS_LAST_UPDATED = 'October 2026';
export const PRIVACY_LAST_UPDATED = 'October 2026';

export const OPERATOR_NAME = 'MDIO';
export const OPERATOR_HREF = 'https://mdivani.agency';
export const CONTACT_EMAIL = 'contact@talvio.co';

export const operatorLink = (): LegalInline => ({ text: OPERATOR_NAME, href: OPERATOR_HREF });
export const contactLink = (): LegalInline => ({ text: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` });
export const strong = (text: string): LegalInline => ({ strong: text });
export const p = (...content: LegalInline[]): LegalBlock => ({ type: 'p', content });
export const ul = (...items: LegalInline[][]): LegalBlock => ({ type: 'ul', items });

/** Plain text of one inline run, used by tests and for checking the copy. */
export function inlineText(inline: LegalInline): string {
  if (typeof inline === 'string') return inline;
  return 'strong' in inline ? inline.strong : inline.text;
}

export function documentText(doc: LegalDocument): string {
  const parts: string[] = [doc.title, doc.lastUpdated];
  for (const section of doc.sections) {
    parts.push(section.heading);
    for (const block of section.blocks) {
      if (block.type === 'p') {
        parts.push(block.content.map(inlineText).join(''));
      } else {
        for (const item of block.items) parts.push(item.map(inlineText).join(''));
      }
    }
  }
  return parts.join('\n');
}
