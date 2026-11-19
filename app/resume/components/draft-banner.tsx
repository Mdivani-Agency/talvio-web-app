import { FileClock } from 'lucide-react';

import { Button } from '@components/ui';
import { DRAFT_BANNER } from '@/lib/resume-editor-copy';

import type { ResumeFamilyControls } from '../views/resume-editor-shell';

/** Under the top bar for a draft and its generated original: which one is open, and how to switch or discard. */
export function DraftBanner({ family }: { family: ResumeFamilyControls }) {
  return (
    <div className="flex flex-none flex-wrap items-center gap-3 bg-accent px-4 py-2.5 text-sm text-foreground md:px-6">
      <FileClock aria-hidden="true" className="size-4 shrink-0" />
      <p className="min-w-[20rem] flex-1">{family.viewingOriginal ? DRAFT_BANNER.original : DRAFT_BANNER.editing}</p>
      {family.viewingOriginal ? (
        <Button type="button" variant="outline" className="h-[3.6rem]" onClick={family.onViewDraft}>
          {DRAFT_BANNER.backToDraft}
        </Button>
      ) : (
        <>
          <Button type="button" variant="outline" className="h-[3.6rem]" onClick={family.onViewOriginal}>
            {DRAFT_BANNER.viewOriginal}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-[3.6rem] text-destructive hover:text-destructive"
            onClick={family.onDiscard}
          >
            {DRAFT_BANNER.discard}
          </Button>
        </>
      )}
    </div>
  );
}
