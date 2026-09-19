import { format } from 'date-fns';

import type { Account, AccountDto, Education, Experience } from '@lib/types';
import { employmentTypeEnum, locationTypeEnum } from '@lib/schema/enums';

const EMPLOYMENT_TO_DB: Record<string, string> = {
  'full-time': 'full_time',
  'part-time': 'part_time',
  contract: 'contract',
  'self-employed': 'self_employed',
  volunteer: 'volunteer',
  internship: 'internship',
  apprenticeship: 'apprenticeship',
  seasonal: 'seasonal',
};

const EMPLOYMENT_TO_APP: Record<string, string> = Object.fromEntries(
  Object.entries(EMPLOYMENT_TO_DB).map(([app, db]) => [db, app]),
);

export type ProfileRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
  tagline?: string | null;
  seniority?: string | null;
  city?: string | null;
  country?: string | null;
  created_at: string;
  updated_at: string;
};

export type ContactRow = {
  kind: string;
  value: string;
  is_primary: boolean;
  sort_order: number;
};

export type ExperienceRow = {
  company: string;
  job_title: string;
  employment_type?: string | null;
  location_type?: string | null;
  start_date: string;
  end_date?: string | null;
  is_present: boolean;
  achievements?: string[] | null;
  responsibilities?: string[] | null;
  key_contributions?: string[] | null;
  additional_details?: string | null;
};

export type EducationRow = {
  name: string;
  degree_type: string;
  start_date: string;
  end_date?: string | null;
  is_present: boolean;
  additional_details?: string | null;
};

export type NamedRow = {
  name: string;
  url?: string | null;
  additional_details?: string | null;
};

export type LinkRow = {
  type: string;
  value: string;
};

export type LanguageRow = {
  language: string;
  proficiency: string;
};

export type ProfileCollections = {
  contacts?: ContactRow[];
  experiences?: ExperienceRow[];
  educations?: EducationRow[];
  projects?: NamedRow[];
  recommendations?: NamedRow[];
  skills?: Array<{ name: string }>;
  tools?: Array<{ name: string }>;
  links?: LinkRow[];
  languages?: LanguageRow[];
};

export function toIsoDateTime(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
}

export function toDateOnly(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return format(parsed, 'yyyy-MM-dd');
}

export function toBooleanPresent(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.length > 0;
  }
  return false;
}

export function employmentToApp(value?: string | null) {
  if (!value) {
    return undefined;
  }
  const mapped = EMPLOYMENT_TO_APP[value] ?? value.replaceAll('_', '-');
  const parsed = employmentTypeEnum.safeParse(mapped);
  return parsed.success ? parsed.data : undefined;
}

export function employmentToDb(value?: string | null) {
  if (!value) {
    return undefined;
  }
  return EMPLOYMENT_TO_DB[value] ?? value.replaceAll('-', '_');
}

