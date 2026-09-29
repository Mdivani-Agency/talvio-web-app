import { PRIMARY_CTA_HREF, PRIMARY_CTA_LABEL, SECONDARY_CTA_HREF, SECONDARY_CTA_LABEL } from './homepage-copy';
import { PRICING_HOME_PACK_CTA_LABEL, PRICING_PATH } from './pricing-page-copy';

export const ATS_PATH = '/ats-friendly-resume';

export const ATS_PAGE_TITLE = 'Readable resumes and ATS checkers | Talvio';

export const ATS_PAGE_DESCRIPTION =
  'Use standard headings, a simple reading order, and evidence that matches the role. A generic checker score is not the hiring company’s system, and those systems differ.';

export const ATS_PAGE_HEADING = 'A readable resume is not a checker score';

export const ATS_PAGE_INTRO =
  'An applicant tracking system stores applications and may extract text from a resume file. A file a person can scan is easier to review. A score from a public checker is that checker’s result. It is separate from the hiring company’s system, and those systems differ.';

export const ATS_HEADINGS_HEADING = 'Use readable section headings';

export const ATS_HEADINGS_BODY =
  'Name the main parts with ordinary labels such as Experience, Education, and Skills. A heading a person can scan is also text that can be selected. Headings drawn as images are harder to read back as words.';

export const ATS_ORDER_HEADING = 'Keep a simple reading order';

export const ATS_ORDER_BODY =
  'Place the name, contact details, and sections in an order a reader can follow from top to bottom. Text boxes, icons, and side-by-side columns can store words in a different order from the order on the page. A straightforward structure keeps the stored order closer to that page.';

export const ATS_EVIDENCE_HEADING = 'Show role-relevant evidence';

export const ATS_EVIDENCE_BODY =
  'Describe work you did in the language of the role. Name the tools, responsibilities, and results that belong in that section. A keyword that is not backed by the experience does not make the file more accurate.';

export const ATS_CHECKERS_HEADING = 'Checker scores have limits';

export const ATS_CHECKERS_BODY =
  'A generic checker scores a file against its own rules. That score is not the hiring company’s system. Products differ in what they extract, and a high score on one checker is that checker’s result.';

export const ATS_PDF_HEADING = 'Check the PDF by selecting the text';

export const ATS_PDF_BODY =
  'Open the downloaded PDF, select the text, and copy it into a plain text editor. Read the paste from top to bottom. When the name, headings, and roles appear in an order you can follow, the file kept selectable text. This is a sanity check for copy order. A clean paste is not an ATS pass.';

export const ATS_CLOSING_HEADING = 'Preview a template, then download a PDF';

export const ATS_CLOSING_BODY =
  'Preview a template for free. Sign in to fill the resume and download a PDF. Pricing lists the free credits on a new account and the one-time packs.';

export const ATS_TEMPLATES_CTA_HREF = SECONDARY_CTA_HREF;
export const ATS_TEMPLATES_CTA_LABEL = SECONDARY_CTA_LABEL;
export const ATS_PRICING_CTA_HREF = PRICING_PATH;
export const ATS_PRICING_CTA_LABEL = PRICING_HOME_PACK_CTA_LABEL;
export const ATS_SIGN_IN_CTA_HREF = PRIMARY_CTA_HREF;
export const ATS_SIGN_IN_CTA_LABEL = PRIMARY_CTA_LABEL;

export const ATS_RELATED_LEAD = 'A separate essay on this topic is published on the agency site:';

export const ATS_RELATED_LABEL = 'ATS-Friendly Resume: What Actually Matters vs the Myths';

export const ATS_RELATED_HREF =
  'https://www.mdivani.agency/blog/ats-friendly-resume-what-actually-matters-vs-the-myths';

export function atsPageText(): string {
  return [
    ATS_PAGE_TITLE,
    ATS_PAGE_DESCRIPTION,
    ATS_PAGE_HEADING,
    ATS_PAGE_INTRO,
    ATS_HEADINGS_HEADING,
    ATS_HEADINGS_BODY,
    ATS_ORDER_HEADING,
    ATS_ORDER_BODY,
    ATS_EVIDENCE_HEADING,
    ATS_EVIDENCE_BODY,
    ATS_CHECKERS_HEADING,
    ATS_CHECKERS_BODY,
    ATS_PDF_HEADING,
    ATS_PDF_BODY,
    ATS_CLOSING_HEADING,
    ATS_CLOSING_BODY,
    ATS_TEMPLATES_CTA_LABEL,
    ATS_PRICING_CTA_LABEL,
    ATS_SIGN_IN_CTA_LABEL,
  ].join('\n');
}
