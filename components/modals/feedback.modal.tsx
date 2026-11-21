'use client';

import { useId, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { useStore } from '@tanstack/react-form';
import { CheckIcon, ExternalLinkIcon, MailIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useMediaQuery } from 'usehooks-ts';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  Form,
  FormField,
  FormItem,
  Textarea,
} from '@components/ui';
import { FEEDBACK_COMMENT_MAX_LENGTH, feedbackFormSchema, type FeedbackFormValues } from '@lib/feedback';
import { FEEDBACK_FORM, FEEDBACK_PROMPT, FEEDBACK_SENT, TRUSTPILOT_REVIEW_URL } from '@lib/feedback-copy';
import { fieldErrorMessage, firstFormError } from '@lib/forms/errors';
import { useAppForm } from '@lib/forms/use-form';
import { cn } from '@lib/utils';

type Step = 'ask' | 'wrong' | 'sent';

export type FeedbackModalProps = {
  open: boolean;
  /** Close, Escape, "Not now" and Done. The prompt was already counted when it opened. */
  onClose: () => void;
  /** Called when the Trustpilot link is followed. The link itself opens the review page in a new tab. */
  onTrustpilot: () => void;
  /** Sends the message. Resolves `true` when it was stored. */
  onSubmit: (comment: string) => Promise<boolean>;
  /** The green line above the title: what just happened. Defaults to "Your PDF is downloading". */
  eyebrow?: string;
};

const primaryButton = 'h-[4.8rem] w-full px-8 text-[1.5rem] font-semibold';
const outlineButton = 'h-[4.8rem] w-full px-8 text-[1.5rem] font-medium';

function TrustpilotLink({ variant, onClick }: { variant: 'default' | 'outline'; onClick: () => void }) {
  return (
    <Button asChild variant={variant} className={variant === 'default' ? primaryButton : outlineButton}>
      <a href={TRUSTPILOT_REVIEW_URL} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {FEEDBACK_PROMPT.trustpilot}
        <span className="sr-only"> {FEEDBACK_PROMPT.newTab}</span>
        <ExternalLinkIcon aria-hidden="true" className="size-[1.6rem]" />
      </a>
    </Button>
  );
}

function Header({
  Title,
  Description,
  title,
  description,
  eyebrow,
  onClose,
}: {
  Title: ComponentType<{ className?: string; children: ReactNode }>;
  Description: ComponentType<{ className?: string; children: ReactNode }>;
  title: string;
  description: string;
  eyebrow?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1 text-left">
        {eyebrow}
        <Title className="text-[2.2rem] leading-[1.3] font-semibold text-primary">{title}</Title>
        <Description className="mt-2 text-[1.5rem] leading-[1.6] text-muted-foreground">{description}</Description>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={FEEDBACK_PROMPT.close}
        onClick={onClose}
        className="-mt-2 -mr-2 size-[4rem] shrink-0"
      >
        <XIcon aria-hidden="true" className="size-[1.8rem]" />
      </Button>
    </div>
  );
}

