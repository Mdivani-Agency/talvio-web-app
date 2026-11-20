'use client';

import { Trash2, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { submitWrapper } from '@app/actions/action.utils';
import { ConfirmModal } from '@components/modals';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui';
import type { ApplicationPatch } from '@/lib/adapters/application.adapter';
import {
  APPLICATION_DELETED_MESSAGE,
  DELETE_APPLICATION_DESCRIPTION,
  DELETE_APPLICATION_LABEL,
  DELETE_APPLICATION_TITLE,
  DETAILS_TITLE,
  DETAIL_CLOSE_LABEL,
  DETAIL_FIELDS,
  DETAIL_LOAD_ERROR,
  DETAIL_LOADING,
  DETAIL_RETRY_LABEL,
  HISTORY_TITLE,
  LABELS_TITLE,
  LINKS_TITLE,
  NOTES_TITLE,
  RESUME_SENT_TITLE,
  SAVED_LABEL,
  SAVE_FAILED_LABEL,
  SAVE_HINT,
  SAVE_RETRY_LABEL,
  SAVING_LABEL,
  STAGE_NAMES,
  detailSubheading,
} from '@/lib/applications-copy';
import { useAppForm } from '@lib/forms/use-form';
import { APPLICATION_STAGES } from '@lib/schema/application.schema';
import type { ApplicationLabel, ApplicationStage, JobApplication } from '@lib/types';

import { useAutoSave, type SaveStatus } from '../../hooks/use-auto-save';
import { useApplication } from '../../query/use-application';
import { useDeleteApplication } from '../../query/use-delete-application';
import {
  DetailsField,
  DetailsFields,
  detailsDefaults,
  detailsFormValuesSchema,
  detailsPatch,
  type DetailsFormValues,
  type DetailsField as DetailsFieldName,
} from './details.fields';
import { HistorySection } from './history-section';
import { LabelsSection } from './labels-section';
import { LinksSection } from './links-section';
import { NotesSection } from './notes-section';
import { ResumeSent } from './resume-sent';

type DetailPanelProps = {
  /** The open card, from the board's list; null closes the panel. */
  application: JobApplication | null;
  userId: string;
  /** Labels on any card, for the + Label suggestions. */
  knownLabels: ApplicationLabel[];
  /** The patch that moves the card to a stage, placed at the end of its new column. */
  stagePatch: (application: JobApplication, stage: ApplicationStage) => ApplicationPatch;
  onClose: () => void;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      {children}
    </section>
  );
}

function SaveState({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === 'failed') {
    return (
      <span role="alert" className="flex items-center gap-1 text-[1.3rem] text-foreground">
        {SAVE_FAILED_LABEL}
        <button
          type="button"
          onClick={onRetry}
          className="rounded-sm px-1 font-semibold text-secondary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:text-[#8688ea]"
        >
          {SAVE_RETRY_LABEL}
        </button>
      </span>
    );
  }
  return (
    <span role="status" className="text-[1.3rem] text-muted-foreground">
      {status === 'saving' ? SAVING_LABEL : status === 'saved' ? SAVED_LABEL : SAVE_HINT}
    </span>
  );
}

