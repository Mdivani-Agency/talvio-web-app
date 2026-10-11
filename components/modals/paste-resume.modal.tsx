'use client';

import { useState } from 'react';

import { cn } from '@lib/utils';
import { Button, Textarea } from '@components/ui';
import { Modal } from '@components/views';

/** Client limit for pasted resume text. PDF extraction has no such limit. */
export const MAX_PASTED_RESUME_CHARS = 2000;

const count = new Intl.NumberFormat('en-US');

type PasteResumeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
};

export const PasteResumeModal = ({ isOpen, onClose, onConfirm }: PasteResumeModalProps) => {
  const [text, setText] = useState('');
  const length = text.length;
  const over = length - MAX_PASTED_RESUME_CHARS;
  const canConfirm = text.trim().length > 0 && over <= 0;

  const handleConfirm = () => {
    if (!canConfirm) {
      return;
    }
    onConfirm(text.trim());
    setText('');
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Paste resume text"
      description="Paste the text of your resume. Talvio fills in the form from it."
      className="w-full max-w-lg"
    >
      <div className="flex flex-col gap-2">
        <Textarea
          aria-label="Resume text"
          aria-describedby="paste-resume-count"
          aria-invalid={over > 0}
          placeholder="Paste your resume here"
          size="lg"
          className="h-64"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <p
          id="paste-resume-count"
          aria-live="polite"
          className={cn('text-sm text-right text-muted-foreground', over > 0 && 'text-destructive')}
        >
          {count.format(length)} / {count.format(MAX_PASTED_RESUME_CHARS)} characters
          {over > 0 ? ` (${count.format(over)} over the limit)` : ''}
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" size="sm" className="w-36" disabled={!canConfirm} onClick={handleConfirm}>
          Confirm
        </Button>
      </div>
    </Modal>
  );
};
