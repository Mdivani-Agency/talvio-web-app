import { Button } from '@components/ui/button';
import {
  ATS_CLOSING_BODY,
  ATS_CLOSING_HEADING,
  ATS_PAGE_HEADING,
  ATS_PAGE_INTRO,
  ATS_PRIMARY_CTA_HREF,
  ATS_PRIMARY_CTA_LABEL,
  ATS_SECONDARY_CTA_HREF,
  ATS_SECONDARY_CTA_LABEL,
  ATS_SECTIONS,
} from '@/lib/ats-page-copy';
import Link from 'next/link';

export default function AtsFriendlyResumePage() {
  return (
    <main className="mx-auto flex w-full max-w-container-3xl flex-col gap-12 px-4 pb-12 pt-24 text-primary lg:px-6">
      <header className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold lg:text-3xl">{ATS_PAGE_HEADING}</h1>
        <p className="max-w-[70ch] text-lg text-muted-foreground">{ATS_PAGE_INTRO}</p>
      </header>

      <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {ATS_SECTIONS.map((section, index) => (
          <li key={section.heading} className="flex flex-col gap-3 rounded-lg bg-card p-6 lg:p-8">
            <span className="text-md font-semibold text-secondary">{index + 1}</span>
            <h2 className="text-xl font-semibold">{section.heading}</h2>
            <p className="text-md text-muted-foreground">{section.body}</p>
          </li>
        ))}
      </ol>

      <section className="flex flex-col gap-4 rounded-lg bg-card p-6 lg:p-8">
        <h2 className="text-xl font-semibold">{ATS_CLOSING_HEADING}</h2>
        <p className="max-w-[70ch] text-md text-muted-foreground">{ATS_CLOSING_BODY}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild className="w-fit">
            <Link href={ATS_PRIMARY_CTA_HREF}>{ATS_PRIMARY_CTA_LABEL}</Link>
          </Button>
          <Button asChild variant="outline" className="w-fit">
            <Link href={ATS_SECONDARY_CTA_HREF}>{ATS_SECONDARY_CTA_LABEL}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
