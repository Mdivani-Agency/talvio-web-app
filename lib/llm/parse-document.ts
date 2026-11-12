import { z } from 'zod';

import {
  DegreeTypeEnum,
  employmentTypeEnum,
  LanguageProficiency,
  locationTypeEnum,
  SeniorityEnum,
} from '@lib/schema/enums';
import type { AccountDto, Education, Experience, Language, Link, Project, Recommendation, Skill, Tool } from '@lib/types';

import { LLM_LIMITS, type ExtractionManifest, type ResultEnvelope } from './contract';

/*
 * parse_document for import (MDI-221): the request built from pasted or PDF text, and the typed
 * result turned into the account form's values plus a review of what needs the user's attention.
 *
 * The service never guesses: an unknown date or end is null, and the result is `partial` when a
 * page could not be read. The web keeps that visible instead of filling gaps: an entry the form
 * cannot hold without a guess is left out and listed, a year-only date is shown as January and
 * listed, and the service's uncertainties and warnings are listed as they are.
 */

export const PDF_EXTRACTOR = 'pdfjs-dist';
/** Pages the service accepts from browser extraction (contract LIMITS.pdfPages). */
export const MAX_PDF_PAGES = 30;

/** Text from a PDF, one entry per page, with the page manifest the service reads. */
export function pdfTextRequest(pages: string[], extractorVersion: string): { text: string; extraction: ExtractionManifest } {
  let text = '';
  const manifest: ExtractionManifest['pages'] = [];
  pages.forEach((pageText, index) => {
    if (index > 0) {
      text += '\n';
    }
    const start = text.length;
    text += pageText;
    manifest.push({
      page: index + 1,
      start,
      end: text.length,
      coverage: pageText.trim() ? 'text' : 'empty',
    });
  });
  return {
    text,
    extraction: {
      extractor: PDF_EXTRACTOR,
      extractorVersion: extractorVersion.slice(0, 32),
      pageCount: pages.length,
      pages: manifest,
    },
  };
}

/** Why the text cannot be sent, before any request. */
export function importTextProblem(text: string, pageCount: number | null = null): string | null {
  if (!text.trim()) {
    return 'We could not find any text in this file. Try a PDF with selectable text, or paste the text instead.';
  }
  if (text.length > LLM_LIMITS.sourceTextChars) {
    return 'This resume is too long to import. Shorten it or paste the main sections.';
  }
  if (pageCount !== null && pageCount > MAX_PDF_PAGES) {
    return `This PDF has ${pageCount} pages. Import a resume of ${MAX_PDF_PAGES} pages or fewer.`;
  }
  return null;
}

// The result, read loosely: unknown fields are ignored and only what the form uses is required.
const text = z.string().nullable();
const lines = z.array(z.string());
const inline = z.array(z.looseObject({ text: z.string() }));
const contentDoc = z
  .looseObject({
    blocks: z.array(
      z.union([
        z.looseObject({ type: z.literal('paragraph'), content: inline }),
        z.looseObject({ type: z.string(), items: z.array(inline) }),
      ]),
    ),
  })
  .nullable();
const period = { startDate: text, endDate: text, current: z.boolean().nullable() };

const careerSchema = z.looseObject({
  person: z.looseObject({ firstName: text, lastName: text, role: text, tagline: text, seniority: text }),
  contacts: z.looseObject({ email: text, phone: text, url: text }),
  location: z.looseObject({ city: text, country: text }),
  experience: z.array(
    z.looseObject({
      company: text,
      jobTitle: text,
      employmentType: text,
      locationType: text,
      ...period,
      description: contentDoc,
      achievements: lines,
      responsibilities: lines,
      keyContributions: lines,
    }),
  ),
  education: z.array(z.looseObject({ name: text, degreeType: text, ...period, description: contentDoc })),
  projects: z.array(z.looseObject({ name: text, url: text, description: contentDoc })),
  recommendations: z.array(z.looseObject({ name: text, url: text, description: contentDoc })),
  skills: z.array(z.looseObject({ name: z.string() })),
  tools: z.array(z.looseObject({ name: z.string() })),
  links: z.array(z.looseObject({ type: text, value: z.string() })),
  languages: z.array(z.looseObject({ language: z.string(), proficiency: text })),
});