export function locationToApp(value?: string | null) {
  if (!value) {
    return undefined;
  }
  const parsed = locationTypeEnum.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

function primaryContact(contacts: ContactRow[] | undefined, kind: string) {
  const matches = (contacts ?? []).filter((row) => row.kind === kind);
  return (matches.find((row) => row.is_primary) ?? matches[0])?.value;
}

function contactsFromProfile(profile: AccountDto['profile']) {
  const contacts: Array<{
    kind: 'email' | 'phone' | 'url';
    value: string;
    is_primary: boolean;
    sort_order: number;
  }> = [];

  if (profile.email) {
    contacts.push({ kind: 'email', value: profile.email, is_primary: true, sort_order: 0 });
  }
  if (profile.phone) {
    contacts.push({ kind: 'phone', value: profile.phone, is_primary: true, sort_order: 1 });
  }
  if (profile.website) {
    contacts.push({ kind: 'url', value: profile.website, is_primary: true, sort_order: 2 });
  }

  return contacts;
}

function experienceFromRow(row: ExperienceRow): Experience {
  return {
    company: row.company,
    jobTitle: row.job_title,
    startDate: toIsoDateTime(row.start_date) ?? `${row.start_date}T00:00:00.000Z`,
    endDate: toIsoDateTime(row.end_date),
    isPresent: toBooleanPresent(row.is_present),
    employmentType: employmentToApp(row.employment_type),
    locationType: locationToApp(row.location_type),
    additionalDetails: row.additional_details ?? undefined,
    achievements: row.achievements ?? [],
    responsibilities: row.responsibilities ?? [],
    keyContributions: row.key_contributions ?? [],
  };
}

function educationFromRow(row: EducationRow): Education {
  return {
    name: row.name,
    degreeType: row.degree_type as Education['degreeType'],
    startDate: toIsoDateTime(row.start_date) ?? `${row.start_date}T00:00:00.000Z`,
    endDate: toIsoDateTime(row.end_date),
    isPresent: toBooleanPresent(row.is_present),
    additionalDetails: row.additional_details ?? undefined,
  };
}

export function accountFromProfile(profile: ProfileRow, collections: ProfileCollections = {}): Account {
  return {
    id: profile.user_id,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    profile: {
      firstName: profile.first_name,
      lastName: profile.last_name,
      role: profile.role,
      tagline: profile.tagline ?? undefined,
      seniority: (profile.seniority as AccountDto['profile']['seniority']) ?? 'entry',
      city: profile.city ?? undefined,
      country: profile.country ?? undefined,
      email: primaryContact(collections.contacts, 'email') ?? '',
      phone: primaryContact(collections.contacts, 'phone'),
      website: primaryContact(collections.contacts, 'url'),
    },
    experience: (collections.experiences ?? []).map(experienceFromRow),
    education: (collections.educations ?? []).map(educationFromRow),
    projects: (collections.projects ?? []).map((row) => ({
      name: row.name,
      url: row.url ?? undefined,
      additionalDetails: row.additional_details ?? '',
    })),
    recommendations: (collections.recommendations ?? []).map((row) => ({
      name: row.name,
      url: row.url ?? '',
      additionalDetails: row.additional_details ?? '',
    })),
    skills: (collections.skills ?? []).map((row) => ({ name: row.name })),
    tools: (collections.tools ?? []).map((row) => ({ name: row.name })),
    links: (collections.links ?? []).map((row) => ({ type: row.type, value: row.value })),
    languages: (collections.languages ?? []).map((row) => ({
      language: row.language,
      proficiency: row.proficiency as NonNullable<AccountDto['languages']>[number]['proficiency'],
    })),
  };
}

export function accountDtoToSavePayload(account: AccountDto) {
  return {
    profile: {
      firstName: account.profile.firstName,
      lastName: account.profile.lastName,
      role: account.profile.role,
      tagline: account.profile.tagline,
      seniority: account.profile.seniority ?? 'entry',
      city: account.profile.city,
      country: account.profile.country,
    },
    contacts: contactsFromProfile(account.profile),
    experience: (account.experience ?? []).map((row, index) => ({
      company: row.company,
      jobTitle: row.jobTitle,
      startDate: toDateOnly(row.startDate),
      endDate: toDateOnly(row.endDate),
      isPresent: toBooleanPresent(row.isPresent),
      employmentType: employmentToDb(row.employmentType),
      locationType: row.locationType,
      additionalDetails: row.additionalDetails,
      achievements: row.achievements ?? [],
      responsibilities: row.responsibilities ?? [],
      keyContributions: row.keyContributions ?? [],
      sortOrder: index,
    })),
    education: (account.education ?? []).map((row, index) => ({
      name: row.name,
      degreeType: row.degreeType,
      startDate: toDateOnly(row.startDate),
      endDate: toDateOnly(row.endDate),
      isPresent: toBooleanPresent(row.isPresent),
      additionalDetails: row.additionalDetails,
      sortOrder: index,
    })),
    projects: (account.projects ?? []).map((row, index) => ({
      name: row.name,
      url: row.url,
      additionalDetails: row.additionalDetails,
      sortOrder: index,
    })),
    recommendations: (account.recommendations ?? []).map((row, index) => ({
      name: row.name,
      url: row.url,
      additionalDetails: row.additionalDetails,
      sortOrder: index,
    })),
    skills: (account.skills ?? []).map((row, index) => ({ name: row.name, sortOrder: index })),
    tools: (account.tools ?? []).map((row, index) => ({ name: row.name, sortOrder: index })),
    links: (account.links ?? []).map((row, index) => ({
      type: row.type,
      value: row.value,
      sortOrder: index,
    })),
    languages: (account.languages ?? []).map((row, index) => ({
      language: row.language,
      proficiency: row.proficiency,
      sortOrder: index,
    })),
  };
}
