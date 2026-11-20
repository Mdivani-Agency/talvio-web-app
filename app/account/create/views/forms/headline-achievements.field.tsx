'use client';

import { useId } from 'react';
import { Plus, Trash } from 'lucide-react';
import { useStore } from '@tanstack/react-form';

import { Button, FormControl, FormField, FormItem, FormMessage, Input } from '@components/ui';
import type { AppForm } from '@lib/forms/use-form';
import { fieldErrorMessage } from '@lib/forms/errors';
import { useFormArray } from '@lib/forms/use-form-array';
import { HEADLINE_ACHIEVEMENTS_MAX } from '@lib/schema/account.schema';
import { optionalFieldUse } from '@lib/template-fields';
import type { HeadlineAchievement } from '@lib/types';
import { HEADLINE_ACHIEVEMENT_COPY as COPY } from '@/lib/onboarding-copy';

import { useCurrentTemplate } from './template-context';

const NAME = 'headlineAchievements';

/** Up to three results, each a value and what it measures. Shown at the top of the Executive template. */
export function HeadlineAchievementsField({ form }: { form: AppForm }) {
  const { fields, append, remove } = useFormArray<HeadlineAchievement>(form, NAME);
  const template = useCurrentTemplate();
  const titleId = useId();
  const hintId = useId();
  const listError = useStore(form.store, (state) => fieldErrorMessage(state.fieldMeta[NAME as never]?.errors ?? []));
  const full = fields.length >= HEADLINE_ACHIEVEMENTS_MAX;

  return (
    <div role="group" aria-labelledby={titleId} aria-describedby={hintId} className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span id={titleId} className="text-sm font-medium text-foreground">
          {COPY.label}
        </span>
        <span data-allow-small-text className="text-[1.3rem] text-muted-foreground" aria-live="polite">
          {COPY.count(fields.length, HEADLINE_ACHIEVEMENTS_MAX)}
        </span>
      </div>
      <p id={hintId} data-allow-small-text className="text-[1.3rem] text-muted-foreground">
        {COPY.hint} {optionalFieldUse('headlineAchievements', template)}
      </p>
      {fields.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {fields.map((item, index) => (
            <li
              key={item.id}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_4rem] items-start gap-2 md:grid-cols-[12rem_minmax(0,1fr)_4rem]"
            >
              <FormField form={form} name={`${NAME}[${index}].value`}>
                {(field) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        name={field.name}
                        aria-label={COPY.value.label(index + 1)}
                        value={String(field.state.value ?? '')}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder={COPY.value.example}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              </FormField>
              <FormField form={form} name={`${NAME}[${index}].label`}>
                {(field) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        name={field.name}
                        aria-label={COPY.measure.label(index + 1)}
                        value={String(field.state.value ?? '')}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder={COPY.measure.example}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              </FormField>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={COPY.remove(index + 1)}
                onClick={() => remove(index)}
                className="size-12 text-destructive hover:text-destructive"
              >
                <Trash aria-hidden="true" className="size-4" strokeWidth={1.75} />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {listError ? <p className="text-sm text-destructive">{listError}</p> : null}
      {full ? (
        <p data-allow-small-text className="text-[1.3rem] text-muted-foreground">
          {COPY.limitReached(HEADLINE_ACHIEVEMENTS_MAX)}
        </p>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-10 self-start"
          onClick={() => append({ value: '', label: '' })}
        >
          <Plus aria-hidden="true" className="size-4" />
          {COPY.add}
        </Button>
      )}
    </div>
  );
}
