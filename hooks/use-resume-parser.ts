import { useCallback, useEffect, useRef, useState } from 'react';

import { parseResume } from '@lib/clients/llm.client';
import { featureFlags } from '@lib/flags';
import type { LlmError } from '@lib/llm/errors';
import { importedAccount, importTextProblem, pdfTextRequest, type ImportReview } from '@lib/llm/parse-document';
import { useUserSession } from '@lib/providers';
import type { AccountDto } from '@lib/types';
import { transformFromParsedToAccount } from '@lib/utils/forms';

import { useLlmJob } from './use-llm-job';
import { usePdfText } from './use-pdf-text';

type Events = {
  /**
   * The imported account. `sourceText` is the extracted PDF text or the pasted text that was parsed.
   * `review` lists what the user should check; it is null on the legacy route, which reports nothing.
   */
  onResumeParsed: (account: AccountDto, sourceText: string, review: ImportReview | null) => void;
  onError: (error: Error) => void;
};

type Options = {
  /** Which import this is; a reload resumes a running import only in the same place. */
  surface: 'onboarding' | 'resume';
};

/** The stored job for a user's import in one place (see useLlmJob). */
export function importJobStorageKey(userId: string, surface: Options['surface']) {
  return `talvio-llm-job:v1:${userId}:import:${surface}`;
}

/**
 * Reads a resume from a PDF or pasted text into account values (MDI-221). With
 * NEXT_PUBLIC_FLAG_LLM_SERVICE on, it runs a parse_document job on the LLM service, which survives
 * a reload; otherwise it calls the legacy `/api/resume/parse` route.
 */
export const useResumeParser = (events: Events, { surface }: Options) => {
  const service = featureFlags().llmService;
  const { session } = useUserSession();
  const userId = session?.user.id ?? null;
  const [legacyLoading, setLegacyLoading] = useState(false);
  const { parsePdf, extractPdfPages, parsing } = usePdfText();
  const job = useLlmJob({ storageKey: service && userId ? importJobStorageKey(userId, surface) : null });
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Deliver a finished job once, then forget it, so a reload does not offer it again.
  const { state, clear, request } = job;
  useEffect(() => {
    if (state.phase === 'succeeded') {
      const sent = request();
      const sourceText = sent?.operation === 'parse_document' && sent.input.kind === 'text' ? sent.input.text : '';
      try {
        const { account, review } = importedAccount(state.result);
        eventsRef.current.onResumeParsed(account, sourceText, review);
      } catch {
        eventsRef.current.onError(new Error('Failed to parse resume'));
      }
      clear();
      return;
    }
    if (state.phase === 'failed') {
      const error: LlmError = state.error;
      eventsRef.current.onError(error);
      // A submit that got no answer keeps its key: importing the same text again rejoins it.
      if (error.code !== 'network_error') {
        clear();
      }
    }
  }, [clear, request, state]);

  const parseLegacy = useCallback(async (readText: () => Promise<string>) => {
    setLegacyLoading(true);
    try {
      const text = await readText();
      const parsedResume = await parseResume(text);
      if (parsedResume) {
        eventsRef.current.onResumeParsed(transformFromParsedToAccount(parsedResume), text, null);
      }
    } catch (error) {
      eventsRef.current.onError(error as Error);
    } finally {
      setLegacyLoading(false);
    }
  }, []);

  const parseWithService = useCallback(
    (text: string, extraction: ReturnType<typeof pdfTextRequest>['extraction'] | null) => {
      const problem = importTextProblem(text, extraction?.pageCount ?? null);
      if (problem) {
        eventsRef.current.onError(new Error(problem));
        return;
      }
      job.start({ operation: 'parse_document', locale: 'en-US', input: { kind: 'text', text, extraction } });
    },
    [job],
  );

  const parseResumeText = useCallback(
    async (file: File) => {
      if (!service) {
        return parseLegacy(async () => parsePdf(Buffer.from(await file.arrayBuffer())));
      }
      try {
        const { pages, version } = await extractPdfPages(Buffer.from(await file.arrayBuffer()));
        const { text, extraction } = pdfTextRequest(pages, version);
        parseWithService(text, extraction);
      } catch (error) {
        eventsRef.current.onError(error as Error);
      }
    },
    [extractPdfPages, parseLegacy, parsePdf, parseWithService, service],
  );

  const parsePastedText = useCallback(
    async (text: string) => (service ? parseWithService(text, null) : parseLegacy(async () => text)),
    [parseLegacy, parseWithService, service],
  );

  return {
    loading: legacyLoading || job.busy,
    extracting: parsing,
    /** True while the LLM service cannot be reached; the import continues when it can. */
    offline: (state.phase === 'submitting' || state.phase === 'running') && state.offline,
    cancel: job.cancel,
    parseResumeText,
    parsePastedText,
  };
};
