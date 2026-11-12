import { z } from 'zod';

/*
 * The parts of the Talvio LLM service contract (`/llm/v1`, schema version 1.0) the web reads
 * and sends. Written from talvio-llm-service `docs/contracts.md` and `generated/openapi.json`,
 * as for any third-party API: there is no shared package (MDI-439).
 *
 * Responses are checked loosely: unknown fields and unknown enum members are tolerated, as the
 * contract asks of clients for minor versions. Only the fields the web acts on are required.
 */

export const LLM_SCHEMA_VERSION = '1.0';

/** Service limits the web checks before sending (contract `LIMITS`). */
export const LLM_LIMITS = {
  sourceTextChars: 100_000,
  jobDescriptionChars: 5_000,
  questionsPerSet: 5,
  questionRoundsPerSession: 2,
  jobDeadlineMs: 10 * 60_000,
} as const;

export const OPERATIONS = [
  'parse_document',
  'analyze_resume',
  'generate_questions',
  'improve_profile',
  'improve_resume',
  'tailor_resume',
] as const;
export type Operation = (typeof OPERATIONS)[number];

export const TERMINAL_JOB_STATUSES = ['succeeded', 'failed', 'cancelled', 'expired'] as const;
export type TerminalJobStatus = (typeof TERMINAL_JOB_STATUSES)[number];

/** Job error codes a client may retry with POST /jobs/{id}/retry before the deadline. */
export const RETRYABLE_JOB_ERRORS = ['dependency_unavailable', 'internal_error'] as const;

export type ExtractionManifest = {
  extractor: 'pdfjs-dist';
  extractorVersion: string;
  pageCount: number;
  pages: { page: number; start: number; end: number; coverage: 'text' | 'empty' | 'uncertain' }[];
};

export type OperationInput = {
  parse_document:
    | { kind: 'text'; text: string; extraction: ExtractionManifest | null }
    | { kind: 'document'; documentId: string };
  analyze_resume: { sections: string[] };
  generate_questions: { analysisJobId: string | null; round: number; maxQuestions: number };
  improve_profile: { sections: string[]; targetRole: string | null };
  improve_resume: { sections: string[]; targetRole: string | null };
  tailor_resume: { resumeName: string };
};

type SessionBinding = {
  sessionId: string;
  contextRevisionId: string;
  parentJobId: string | null;
};

/** A job request without its idempotency fields; the job runner adds those. */
export type JobRequestBody<O extends Operation = Operation> = {
  [K in O]: {
    operation: K;
    locale: string;
    input: OperationInput[K];
  } & (K extends 'parse_document' ? unknown : SessionBinding);
}[O];

export type CreateJobRequest<O extends Operation = Operation> = JobRequestBody<O> & {
  schemaVersion: typeof LLM_SCHEMA_VERSION;
  /** Also sent as the Idempotency-Key header. */
  clientRequestId: string;
};

const pollAfterMs = z.number().int().min(0).nullable();

export const jobAcceptedSchema = z.looseObject({
  jobId: z.string().min(1),
  status: z.string(),
  pollAfterMs: z.number().int().min(0),
  replayed: z.boolean(),
});
export type JobAccepted = z.infer<typeof jobAcceptedSchema>;

export const jobErrorSchema = z.looseObject({
  code: z.string(),
  message: z.string(),
  retryable: z.boolean(),
  correlationId: z.string(),
});
export type JobError = z.infer<typeof jobErrorSchema>;

/** A result envelope; `result` is typed per operation by the feature that reads it. */
export const resultEnvelopeSchema = z.looseObject({
  jobId: z.string(),
  operation: z.string(),
  contextRevisionId: z.string().nullable(),
  contextHash: z.string().nullable(),
  sourceRevision: z.string().nullable(),
  resultKind: z.string(),
  warnings: z.array(z.looseObject({ code: z.string(), message: z.string() })),
  result: z.unknown(),
});
export type ResultEnvelope = z.infer<typeof resultEnvelopeSchema>;

export const jobSchema = z.looseObject({
  jobId: z.string().min(1),
  operation: z.string(),
  status: z.string(),
  stage: z.string(),
  sessionId: z.string().nullable(),
  contextRevisionId: z.string().nullable(),
  deadlineAt: z.string(),
  pollAfterMs,
  result: resultEnvelopeSchema.nullable(),
  error: jobErrorSchema.nullable(),
});
export type Job = z.infer<typeof jobSchema>;

export const errorBodySchema = z.looseObject({
  error: z.looseObject({
    code: z.string(),
    message: z.string(),
    retryable: z.boolean(),
    correlationId: z.string(),
    issues: z.array(z.looseObject({ path: z.string(), message: z.string() })).optional(),
  }),
});
export type ErrorBody = z.infer<typeof errorBodySchema>;

export function isTerminal(status: string): status is TerminalJobStatus {
  return (TERMINAL_JOB_STATUSES as readonly string[]).includes(status);
}
