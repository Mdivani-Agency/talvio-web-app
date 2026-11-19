import { Form } from '@components/ui';
import { cn } from '@lib/utils';
import type { AppForm } from '@lib/forms/use-form';
import { SkillsFormField } from './skill.field';

type SkillFieldsFormProps = {
  className?: string;
  form: AppForm;
};

export const SkillFieldsForm = ({ className, form }: SkillFieldsFormProps) => {
  return (
    <Form className={cn('grid grid-cols-1 gap-4 md:grid-cols-2', className)}>
      <SkillsFormField form={form} name="skills" />
      <SkillsFormField form={form} name="tools" />
    </Form>
  );
};