export const parseDocumentResultSchema = z.looseObject({
  career: careerSchema,
  uncertainties: z.array(z.looseObject({ section: z.string(), message: z.string() })),
  extraction: z.looseObject({ complete: z.boolean(), pagesNeedingReview: z.array(z.number()) }),
});

export type ImportReviewItem = { section: string; message: string };

export type ImportReview = {
  /** The service marked the result partial: something could not be read. */
  partial: boolean;
  items: ImportReviewItem[];
};

export type ImportedAccount = { account: AccountDto; review: ImportReview };

const SECTION_LABEL: Record<string, string> = {
  person: 'Profile',
  contacts: 'Profile',
  location: 'Profile',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  recommendations: 'Recommendations',
  skills: 'Skills',
  tools: 'Tools',
  links: 'Links',
  languages: 'Languages',
};

/** A partial date (`2021`, `2021-03`, `2021-03-15`) as the form's ISO date, and whether a part had to be assumed. */
export function partialDateToIso(value: string | null): { iso: string; widened: boolean } | null {
  const match = value?.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  return {
    iso: new Date(Date.UTC(Number(year), Number(month ?? '1') - 1, Number(day ?? '1'))).toISOString(),
    widened: !month,
  };
}

function plainText(doc: z.infer<typeof contentDoc>): string | undefined {
  if (!doc) {
    return undefined;
  }
  const join = (nodes: z.infer<typeof inline>) => nodes.map((node) => node.text).join('');
  const out = doc.blocks
    .flatMap((block) => ('content' in block ? [join(block.content as z.infer<typeof inline>)] : (block.items as z.infer<typeof inline>[]).map(join)))
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
  return out || undefined;
}

function oneOf<T extends string>(options: readonly T[], value: string | null): T | undefined {
  return options.includes(value as T) ? (value as T) : undefined;
}

const EMPLOYMENT = employmentTypeEnum.options;
const LOCATION = locationTypeEnum.options;
const PROFICIENCY = LanguageProficiency.options;
const DEGREES = DegreeTypeEnum.options;
const SENIORITIES = SeniorityEnum.options;

/**
 * The account form's values from a parse_document result, and what the user should check. Entries
 * the form cannot hold without a guess (no start date, no degree type, no proficiency) are left out
 * and listed, never filled in.
 */
