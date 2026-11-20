import { z } from 'zod';
import {
  DegreeTypeEnum,
  employmentTypeEnum,
  locationTypeEnum,
  LanguageProficiency,
  SeniorityEnum,
} from './enums';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Keep real row ids; drop client list keys like `experience-0`. */
export const persistedIdSchema = z
  .string()
  .transform((value) => (UUID_RE.test(value) ? value : undefined))
  .optional();

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
  /** The "Group skills" switch. Off keeps each skill's group, hidden, so switching it on again restores them. */
  groupSkills: z.boolean(),
});

export const profileSchema = baseProfileSchema.partial({
  tagline: true,
  phone: true,
  website: true,
  city: true,
  country: true,
  seniority: true,
  groupSkills: true,
});

/** Limits shared with the database checks in `20261120000200_template_optional_fields.sql`. */
export const HEADLINE_ACHIEVEMENTS_MAX = 3;
export const HEADLINE_VALUE_MAX = 24;
export const HEADLINE_LABEL_MAX = 60;
export const SKILL_GROUP_NAME_MAX = 40;
export const STACK_MAX = 8;
export const STACK_ITEM_MAX = 30;

export const headlineAchievementSchema = z.object({
  id: persistedIdSchema,
  value: z
    .string()
    .trim()
    .min(1, { message: 'Add the number, such as 40%' })
    .max(HEADLINE_VALUE_MAX, { message: `Keep the number to ${HEADLINE_VALUE_MAX} characters` }),
  label: z
    .string()
    .trim()
    .min(1, { message: 'Say what the number measures' })
    .max(HEADLINE_LABEL_MAX, { message: `Keep what it measures to ${HEADLINE_LABEL_MAX} characters` }),
});

/** While editing: a row may still be empty. Drafts and stored resume content load with this. */
export const headlineAchievementDraftSchema = z.object({
  id: persistedIdSchema,
  value: z.string().max(HEADLINE_VALUE_MAX, { message: `Keep the number to ${HEADLINE_VALUE_MAX} characters` }),
  label: z.string().max(HEADLINE_LABEL_MAX, { message: `Keep what it measures to ${HEADLINE_LABEL_MAX} characters` }),
});

export const headlineAchievementsSchema = z
  .array(headlineAchievementSchema)
  .max(HEADLINE_ACHIEVEMENTS_MAX, { message: `Add up to ${HEADLINE_ACHIEVEMENTS_MAX} headline achievements` });

export const stackItemSchema = z
  .string()
  .trim()
  .min(1, { message: 'Add a technology' })
  .max(STACK_ITEM_MAX, { message: `Keep each technology to ${STACK_ITEM_MAX} characters` });

export const stackSchema = z
  .array(stackItemSchema)
  .max(STACK_MAX, { message: `Add up to ${STACK_MAX} technologies` });

const baseExperienceSchema = z.object({
  id: persistedIdSchema,
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
  stack: stackSchema,
});

export const experienceSchema = baseExperienceSchema.partial({
  id: true,
  employmentType: true,
  locationType: true,
  endDate: true,
  isPresent: true,
  additionalDetails: true,
  achievements: true,
  responsibilities: true,
  keyContributions: true,
  stack: true,
});

const educationSchema = z.object({
  id: persistedIdSchema,
  name: z.string(),
  degreeType: DegreeTypeEnum,
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  isPresent: z.boolean(),
  additionalDetails: z.string(),
});

export const educationFormSchema = z.object({
  ...educationSchema.partial({
    id: true,
    isPresent: true,
    endDate: true,
    additionalDetails: true,
  }).shape,
});

export const recommendationSchema = z.object({
  id: persistedIdSchema,
  name: z.string(),
  url: z.string(),
  additionalDetails: z.string(),
});

export const projectSchema = z.object({
  id: persistedIdSchema,
  name: z.string(),
  url: z.string(),
  additionalDetails: z.string(),
});

export const projectFormSchema = projectSchema.partial({
  id: true,
  url: true,
});

export const linkSchema = z.object({
  id: persistedIdSchema,
  value: z.string(),
  type: z.string(),
});

/** Empty while a new group is being named; an empty group is saved as no group, so its skills show under "Other". */
export const skillGroupNameSchema = z
  .string()
  .trim()
  .max(SKILL_GROUP_NAME_MAX, { message: `Keep the group name to ${SKILL_GROUP_NAME_MAX} characters` });

export const skillSchema = z.object({
  id: persistedIdSchema,
  name: z.string().max(50, { message: 'Skill name must be less than 50 characters' }),
  /** The skill's group, such as "Architecture". Shown by templates with skill groups. */
  group: skillGroupNameSchema.optional(),
});

export const toolSchema = z.object({
  id: persistedIdSchema,
  name: z.string().max(50, { message: 'Tool name must be less than 50 characters' }),
});

export const languageSchema = z.object({
  id: persistedIdSchema,
  language: z.string().min(2, { message: 'Please select a language' }),
  proficiency: LanguageProficiency,
});

export const accountSchema = z.object({
  profile: profileSchema,
  headlineAchievements: headlineAchievementsSchema.optional(),
  experience: z.array(experienceSchema).optional(),
  education: z.array(educationFormSchema).optional(),
  recommendations: z.array(recommendationSchema).optional(),
  projects: z.array(projectFormSchema).optional(),
  skills: z.array(skillSchema).optional(),
  tools: z.array(toolSchema).optional(),
  links: z.array(linkSchema).optional(),
  languages: z.array(languageSchema).optional(),
});
