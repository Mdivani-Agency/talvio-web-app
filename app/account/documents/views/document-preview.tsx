import { FileText, LoaderCircle } from 'lucide-react';
import Image from 'next/image';

import { DOCUMENT_PREVIEW_LOADING, DOCUMENT_PREVIEW_UNAVAILABLE } from '@/lib/account-copy';

import type { PdfPreview } from '../hooks/use-pdf-preview';

/** The preview sits on white paper in both themes, so its text uses a fixed grey that reads on white. */
const PAPER_TEXT = 'text-[#525356]';

type DocumentPreviewProps = {
  preview: PdfPreview;
  /** "First page of {name}", or "" where the name is already beside the thumbnail. */
  alt: string;
  /** Phone thumbnails are too small for words: they show the image or nothing. */
  compact?: boolean;
};

/** What fills a document's A4 area: the first page, a loading state, or "Preview not available". */
export function DocumentPreview({ preview, alt, compact = false }: DocumentPreviewProps) {
  if (preview.status === 'ready') {
    return (
      <span className="relative block h-full w-full">
        <Image src={preview.src} alt={alt} fill unoptimized className="object-cover object-top" />
      </span>
    );
  }
  if (compact) return null;
  if (preview.status === 'loading') {
    return (
      <span role="status" className={`flex h-full flex-col items-center justify-center gap-2 text-xs ${PAPER_TEXT}`}>
        <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        {DOCUMENT_PREVIEW_LOADING}
      </span>
    );
  }
  return (
    <span className={`flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-xs ${PAPER_TEXT}`}>
      <FileText aria-hidden="true" className="size-[2.2rem]" strokeWidth={1.75} />
      {DOCUMENT_PREVIEW_UNAVAILABLE}
    </span>
  );
}
