import { BriefcaseBusiness, Plus } from 'lucide-react';

import { Button } from '@components/ui';
import { EMPTY_BODY, EMPTY_CTA_LABEL, EMPTY_TITLE } from '@/lib/applications-copy';

/** No cards yet. */
export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[1.6rem] bg-card px-5 py-8 text-center md:px-6 md:py-16">
      <span
        aria-hidden="true"
        className="flex size-[6.4rem] items-center justify-center rounded-[1.6rem] bg-popover text-secondary dark:bg-[#404040] dark:text-[#8688ea]"
      >
        <BriefcaseBusiness className="size-[2.8rem]" />
      </span>
      <h2 className="text-[2.2rem] font-semibold text-primary">{EMPTY_TITLE}</h2>
      <p className="max-w-[48rem] text-[1.5rem] leading-[1.6] text-muted-foreground">{EMPTY_BODY}</p>
      <Button type="button" className="mt-2 h-[4.8rem] text-[1.5rem]" onClick={onAdd}>
        <Plus aria-hidden="true" className="size-[1.8rem]" />
        {EMPTY_CTA_LABEL}
      </Button>
    </div>
  );
}
