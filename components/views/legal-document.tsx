import { ChevronUp } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@lib/utils';
import {
  LEGAL_BACK_TO_TOP,
  legalSectionId,
  type LegalDocument as LegalDocumentCopy,
  type LegalInline,
} from '@/lib/legal-copy';
import { LEGAL_LINKS } from '@/lib/public-nav';

import { LegalContents } from './legal-contents';

const linkClassName =
  'text-secondary underline underline-offset-[0.3rem] hover:text-secondary-hover dark:text-secondary-hover dark:hover:text-secondary';

/** The switch lists Terms first, then Privacy, with the labels the footer uses. */
const LEGAL_SWITCH_ORDER = ['/terms', '/privacy-policy'];
const LEGAL_SWITCH_LINKS = LEGAL_SWITCH_ORDER.map((href) => LEGAL_LINKS.find((link) => link.href === href)).filter(
  (link) => link !== undefined,
);

function Inline({ inline }: { inline: LegalInline }) {
  if (typeof inline === 'string') {
    return <>{inline}</>;
  }
  if ('strong' in inline) {
    return <strong className="font-semibold text-primary">{inline.strong}</strong>;
  }
  if (inline.href.startsWith('/')) {
    return (
      <Link href={inline.href} className={linkClassName}>
        {inline.text}
      </Link>
    );
  }
  const external = inline.href.startsWith('http');
  return (
    <a href={inline.href} className={linkClassName} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
      {inline.text}
    </a>
  );
}

function InlineRun({ content }: { content: LegalInline[] }) {
  return (
    <>
      {content.map((inline, index) => (
        <Inline key={index} inline={inline} />
      ))}
    </>
  );
}

/** Segmented links between the two legal documents; the current one carries `aria-current="page"`. */
function LegalSwitch({ current }: { current: string }) {
  return (
    <nav aria-label="Legal documents" className="inline-flex max-w-full gap-1 rounded-lg bg-popover p-1 dark:bg-card">
      {LEGAL_SWITCH_LINKS.map((link) => {
        const selected = link.name === current;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={selected ? 'page' : undefined}
            className={cn(
              'inline-flex h-10 items-center rounded-md px-3 text-md whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring lg:px-4',
              selected
                ? 'bg-background font-semibold text-foreground shadow-sm'
                : 'font-medium text-muted-foreground hover:text-foreground',
            )}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Renders a legal text from `lib/*-copy.ts`: the document switch, one `h1`, "Last updated", the contents list, then
 * numbered sections with anchors (`section-5`) and Back to top.
 */
export function LegalDocument({ doc }: { doc: LegalDocumentCopy }) {
  const sections = doc.sections.map((section, index) => ({ ...section, id: legalSectionId(section.heading, index) }));
  return (
    <main id="top" className="mx-auto w-full max-w-[120rem] flex-1 px-4 pt-8 pb-14 text-primary lg:px-10 lg:pt-14 lg:pb-24">
      <header className="flex flex-col items-start gap-4 border-b border-input pb-6 lg:pb-8">
        <LegalSwitch current={doc.title} />
        <h1 className="mt-2 text-[3.2rem] leading-[1.2] font-semibold tracking-[-0.01em] lg:text-3xl">{doc.title}</h1>
        <p className="text-md text-muted-foreground">Last updated: {doc.lastUpdated}</p>
      </header>
      <div className="mt-6 grid grid-cols-1 items-start gap-8 lg:mt-10 lg:grid-cols-[24rem_minmax(0,1fr)] lg:gap-16">
        {/* Stretches to the article's height so the desktop list can stay sticky beside it. */}
        <div className="min-w-0 lg:self-stretch">
          <LegalContents items={sections.map(({ id, heading }) => ({ id, heading }))} />
        </div>
        <article className="flex max-w-[72rem] min-w-0 flex-col text-md text-foreground">
          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className={cn('flex scroll-mt-24 flex-col gap-3', index === 0 ? 'pb-8' : 'border-t border-input py-8')}
            >
              <h2 className="text-[2rem] leading-[1.4] font-semibold text-primary lg:text-xl">{section.heading}</h2>
              {section.blocks.map((block, blockIndex) =>
                block.type === 'p' ? (
                  <p key={blockIndex}>
                    <InlineRun content={block.content} />
                  </p>
                ) : (
                  <ul key={blockIndex} className="flex list-disc flex-col gap-2 pl-6">
                    {block.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <InlineRun content={item} />
                      </li>
                    ))}
                  </ul>
                ),
              )}
            </section>
          ))}
          <a
            href="#top"
            className="mt-8 inline-flex min-h-11 items-center gap-2 self-start text-md font-medium text-secondary hover:text-secondary-hover dark:text-secondary-hover dark:hover:text-secondary"
          >
            <ChevronUp aria-hidden="true" className="size-4" />
            {LEGAL_BACK_TO_TOP}
          </a>
        </article>
      </div>
    </main>
  );
}
