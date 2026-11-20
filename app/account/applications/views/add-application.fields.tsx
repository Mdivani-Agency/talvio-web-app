'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui';
import { ADD_FIELDS, STAGE_NAMES } from '@/lib/applications-copy';
import { resumeDisplayTitle } from '@/lib/adapters/resume.adapter';
import type { AppForm } from '@lib/forms/use-form';
import { APPLICATION_STAGES } from '@lib/schema/application.schema';
import type { Resume } from '@lib/types';

/** Radix Select has no empty value, so "no resume" is this sentinel in the control and `''` in the form. */
const NO_RESUME = 'none';

type TextFieldProps = {
  form: AppForm;
  name: 'position' | 'company' | 'jobPostUrl' | 'appliedOn';
  label: string;
  placeholder?: string;
  type?: 'text' | 'url' | 'date';
  autoFocus?: boolean;
};

function TextField({ form, name, label, placeholder, type = 'text', autoFocus }: TextFieldProps) {
  return (
    <FormField form={form} name={name}>
      {(field) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              name={field.name}
              autoFocus={autoFocus}
              inputMode={type === 'url' ? 'url' : undefined}
              placeholder={placeholder}
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
  );
}

type AddApplicationFieldsProps = {
  form: AppForm;
  resumes: Resume[];
  resumesLoading: boolean;
};

export function AddApplicationFields({ form, resumes, resumesLoading }: AddApplicationFieldsProps) {
  return (
    <Form className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField form={form} name="position" autoFocus {...ADD_FIELDS.position} />
        <TextField form={form} name="company" {...ADD_FIELDS.company} />
      </div>
      <TextField form={form} name="jobPostUrl" type="url" {...ADD_FIELDS.jobPostUrl} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField form={form} name="stage">
          {(field) => (
            <FormItem>
              <FormLabel>{ADD_FIELDS.stage.label}</FormLabel>
              <Select value={String(field.state.value)} onValueChange={(value) => field.handleChange(value)}>
                <FormControl>
                  <SelectTrigger className="h-[4.4rem] text-sm md:text-md">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {APPLICATION_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {STAGE_NAMES[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        </FormField>
        <TextField form={form} name="appliedOn" type="date" label={ADD_FIELDS.appliedOn.label} />
      </div>
      <FormField form={form} name="resumeId">
        {(field) => (
          <FormItem>
            <FormLabel>{ADD_FIELDS.resumeId.label}</FormLabel>
            <Select
              value={String(field.state.value || NO_RESUME)}
              onValueChange={(value) => field.handleChange(value === NO_RESUME ? '' : value)}
              disabled={resumesLoading}
            >
              <FormControl>
                <SelectTrigger className="h-[4.4rem] text-sm md:text-md">
                  <SelectValue placeholder={ADD_FIELDS.resumeId.placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NO_RESUME}>{ADD_FIELDS.resumeId.none}</SelectItem>
                {resumes.map((resume) => (
                  <SelectItem key={resume.id} value={resume.id}>
                    {resumeDisplayTitle(resume)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      </FormField>
    </Form>
  );
}
