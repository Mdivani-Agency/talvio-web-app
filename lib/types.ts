import { z } from "zod";
import {
  accountSchema,
  educationFormSchema,
  experienceSchema,
  headlineAchievementSchema,
  languageSchema,
  linkSchema,
  profileSchema,
  projectFormSchema,
  skillSchema,
  toolSchema,
  recommendationSchema
} from "./schema/account.schema";
import { LanguageProficiency, TemplateKeyEnum } from "./schema/enums";
import { resumeDraftSchema, resumeSchema } from "./schema/resume.schema";
import { Template } from "@pdf-tlv/resume";
import type { TemplateFilter, TemplateStyle } from "./templates-page-copy";

export type User = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AllowEmptyStringForEnum<T> = T extends string ? T | '' : T;
export type RequiredWithEmptyEnums<T> = {
  [K in keyof T]-?: T[K] extends object ? RequiredWithEmptyEnums<T[K]> : AllowEmptyStringForEnum<T[K]>;
};
type Primitive = string | number | boolean | null | undefined;

type Paths<T> = T extends Primitive
  ? never
  : T extends Array<infer U>
    ? '' | `[${number}]` | `[${number}]${Paths<U> extends '' ? '' : `.${Paths<U>}`}`
    : T extends object
      ?
          | ''
          | {
              [K in keyof T & string]: K | `${K}${Paths<T[K]> extends '' ? '' : `.${Paths<T[K]>}`}`;
            }[keyof T & string]
      : never;

export type FlattenedPaths<T> = Paths<T> extends string ? Paths<T> : never;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MarkType = { type: string; attrs?: Record<string, any>; [key: string]: any };

export type Skill = z.infer<typeof skillSchema>;
export type HeadlineAchievement = z.infer<typeof headlineAchievementSchema>;
export type Tool = z.infer<typeof toolSchema>;
export type Link = z.infer<typeof linkSchema>;
export type Language = z.infer<typeof languageSchema>;
export type SkillFields = { skills?: Skill[]; tools?: Tool[]; };
export type Highlights = { languages?: Language[]; links?: Link[]; } & SkillFields;
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationFormSchema>;
export type Project = z.infer<typeof projectFormSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type AccountDto = z.infer<typeof accountSchema>;
export type Account = AccountDto & {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Resume types
export type TemplateKey = z.infer<typeof TemplateKeyEnum>;
export type TemplateItem = {
  name: string;
  template: Template;
  /** Default accent. */
  color: string;
  imageUrl: string;
  description: string;
  key: TemplateKey;
  /** The gallery style this key shows, such as `mint` for every level of Mint. */
  style: TemplateStyle;
  /** Completes "Best for …". */
  bestFor: string;
  filters: readonly TemplateFilter[];
  /** One of the ten templates added in MDI-660; tagged "New" for a while after launch. */
  isNew: boolean;
};

export type TemplateList = Record<'entry' | 'mid' | 'senior', Array<TemplateItem>>;
export type ResumeDto = z.infer<typeof resumeSchema>;
export type ResumeForm = z.infer<typeof resumeDraftSchema>;
export type Resume = ResumeDto & {
  media?: {
    url: string;
    key: string;
  };
  id: string;
  sourceResumeId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PreviewDto = Omit<ResumeDto, 'metadata'> & {
  resume: ResumeForm;
}

// Parsed types

// Enums
export type LanguageProficiency = z.infer<typeof LanguageProficiency>;

// Application tracker (MDI-654)
export type {
  ApplicationLabel,
  ApplicationLink,
  ApplicationStage,
  BoardColumn,
  ClosedStage,
  JobApplication,
  LabelColor,
} from './schema/application.schema';
