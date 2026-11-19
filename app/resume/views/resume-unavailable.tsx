import { FileX, Lock } from 'lucide-react';

import { StatusView } from '@components/views';
import { signInHref } from '@lib/auth/sign-in-href';
import {
  NEW_RESUME_HREF,
  NEW_RESUME_LABEL,
  RESUME_NOT_FOUND_BODY,
  RESUME_NOT_FOUND_DOCUMENTS_HREF,
  RESUME_NOT_FOUND_DOCUMENTS_LABEL,
  RESUME_NOT_FOUND_TITLE,
  RESUME_SIGN_IN_BODY,
  RESUME_SIGN_IN_LABEL,
  RESUME_SIGN_IN_TITLE,
} from '@/lib/status-copy';

type ResumeUnavailableProps = {
  /** `signed-out`: a guest opened a saved resume link. `not-found`: the signed-in user cannot read this resume. */
  reason: 'signed-out' | 'not-found';
  resumeId: string;
};

const newResume = { label: NEW_RESUME_LABEL, href: NEW_RESUME_HREF };

/** Why a saved resume link does not open the editor, with the way forward. */
export function ResumeUnavailable({ reason, resumeId }: ResumeUnavailableProps) {
  if (reason === 'signed-out') {
    return (
      <StatusView
        as="main"
        icon={Lock}
        title={RESUME_SIGN_IN_TITLE}
        body={RESUME_SIGN_IN_BODY}
        primary={{ label: RESUME_SIGN_IN_LABEL, href: signInHref(`/resume/${resumeId}`) }}
        secondary={newResume}
        className="min-h-[calc(100svh-7.2rem)]"
      />
    );
  }
  return (
    <StatusView
      as="main"
      icon={FileX}
      title={RESUME_NOT_FOUND_TITLE}
      body={RESUME_NOT_FOUND_BODY}
      primary={{ label: RESUME_NOT_FOUND_DOCUMENTS_LABEL, href: RESUME_NOT_FOUND_DOCUMENTS_HREF }}
      secondary={newResume}
      className="min-h-[calc(100svh-7.2rem)]"
    />
  );
}
