import {
  APPLICATION_PAGE_SIZE,
  toApplication,
  toApplicationEvent,
  toApplicationNote,
  type ApplicationDetail,
  type ApplicationEvent,
  type ApplicationNote,
} from '@/lib/adapters/application.adapter';
import { getGraphqlSdk, type GraphqlSdk } from '@/lib/graphql-client';
import { unwrapCollection, useGraphqlQuery } from '@/lib/query/base-query';

/** Stops a runaway loop: 50 pages of 100 is far beyond any real card. */
const MAX_PAGES = 50;

export function applicationQueryKey(id?: string) {
  return ['application', id] as const;
}

type Page<T> = { items: T[]; hasNextPage: boolean; endCursor: string | null };

/** Loads every page of a card's list (notes or history), newest first; nothing is cut off at 100. */
async function loadAll<T>(loadPage: (after?: string) => Promise<Page<T>>): Promise<T[]> {
  const all: T[] = [];
  let after: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { items, hasNextPage, endCursor } = await loadPage(after);
    all.push(...items);
    if (!hasNextPage || !endCursor) {
      break;
    }
    after = endCursor;
  }
  return all;
}

export async function fetchApplicationNotes(sdk: GraphqlSdk, applicationId: string): Promise<ApplicationNote[]> {
  return loadAll(async (after) => {
    const data = await sdk.NotesByApplication({ applicationId, first: APPLICATION_PAGE_SIZE, after });
    return {
      items: unwrapCollection(data.job_application_notesCollection).map(toApplicationNote),
      hasNextPage: data.job_application_notesCollection?.pageInfo.hasNextPage ?? false,
      endCursor: data.job_application_notesCollection?.pageInfo.endCursor ?? null,
    };
  });
}

export async function fetchApplicationEvents(sdk: GraphqlSdk, applicationId: string): Promise<ApplicationEvent[]> {
  return loadAll(async (after) => {
    const data = await sdk.EventsByApplication({ applicationId, first: APPLICATION_PAGE_SIZE, after });
    return {
      items: unwrapCollection(data.job_application_eventsCollection)
        .map(toApplicationEvent)
        .filter((event): event is ApplicationEvent => event !== null),
      hasNextPage: data.job_application_eventsCollection?.pageInfo.hasNextPage ?? false,
      endCursor: data.job_application_eventsCollection?.pageInfo.endCursor ?? null,
    };
  });
}

/** One card with all its notes and stage history, newest first. Throws when RLS hides the card or it is gone. */
export async function fetchApplication(id: string): Promise<ApplicationDetail> {
  const sdk = await getGraphqlSdk();
  const data = await sdk.ApplicationById({ id });
  const row = unwrapCollection(data.job_applicationsCollection)[0];
  if (!row) {
    throw new Error('Application not found');
  }
  const [notes, events] = await Promise.all([fetchApplicationNotes(sdk, id), fetchApplicationEvents(sdk, id)]);
  return { application: toApplication(row), notes, events };
}

export function useApplication(id?: string) {
  return useGraphqlQuery(applicationQueryKey(id), async () => fetchApplication(id!), { enabled: !!id });
}
