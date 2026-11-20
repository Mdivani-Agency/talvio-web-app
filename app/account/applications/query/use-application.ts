import { toApplication, toApplicationEvent, toApplicationNote, type ApplicationDetail } from '@/lib/adapters/application.adapter';
import { getGraphqlSdk } from '@/lib/graphql-client';
import { unwrapCollection, useGraphqlQuery } from '@/lib/query/base-query';

export function applicationQueryKey(id?: string) {
  return ['application', id] as const;
}

/** One card with its notes and stage history, newest first. Throws when RLS hides the card or it is gone. */
export async function fetchApplication(id: string): Promise<ApplicationDetail> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.ApplicationById({ id });
  const row = unwrapCollection(data.job_applicationsCollection)[0];
  if (!row) {
    throw new Error('Application not found');
  }
  return {
    application: toApplication(row),
    notes: unwrapCollection(row.job_application_notesCollection).map(toApplicationNote),
    events: unwrapCollection(row.job_application_eventsCollection)
      .map(toApplicationEvent)
      .filter((event): event is NonNullable<typeof event> => event !== null),
  };
}

export function useApplication(id?: string) {
  return useGraphqlQuery(applicationQueryKey(id), async () => fetchApplication(id!), { enabled: !!id });
}
