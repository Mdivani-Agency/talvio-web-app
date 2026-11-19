import { Form } from '@components/ui';
import { cn } from '@lib/utils';
import type { AppForm } from '@lib/forms/use-form';
import { SkillFieldsForm } from './skill-fields';
import { LanguagesFormFields } from './language-fields';
import { LinksFormField } from './link.fields';
import { SectionHeading } from './section-heading';
import { PROFILE_SECTIONS } from '@/lib/onboarding-copy';

type HighlightsFormProps = {
  className?: string;
  form: AppForm;
};

export const HighlightsForm = ({ className, form }: HighlightsFormProps) => {
  return (
    <Form className={cn('space-y-4', className)}>
      <SectionHeading copy={PROFILE_SECTIONS.highlights} />
      <LinksFormField form={form} />
      <SkillFieldsForm form={form} />
      <LanguagesFormFields form={form} />
    </Form>
  );
};
