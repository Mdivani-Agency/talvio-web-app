'use client';
import { useEffect } from 'react';
import { Loading } from '@components/views';
import { fetchProfile } from '@app/account/query/use-profile';
import { useUserSession } from '@lib/providers';
import { useQuery } from '@tanstack/react-query';
import { EMPTY_RESUME_DOCUMENT, profileToResumeDocument } from '@lib/models/resume-document';
import { ResumePreviewPage } from './resume-page';
import { useSearchParams } from 'next/navigation';
import type { AccountDto, PreviewDto, TemplateKey } from '@lib/types';
import { ResumeProvider, useResumeContext } from './providers/state-provider';
import { RESUME_COLORS_MAP } from '@lib/utils';
import OptionsView from './views/options-view';
import ImportResumePage from './views/import-page';
import { normalizeResumeTemplate } from '@lib/drafts';

function previewSeed(account: AccountDto | null, template: TemplateKey): PreviewDto {
  if (!account) {
    return {
      resume: EMPTY_RESUME_DOCUMENT,
      name: 'my resume',
      template,
      color: RESUME_COLORS_MAP.black,
      fontSize: 'md',
    };
  }

  const name = `${account.profile.firstName} ${account.profile.lastName}`.trim() || 'my resume';
  return {
    resume: profileToResumeDocument(account),
    name,
    template,
    color: RESUME_COLORS_MAP.black,
    fontSize: 'md',
  };
}

function ResumeFlow() {
  const searchParams = useSearchParams();
  const requestedTemplate = searchParams.get('template');
  const templatekey = normalizeResumeTemplate(requestedTemplate);
  const { session, isPending: isAuthenticating } = useUserSession();
  const { seedIfFetching, step, resume, changeResume } = useResumeContext();

  useEffect(() => {
    if (step !== 'options' || !requestedTemplate || resume.template === templatekey) {
      return;
    }
    changeResume({ ...resume, template: templatekey });
  }, [changeResume, requestedTemplate, resume, step, templatekey]);

  const userId = session?.user.id;

  const { isLoading } = useQuery({
    queryKey: ['account', userId],
    queryFn: async () => {
      const seedIfNeeded = (value: PreviewDto) => {
        seedIfFetching(value);
      };

      try {
        if (!userId) {
          seedIfNeeded(previewSeed(null, templatekey));
          return null;
        }

        const account = await fetchProfile(userId);
        if (!account) {
          throw new Error('No profile');
        }

        seedIfNeeded(previewSeed(account, templatekey));
        return account;
      } catch (error) {
        console.error('Error fetching account', error);
        seedIfNeeded(previewSeed(null, templatekey));
        return null;
      }
    },
    enabled: !isAuthenticating,
  });

  if (isAuthenticating || (isLoading && step === 'fetchingResume')) {
    return <Loading message="Preparing resume..." />;
  }

  if (step === 'options') {
    return <OptionsView />;
  }

  if (step === 'importResume') {
    return <ImportResumePage />;
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
