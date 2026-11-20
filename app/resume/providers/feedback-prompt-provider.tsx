'use client';

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

import { submitWrapper } from '@app/actions/action.utils';
import { fetchFeedbackPromptDue, feedbackPromptDueKey } from '@app/resume/query/use-feedback-prompt';
import { recordFeedbackPrompt } from '@app/resume/query/use-record-feedback-prompt';
import { recordTrustpilotClick } from '@app/resume/query/use-record-trustpilot-click';
import { submitFeedback } from '@app/resume/query/use-submit-feedback';
import { groupByColumn, sortOrderAtEnd, todayIso } from '@app/account/applications/board';
import { fetchAllApplications } from '@app/account/applications/query/use-applications';
import { useCreateApplication } from '@app/account/applications/query/use-create-application';
import { fetchCardsForResumes } from '@app/account/applications/query/use-resume-cards';
import { AddApplicationDialog } from '@app/account/applications/views/add-application-dialog';
import { TrackerPromptBar } from '@app/resume/views/tracker-prompt-bar';
import { FeedbackModal } from '@components/modals';
import { APPLICATION_ADDED_MESSAGE, VIEW_IN_TRACKER_LABEL, cardHref } from '@/lib/applications-copy';
import {
  choosePostGeneratePrompt,
  dismissTrackerPrompt,
  tailoredJobFor,
  trackerPromptDismissed,
  trackerResumeIds,
} from '@/lib/post-generate-prompts';
import { featureFlags } from '@lib/flags';
import { useUserSession } from '@lib/providers';
import { boardColumnOf, type AddApplicationFormValues } from '@lib/schema/application.schema';
import type { ApplicationStage, Resume } from '@lib/types';

type FeedbackPromptContextValue = {
  /** Call after the download of a newly generated PDF has started. Never throws and never delays the caller. */
  notifyNewPdf: (resume: Pick<Resume, 'id' | 'sourceResumeId'>) => void;
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
 * What shows after a new resume PDF: the "Add to tracker" bar (MDI-658, behind `applicationTracker`) or the review
 * prompt (MDI-652, behind `feedbackPrompt`), never both. `choosePostGeneratePrompt` decides: the bar wins, and the
 * review prompt is then neither checked nor recorded, so it waits for the next generation. Lives in the `/resume`
 * layout so it survives the editor moving to a new resume id after a draft is generated.
 *
 * The bar is due when no card links the resume (or its generated original) and it was not dismissed for that resume
 * on this device.
 *
 * Order: the PDF download starts → `feedback_prompt_due` → the Generate dialog has closed → `record_feedback_prompt`
 * → the prompt opens. The database counts the prompt when it opens, so Close, "Not now" and sending a message all
 * count. A failed check or record call shows nothing and never touches the download.
 */
/** True when no card links the resume or its family and the bar was not dismissed for it here. A failed check is false. */
async function isTrackerDue(userId: string, resume: Pick<Resume, 'id' | 'sourceResumeId'>): Promise<boolean> {
  const ids = trackerResumeIds(resume);
  if (trackerPromptDismissed(userId, ids)) {
    return false;
  }
  try {
    return Object.keys(await fetchCardsForResumes(ids)).length === 0;
  } catch {
    return false;
  }
}

export function FeedbackPromptProvider({ children }: { children: ReactNode }) {
  const { session } = useUserSession();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [openFor, setOpenFor] = useState<{ resumeId: string } | null>(null);
  const pathname = usePathname();
  // The bar belongs to the page it appeared on, and to the generated resume's own page (the editor moves there after a
  // draft or a new resume is generated). Leaving for anywhere else clears it, so it never offers a resume that is not
  // the one being viewed.
  const [tracker, setTracker] = useState<{ resume: Pick<Resume, 'id' | 'sourceResumeId'>; path: string | null } | null>(
    null,
  );
  if (tracker && pathname !== tracker.path && pathname !== `/resume/${tracker.resume.id}`) {
    setTracker(null);
  }
  const trackerFor = tracker?.resume ?? null;
  // The bar opens from an async flow; it records the page that is current when it appears.
  const currentPath = useRef(pathname);
  useEffect(() => {
    currentPath.current = pathname;
  }, [pathname]);
  const [addOpen, setAddOpen] = useState(false);
  const createApplication = useCreateApplication(userId);
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
    (resume: Pick<Resume, 'id' | 'sourceResumeId'>) => {
      const flags = featureFlags();
      if ((!flags.feedbackPrompt && !flags.applicationTracker) || !userId || busy.current) {
        return;
      }
      busy.current = true;
      // The page the PDF was generated on. The checks below are async; if the user has gone elsewhere by the time
      // they finish, the bar is not shown.
      const origin = currentPath.current;
      void (async () => {
        try {
          const trackerDue = flags.applicationTracker ? await isTrackerDue(userId, resume) : false;
          const feedbackDue =
            !trackerDue &&
            flags.feedbackPrompt &&
            (await queryClient.fetchQuery({
              queryKey: feedbackPromptDueKey(userId),
              queryFn: () => fetchFeedbackPromptDue(),
              staleTime: 0,
              retry: false,
            })) === 'due';
          const prompt = choosePostGeneratePrompt({ trackerDue, feedbackDue });
          if (prompt === null) {
            busy.current = false;
            return;
          }
          await generateDialogClosed();
          if (prompt === 'tracker') {
            if (currentPath.current === origin || currentPath.current === `/resume/${resume.id}`) {
              setTracker({ resume, path: origin });
            }
            busy.current = false;
            return;
          }
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

  // "Add to tracker": the resume linked, Applied today, and the job from "Tailor to a job" when this device has it.
  const trackerDefaults = useMemo<Partial<AddApplicationFormValues> | undefined>(() => {
    if (!trackerFor || !userId) {
      return undefined;
    }
    const job = tailoredJobFor(userId, trackerResumeIds(trackerFor));
    return {
      resumeId: trackerFor.id,
      stage: 'applied',
      appliedOn: todayIso(new Date()),
      position: job?.position ?? '',
      company: job?.company ?? '',
      jobPostUrl: job?.url ?? '',
    };
  }, [trackerFor, userId]);

  const createCard = async (values: AddApplicationFormValues, stage: ApplicationStage) => {
    const cards = userId ? await fetchAllApplications(userId) : [];
    const created = await createApplication.mutateAsync({
      values,
      sortOrder: sortOrderAtEnd(groupByColumn(cards)[boardColumnOf(stage)]),
    });
    return { id: created.id };
  };

  return (
    <FeedbackPromptContext.Provider value={value}>
      {children}
      {trackerFor && !addOpen ? (
        <TrackerPromptBar
          onAdd={() => setAddOpen(true)}
          onDismiss={() => {
            if (userId) {
              dismissTrackerPrompt(userId, trackerFor.id);
            }
            setTracker(null);
          }}
        />
      ) : null}
      {userId ? (
        <AddApplicationDialog
          open={addOpen}
          userId={userId}
          defaults={trackerDefaults}
          onOpenChange={setAddOpen}
          onCreate={createCard}
          onAdded={(id) => {
            setTracker(null);
            toast.success(APPLICATION_ADDED_MESSAGE, {
              action: createElement(Link, { href: cardHref(id), className: 'font-semibold underline' }, VIEW_IN_TRACKER_LABEL),
            });
          }}
        />
      ) : null}
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
