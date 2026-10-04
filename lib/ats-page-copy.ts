import { PRIMARY_CTA_HREF, PRIMARY_CTA_LABEL, SECONDARY_CTA_HREF, SECONDARY_CTA_LABEL } from './homepage-copy';

export const ATS_PATH = '/ats-friendly-resume';

export const ATS_PAGE_TITLE = 'How to make an ATS-friendly resume | Talvio';

export const ATS_PAGE_DESCRIPTION =
  'How to make an ATS-friendly resume: use standard headings, keep one reading order, show what you did, and check that your PDF text pastes in order.';

// Rewrite from the messaging brief. Primary query: "ATS-friendly resume".
export const ATS_PAGE_HEADING = 'How to make an ATS-friendly resume';

export const ATS_PAGE_INTRO =
  'An applicant tracking system stores resumes and may read their text. A resume that is easy to read helps that software and the person who reviews it.';

/** One point per section. Each body stays within the card budget of 18 words. */
export const ATS_SECTIONS = [
  {
    heading: 'Use standard headings',
    body: 'Label sections Experience, Education and Skills, so software and people can find them.',
  },
  {
    heading: 'Keep one reading order',
    body: 'Put text in a single order, top to bottom. Text boxes and side columns can scramble it.',
  },
  {
    heading: 'Show what you did',
    body: 'Name the tools, tasks and results for each role. Use keywords only where your experience backs them.',
  },
  {
    heading: 'Treat checker scores lightly',
    body: "An online checker scores your file by its own rules, not the employer's system.",
  },
  {
    heading: 'Test your PDF',
    body: 'Copy all text from your PDF into a plain editor. It should paste in reading order.',
  },
] as const;

export const ATS_CLOSING_HEADING = 'Start your resume from a template';

export const ATS_CLOSING_BODY = 'Pick a template, add your experience once, and download a resume PDF for free.';

/** One primary button. */
export const ATS_PRIMARY_CTA_HREF = PRIMARY_CTA_HREF;
export const ATS_PRIMARY_CTA_LABEL = PRIMARY_CTA_LABEL;
export const ATS_SECONDARY_CTA_HREF = SECONDARY_CTA_HREF;
export const ATS_SECONDARY_CTA_LABEL = SECONDARY_CTA_LABEL;

/** The page title and description, for the banned-term test. */
export function atsMetadataText(): string {
  return [ATS_PAGE_TITLE, ATS_PAGE_DESCRIPTION].join('\n');
}

/** Every visible line on the page, for the copy tests. Metadata is in `atsMetadataText()`. */
export function atsPageText(): string {
  return [
    ATS_PAGE_HEADING,
    ATS_PAGE_INTRO,
    ...ATS_SECTIONS.flatMap((section) => [section.heading, section.body]),
    ATS_CLOSING_HEADING,
    ATS_CLOSING_BODY,
    ATS_PRIMARY_CTA_LABEL,
    ATS_SECONDARY_CTA_LABEL,
  ].join('\n');
}
