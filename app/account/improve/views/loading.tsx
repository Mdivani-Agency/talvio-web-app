'use client';

import { PageLock } from '@components/views';
import type { ProfileImproveLoadingStage } from '@app/account/hooks/use-profile-improve';
import { IMPROVE_LOCK } from '@/lib/page-lock-copy';
import {
  CANCEL_LABEL,
  IMPROVE_EYEBROW,
  LOADING_NOTE,
  LOADING_PROPOSAL_STEPS,
  LOADING_PROPOSAL_TITLE,
  LOADING_QUESTIONS_STEPS,
  LOADING_QUESTIONS_TITLE,
} from '@/lib/profile-improve-copy';

/**
 * Reading and picking questions, or sending answers and writing edits, on the page lock (MDI-670): two steps with live
 * status, and Cancel, which stops the job. The job survives a reload, so the lock does not warn before the tab closes;
 * a restored job puts the page back on this step and the lock shows again. Offline, the step shows as paused.
 */
export function LoadingView({ stage, onCancel }: { stage: ProfileImproveLoadingStage; onCancel: () => void }) {
  const proposal = stage === 'answers' || stage === 'proposal';
  return (
    <PageLock
      context={IMPROVE_EYEBROW}
      title={proposal ? LOADING_PROPOSAL_TITLE : LOADING_QUESTIONS_TITLE}
      steps={proposal ? LOADING_PROPOSAL_STEPS : LOADING_QUESTIONS_STEPS}
      currentStep={stage === 'questions' || stage === 'proposal' ? 1 : 0}
      note={LOADING_NOTE}
      slowNote={IMPROVE_LOCK.slow}
      offlineNote={IMPROVE_LOCK.offline}
      cancel={{ label: CANCEL_LABEL, onClick: onCancel }}
    />
  );
}