function FeedbackBody({
  Title,
  Description,
  onClose,
  onTrustpilot,
  onSubmit,
  eyebrow = FEEDBACK_PROMPT.downloading,
}: Omit<FeedbackModalProps, 'open'> & {
  Title: ComponentType<{ className?: string; children: ReactNode }>;
  Description: ComponentType<{ className?: string; children: ReactNode }>;
}) {
  const [step, setStep] = useState<Step>('ask');
  const openFormRef = useRef<HTMLButtonElement>(null);
  const fieldId = useId();
  const noteId = `${fieldId}-note`;
  const errorId = `${fieldId}-error`;
  const form = useAppForm<FeedbackFormValues>({
    defaultValues: { comment: '' },
    schema: feedbackFormSchema,
  });
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const [sending, setSending] = useState(false);
  // Errors show once the field was left or Send was pressed, not on the first keystroke.
  const [attempted, setAttempted] = useState(false);

  const followTrustpilot = () => {
    onTrustpilot();
    onClose();
  };

  const cancelForm = () => {
    setStep('ask');
    setAttempted(false);
    form.reset();
    // The opener comes back when the form closes; put focus on it, not on the dialog itself.
    requestAnimationFrame(() => openFormRef.current?.focus());
  };

  const send = async () => {
    setAttempted(true);
    await form.validate('submit');
    if (!form.state.isValid) {
      toast.error(firstFormError(form) ?? FEEDBACK_FORM.failed);
      document.getElementById(fieldId)?.focus();
      return;
    }
    setSending(true);
    try {
      const sent = await onSubmit(String(form.state.values.comment ?? ''));
      if (sent) {
        setStep('sent');
      }
    } finally {
      setSending(false);
    }
  };

  if (step === 'sent') {
    return (
      <div className="flex flex-col gap-[2rem]">
        <Header
          Title={Title}
          Description={Description}
          title={FEEDBACK_SENT.title}
          description={FEEDBACK_SENT.body}
          onClose={onClose}
        />
        <div className="flex flex-col gap-1.5 rounded-[1.2rem] bg-card p-4 text-left">
          <p className="text-[1.5rem] font-semibold text-foreground">{FEEDBACK_SENT.publicTitle}</p>
          <p className="text-sm leading-[1.5] text-muted-foreground">{FEEDBACK_SENT.publicBody}</p>
        </div>
        <div className="flex flex-col gap-3">
          {/* The message is sent: Done is the main action, so it takes focus. */}
          <Button type="button" className={primaryButton} onClick={onClose} autoFocus>
            {FEEDBACK_SENT.done}
          </Button>
          <TrustpilotLink variant="outline" onClick={followTrustpilot} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[2rem]">
      <Header
        Title={Title}
        Description={Description}
        title={FEEDBACK_PROMPT.title}
        description={FEEDBACK_PROMPT.body}
        onClose={onClose}
        eyebrow={
          <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-green-900 dark:text-green-100">
            <span className="flex size-[2.2rem] items-center justify-center rounded-full bg-green-600 text-white">
              <CheckIcon aria-hidden="true" className="size-[1.3rem]" strokeWidth={3} />
            </span>
            {eyebrow}
          </p>
        }
      />
      <div className="flex flex-col gap-3">
        {/* The same button for everyone: Trustpilot forbids inviting only happy customers. */}
        <TrustpilotLink variant="default" onClick={followTrustpilot} />
        {step === 'ask' ? (
          <Button
            ref={openFormRef}
            type="button"
            variant="outline"
            className={outlineButton}
            aria-expanded={false}
            onClick={() => setStep('wrong')}
          >
            <MailIcon aria-hidden="true" className="size-[1.6rem]" />
            {FEEDBACK_PROMPT.wrong}
          </Button>
        ) : null}
      </div>
      {step === 'wrong' ? (
        <Form className="flex flex-col gap-2.5 rounded-[1.2rem] bg-card p-4 text-left">
          <FormField form={form} name="comment">
            {(field) => {
              const error = attempted || field.state.meta.isBlurred ? fieldErrorMessage(field.state.meta.errors) : undefined;
              return (
                <FormItem className="gap-2.5">
                  <label htmlFor={fieldId} className="text-[1.5rem] font-semibold text-foreground">
                    {FEEDBACK_FORM.label}
                  </label>
                  <Textarea
                    id={fieldId}
                    name={field.name}
                    // The form opens in place; focus moves into it.
                    autoFocus
                    required
                    rows={4}
                    maxLength={FEEDBACK_COMMENT_MAX_LENGTH}
                    placeholder={FEEDBACK_FORM.placeholder}
                    value={String(field.state.value ?? '')}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${errorId} ${noteId}` : noteId}
                    className="h-auto min-h-[10.4rem] resize-y p-3 text-[1.5rem] leading-[1.5]"
                  />
                  {error ? (
                    <p id={errorId} className="text-sm text-destructive">
                      {error}
                    </p>
                  ) : null}
                  <p id={noteId} className="text-[1.3rem] text-muted-foreground">
                    {FEEDBACK_FORM.note}
                  </p>
                </FormItem>
              );
            }}
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="h-[4.4rem] px-8 text-[1.5rem]" onClick={cancelForm}>
              {FEEDBACK_FORM.cancel}
            </Button>
            <Button
              type="button"
              className="h-[4.4rem] px-8 text-[1.5rem] font-semibold"
              loading={sending || isSubmitting}
              onClick={() => void send()}
            >
              {FEEDBACK_FORM.send}
            </Button>
          </div>
        </Form>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        className="h-[4rem] self-center px-4 text-sm font-medium text-muted-foreground"
        onClick={onClose}
      >
        {FEEDBACK_PROMPT.notNow}
      </Button>
    </div>
  );
}

/**
 * The review prompt after a new resume PDF (MDI-652). One step, the same for every user: the Trustpilot review page,
 * "Tell us what went wrong" (stored for the team) and "Not now". A dialog on desktop and a bottom sheet on phones;
 * both trap focus and close on Escape.
 */
export function FeedbackModal({ open, onClose, onTrustpilot, onSubmit, eyebrow }: FeedbackModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const onOpenChange = (next: boolean) => {
    if (!next) {
      onClose();
    }
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh] overflow-y-auto rounded-t-[1.6rem] px-6 pb-6">
          {open ? (
            // Clear of the drawer's drag handle.
            <div className="pt-6">
              <FeedbackBody
                Title={DrawerTitle}
                Description={DrawerDescription}
                onClose={onClose}
                onTrustpilot={onTrustpilot}
                onSubmit={onSubmit}
                eyebrow={eyebrow}
              />
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn('max-w-[48rem] rounded-[1.6rem] border-0 p-6 shadow-[0_16px_48px_rgba(13,13,13,0.3)] sm:max-w-[48rem]')}
      >
        {open ? (
          <FeedbackBody
            Title={DialogTitle}
            Description={DialogDescription}
            onClose={onClose}
            onTrustpilot={onTrustpilot}
            onSubmit={onSubmit}
            eyebrow={eyebrow}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