export function importedAccount(envelope: ResultEnvelope): ImportedAccount {
  const parsed = parseDocumentResultSchema.parse(envelope.result);
  const { career } = parsed;
  const items: ImportReviewItem[] = [];
  const note = (section: string, message: string) => items.push({ section: SECTION_LABEL[section] ?? section, message });
  const label = (...parts: (string | null)[]) => parts.filter(Boolean).join(', ') || 'An entry';

  const date = (section: string, what: string, value: string | null) => {
    const parsedDate = partialDateToIso(value);
    if (parsedDate?.widened) {
      note(section, `${what}: only the year was found, so the month is shown as January. Check it.`);
    }
    return parsedDate?.iso;
  };

  const experience: Experience[] = [];
  career.experience.forEach((entry) => {
    const name = label(entry.jobTitle, entry.company);
    const startDate = date('experience', `${name} start`, entry.startDate);
    if (!entry.company || !entry.jobTitle || !startDate) {
      note('experience', `${name} was not imported: its ${!entry.company ? 'employer' : !entry.jobTitle ? 'job title' : 'start date'} could not be read. Add it yourself.`);
      return;
    }
    const endDate = date('experience', `${name} end`, entry.endDate);
    if (!endDate && entry.current === null) {
      note('experience', `${name}: no end date was found. Add one, or mark it as your current role.`);
    }
    experience.push({
      company: entry.company,
      jobTitle: entry.jobTitle,
      startDate,
      endDate,
      isPresent: entry.current === true,
      employmentType: oneOf(EMPLOYMENT, entry.employmentType),
      locationType: oneOf(LOCATION, entry.locationType),
      additionalDetails: plainText(entry.description),
      achievements: entry.achievements,
      responsibilities: entry.responsibilities,
      keyContributions: entry.keyContributions,
    } as Experience);
  });

  const education: Education[] = [];
  career.education.forEach((entry) => {
    const name = label(entry.name);
    const startDate = date('education', `${name} start`, entry.startDate);
    const degreeType = oneOf(DEGREES, entry.degreeType);
    if (!entry.name || !degreeType || !startDate) {
      note('education', `${name} was not imported: its ${!entry.name ? 'name' : !degreeType ? 'degree type' : 'start date'} could not be read. Add it yourself.`);
      return;
    }
    education.push({
      name: entry.name,
      degreeType,
      startDate,
      endDate: date('education', `${name} end`, entry.endDate),
      isPresent: entry.current === true,
      additionalDetails: plainText(entry.description),
    } as Education);
  });

  const projects: Project[] = career.projects.flatMap((entry) => {
    if (!entry.name) {
      note('projects', 'A project without a name was not imported.');
      return [];
    }
    return [{ name: entry.name, url: entry.url ?? undefined, additionalDetails: plainText(entry.description) ?? '' } as Project];
  });

  const recommendations: Recommendation[] = career.recommendations.flatMap((entry) => {
    if (!entry.name || !entry.url) {
      note('recommendations', `${label(entry.name)} was not imported: it needs a name and a link.`);
      return [];
    }
    return [{ name: entry.name, url: entry.url, additionalDetails: plainText(entry.description) ?? '' } as Recommendation];
  });

  const languages: Language[] = career.languages.flatMap((entry) => {
    const proficiency = oneOf(PROFICIENCY, entry.proficiency);
    if (!proficiency) {
      note('languages', `${entry.language}: choose how well you speak it.`);
      return [];
    }
    return [{ language: entry.language, proficiency } as Language];
  });

  const links: Link[] = career.links.flatMap((entry) => {
    if (!entry.type) {
      note('links', `${entry.value} was not imported: choose what kind of link it is.`);
      return [];
    }
    return [{ value: entry.value, type: entry.type } as Link];
  });

  for (const uncertainty of parsed.uncertainties) {
    note(uncertainty.section, uncertainty.message);
  }
  for (const page of parsed.extraction.pagesNeedingReview) {
    note('document', `Page ${page} could not be read completely. Check what was imported from it.`);
  }
  for (const warning of envelope.warnings) {
    if (!warning.code.startsWith('page_')) {
      note('document', warning.message);
    }
  }

  const person = career.person;
  return {
    account: {
      profile: {
        email: career.contacts.email ?? '',
        firstName: person.firstName ?? '',
        lastName: person.lastName ?? '',
        role: person.role ?? '',
        tagline: person.tagline ?? '',
        phone: career.contacts.phone ?? '',
        website: career.contacts.url ?? '',
        city: career.location.city ?? undefined,
        country: career.location.country ?? undefined,
        seniority: oneOf(SENIORITIES, person.seniority),
      },
      experience,
      education,
      languages,
      links,
      skills: career.skills.map((entry) => ({ name: entry.name }) as Skill),
      tools: career.tools.map((entry) => ({ name: entry.name }) as Tool),
      projects,
      recommendations,
    },
    review: { partial: envelope.resultKind === 'partial' || !parsed.extraction.complete, items: dedupe(items) },
  };
}

function dedupe(items: ImportReviewItem[]): ImportReviewItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.section}:${item.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
