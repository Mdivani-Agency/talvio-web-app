'use client';

import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui';
import { CLOSED_OUTCOME_TITLE, OUTCOME_NAMES } from '@/lib/applications-copy';
import { CLOSED_STAGES } from '@lib/schema/application.schema';
import type { ClosedStage, JobApplication } from '@lib/types';

type OutcomeDialogProps = {
  application: JobApplication | null;
  onPick: (stage: ClosedStage) => void;
  onCancel: () => void;
};

/** A card dropped on Closed: pick Accepted, Rejected or Withdrawn. */
export function OutcomeDialog({ application, onPick, onCancel }: OutcomeDialogProps) {
  return (
    <Dialog open={application !== null} onOpenChange={(open) => (open ? undefined : onCancel())}>
      <DialogContent className="gap-4 p-5 sm:max-w-[36rem]">
        <DialogTitle className="text-md font-semibold text-primary">{CLOSED_OUTCOME_TITLE}</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          {application ? `${application.position} · ${application.company}` : null}
        </DialogDescription>
        <div className="flex flex-col gap-2">
          {CLOSED_STAGES.map((stage) => (
            <Button key={stage} type="button" variant="outline" className="h-[4.4rem] justify-start text-sm" onClick={() => onPick(stage)}>
              {OUTCOME_NAMES[stage]}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
