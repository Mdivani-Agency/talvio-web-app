import { ResumePDFService, Template, ResumeData, formatUrl, interFont, type RenderOptions } from '@pdf-tlv/resume';
import { RESUME_FONTS } from '@lib/pdf-templates/fonts';
import { pdfSectionOrder } from '@lib/resume/section-order';
import { ResumeForm } from '@lib/types';
import { capitalise, formatDate } from '@lib/utils';

/** Optional template fields (MDI-664), as `@pdf-tlv/resume` reads them. Templates that don't use them ignore them. */
export type TemplateOptionalData = Pick<ResumeData, 'headlineAchievements' | 'skillGroups'>;

export type ResumePdfData = ResumeData;

/**
 * Inter, which the built-in templates are designed with. From 0.3.0 the engine uses Helvetica unless it gets a custom
 * font, so the app passes Inter to keep resumes looking as they did on 0.2.3.
 */
export const RESUME_PDF_FONT = interFont;

type GenerateParams = Parameters<ResumePDFService['generate']>[0];

/**
 * Render with the template fonts (Inter, Source Serif 4, IBM Plex Mono; only the roles a template uses are fetched),
 * falling back to the standard fonts when a file cannot be downloaded (offline, or a network that blocks the font
 * hosts), as 0.2.3 did with Inter. 0.4.0 rejects the whole render instead. A failure is remembered on the service so
 * later renders don't wait on the download again. A render error that is not about the fonts fails the retry too.
 */
export async function generateWithFontFallback(
  service: ResumePDFService,
  params: GenerateParams,
  state: { fontUnavailable: boolean },
): Promise<Uint8Array> {
  if (state.fontUnavailable) {
    return service.generate(params);
  }
  let fontError: unknown;
  try {
    return await service.generate({ ...params, options: { ...params.options, fonts: RESUME_FONTS } });
  } catch (error) {
    fontError = error;
  }
  // Only blame the font when the same render works without it.
  const bytes = await service.generate(params);
  state.fontUnavailable = true;
  console.warn('Resume font unavailable, using the standard font', fontError);
  return bytes;
}

/** The group that holds skills without a group when grouping is on. */
export const UNGROUPED_SKILLS_LABEL = 'Other';

/**
 * Skills in named groups, for templates that show them. Only when the Group skills switch is on and at least one
 * skill has a group; skills without one go under "Other", last.
 */
export function skillGroupsOf(data: Pick<ResumeForm, 'skills' | 'profile'>): TemplateOptionalData['skillGroups'] {
  if (!data.profile?.groupSkills) {
    return undefined;
  }
  const skills = (data.skills ?? []).filter((skill) => skill.name.trim());
  if (!skills.some((skill) => skill.group?.trim())) {
    return undefined;
  }
  const groups = new Map<string, string[]>();
  const other: string[] = [];
  for (const skill of skills) {
    const group = skill.group?.trim();
    if (!group) {
      other.push(skill.name);
      continue;
    }
    groups.set(group, [...(groups.get(group) ?? []), skill.name]);
  }
  return [
    ...[...groups].map(([name, names]) => ({ name, skills: names })),
    ...(other.length ? [{ name: UNGROUPED_SKILLS_LABEL, skills: other }] : []),
  ];
}

function headlineAchievementsOf(data: ResumeForm): TemplateOptionalData['headlineAchievements'] {
  const items = (data.headlineAchievements ?? [])
    .map(({ value, label }) => ({ value: value.trim(), label: label.trim() }))
    .filter(({ value, label }) => value && label);
  return items.length ? items : undefined;
}

function stackOf(stack: string[] | undefined) {
  const items = (stack ?? []).map((item) => item.trim()).filter(Boolean);
  return items.length ? { stack: items } : {};
}

export function getResumePrimaryLink(data: ResumeForm) {
  return data.links?.[0]?.value;
}

export function convertToResumeData(data: ResumeForm): ResumePdfData {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, ...links] = data.links || [];
  const primaryLink = getResumePrimaryLink(data);

  return {
    name: data.profile.firstName + ' ' + data.profile.lastName,
    role: data.profile.role,
    description: data.profile.tagline,
    phone: data.contacts.phone,
    email: data.contacts.email,
    primaryProfile: data.contacts?.url
      ? formatUrl(data.contacts?.url)
      : primaryLink
        ? formatUrl(primaryLink)
        : undefined,
    skills: data.skills?.map(({ name }) => name),
    ...optional('skillGroups', skillGroupsOf(data)),
    ...optional('headlineAchievements', headlineAchievementsOf(data)),
    tools: data.tools?.map(({ name }) => name),
    links: links.map(({ value, type }) => ({
      url: formatUrl(value),
      icon: type,
    })),
    recommendations: data.recommendations?.map((recommendation) => ({
      recommendeeName: recommendation.name,
      url: recommendation.url,
      formattedUrl: formatUrl(recommendation.url),
      description: recommendation.description,
      kind: 'recommendation',
    })),
    experience: data.experience?.map((experience) => ({
      locationType: capitalise(experience.locationType),
      jobTitle: experience.jobTitle,
      dateRange: `${formatDate(experience.startDate)} - ${experience.endDate ? formatDate(experience.endDate) : 'Present'}`,
      company: experience.company,
      employmentType: experience.employmentType,
      companyWithEmploymentType:
        experience.company && experience.employmentType
          ? `${capitalise(experience.company)} • ${capitalise(experience.employmentType)}`
          : capitalise(experience.company),
      description: experience.description,
      ...stackOf(experience.stack),
      kind: 'experience',
    })),
    education: data.education?.map((education) => ({
      school: education.name,
      degree: education.degreeType,
      description: education.description,
      dateRangeShort: `${formatDate(education.startDate)} - ${education.endDate ? formatDate(education.endDate) : 'Present'}`,
      dateRange: `${formatDate(education.startDate)} - ${education.endDate ? formatDate(education.endDate) : 'Present'}`,
      kind: 'education',
    })),
    projects: data.projects?.map((project) => ({
      projectName: project.name,
      url: project.url,
      formattedUrl: project.url ? formatUrl(project.url) : undefined,
      description: project.description,
      kind: 'project',
    })),
    location:
      data.location?.city && data.location?.country
        ? `${data.location.city}, ${data.location.country}`
        : data.location?.city || data.location?.country,
    languages: data.languages?.map(({ language, proficiency }) => `${language} - ${capitalise(proficiency)}`),
  };
}

/** `{ key: value }` when there is a value, else `{}`, so empty optional fields never reach the PDF. */
function optional<K extends string, V>(key: K, value: V | undefined): Partial<Record<K, V>> {
  return value === undefined ? {} : ({ [key]: value } as Record<K, V>);
}

export class ResumeService {
  private readonly $resume: ResumePDFService;
  private readonly $font = { fontUnavailable: false };

  constructor() {
    this.$resume = new ResumePDFService();
    this.$resume.create({
      color: '#000000',
      fontSize: 'md',
      leading: 'md',
      isPreview: true,
      // Text only: there is no /logo.png. 0.2.3 skipped the missing image; 0.4.0 rejects the render instead.
      watermark: {
        text: 'Talvio',
        color: '#1E20D4',
      },
    });
  }

  async generate(data: ResumeForm, template: Template, options: RenderOptions = {}) {
    return generateWithFontFallback(
      this.$resume,
      { data: convertToResumeData(data), template, options, sectionOrder: pdfSectionOrder(data.sectionOrder) },
      this.$font,
    );
  }
}

export const resumeService = new ResumeService();
