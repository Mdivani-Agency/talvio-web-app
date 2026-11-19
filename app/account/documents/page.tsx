'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { Button } from '@components/ui';
import { Loading, PageContainer } from '@components/views';
import { getDocuments } from '@lib/clients/media.client';
import { useUserSession } from '@lib/providers';
import {
  DOCUMENTS_INTRO,
  DOCUMENTS_LOADING,
  DOCUMENTS_MORE_ERROR,
  DOCUMENTS_RETRY_LABEL,
  DOCUMENTS_TAILOR_HREF,
  DOCUMENTS_TAILOR_LABEL,
  DOCUMENTS_TITLE,
  LOAD_MORE_LABEL,
} from '@/lib/account-copy';

import { DocumentGrid } from './views/document-grid';
import { DocumentsPanel } from './views/documents-panel';

export default function DocumentsPage() {
  const { session } = useUserSession();
  const userId = session?.user?.id;

  // One page per media-service request; `nextToken` continues the list until it runs out.
  const documentsQuery = useInfiniteQuery({
    queryKey: ['documents', userId],
    queryFn: ({ pageParam }) => getDocuments(userId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextToken,
    enabled: !!userId,
    retry: false,
  });

  if (!userId || documentsQuery.isLoading) {
    return <Loading message={DOCUMENTS_LOADING} />;
  }

  const documents = documentsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  // Only a failed first page replaces the list; a failed next page keeps what is already shown.
  const firstPageFailed = documentsQuery.isError && !documentsQuery.data;

  return (
    <PageContainer as="section" className="flex flex-col gap-8 py-6 md:py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl leading-[1.333] font-semibold text-primary md:text-[2.8rem]">{DOCUMENTS_TITLE}</h1>
          <p className="text-sm text-muted-foreground">{DOCUMENTS_INTRO}</p>
        </div>
        <Button asChild variant="outline" className="h-10 border-input bg-background text-sm dark:bg-background">
          <Link href={DOCUMENTS_TAILOR_HREF}>{DOCUMENTS_TAILOR_LABEL}</Link>
        </Button>
      </header>
      {firstPageFailed ? (
        <DocumentsPanel kind="error" onRetry={() => void documentsQuery.refetch()} />
      ) : documents.length === 0 ? (
        <DocumentsPanel kind="empty" />
      ) : (
        <div className="flex flex-col gap-5">
          <DocumentGrid documents={documents} />
          {documentsQuery.isFetchNextPageError ? (
            <div
              role="alert"
              className="flex flex-col items-center gap-3 rounded-lg border border-input px-5 py-4 text-center text-sm text-foreground md:flex-row md:justify-center"
            >
              {DOCUMENTS_MORE_ERROR}
              <Button
                type="button"
                variant="outline"
                className="h-10 border-input bg-background text-sm dark:bg-background"
                onClick={() => void documentsQuery.fetchNextPage()}
              >
                {DOCUMENTS_RETRY_LABEL}
              </Button>
            </div>
          ) : documentsQuery.hasNextPage ? (
            <Button
              type="button"
              variant="ghost"
              loading={documentsQuery.isFetchingNextPage}
              disabled={documentsQuery.isFetchingNextPage}
              className="h-10 self-center text-sm font-semibold text-secondary dark:text-secondary-hover"
              onClick={() => void documentsQuery.fetchNextPage()}
            >
              {LOAD_MORE_LABEL}
            </Button>
          ) : null}
        </div>
      )}
    </PageContainer>
  );
}
