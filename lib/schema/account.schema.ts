import { z } from 'zod';
import {
  DegreeTypeEnum,
  employmentTypeEnum,
  locationTypeEnum,
  LanguageProficiency,
  SeniorityEnum,
} from './enums';

const baseProfileSchema = z.object({
  email: z.string({ message: 'Email is required' }).email({ message: 'Invalid email address' }),
  firstName: z.string({ message: 'First name is required' }),
  lastName: z.string({ message: 'Last name is required' }),
  role: z.string({ message: 'Role is required' }),
  tagline: z.string(),
  phone: z.string(),
  website: z.string(),
  city: z.string(),
  country: z.string(),
  seniority: SeniorityEnum,
});

export const profileSchema = baseProfileSchema.partial({
  tagline: true,
  phone: true,
  website: true,
  city: true,
  country: true,
  seniority: true,
});

const baseExperienceSchema = z.object({
  company: z.string(),
  jobTitle: z.string(),
  startDate: z.iso.datetime(),
  employmentType: employmentTypeEnum,
  locationType: locationTypeEnum,
  endDate: z.iso.datetime(),
  isPresent: z.boolean(),
  additionalDetails: z.string(),
  achievements: z.array(z.string()),
  responsibilities: z.array(z.string()),
  keyContributions: z.array(z.string()),
});

export const experienceSchema = baseExperienceSchema.partial({
  employmentType: true,
  locationType: true,
  endDate: true,
  isPresent: true,
  additionalDetails: true,
  achievements: true,
  responsibilities: true,
  keyContributions: true,
});

const educationSchema = z.object({
  name: z.string(),
  degreeType: DegreeTypeEnum,
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  isPresent: z.boolean(),
  additionalDetails: z.string(),
});

export const educationFormSchema = z.object({
  ...educationSchema.partial({
    isPresent: true,
    endDate: true,
    additionalDetails: true,
  }).shape,
});

export const recommendationSchema = z.object({
  name: z.string(),
  url: z.string(),
  additionalDetails: z.string(),
});

export const projectSchema = z.object({
  name: z.string(),
  url: z.string(),
  additionalDetails: z.string(),
});

export const projectFormSchema = projectSchema.partial({
  url: true,
});

export const linkSchema = z.object({
  value: z.string(),
  type: z.string(),
});

export const skillSchema = z.object({
  name: z.string().max(50, { message: 'Skill name must be less than 50 characters' }),
});

export const toolSchema = z.object({
  name: z.string().max(50, { message: 'Tool name must be less than 50 characters' }),
});

export const languageSchema = z.object({
  language: z.string().min(2, { message: 'Please select a language' }),
  proficiency: LanguageProficiency,
});

export const accountSchema = z.object({
  profile: profileSchema,
  experience: z.array(experienceSchema).optional(),
  education: z.array(educationFormSchema).optional(),
  recommendations: z.array(recommendationSchema).optional(),
  projects: z.array(projectFormSchema).optional(),
  skills: z.array(skillSchema).optional(),
  tools: z.array(toolSchema).optional(),
  links: z.array(linkSchema).optional(),
  languages: z.array(languageSchema).optional(),
});