function PanelBody({ application, userId, knownLabels, stagePatch, onClose }: DetailPanelProps & { application: JobApplication }) {
  const detail = useApplication(application.id);
  const deleteApplication = useDeleteApplication(userId);
  const { status, save, retry } = useAutoSave(application, userId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const form = useAppForm<DetailsFormValues>({
    defaultValues: detailsDefaults(application),
    schema: detailsFormValuesSchema,
  });

  // A field saves once it is valid and differs from what is stored; errors stay under the field.
  const commit = async (name: DetailsFieldName) => {
    await form.validateField(name, 'change');
    if ((form.getFieldMeta(name)?.errors ?? []).length > 0) {
      return;
    }
    const patch = detailsPatch(application, name, String(form.getFieldValue(name) ?? ''));
    if (patch) {
      await save(patch);
    }
  };

  return (
    <>
      <header className="flex shrink-0 items-start gap-3 border-b border-input px-5 pt-5 pb-4">
        <div className="min-w-0 flex-1">
          <DialogTitle className="text-[2rem] leading-[1.3] font-semibold break-words text-primary">
            {application.position}
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-[1.5rem] text-muted-foreground">
            {detailSubheading(application.company, application.location)}
          </DialogDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={DETAIL_CLOSE_LABEL}
          className="-mt-1.5 -mr-1.5 size-[4rem] shrink-0"
          onClick={onClose}
        >
          <X aria-hidden="true" className="size-[2rem]" />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-5">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="detail-stage" className="text-sm leading-[1.4286] font-medium text-foreground">
                {DETAIL_FIELDS.stage.label}
              </label>
              <Select
                value={application.stage}
                onValueChange={(value) => void save(stagePatch(application, value as ApplicationStage))}
              >
                <SelectTrigger id="detail-stage" className="h-[4.4rem] text-sm md:text-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {STAGE_NAMES[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DetailsField form={form} name="nextStepOn" type="date" onCommit={(name) => void commit(name)} />
          </div>
          <DetailsField form={form} name="nextStep" onCommit={(name) => void commit(name)} />
        </div>

        <Section title={RESUME_SENT_TITLE}>
          <ResumeSent application={application} userId={userId} onSave={save} />
        </Section>

        <Section title={DETAILS_TITLE}>
          <DetailsFields form={form} onCommit={(name) => void commit(name)} />
        </Section>

        <Section title={LINKS_TITLE}>
          <LinksSection application={application} onSave={save} />
        </Section>

        <Section title={LABELS_TITLE}>
          <LabelsSection application={application} knownLabels={knownLabels} onSave={save} />
        </Section>

        {detail.isError ? (
          <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-foreground">
            {DETAIL_LOAD_ERROR}
            <Button
              type="button"
              variant="ghost"
              className="h-[3.6rem] px-2 text-sm font-semibold text-secondary dark:text-secondary-hover"
              onClick={() => void detail.refetch()}
            >
              {DETAIL_RETRY_LABEL}
            </Button>
          </div>
        ) : !detail.data ? (
          <p role="status" className="text-sm text-muted-foreground">
            {DETAIL_LOADING}
          </p>
        ) : (
          <>
            <Section title={NOTES_TITLE}>
              <NotesSection applicationId={application.id} notes={detail.data.notes} />
            </Section>
            <Section title={HISTORY_TITLE}>
              <HistorySection events={detail.data.events} />
            </Section>
          </>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-input px-5 py-3">
        <Button
          type="button"
          variant="ghost"
          className="h-[4rem] px-2 text-sm text-destructive hover:text-destructive"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 aria-hidden="true" className="size-[1.6rem]" />
          {DELETE_APPLICATION_LABEL}
        </Button>
        <SaveState status={status} onRetry={() => void retry()} />
      </footer>

      <ConfirmModal
        isOpen={confirmDelete}
        title={DELETE_APPLICATION_TITLE}
        description={DELETE_APPLICATION_DESCRIPTION}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          void submitWrapper({
            fn: () => deleteApplication.mutateAsync(application.id),
            successMessage: APPLICATION_DELETED_MESSAGE,
            onSuccess: onClose,
          })
        }
      />
    </>
  );
}

/**
 * A card's detail (MDI-657): a panel on the right, 480px wide, full screen on phone. It traps focus, closes on
 * Escape and gives focus back to the card's open button.
 */
export function DetailPanel(props: DetailPanelProps) {
  const { application, onClose } = props;
  // When the panel closes the card prop is already null; remember which card to give focus back to.
  const [lastId, setLastId] = useState(application?.id);
  if (application && application.id !== lastId) {
    setLastId(application.id);
  }
  return (
    <Dialog open={application !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          // A stage change moves the card to another column, so focus its open button wherever it is now.
          const opener = lastId ? document.querySelector<HTMLElement>(`[data-card-open="${lastId}"]`) : null;
          if (opener) {
            event.preventDefault();
            opener.focus();
          }
        }}
        className="top-0 right-0 left-auto flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 border-l border-input p-0 shadow-[-8px_0_32px_rgba(13,13,13,0.2)] sm:max-w-none md:w-[48rem]"
      >
        {/* Keyed by card so switching cards starts a fresh form. */}
        {application ? <PanelBody key={application.id} {...props} application={application} /> : null}
      </DialogContent>
    </Dialog>
  );
}
