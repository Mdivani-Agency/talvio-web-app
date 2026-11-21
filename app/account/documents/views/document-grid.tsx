'use client';

import { Download } from 'lucide-react';

import { Button, Card } from '@components/ui';
import type { MediaItem } from '@lib/clients/media.client';
import {
  DOWNLOAD_LABEL,
  documentFileName,
  documentMetaLine,
  documentPreviewAlt,
  downloadDocumentLabel,
  openDocumentLabel,
} from '@/lib/account-copy';

import { InTrackerLink } from '@app/account/applications/views/in-tracker-link';

import { usePdfPreview } from '../hooks/use-pdf-preview';
import { DocumentPreview } from './document-preview';

const PAPER_CLASS = 'overflow-hidden bg-white shadow-sm';

/**
 * One generated PDF. From `md` it is a card (the first page opens the PDF, then the name and a Download button);
 * below `md` it is a row (a decorative thumbnail, the name, and a 44px download icon). The preview is drawn once.
 */
function DocumentCard({ document, trackerCardId }: { document: MediaItem; trackerCardId?: string }) {
  const preview = usePdfPreview(document.publicUrl);
  const fileName = documentFileName(document.name, document.type);
  const downloadLabel = downloadDocumentLabel(document.name);

  return (
    <li data-testid="document-card" className="min-w-0">
      <Card className="h-full flex-row items-center gap-3 py-2.5 pr-2 pl-2.5 md:flex-col md:items-stretch md:p-3">
        <span aria-hidden="true" className={`aspect-[210/297] w-14 shrink-0 rounded-sm md:hidden ${PAPER_CLASS}`}>
          <DocumentPreview preview={preview} alt="" compact />
        </span>
        <a
          href={document.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={openDocumentLabel(document.name)}
          className={`hidden aspect-[210/297] rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring md:block ${PAPER_CLASS}`}
        >
          <DocumentPreview preview={preview} alt={documentPreviewAlt(document.name)} />
        </a>
        <div className="flex min-w-0 flex-1 flex-col gap-[0.2rem]">
          <span className="truncate text-sm font-semibold text-primary" title={fileName}>
            {fileName}
          </span>
          <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {documentMetaLine(document.createdAt)}
            {trackerCardId ? <InTrackerLink applicationId={trackerCardId} name={fileName} /> : null}
          </span>
        </div>
        <a
          href={document.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={downloadLabel}
          className="flex size-[4.4rem] shrink-0 items-center justify-center rounded-md text-foreground outline-none hover:bg-popover focus-visible:ring-2 focus-visible:ring-ring md:hidden dark:hover:bg-accent"
        >
          <Download aria-hidden="true" className="size-[1.8rem]" />
        </a>
        <Button
          asChild
          variant="outline"
          className="hidden h-10 w-full gap-2 border-input bg-background text-sm md:inline-flex dark:bg-background"
        >
          <a href={document.publicUrl} target="_blank" rel="noopener noreferrer" aria-label={downloadLabel}>
            <Download aria-hidden="true" className="size-4" />
            {DOWNLOAD_LABEL}
          </a>
        </Button>
      </Card>
    </li>
  );
}

/** Rows on phones, a fluid card grid from `md`. */
/** `trackerCards` maps a document's media key to the tracker card that links its resume (MDI-658). */
export function DocumentGrid({ documents, trackerCards = {} }: { documents: MediaItem[]; trackerCards?: Record<string, string> }) {
  return (
    <ul className="grid grid-cols-1 gap-2 md:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] md:gap-5">
      {documents.map((document) => (
        <DocumentCard key={document.key} document={document} trackerCardId={trackerCards[document.key]} />
      ))}
    </ul>
  );
}
