import { z } from 'zod';

/**
 * The application tracker (MDI-654). Stages, label colours and limits mirror the database
 * (`supabase/migrations/20261120000200_job_applications.sql`); the database stays the source of truth.
 */
export const APPLICATION_STAGES = ['saved', 'applied', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn'] as const;
export const applicationStageSchema = z.enum(APPLICATION_STAGES);
export type ApplicationStage = z.infer<typeof applicationStageSchema>;

/** The outcomes that share the board's Closed column. */
export const CLOSED_STAGES = ['accepted', 'rejected', 'withdrawn'] as const satisfies readonly ApplicationStage[];
export type ClosedStage = (typeof CLOSED_STAGES)[number];

/** The board's five columns, left to right. */
export const BOARD_COLUMNS = ['saved', 'applied', 'interview', 'offer', 'closed'] as const;
export type BoardColumn = (typeof BOARD_COLUMNS)[number];

export const LABEL_COLORS = ['gray', 'blue', 'green', 'amber', 'red', 'pink', 'purple', 'teal'] as const;
export const labelColorSchema = z.enum(LABEL_COLORS);
export type LabelColor = z.infer<typeof labelColorSchema>;

export const APPLICATION_TEXT_MAX = 300;
export const APPLICATION_LABELS_MAX = 10;
export const APPLICATION_LINKS_MAX = 10;
export const LABEL_NAME_MAX = 40;
export const LINK_NAME_MAX = 100;
export const LINK_URL_MAX = 2048;

const HTTP_URL = /^https?:\/\/\S+$/i;

export const applicationLabelSchema = z.object({
  name: z.string().trim().min(1).max(LABEL_NAME_MAX),
  color: labelColorSchema,
});
export type ApplicationLabel = z.infer<typeof applicationLabelSchema>;

export const applicationLinkSchema = z.object({
  name: z.string().trim().min(1).max(LINK_NAME_MAX),
  url: z.string().trim().max(LINK_URL_MAX).regex(HTTP_URL),
});
export type ApplicationLink = z.infer<typeof applicationLinkSchema>;

const labelListSchema = z
  .array(applicationLabelSchema)
  .max(APPLICATION_LABELS_MAX)
  .refine((labels) => new Set(labels.map((label) => label.name.trim().toLowerCase())).size === labels.length, {
    message: 'Each label can be used once',
  });

const optionalText = z.string().max(APPLICATION_TEXT_MAX).nullable();
const isoDate = z.iso.date();

/** One card, as the app uses it. Dates are `YYYY-MM-DD`; timestamps are ISO strings. */
export const jobApplicationSchema = z.object({
  id: z.string(),
  position: z.string().trim().min(1).max(APPLICATION_TEXT_MAX),
  company: z.string().trim().min(1).max(APPLICATION_TEXT_MAX),
  stage: applicationStageSchema,
  sortOrder: z.number(),
  location: optionalText,
  salary: optionalText,
  contact: optionalText,
  appliedOn: isoDate.nullable(),
  nextStepOn: isoDate.nullable(),
  nextStep: optionalText,
  resumeId: z.string().nullable(),
  labels: labelListSchema,
  links: z.array(applicationLinkSchema).max(APPLICATION_LINKS_MAX),
  stageChangedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type JobApplication = z.infer<typeof jobApplicationSchema>;

/** The Add application dialog. Empty optional fields are `''`. */
export const addApplicationFormSchema = z.object({
  position: z
    .string()
    .trim()
    .min(1, { message: 'Enter the position' })
    .max(APPLICATION_TEXT_MAX, { message: `Use ${APPLICATION_TEXT_MAX} characters or fewer` }),
  company: z
    .string()
    .trim()
    .min(1, { message: 'Enter the company' })
    .max(APPLICATION_TEXT_MAX, { message: `Use ${APPLICATION_TEXT_MAX} characters or fewer` }),
  jobPostUrl: z
    .string()
    .trim()
    .max(LINK_URL_MAX, { message: 'This link is too long' })
    .refine((value) => value === '' || HTTP_URL.test(value), { message: 'Enter a link that starts with https://' }),
  stage: applicationStageSchema,
  appliedOn: z.union([z.literal(''), isoDate], { message: 'Enter a valid date' }),
  resumeId: z.string(),
});
export type AddApplicationFormValues = z.input<typeof addApplicationFormSchema>;

export function isClosedStage(stage: ApplicationStage): stage is ClosedStage {
  return (CLOSED_STAGES as readonly ApplicationStage[]).includes(stage);
}

/** The board column a stage is shown in. */
export function boardColumnOf(stage: ApplicationStage): BoardColumn {
  return isClosedStage(stage) ? 'closed' : stage;
}
