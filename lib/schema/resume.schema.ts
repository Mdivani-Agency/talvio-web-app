import { JSONContent } from '@tiptap/react';
import { z } from 'zod';
import {
  DegreeTypeEnum,
  employmentTypeEnum,
  locationTypeEnum,
  TemplateKeyEnum,
} from './enums';
import { MarkType } from '@lib/types';
import {languageSchema, linkSchema, skillSchema, toolSchema } from './account.schema';

export const markValueSchema: z.ZodType<MarkType> = z.object({
  attrs: z.record(z.string(), z.any()).optional(),
  type: z.string(),
});

export const textContentSchema: z.ZodType<JSONContent> = z.lazy(() =>
  z.object({
    type: z.string(),
    text: z.string().optional(),
    attrs: z.object({}).optional(),
    marks: z.array(markValueSchema).optional(),
    content: z.array(textContentSchema).optional(),
  }),
);

const baseExperienceSchema = z.object({
  company: z.string(),
  jobTitle: z.string(),
  startDate: z.iso.datetime(),
  employmentType: employmentTypeEnum,
  locationType: locationTypeEnum,
  endDate: z.iso.datetime(),
  isPresent: z.iso.datetime(),
  achievements: z.array(z.string()),
  responsibilities: z.array(z.string()),
  keyContributions: z.array(z.string()),
});

export const experienceSchema = baseExperienceSchema.partial({
  employmentType: true,
  locationType: true,
  endDate: true,
  isPresent: true,
  achievements: true,
  responsibilities: true,
  keyContributions: true,
});

const educationSchema = z.object({
  name: z.string(),
  degreeType: DegreeTypeEnum,
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  isPresent: z.iso.datetime(),
});

export const formEducationSchema = z.object({
  ...educationSchema.partial({
    isPresent: true,
    endDate: true,
  }).shape,
  description: textContentSchema.optional(),
});

const recommendationSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const formRecommendationSchema = z.object({
  ...recommendationSchema.shape,
  description: textContentSchema,
});

const projectSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const formProjectSchema = z.object({
  ...projectSchema.partial({ url: true }).shape,
  description: textContentSchema,
});

export const resumeExperienceSchema = z.object({
  ...experienceSchema.shape,
  description: textContentSchema.optional(),
});

export const resumeFormSchema = z.object({
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    role: z.string(),
    tagline: z.string().optional(),
  }),
  contacts: z.object({
    email: z.email(),
    phone: z.string().optional(),
    url: z.string().optional(),
  }),
  skills: z.array(skillSchema).optional(),
  tools: z.array(toolSchema).optional(),
  links: z.array(linkSchema).optional(),
  location: z
    .object({
      city: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  languages: z.array(languageSchema).optional(),
  experience: z.array(resumeExperienceSchema).optional(),
  education: z
    .array(
      formEducationSchema.partial({
        isPresent: true,
        endDate: true,
        description: true,
      }),
    )
    .optional(),
  recommendations: z.array(formRecommendationSchema).optional(),
  projects: z.array(formProjectSchema.partial({ url: true })).optional(),
});

export const resumeSchema = z.object({
  metadata: resumeFormSchema,
  name: z.string(),
  template: TemplateKeyEnum,
  color: z.string(),
  fontSize: z.enum(['sm', 'md', 'lg']),
  fontFamily: z.string().optional(),
});
