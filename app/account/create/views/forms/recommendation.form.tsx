import { ENTRY_CANCEL_LABEL } from '@/lib/onboarding-copy';
import { Button } from '@components/ui';
import { cn, getErrorMessage } from '@lib/utils';
import type { Recommendation } from '@lib/types';
import { recommendationSchema } from '@lib/schema/account.schema';
import { toast } from 'sonner';
import { useAppForm } from '@lib/forms/use-form';
import { firstFormError } from '@lib/forms/errors';

import {
  RecommendationFields,
  type RecommendationFormValues,
  recommendationFormValuesSchema,
} from './recommendation.fields';

const DEFAULT_VALUES: RecommendationFormValues = { name: '', url: '', additionalDetails: '' };

type RecommendationFormProps = {
  className?: string;
  defaultValues?: Partial<RecommendationFormValues>;
  onSubmit: (data: Recommendation) => void;
  submitLabel: string;
  onCancel?: () => void;
};

export const RecommendationForm = ({
  className,
  defaultValues = DEFAULT_VALUES,
  submitLabel,
  onCancel,
  onSubmit,
}: RecommendationFormProps) => {
  const form = useAppForm<RecommendationFormValues>({
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues },
    schema: recommendationFormValuesSchema,
  });

  const handleSubmit = async () => {
    await form.validateAllFields('submit');
    await form.validate('submit');
    if (!form.state.isValid) {
      toast.error(firstFormError(form));
      return;
    }
    const { success, data, error } = recommendationSchema.safeParse(form.state.values);
    if (success) {
      onSubmit(data);
      form.reset(DEFAULT_VALUES);
    }
    if (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <RecommendationFields form={form} />
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
