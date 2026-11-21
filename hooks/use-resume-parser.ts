import { useCallback, useEffect, useRef, useState } from 'react';

import type { LlmError } from '@lib/llm/errors';
import { importedAccount, importTextProblem, pdfTextRequest, type ImportReview } from '@lib/llm/parse-document';
import { useUserSession } from '@lib/providers';
import type { AccountDto } from '@lib/types';

import { useLlmJob } from './use-llm-job';
import { usePdfText } from './use-pdf-text';

type Events = {
  /**
   * The imported account. `sourceText` is the extracted PDF text or the pasted text that was parsed.
   * `review` lists what the user should check.
   */
  onResumeParsed: (account: AccountDto, sourceText: string, review: ImportReview) => void;
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
 * Reads a resume from a PDF or pasted text into account values (MDI-221) with a parse_document job
 * on the LLM service, which survives a reload.
 */
export const useResumeParser = (events: Events, { surface }: Options) => {
  const { session } = useUserSession();
  const userId = session?.user.id ?? null;
  // Reading a PDF before its job starts counts as busy, and only the latest selection may submit.
  const [reading, setReading] = useState(false);
  const readSeq = useRef(0);
  const { extractPdfPages, parsing } = usePdfText();
  const job = useLlmJob({ storageKey: userId ? importJobStorageKey(userId, surface) : null });
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Deliver a finished job once, then forget it, so a reload does not offer it again.
  const { state, clear, request, unsubmitted } = job;
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
      // A submit that got no answer (offline, or a proxy timeout after the service may have admitted
      // it) keeps its key: importing the same text again rejoins that job instead of starting another.
      if (!unsubmitted()) {
        clear();
      }
    }
  }, [clear, request, state, unsubmitted]);

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
      const seq = ++readSeq.current;
      setReading(true);
      try {
        const { pages, version } = await extractPdfPages(Buffer.from(await file.arrayBuffer()));
        if (seq !== readSeq.current) {
          return;
        }
        const { text, extraction } = pdfTextRequest(pages, version);
        parseWithService(text, extraction);
      } catch (error) {
        if (seq === readSeq.current) {
          eventsRef.current.onError(error as Error);
        }
      } finally {
        if (seq === readSeq.current) {
          setReading(false);
        }
      }
    },
    [extractPdfPages, parseWithService],
  );

  const parsePastedText = useCallback(
    async (text: string) => {
      // A newer paste wins over a PDF that is still being read.
      readSeq.current += 1;
      setReading(false);
      parseWithService(text, null);
    },
    [parseWithService],
  );

  /** Stops the import: a PDF still being read is dropped, and a running job is cancelled. */
  const stop = useCallback(() => {
    readSeq.current += 1;
    setReading(false);
    if (job.busy) {
      job.cancel();
    }
  }, [job]);

  /**
   * Leaves a failed import for good: also forgets a submission that got no answer, which is otherwise kept so that
   * importing the same text again rejoins it. Without this, that stored job could resume after a reload and replace
   * the edits made since.
   */
  const dismiss = useCallback(() => {
    readSeq.current += 1;
    setReading(false);
    clear();
  }, [clear]);

  return {
    loading: reading || job.busy,
    /** Which part of the import is running, for the page lock's steps: reading the PDF, or the service's job. */
    stage: reading ? ('reading' as const) : job.busy ? ('parsing' as const) : null,
    extracting: parsing,
    /** True while the LLM service cannot be reached; the import continues when it can. */
    offline: (state.phase === 'submitting' || state.phase === 'running') && state.offline,
    cancel: job.cancel,
    stop,
    dismiss,
    parseResumeText,
    parsePastedText,
  };
};
