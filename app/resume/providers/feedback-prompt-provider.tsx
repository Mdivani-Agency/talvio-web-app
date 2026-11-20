'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { submitWrapper } from '@app/actions/action.utils';
import { fetchFeedbackPromptDue, feedbackPromptDueKey } from '@app/resume/query/use-feedback-prompt';
import { recordFeedbackPrompt } from '@app/resume/query/use-record-feedback-prompt';
import { recordTrustpilotClick } from '@app/resume/query/use-record-trustpilot-click';
import { submitFeedback } from '@app/resume/query/use-submit-feedback';
import { FeedbackModal } from '@components/modals';
import { featureFlags } from '@lib/flags';
import { useUserSession } from '@lib/providers';
import type { Resume } from '@lib/types';

type FeedbackPromptContextValue = {
  /** Call after the download of a newly generated PDF has started. Never throws and never delays the caller. */
  notifyNewPdf: (resume: Pick<Resume, 'id'>) => void;
  /** The editor reports its Generate dialog, so the prompt never covers it. */
  setGenerateDialogOpen: (open: boolean) => void;
};

const noop: FeedbackPromptContextValue = {
  notifyNewPdf: () => undefined,
  setGenerateDialogOpen: () => undefined,
};

const FeedbackPromptContext = createContext<FeedbackPromptContextValue>(noop);

export function useFeedbackPrompt() {
  return useContext(FeedbackPromptContext);
}

/**
 * The review prompt after a new resume PDF (MDI-652), behind `feedbackPrompt`. Lives in the `/resume` layout so it
 * survives the editor moving to a new resume id after a draft is generated.
 *
 * Order: the PDF download starts → `feedback_prompt_due` → the Generate dialog has closed → `record_feedback_prompt`
 * → the prompt opens. The database counts the prompt when it opens, so Close, "Not now" and sending a message all
 * count. A failed check or record call shows nothing and never touches the download.
 */
export function FeedbackPromptProvider({ children }: { children: ReactNode }) {
  const { session } = useUserSession();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [openFor, setOpenFor] = useState<{ resumeId: string } | null>(null);
  const busy = useRef(false);
  const dialogOpen = useRef(false);
  const waiters = useRef<Array<() => void>>([]);

  const setGenerateDialogOpen = useCallback((open: boolean) => {
    dialogOpen.current = open;
    if (!open) {
      const ready = waiters.current;
      waiters.current = [];
      ready.forEach((resolve) => resolve());
    }
  }, []);

  const generateDialogClosed = useCallback(
    () =>
      dialogOpen.current
        ? new Promise<void>((resolve) => {
            waiters.current.push(resolve);
          })
        : Promise.resolve(),
    [],
  );

  const notifyNewPdf = useCallback(
    (resume: Pick<Resume, 'id'>) => {
      if (!featureFlags().feedbackPrompt || !userId || busy.current) {
        return;
      }
      busy.current = true;
      void (async () => {
        try {
          const due = await queryClient.fetchQuery({
            queryKey: feedbackPromptDueKey(userId),
            queryFn: () => fetchFeedbackPromptDue(),
            staleTime: 0,
            retry: false,
          });
          if (due !== 'due') {
            busy.current = false;
            return;
          }
          await generateDialogClosed();
          if (!(await recordFeedbackPrompt())) {
            busy.current = false;
            return;
          }
          setOpenFor({ resumeId: resume.id });
        } catch {
          // The prompt is optional: a failed check or record call shows nothing.
          busy.current = false;
        } finally {
          void queryClient.invalidateQueries({ queryKey: feedbackPromptDueKey(userId) });
        }
      })();
    },
    [generateDialogClosed, queryClient, userId],
  );

  const close = useCallback(() => {
    setOpenFor(null);
    busy.current = false;
  }, []);

  const value = useMemo(() => ({ notifyNewPdf, setGenerateDialogOpen }), [notifyNewPdf, setGenerateDialogOpen]);

  return (
    <FeedbackPromptContext.Provider value={value}>
      {children}
      <FeedbackModal
        open={openFor !== null}
        onClose={close}
        onTrustpilot={() => {
          // Never ask again. A failed call is not shown: the user is already on their way to Trustpilot.
          void recordTrustpilotClick()
            .catch(() => undefined)
            .finally(() => queryClient.invalidateQueries({ queryKey: feedbackPromptDueKey(userId) }));
        }}
        onSubmit={(comment) =>
          submitWrapper({
            fn: () => submitFeedback({ comment, resumeId: openFor?.resumeId ?? null }),
          })
        }
      />
    </FeedbackPromptContext.Provider>
  );
}
