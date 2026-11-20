import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toApplication, toApplicationInsert } from '@/lib/adapters/application.adapter';
import { getGraphqlSdk } from '@/lib/graphql-client';
import type { AddApplicationFormValues } from '@lib/schema/application.schema';
import type { JobApplication } from '@lib/types';

export type CreateApplicationInput = { values: AddApplicationFormValues; sortOrder: number };

export async function createApplication({ values, sortOrder }: CreateApplicationInput): Promise<JobApplication> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.InsertApplication({ objects: [toApplicationInsert(values, sortOrder)] });
  const row = data.insertIntojob_applicationsCollection?.records[0];
  if (!row) {
    throw new Error('Application not saved');
  }
  return toApplication(row);
}

export function useCreateApplication(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplication,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['applications', userId] });
    },
  });
}
