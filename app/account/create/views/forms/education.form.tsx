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
  action: 'add' | 'edit';
};

export const EducationForm = ({ className, defaultValues = DEFAULT_VALUES, action, onSubmit }: EducationFieldsProps) => {
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
        <Button type="button" className="w-36" variant={'secondary'} size={'icon'} onClick={() => void handleSubmit()}>
          {action === 'add' ? 'Add' : 'Save'}
        </Button>
      </div>
    </div>
  );
};
