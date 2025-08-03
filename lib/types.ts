import { z } from "zod";
import { accountSchema, formEducationSchema, experienceSchema, languageSchema, linkSchema, profileSchema, skillSchema, toolSchema } from "./schema/account.schema";

export type Skill = z.infer<typeof skillSchema>;
export type Tool = z.infer<typeof toolSchema>;
export type Link = z.infer<typeof linkSchema>;
export type Language = z.infer<typeof languageSchema>;
export type SkillFields = { skills?: Skill[]; tools?: Tool[]; };
export type Highlights = { languages?: Language[]; links?: Link[]; } & SkillFields;
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof formEducationSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Account = z.infer<typeof accountSchema>;
