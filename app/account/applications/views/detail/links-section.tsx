'use client';

import { ExternalLink, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';

import { Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input } from '@components/ui';
import type { ApplicationPatch } from '@/lib/adapters/application.adapter';
import { ADD_LINK_LABEL, LINK_FIELDS, LINK_SAVE_LABEL, NOTE_CANCEL_LABEL, removeLinkLabel } from '@/lib/applications-copy';
import { firstFormError } from '@lib/forms/errors';
import { useAppForm } from '@lib/forms/use-form';
import { APPLICATION_LINKS_MAX, LINK_NAME_MAX, LINK_URL_MAX } from '@lib/schema/application.schema';
import type { ApplicationLink, JobApplication } from '@lib/types';
import { toast } from 'sonner';

/** The Add a link form. The card's list is checked again by the database. */
export const linkFormValuesSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Name the link' })
    .max(LINK_NAME_MAX, { message: `Use ${LINK_NAME_MAX} characters or fewer` }),
  url: z
    .string()
    .trim()
    .max(LINK_URL_MAX, { message: 'This link is too long' })
    .regex(/^https?:\/\/\S+$/i, { message: 'Enter a link that starts with https://' }),
});
type LinkFormValues = z.input<typeof linkFormValuesSchema>;

function hostOf(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname === '/' ? '' : parsed.pathname}`;
  } catch {
    return url;
  }
}

function AddLinkForm({ onAdd, onCancel }: { onAdd: (link: ApplicationLink) => Promise<boolean>; onCancel: () => void }) {
  const form = useAppForm<LinkFormValues>({ defaultValues: { name: '', url: '' }, schema: linkFormValuesSchema });

  const add = async () => {
    await form.validateAllFields('submit');
    await form.validate('submit');
    if (!form.state.isValid) {
      toast.error(firstFormError(form));
      return;
    }
    const values = form.state.values as LinkFormValues;
    if (await onAdd({ name: values.name.trim(), url: values.url.trim() })) {
      onCancel();
    }
  };

  return (
    <Form className="flex flex-col gap-3 rounded-[1rem] border border-input p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(['name', 'url'] as const).map((name) => (
          <FormField key={name} form={form} name={name}>
            {(field) => (
              <FormItem>
                <FormLabel>{LINK_FIELDS[name].label}</FormLabel>
                <FormControl>
                  <Input
                    type={name === 'url' ? 'url' : 'text'}
                    autoFocus={name === 'name'}
                    name={field.name}
                    placeholder={LINK_FIELDS[name].placeholder}
                    value={String(field.state.value ?? '')}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    className="h-[4.4rem]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          </FormField>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" className="h-[4rem] text-sm" onClick={onCancel}>
          {NOTE_CANCEL_LABEL}
        </Button>
        <Button type="button" className="h-[4rem] text-sm" onClick={() => void add()}>
          {LINK_SAVE_LABEL}
        </Button>
      </div>
    </Form>
  );
}

/** Named links that open in a new tab; at most 10. */
export function LinksSection({ application, onSave }: { application: JobApplication; onSave: (patch: ApplicationPatch) => Promise<boolean> }) {
  const [adding, setAdding] = useState(false);
  const links = application.links;

  return (
    <div className="flex flex-col gap-2">
      {links.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {links.map((link, index) => (
            <li key={`${link.url}-${index}`} className="flex min-w-0 items-center gap-2">
              <span className="flex min-w-0 flex-1 flex-col">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 self-start text-sm font-semibold text-secondary underline-offset-2 hover:underline dark:text-[#8688ea]"
                >
                  {link.name}
                  <ExternalLink aria-hidden="true" className="size-[1.4rem]" />
                </a>
                <span className="truncate text-xs text-muted-foreground">{hostOf(link.url)}</span>
              </span>
              <button
                type="button"
                aria-label={removeLinkLabel(link.name)}
                className="flex size-[3.2rem] shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-popover hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:bg-accent/40"
                onClick={() => void onSave({ links: links.filter((_, item) => item !== index) })}
              >
                <X aria-hidden="true" className="size-[1.6rem]" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {adding ? (
        <AddLinkForm onAdd={(link) => onSave({ links: [...links, link] })} onCancel={() => setAdding(false)} />
      ) : links.length < APPLICATION_LINKS_MAX ? (
        <Button type="button" variant="ghost" className="h-[3.6rem] self-start px-2 text-[1.3rem]" onClick={() => setAdding(true)}>
          <Plus aria-hidden="true" className="size-[1.6rem]" />
          {ADD_LINK_LABEL}
        </Button>
      ) : null}
    </div>
  );
}
