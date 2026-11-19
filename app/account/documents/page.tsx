'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { Button } from '@components/ui';
import { Loading, PageContainer } from '@components/views';
import { getDocuments } from '@lib/clients/media.client';
import { useUserSession } from '@lib/providers';
import {
  DOCUMENTS_INTRO,
  DOCUMENTS_LOADING,
  DOCUMENTS_TAILOR_HREF,
  DOCUMENTS_TAILOR_LABEL,
  DOCUMENTS_TITLE,
} from '@/lib/account-copy';

import { DocumentGrid } from './views/document-grid';
import { DocumentsPanel } from './views/documents-panel';

export default function DocumentsPage() {
  const { session } = useUserSession();
  const userId = session?.user?.id;

  const documentsQuery = useQuery({
    queryKey: ['documents', userId],
    queryFn: async () => {
      const { items } = await getDocuments(userId!);
      return items;
    },
    enabled: !!userId,
    retry: false,
  });

  if (!userId || documentsQuery.isLoading) {
    return <Loading message={DOCUMENTS_LOADING} />;
  }

  const documents = documentsQuery.data ?? [];

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
      {documentsQuery.isError ? (
        <DocumentsPanel kind="error" onRetry={() => void documentsQuery.refetch()} />
      ) : documents.length === 0 ? (
        <DocumentsPanel kind="empty" />
      ) : (
        <DocumentGrid documents={documents} />
      )}
    </PageContainer>
  );
}
