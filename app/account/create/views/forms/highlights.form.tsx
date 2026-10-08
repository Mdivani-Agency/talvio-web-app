import { Form, Label } from '@components/ui';
import { cn } from '@lib/utils';
import type { AppForm } from '@lib/forms/use-form';
import { SkillFieldsForm } from './skill-fields';
import { LanguagesFormFields } from './language-fields';
import { LinksFormField } from './link.fields';

type HighlightsFormProps = {
  className?: string;
  form: AppForm;
};

export const HighlightsForm = ({ className, form }: HighlightsFormProps) => {
  return (
    <Form className={cn('space-y-6', className)}>
      <Label size="lg">Highlights</Label>
      <LinksFormField form={form} />
      <SkillFieldsForm form={form} />
      <LanguagesFormFields form={form} />
    </Form>
  );
};
