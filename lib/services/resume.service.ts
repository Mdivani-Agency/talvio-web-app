import { Config, ResumePDFService, Template, ResumeData, formatUrl } from '@pdf-tlv/resume';
import { ResumeForm } from '@lib/types';
import { capitalise, formatDate } from '@lib/utils';

export function getResumePrimaryLink(data: ResumeForm) {
  return data.links?.[0]?.value;
}

export function convertToResumeData(data: ResumeForm): ResumeData {
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

export class ResumeService {
  private readonly $resume: ResumePDFService;

  constructor() {
    this.$resume = new ResumePDFService();
    this.$resume.create({
      color: '#000',
      fontSize: 'md',
      leading: 'md',
      isPreview: true,
      watermark: {
        text: 'Talvio',
        url: '/logo.png',
        color: '#1E20D4',
      },
    });
  }

  async generate(data: ResumeForm, template: Template, options: Partial<Config> = {}) {
    const resumeData = convertToResumeData(data);
    return this.$resume.generate({ data: resumeData, template, options });
  }
}

export const resumeService = new ResumeService();
