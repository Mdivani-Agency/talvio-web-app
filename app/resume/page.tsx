'use client';
import { Loading } from '@components/views';
import { fetchProfile } from '@app/account/query/use-profile';
import { useUserSession } from '@lib/providers';
import { useQuery } from '@tanstack/react-query';
import { EMPTY_RESUME_DOCUMENT, profileToResumeDocument } from '@lib/models/resume-document';
import { ResumePreviewPage } from './resume-page';
import { useSearchParams } from 'next/navigation';
import type { AccountDto, PreviewDto, TemplateKey } from '@lib/types';
import { useResumeContext } from './providers/state-provider';
import { RESUME_COLORS_MAP } from '@lib/utils';

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
import OptionsView from './views/options-view';
import ImportResumePage from './views/import-page';

export default function ResumePage() {
  const searchParams = useSearchParams();
  const templatekey = searchParams.get('template') as TemplateKey;
  const { session, isPending: isAuthenticating } = useUserSession();
  const { send, state } = useResumeContext();

  const userId = session?.user.id;

  const { data: account, isLoading } = useQuery({
    queryKey: ['account', userId],
    queryFn: async () => {
      try {
        if (!userId) {
          send({
            type: 'FETCHING_RESUME_FAILURE',
            value: previewSeed(null, templatekey),
          });
          return null;
        }

        const account = await fetchProfile(userId);
        if (!account) {
          throw new Error('No profile');
        }

        send({
          type: 'FETCHING_RESUME_FAILURE',
          value: previewSeed(account, templatekey),
        });

        return account;
      } catch (error) {
        console.error('Error fetching account', error);
        send({
          type: 'FETCHING_RESUME_FAILURE',
          value: previewSeed(null, templatekey),
        });
        return null;
      }
    },
    enabled: !isAuthenticating,
  });

  if (isAuthenticating || isLoading) {
    return <Loading message="Preparing resume..." />;
  }

  if (state.matches('options')) {
    return <OptionsView />;
  }

  if (state.matches('importResume')) {
    return <ImportResumePage />;
  }

  return (
    <ResumePreviewPage
      level={account?.profile.seniority ?? 'senior'}
    />
  );
}
