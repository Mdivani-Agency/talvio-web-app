import { Download } from 'lucide-react';

import { Button } from '@components/ui';
import type { MediaItem } from '@lib/clients/media.client';
import {
  DOWNLOAD_LABEL,
  documentFileName,
  documentMetaLine,
  downloadDocumentLabel,
  openDocumentLabel,
} from '@/lib/account-copy';

import { ResumeImage } from '../resume-image';

/** One card per generated PDF: the first-page preview, the file name and date, and Download. */
export function DocumentGrid({ documents }: { documents: MediaItem[] }) {
  return (
    <ul className="grid grid-cols-1 gap-5 md:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]">
      {documents.map((document) => (
        <li
          key={document.key}
          data-testid="document-card"
          className="flex min-w-0 flex-col gap-3 rounded-lg bg-card p-3"
        >
          <a
            href={document.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={openDocumentLabel(document.name)}
            className="block aspect-[210/297] overflow-hidden rounded-md bg-white shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ResumeImage pdfUrl={document.publicUrl} className="h-full w-full" />
          </a>
          <div className="flex min-w-0 flex-col gap-[0.2rem]">
            <span className="truncate text-sm font-semibold text-primary" title={documentFileName(document.name, document.type)}>
              {documentFileName(document.name, document.type)}
            </span>
            <span className="text-xs text-muted-foreground">{documentMetaLine(document.createdAt)}</span>
          </div>
          <Button asChild variant="outline" className="h-10 w-full gap-2 border-input bg-background text-sm dark:bg-background">
            <a
              href={document.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={downloadDocumentLabel(document.name)}
            >
              <Download aria-hidden="true" className="size-4" />
              {DOWNLOAD_LABEL}
            </a>
          </Button>
        </li>
      ))}
    </ul>
  );
}
