import { AccountDto, ResumeForm } from "@lib/types";
import { JSONContent } from "@tiptap/react";

export const transformArrToJsonBullets = (arr: string[]): JSONContent => {
  return {
    type: 'doc',
    content: [
      {
        type: 'bulletList',
        content: arr.map((item) => ({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: item,
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
    experience: experience.map((experience) => ({
      ...experience,
      description: transformArrToJsonBullets([
        ...(experience.keyContributions || []),
        ...(experience.achievements || []),
        ...(experience.responsibilities || []),
      ]),
    })),
    education,
    recommendations: recommendations.map((recommendation) => ({
      ...recommendation,
      description: transformTextToParagraph(recommendation.additionalDetails),
    })),
    projects: projects.map((project) => ({
      ...project,
      description: transformTextToParagraph(project.additionalDetails),
    })),
    skills,
    tools,
    languages,
  };
};
