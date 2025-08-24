'use client';
import { Loading } from '@components/views';
import { getAccount } from '@lib/clients/account.client';
import { useUserSession } from '@lib/providers';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_ACCOUNT_DTO } from '@app/account/create/views/account.form';
import { ResumePreviewPage } from './resume-page';
import { useSearchParams } from 'next/navigation';
import { TemplateKey } from '@lib/types';
import { useResumeContext } from './providers/state-provider';
import { RESUME_COLORS_MAP } from '@lib/utils';

export default function ResumePage() {
  const searchParams = useSearchParams();
  const template = searchParams.get('template') as TemplateKey;
  const { session } = useUserSession();
  const { send } = useResumeContext();

  const userId = session?.user.id;

  const { data: account, isPending } = useQuery({
    queryKey: ['account', userId],
    queryFn: async () => {
      try {
        if (!userId) {
        throw new Error('User not found');
        }

        send({ type: 'INITIALIZE' });

        const account = await getAccount(userId);
        console.log('account', account);
        send({
          type: 'FETCHING_RESUME_FAILURE',
          value: {
            resume: account || DEFAULT_ACCOUNT_DTO,
            name: `${account.profile.firstName} ${account.profile.lastName}`,
            template: template || 'entry-level-ember',
            color: RESUME_COLORS_MAP.black,
            fontSize: 'md',
          },
        });

        return account;
      } catch (error) {
        console.error('Error fetching account', error);
        send({
          type: 'FETCHING_RESUME_FAILURE',
          value: {
            resume: account || DEFAULT_ACCOUNT_DTO,
            name: `my resume`,
            template: template || 'entry-level-ember',
            color: RESUME_COLORS_MAP.black,
            fontSize: 'md',
          },
        });

        return null;
      }
    },
    enabled: !!userId,
  });

  if (!account && isPending) {
    return <Loading message="Preparing resume..." />;
  }

  return (
    <ResumePreviewPage
      level={account?.profile.seniority ?? 'senior'}
    />
  );
}
