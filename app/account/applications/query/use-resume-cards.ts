import { APPLICATION_PAGE_SIZE } from '@/lib/adapters/application.adapter';
import { getGraphqlSdk } from '@/lib/graphql-client';
import { unwrapCollection, useGraphqlQuery } from '@/lib/query/base-query';

/** Stops a runaway loop: 50 pages of 100 cards. */
const MAX_PAGES = 50;

/** For each of these resumes that a card links, the card's id (the oldest card when several do). */
export async function fetchCardsForResumes(resumeIds: string[]): Promise<Record<string, string>> {
  const cards: Record<string, string> = {};
  if (resumeIds.length === 0) {
    return cards;
  }
  const sdk = await getGraphqlSdk();
  let after: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = await sdk.ApplicationsByResumes({ resumeIds, first: APPLICATION_PAGE_SIZE, after });
    for (const row of unwrapCollection(data.job_applicationsCollection)) {
      if (row.resume_id && !cards[row.resume_id]) {
        cards[row.resume_id] = row.id;
      }
    }
    const info = data.job_applicationsCollection?.pageInfo;
    if (!info?.hasNextPage || !info.endCursor) {
      break;
    }
    after = info.endCursor;
  }
  return cards;
}

/** For each Documents media key whose resume a card links, the card's id. Keys go 100 at a time (`max_rows`). */
export async function fetchCardsForMediaKeys(keys: string[]): Promise<Record<string, string>> {
  if (keys.length === 0) {
    return {};
  }
  const sdk = await getGraphqlSdk();
  const resumes: { id: string; pdf_media_key: string | null }[] = [];
  for (let start = 0; start < keys.length; start += APPLICATION_PAGE_SIZE) {
    const chunk = keys.slice(start, start + APPLICATION_PAGE_SIZE);
    const data = await sdk.ResumesByMediaKeys({ keys: chunk, first: chunk.length });
    resumes.push(...unwrapCollection(data.resumesCollection));
  }
  const cards = await fetchCardsForResumes(resumes.map((resume) => resume.id));
  const byKey: Record<string, string> = {};
  for (const resume of resumes) {
    if (resume.pdf_media_key && cards[resume.id]) {
      byKey[resume.pdf_media_key] = cards[resume.id];
    }
  }
  return byKey;
}

/** Cards for a list of resumes, keyed under ['applications', userId] so card changes refresh it. */
export function useResumeCards(userId: string | undefined, resumeIds: string[], enabled: boolean) {
  const ids = [...new Set(resumeIds)].sort();
  return useGraphqlQuery(['applications', userId, 'by-resume', ids], () => fetchCardsForResumes(ids), {
    enabled: enabled && !!userId && ids.length > 0,
  });
}

/** Cards for Documents rows, by media key. */
export function useMediaKeyCards(userId: string | undefined, keys: string[], enabled: boolean) {
  const sorted = [...new Set(keys)].sort();
  return useGraphqlQuery(['applications', userId, 'by-media-key', sorted], () => fetchCardsForMediaKeys(sorted), {
    enabled: enabled && !!userId && sorted.length > 0,
  });
}
