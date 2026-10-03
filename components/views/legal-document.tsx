import Link from 'next/link';
import type { LegalDocument as LegalDocumentCopy, LegalInline } from '@/lib/legal-copy';

const linkClassName = 'underline hover:text-secondary';

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
    <a
      href={inline.href}
      className={linkClassName}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
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

/** Renders a legal text from `lib/*-copy.ts`: one `h1`, "Last updated", then numbered sections. */
export function LegalDocument({ doc }: { doc: LegalDocumentCopy }) {
  return (
    <main className="mx-auto w-full max-w-container-3xl px-4 pb-12 pt-24 text-primary lg:px-6">
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold lg:text-3xl">{doc.title}</h1>
        <p className="text-md text-muted-foreground">Last updated: {doc.lastUpdated}</p>
      </header>
      <div className="flex max-w-[100ch] flex-col gap-8">
        {doc.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">{section.heading}</h2>
            {section.blocks.map((block, index) =>
              block.type === 'p' ? (
                <p key={index} className="text-md text-muted-foreground">
                  <InlineRun content={block.content} />
                </p>
              ) : (
                <ul key={index} className="ml-6 flex list-disc flex-col gap-2 text-md text-muted-foreground">
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
      </div>
    </main>
  );
}
