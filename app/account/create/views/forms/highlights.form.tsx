import { Form } from '@components/ui';
import { cn } from '@lib/utils';
import type { AppForm } from '@lib/forms/use-form';
import { SkillFieldsForm } from './skill-fields';
import { LanguagesFormFields } from './language-fields';
import { LinksFormField } from './link.fields';
import { SectionHeading } from './section-heading';
import { PROFILE_SECTIONS } from '@/lib/onboarding-copy';

type HighlightsFormProps = {
  /** Off where a parent already names the section, as the resume editor's accordion does. */
  heading?: boolean;
  className?: string;
  form: AppForm;
};

export const HighlightsForm = ({ className, form, heading = true }: HighlightsFormProps) => {
  return (
    <Form className={cn('space-y-4', className)}>
      {heading ? <SectionHeading copy={PROFILE_SECTIONS.highlights} /> : null}
      <LinksFormField form={form} />
      <SkillFieldsForm form={form} />
      <LanguagesFormFields form={form} />
    </Form>
  );
};
