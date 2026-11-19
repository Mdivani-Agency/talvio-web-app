import { format, isValid, parseISO } from 'date-fns';

import { ENTRY_PRESENT_LABEL, ENTRY_UNTITLED } from '@/lib/onboarding-copy';

/** What a saved entry's row shows: a title, a muted subline, and the name its buttons use. */
export type EntrySummary = { title: string; subline: string; name: string };

type Dated = { startDate?: string | null; endDate?: string | null; isPresent?: boolean | null };

function formatDate(value: string | null | undefined, pattern: string): string {
  if (!value) return '';
  const date = parseISO(value);
  return isValid(date) ? format(date, pattern) : '';
}

/** "Jan 2024 - Present", "2009 - 2013", or one end when the other is missing. */
export function dateRange(entry: Dated, pattern: string): string {
  const start = formatDate(entry.startDate, pattern);
  const end = entry.isPresent ? ENTRY_PRESENT_LABEL : formatDate(entry.endDate, pattern);
  return [start, end].filter(Boolean).join(' - ');
}

const clean = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const joinLine = (...parts: string[]) => parts.filter(Boolean).join(' · ');

export function experienceSummary(entry: Dated & { company?: string | null; jobTitle?: string | null }): EntrySummary {
  const jobTitle = clean(entry.jobTitle);
  const company = clean(entry.company);
  const title = jobTitle || company || ENTRY_UNTITLED;
  return {
    title,
    subline: joinLine(jobTitle ? company : '', dateRange(entry, 'MMM yyyy')),
    name: jobTitle && company ? `${jobTitle} at ${company}` : title,
  };
}

export function educationSummary(entry: Dated & { name?: string | null; degreeType?: string | null }): EntrySummary {
  const school = clean(entry.name);
  const degree = clean(entry.degreeType);
  const title = school || degree || ENTRY_UNTITLED;
  return {
    title,
    subline: joinLine(school ? degree : '', dateRange(entry, 'yyyy')),
    name: title,
  };
}

export function projectSummary(entry: { name?: string | null; url?: string | null }): EntrySummary {
  const title = clean(entry.name) || ENTRY_UNTITLED;
  return { title, subline: clean(entry.url), name: title };
}
