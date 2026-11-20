'use client';

import { Check, X } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input } from '@components/ui';
import type { ApplicationPatch } from '@/lib/adapters/application.adapter';
import {
  ADD_LABEL_LABEL,
  LABEL_COLOR_LABEL,
  LABEL_COLOR_NAMES,
  LABEL_DUPLICATE_ERROR,
  LABEL_NAME_LABEL,
  LABEL_NAME_PLACEHOLDER,
  LABEL_SAVE_LABEL,
  NOTE_CANCEL_LABEL,
  removeLabelLabel,
} from '@/lib/applications-copy';
import { firstFormError } from '@lib/forms/errors';
import { useAppForm } from '@lib/forms/use-form';
import { APPLICATION_LABELS_MAX, LABEL_COLORS, LABEL_NAME_MAX, labelColorSchema } from '@lib/schema/application.schema';
import type { ApplicationLabel, JobApplication, LabelColor } from '@lib/types';
import { cn } from '@lib/utils';

import { CHIP_CLASS, LABEL_TONES } from '../tones';

/** The + Label form. `taken` is the card's current label names, compared without case. */
export function labelFormValuesSchema(taken: string[]) {
  const names = new Set(taken.map((name) => name.trim().toLowerCase()));
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: 'Name the label' })
      .max(LABEL_NAME_MAX, { message: `Use ${LABEL_NAME_MAX} characters or fewer` })
      .refine((name) => !names.has(name.trim().toLowerCase()), { message: LABEL_DUPLICATE_ERROR }),
    color: labelColorSchema,
  });
}
type LabelFormValues = { name: string; color: LabelColor };

function AddLabelForm({
  taken,
  suggestions,
  onAdd,
  onCancel,
}: {
  taken: string[];
  suggestions: ApplicationLabel[];
  onAdd: (label: ApplicationLabel) => Promise<boolean>;
  onCancel: () => void;
}) {
  const listId = useId();
  const form = useAppForm<LabelFormValues>({
    defaultValues: { name: '', color: 'blue' },
    schema: labelFormValuesSchema(taken),
  });

  const add = async () => {
    await form.validateAllFields('submit');
    await form.validate('submit');
    if (!form.state.isValid) {
      toast.error(firstFormError(form));
      return;
    }
    const values = form.state.values as LabelFormValues;
    if (await onAdd({ name: values.name.trim(), color: values.color })) {
      onCancel();
    }
  };

  return (
    <Form className="flex flex-col gap-3 rounded-[1rem] border border-input p-3">
      <FormField form={form} name="name">
        {(field) => (
          <FormItem>
            <FormLabel>{LABEL_NAME_LABEL}</FormLabel>
            <FormControl>
              <Input
                autoFocus
                list={listId}
                name={field.name}
                placeholder={LABEL_NAME_PLACEHOLDER}
                value={String(field.state.value ?? '')}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                  // Picking a label used on another card keeps its colour.
                  const known = suggestions.find((label) => label.name.toLowerCase() === event.target.value.trim().toLowerCase());
                  if (known) {
                    form.setFieldValue('color', known.color);
                  }
                }}
                className="h-[4.4rem]"
              />
            </FormControl>
            <datalist id={listId}>
              {suggestions.map((label) => (
                <option key={label.name} value={label.name} />
              ))}
            </datalist>
            <FormMessage />
          </FormItem>
        )}
      </FormField>
      <FormField form={form} name="color">
        {(field) => (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium text-foreground">{LABEL_COLOR_LABEL}</legend>
            <div role="radiogroup" aria-label={LABEL_COLOR_LABEL} className="flex flex-wrap gap-1.5">
              {LABEL_COLORS.map((color) => {
                const selected = field.state.value === color;
                return (
                  <button
                    key={color}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={LABEL_COLOR_NAMES[color]}
                    title={LABEL_COLOR_NAMES[color]}
                    onClick={() => field.handleChange(color)}
                    className={cn(
                      'flex size-[3.2rem] items-center justify-center rounded-full border-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                      LABEL_TONES[color],
                      selected ? 'border-foreground' : 'border-transparent',
                    )}
                  >
                    {selected ? <Check aria-hidden="true" className="size-[1.4rem]" /> : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      </FormField>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" className="h-[4rem] text-sm" onClick={onCancel}>
          {NOTE_CANCEL_LABEL}
        </Button>
        <Button type="button" className="h-[4rem] text-sm" onClick={() => void add()}>
          {LABEL_SAVE_LABEL}
        </Button>
      </div>
    </Form>
  );
}

/** Label chips with a remove button, and + Label; at most 10. Suggestions are labels already used on other cards. */
export function LabelsSection({
  application,
  knownLabels,
  onSave,
}: {
  application: JobApplication;
  knownLabels: ApplicationLabel[];
  onSave: (patch: ApplicationPatch) => Promise<boolean>;
}) {
  const [adding, setAdding] = useState(false);
  const labels = application.labels;
  const taken = labels.map((label) => label.name);
  const suggestions = knownLabels.filter((label) => !taken.some((name) => name.toLowerCase() === label.name.toLowerCase()));

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap items-center gap-1.5">
        {labels.map((label) => (
          <li key={label.name} className={cn(CHIP_CLASS, 'flex items-center gap-1 pr-1', LABEL_TONES[label.color])}>
            {label.name}
            <button
              type="button"
              aria-label={removeLabelLabel(label.name)}
              className="flex size-[2rem] items-center justify-center rounded-sm outline-none hover:bg-black/10 focus-visible:ring-2 focus-visible:ring-ring/50 dark:hover:bg-white/10"
              onClick={() => void onSave({ labels: labels.filter((item) => item.name !== label.name) })}
            >
              <X aria-hidden="true" className="size-[1.2rem]" />
            </button>
          </li>
        ))}
        {!adding && labels.length < APPLICATION_LABELS_MAX ? (
          <li>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="h-[2.8rem] rounded-[0.6rem] border border-dashed border-input px-2 text-xs font-semibold text-foreground outline-none hover:bg-popover focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:bg-accent/40"
            >
              {ADD_LABEL_LABEL}
            </button>
          </li>
        ) : null}
      </ul>
      {adding ? (
        <AddLabelForm
          taken={taken}
          suggestions={suggestions}
          onAdd={(label) => onSave({ labels: [...labels, label] })}
          onCancel={() => setAdding(false)}
        />
      ) : null}
    </div>
  );
}
