'use client';
import { useEffect, useRef } from 'react';
import { EditorSkeleton } from './views/editor-skeleton';
import { fetchProfile } from '@app/account/query/use-profile';
import { useUserSession } from '@lib/providers';
import { useQuery } from '@tanstack/react-query';
import { EMPTY_RESUME_DOCUMENT, profileToResumeDocument } from '@lib/models/resume-document';
import { ResumePreviewPage } from './resume-page';
import { redirect, useSearchParams } from 'next/navigation';
import type { AccountDto, PreviewDto, TemplateKey } from '@lib/types';
import { ResumeProvider, useResumeContext } from './providers/state-provider';
import OptionsView from './views/options-view';
import ImportResumePage from './views/import-page';
import { onboardingHref } from '@lib/auth/onboarding-return';
import { normalizeResumeTemplate } from '@lib/drafts';
import { resolveAvailableTemplate } from '@lib/resume/resolve-editor';
import { colorAfterTemplateChange } from '@lib/templates';
import { WithResumeHeader } from './views/resume-public-header';

function previewSeed(account: AccountDto | null, template: TemplateKey): PreviewDto {
  // A new resume opens in its template's own accent colour, as the gallery image shows it.
  const color = resolveAvailableTemplate(template).color;
  if (!account) {
    return {
      resume: EMPTY_RESUME_DOCUMENT,
      name: 'my resume',
      template,
      color,
      fontSize: 'md',
    };
  }

  const name = `${account.profile.firstName} ${account.profile.lastName}`.trim() || 'my resume';
  return {
    resume: profileToResumeDocument(account),
    name,
    template,
    color,
    fontSize: 'md',
  };
}

function ResumeFlow() {
  const searchParams = useSearchParams();
  const requestedTemplate = searchParams.get('template');
  const templatekey = normalizeResumeTemplate(requestedTemplate);
  const { session, isPending: isAuthenticating } = useUserSession();
  const { seedIfFetching, step, resume, changeResume } = useResumeContext();
  const consumedTemplate = useRef<string | null>(null);

  useEffect(() => {
    if (!requestedTemplate || step === 'fetchingResume' || consumedTemplate.current === requestedTemplate) {
      return;
    }
    consumedTemplate.current = requestedTemplate;
    if (resume.template === templatekey) {
      return;
    }
    changeResume({ ...resume, template: templatekey, color: colorAfterTemplateChange(resume, templatekey) });
  }, [changeResume, requestedTemplate, resume, step, templatekey]);

  const userId = session?.user.id;

  const { isLoading, data: account } = useQuery({
    queryKey: ['account', userId],
    queryFn: async () => {
      if (!userId) {
        seedIfFetching(previewSeed(null, templatekey));
        return null;
      }

      let found: AccountDto | null;
      try {
        found = await fetchProfile(userId);
      } catch (error) {
        // A failed lookup is not a missing profile: open the editor empty, and leave the query failed so that
        // nothing reads it as "no profile".
        console.error('Error fetching account', error);
        seedIfFetching(previewSeed(null, templatekey));
        throw error;
      }

      if (found) {
        seedIfFetching(previewSeed(found, templatekey));
      }
      return found;
    },
    enabled: !isAuthenticating,
    retry: false,
  });

  // A resume starts from the profile. Someone signed in without one (a new account that came here from the template
  // gallery or a guest draft) saves a profile first; onboarding brings them back here, template included.
  if (userId && account === null) {
    return redirect(onboardingHref(requestedTemplate ? `/resume?template=${encodeURIComponent(requestedTemplate)}` : '/resume'));
  }

  if (isAuthenticating || (isLoading && step === 'fetchingResume')) {
    return <EditorSkeleton />;
  }

  if (step === 'options') {
    return (
      <WithResumeHeader>
        <OptionsView />
      </WithResumeHeader>
    );
  }

  if (step === 'importResume') {
    return (
      <WithResumeHeader>
        <ImportResumePage />
      </WithResumeHeader>
    );
  }

  return <ResumePreviewPage />;
}

export default function ResumePage() {
  return (
    <ResumeProvider resumeId="new">
      <ResumeFlow />
    </ResumeProvider>
  );
}
