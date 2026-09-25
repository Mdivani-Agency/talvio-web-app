import { Button } from '@components/ui';
import { cn, getErrorMessage } from '@lib/utils';
import { Experience } from '@lib/types';
import { experienceSchema } from '@lib/schema/account.schema';
import { toast } from 'sonner';
import { ExperienceFields, ExperienceFormValues, experienceFormValuesSchema } from './experience.fields';
import { useAppForm } from '@lib/forms/use-form';
import { firstFormError } from '@lib/forms/errors';

const DEFAULT_VALUES: ExperienceFormValues = {
  company: '',
  jobTitle: '',
  startDate: '',
  endDate: '',
  additionalDetails: '',
  achievements: [],
  responsibilities: [],
  keyContributions: [],
  employmentType: '',
  locationType: '',
};

type ExperienceFieldsProps = {
  className?: string;
  defaultValues?: Partial<ExperienceFormValues>;
  onSubmit: (data: Experience) => void;
  action: 'add' | 'edit';
};

function definedDefaults(values: Partial<ExperienceFormValues>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) as Partial<ExperienceFormValues>;
}

export const ExperienceForm = ({ className, defaultValues = DEFAULT_VALUES, action, onSubmit }: ExperienceFieldsProps) => {
  const form = useAppForm<ExperienceFormValues>({
    defaultValues: {
      ...DEFAULT_VALUES,
      ...definedDefaults(defaultValues),
    },
    schema: experienceFormValuesSchema,
  });

  const handleSubmit = async () => {
    await form.validateAllFields('submit');
    await form.validate('submit');

    if (!form.state.isValid) {
      toast.error(firstFormError(form));
      return;
    }

    const values = form.state.values;
    const { success, data: parsedData, error } = experienceSchema.safeParse({
      ...values,
      startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
      isPresent: Boolean(values.isPresent),
      endDate: !values.isPresent && values.endDate ? new Date(values.endDate).toISOString() : undefined,
      employmentType: values.employmentType || undefined,
      locationType: values.locationType || undefined,
      additionalDetails: values.additionalDetails || '',
      achievements: values.achievements.length > 0 ? values.achievements : [],
      responsibilities: values.responsibilities.length > 0 ? values.responsibilities : [],
      keyContributions: values.keyContributions.length > 0 ? values.keyContributions : [],
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
      <ExperienceFields form={form} />
      <div className="flex justify-end gap-2">
        <Button type="button" className="w-36" variant={'secondary'} size={'icon'} onClick={() => void handleSubmit()}>
          {action === 'add' ? 'Add' : 'Save'}
        </Button>
      </div>
    </div>
  );
};
