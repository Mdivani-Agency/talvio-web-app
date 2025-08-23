'use client';
import { Loading } from '@components/views';
import { getAccount } from '@lib/clients/account.client';
import { useUserSession } from '@lib/providers';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_ACCOUNT_DTO } from '@app/account/create/views/account.form';
import { ResumePreviewPage } from './resume-page';

export default function ResumePage() {
  const { session } = useUserSession();

  const userId = session?.user.id;

  const { data: account, isPending } = useQuery({
    queryKey: ['account', userId],
    queryFn: () => userId ? getAccount(userId) : undefined,
    enabled: !!userId,
  });

  if (!account && isPending) {
    return <Loading message="Preparing resume..." />;
  }

  return (
    <ResumePreviewPage
      resume={{
        resume: account || DEFAULT_ACCOUNT_DTO,
        name: 'resume',
        template: 'entry-level-ember',
        id: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        color: 'black',
        fontSize: 'md',
      }}
      level={account?.profile.seniority ?? 'entry'}
    />
  );
}
