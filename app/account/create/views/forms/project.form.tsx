import { ENTRY_CANCEL_LABEL } from '@/lib/onboarding-copy';
import { Button } from '@components/ui';
import { cn, getErrorMessage } from '@lib/utils';
import { Project } from '@lib/types';
import { projectFormSchema } from '@lib/schema/account.schema';
import { toast } from 'sonner';
import { ProjectFields, ProjectFormValues, projectFormValuesSchema } from './project.fields';
import { useAppForm } from '@lib/forms/use-form';
import { firstFormError } from '@lib/forms/errors';

const DEFAULT_VALUES: ProjectFormValues = {
  name: '',
  additionalDetails: '',
  url: '',
};

type ProjectFieldsProps = {
  className?: string;
  defaultValues?: Partial<ProjectFormValues>;
  onSubmit: (data: Project) => void;
  /** The submit button's text, such as "Add experience" or "Save". */
  submitLabel: string;
  /** Shows a Cancel button that closes the form without saving. */
  onCancel?: () => void;
};

export const ProjectForm = ({ className, defaultValues = DEFAULT_VALUES, submitLabel, onCancel, onSubmit }: ProjectFieldsProps) => {
  const form = useAppForm<ProjectFormValues>({
    defaultValues: {
      ...DEFAULT_VALUES,
      ...defaultValues,
    },
    schema: projectFormValuesSchema,
  });

  const handleSubmit = async () => {
    await form.validateAllFields('submit');
    await form.validate('submit');

    if (!form.state.isValid) {
      toast.error(firstFormError(form));
      return;
    }

    const { success, data: parsedData, error } = projectFormSchema.safeParse({
      ...form.state.values,
      url: form.state.values.url || undefined,
    });

    if (success) {
      onSubmit(parsedData);
      form.reset(DEFAULT_VALUES);
    }

    if (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <ProjectFields form={form} />
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" className="h-[4rem]" onClick={onCancel}>
            {ENTRY_CANCEL_LABEL}
          </Button>
        ) : null}
        <Button type="button" className="h-[4rem]" onClick={() => void handleSubmit()}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};
