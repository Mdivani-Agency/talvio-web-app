import { z } from "zod";
import {
  accountSchema,
  educationFormSchema,
  experienceSchema,
  languageSchema,
  linkSchema,
  profileSchema,
  projectFormSchema,
  skillSchema,
  toolSchema,
  recommendationSchema
} from "./schema/account.schema";
import { LanguageProficiency } from "./schema/enums";
import { parsedAccountSchema } from "./schema/parsed.schema";
import { questionSchema } from "./clients/openai.client";

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

export type Skill = z.infer<typeof skillSchema>;
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

// Parsed types
export type ParsedAccount = z.infer<typeof parsedAccountSchema>;

// Enums
export type LanguageProficiency = z.infer<typeof LanguageProficiency>;

export type FeedbackQuestions = z.infer<typeof questionSchema>;
