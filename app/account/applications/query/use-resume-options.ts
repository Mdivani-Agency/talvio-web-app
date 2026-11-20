import { fetchAllResumes } from '@app/resume/query/use-resumes';
import { useGraphqlQuery } from '@/lib/query/base-query';

/** Every resume the user has, general and tailored, for the "Resume sent" pickers. */
export function useResumeOptions(userId: string | undefined, enabled: boolean) {
  return useGraphqlQuery(
    ['resumes', userId, 'application-picker'],
    async () => {
      const [general, tailored] = await Promise.all([
        fetchAllResumes(userId!, 'GENERAL'),
        fetchAllResumes(userId!, 'JOB_SPECIFIC'),
      ]);
      return [...general, ...tailored];
    },
    { enabled: enabled && !!userId },
  );
}
