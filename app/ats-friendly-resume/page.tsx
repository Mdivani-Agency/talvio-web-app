import { Button } from '@components/ui/button';
import {
  ATS_CHECKERS_BODY,
  ATS_CHECKERS_HEADING,
  ATS_CLOSING_BODY,
  ATS_CLOSING_HEADING,
  ATS_EVIDENCE_BODY,
  ATS_EVIDENCE_HEADING,
  ATS_HEADINGS_BODY,
  ATS_HEADINGS_HEADING,
  ATS_ORDER_BODY,
  ATS_ORDER_HEADING,
  ATS_PAGE_HEADING,
  ATS_PAGE_INTRO,
  ATS_PDF_BODY,
  ATS_PDF_HEADING,
  ATS_PRICING_CTA_HREF,
  ATS_PRICING_CTA_LABEL,
  ATS_RELATED_HREF,
  ATS_RELATED_LABEL,
  ATS_RELATED_LEAD,
  ATS_SIGN_IN_CTA_HREF,
  ATS_SIGN_IN_CTA_LABEL,
  ATS_TEMPLATES_CTA_HREF,
  ATS_TEMPLATES_CTA_LABEL,
} from '@/lib/ats-page-copy';
import Link from 'next/link';

const sections = [
  { heading: ATS_HEADINGS_HEADING, body: ATS_HEADINGS_BODY },
  { heading: ATS_ORDER_HEADING, body: ATS_ORDER_BODY },
  { heading: ATS_EVIDENCE_HEADING, body: ATS_EVIDENCE_BODY },
  { heading: ATS_CHECKERS_HEADING, body: ATS_CHECKERS_BODY },
  { heading: ATS_PDF_HEADING, body: ATS_PDF_BODY },
];

export default function AtsFriendlyResumePage() {
  return (
    <main className="mx-auto flex w-full max-w-container-3xl flex-col gap-12 px-4 pb-12 pt-24 text-primary lg:px-6">
      <header className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold lg:text-3xl">{ATS_PAGE_HEADING}</h1>
        <p className="max-w-[70ch] text-lg text-muted-foreground">{ATS_PAGE_INTRO}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:gap-8">
        {sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-4 rounded-lg bg-card p-6 lg:p-8">
            <h2 className="text-xl font-semibold">{section.heading}</h2>
            <p className="text-md text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>

      <section className="flex flex-col gap-4 rounded-lg bg-card p-6 lg:p-8">
        <h2 className="text-xl font-semibold">{ATS_CLOSING_HEADING}</h2>
        <p className="max-w-[70ch] text-md text-muted-foreground">{ATS_CLOSING_BODY}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild className="w-fit">
            <Link href={ATS_TEMPLATES_CTA_HREF}>{ATS_TEMPLATES_CTA_LABEL}</Link>
          </Button>
          <Button asChild variant="outline" className="w-fit">
            <Link href={ATS_PRICING_CTA_HREF}>{ATS_PRICING_CTA_LABEL}</Link>
          </Button>
          <Button asChild variant="outline" className="w-fit">
            <Link href={ATS_SIGN_IN_CTA_HREF}>{ATS_SIGN_IN_CTA_LABEL}</Link>
          </Button>
        </div>
      </section>

      <p className="max-w-[70ch] text-md text-muted-foreground">
        {ATS_RELATED_LEAD}{' '}
        <a href={ATS_RELATED_HREF} className="underline" rel="noreferrer" target="_blank">
          {ATS_RELATED_LABEL}
        </a>
      </p>
    </main>
  );
}
