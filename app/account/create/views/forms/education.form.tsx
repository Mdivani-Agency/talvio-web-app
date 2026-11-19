import { ENTRY_CANCEL_LABEL } from '@/lib/onboarding-copy';
import { Button } from '@components/ui';
import { cn, getErrorMessage } from '@lib/utils';
import { Education } from '@lib/types';
import { educationFormSchema } from '@lib/schema/account.schema';
import { toast } from 'sonner';
import { EducationFields, EducationFormValues, educationFormValuesSchema } from './education.fields';
import { useAppForm } from '@lib/forms/use-form';
import { firstFormError } from '@lib/forms/errors';

const DEFAULT_VALUES: EducationFormValues = {
  name: '',
  degreeType: '',
  startDate: '',
  endDate: '',
  isPresent: false,
  additionalDetails: '',
};

type EducationFieldsProps = {
  className?: string;
  defaultValues?: Partial<EducationFormValues>;
  onSubmit: (data: Education) => void;
  /** The submit button's text, such as "Add experience" or "Save". */
  submitLabel: string;
  /** Shows a Cancel button that closes the form without saving. */
  onCancel?: () => void;
};

export const EducationForm = ({ className, defaultValues = DEFAULT_VALUES, submitLabel, onCancel, onSubmit }: EducationFieldsProps) => {
  const form = useAppForm<EducationFormValues>({
    defaultValues: {
      ...DEFAULT_VALUES,
      ...defaultValues,
    },
    schema: educationFormValuesSchema,
  });

  const handleSubmit = async () => {
    await form.validateAllFields('submit');
    await form.validate('submit');

    if (!form.state.isValid) {
      toast.error(firstFormError(form));
      return;
    }

    const { success, data: parsedData, error } = educationFormSchema.safeParse({
      ...form.state.values,
      isPresent: Boolean(form.state.values.isPresent),
      endDate: form.state.values.endDate || undefined,
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
      <EducationFields form={form} />
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
