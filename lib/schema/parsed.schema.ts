import { z } from 'zod';
import {
  DegreeTypeEnum,
  employmentTypeEnum,
  locationTypeEnum,
  LanguageProficiency,
  SeniorityEnum,
} from './enums';

const baseProfileSchema = z.object({
  email: z.email().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  role: z.string().nullable(),
  tagline: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  seniority: SeniorityEnum.nullable(),
});

export const experienceSchema = z.object({
  company: z.string().nullable(),
  jobTitle: z.string().nullable(),
  startDate: z.iso.datetime().or(z.literal('')).nullable(),
  endDate: z.iso.datetime().or(z.literal('')).nullable(),
  isPresent: z.iso.datetime().or(z.literal('')).nullable(),
  employmentType: employmentTypeEnum.or(z.literal('')).nullable(),
  locationType: locationTypeEnum.or(z.literal('')).nullable(),
  additionalDetails: z.string().nullable(),
  achievements: z.array(z.string()).nullable(),
  responsibilities: z.array(z.string()).nullable(),
  keyContributions: z.array(z.string()).nullable(),
});

export const educationSchema = z.object({
  name: z.string().nullable(),
  degreeType: DegreeTypeEnum.or(z.literal('')).nullable(),
  startDate: z.iso.datetime().or(z.literal('')).nullable(),
  endDate: z.iso.datetime().or(z.literal('')).nullable(),
  isPresent: z.iso.datetime().or(z.literal('')).nullable(),
  additionalDetails: z.string().nullable(),
});

const recommendationSchema = z.object({
  name: z.string().nullable(),
  url: z.string().nullable(),
  additionalDetails: z.string().nullable(),
});

const projectSchema = z.object({
  name: z.string().nullable(),
  url: z.string().nullable(),
  additionalDetails: z.string().nullable(),
});

export const linkSchema = z.object({
  value: z.string().nullable(),
  type: z.string().nullable(),
});

export const skillSchema = z.object({
  name: z.string().nullable(),
});

export const toolSchema = z.object({
  name: z.string().nullable(),
});

export const languageSchema = z.object({
  language: z.string().nullable(),
  proficiency: LanguageProficiency.or(z.literal('')).nullable(),
});

export const parsedAccountSchema = z.object({
  profile: baseProfileSchema.nullable(),
  experience: z.array(experienceSchema).nullable(),
  education: z.array(educationSchema).nullable(),
  recommendations: z.array(recommendationSchema).nullable(),
  projects: z.array(projectSchema).nullable(),
  skills: z.array(skillSchema).nullable(),
  tools: z.array(toolSchema).nullable(),
  links: z.array(linkSchema).nullable(),
  languages: z.array(languageSchema).nullable(),
});
