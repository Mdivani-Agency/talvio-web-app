import { AccountDto, ResumeForm } from "@lib/types";
import { JSONContent, generateText } from "@tiptap/react";

export const transformArrToJsonBullets = (arr: { text: string; key: string }[]): JSONContent => {
  return {
    type: 'doc',
    content: [
      {
        type: 'bulletList',
        content: arr.map(({ text, key }) => ({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              marks: [{ type: key }],
              content: [
                {
                  type: 'text',
                  text: text,
                },
              ],
            },
          ],
        })),
      },
    ],
  };
};

export const transformTextToParagraph = (text: string): JSONContent => {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  };
};

export const accountToResume = ({
  profile,
  experience = [],
  education = [],
  recommendations = [],
  projects = [],
  skills = [],
  tools = [],
  languages = [],
}: AccountDto): ResumeForm => {
  return {
    profile: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: profile.role,
      tagline: profile.tagline,
    },
    contacts: {
      email: profile.email,
      phone: profile.phone,
      url: profile.website,
    },
    experience: experience.map(({ keyContributions, achievements, responsibilities, company, jobTitle, startDate, isPresent, endDate, employmentType, locationType }) => ({
      company,
      jobTitle,
      startDate,
      isPresent,
      endDate,
      employmentType,
      locationType,
      description: transformArrToJsonBullets([
        ...(keyContributions || []).map((text) => ({ text, key: 'keyContributions' })),
        ...(achievements || []).map((text) => ({ text, key: 'achievements' })),
        ...(responsibilities || []).map((text) => ({ text, key: 'responsibilities' })),
      ]),
    })),
    education: education.map(({ additionalDetails, name, degreeType, startDate, endDate, isPresent }) => ({
      name,
      degreeType,
      startDate,
      endDate,
      isPresent,
      additionalDetails: transformTextToParagraph(additionalDetails || ''),
    })),
    recommendations: recommendations.map(({ additionalDetails, name, url }) => ({
      name,
      url,
      description: transformTextToParagraph(additionalDetails),
    })),
    projects: projects.map(({ additionalDetails, ...project }) => ({
      name: project.name,
      url: project.url,
      description: transformTextToParagraph(additionalDetails),
    })),
    skills: skills.map(({ name }) => ({
      name,
    })),
    tools: tools.map(({ name }) => ({
      name,
    })),
    languages: languages.map(({ language, proficiency }) => ({
      language,
      proficiency,
    })),
  };
};

export const resumeToAccount = (resume: ResumeForm): AccountDto => {
  return {
    profile: {
      firstName: resume.profile.firstName,
      lastName: resume.profile.lastName,
      role: resume.profile.role,
      tagline: resume.profile.tagline,
      email: resume.contacts.email,
      phone: resume.contacts.phone,
      website: resume.contacts.url,
    },
    experience: resume.experience?.map((experience) => ({
      company: experience.company,
      jobTitle: experience.jobTitle,
      startDate: experience.startDate,
      isPresent: experience.isPresent,
      endDate: experience.endDate,
      employmentType: experience.employmentType,
      locationType: experience.locationType,
      keyContributions: experience.description?.content?.filter((item) => item.marks?.some((mark) => mark.type === 'keyContributions'))?.map((item) => item.text || '') || [],
      achievements: experience.description?.content?.filter((item) => item.marks?.some((mark) => mark.type === 'achievements'))?.map((item) => item.text || '') || [],
      responsibilities: experience.description?.content?.filter((item) => item.marks?.some((mark) => mark.type === 'responsibilities'))?.map((item) => item.text || '') || [],
      description: experience.description ? generateText(experience.description, []) : '',
    })),
    education: resume.education,
    recommendations: resume.recommendations?.map((recommendation) => ({
      name: recommendation.name,
      url: recommendation.url,
      additionalDetails: recommendation.description ? generateText(recommendation.description, []) : '',
    })),
    projects: resume.projects?.map((project) => ({
      name: project.name,
      url: project.url,
      additionalDetails: project.description ? generateText(project.description, []) : '',
    })),
  };
}
