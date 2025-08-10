import { useForm } from "react-hook-form";
import { Button } from "@components/ui";
import { cn, getErrorMessage } from "@lib/utils";
import { Experience } from "@lib/types";
import { experienceSchema } from "@lib/schema/account.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ExperienceFields, ExperienceFormValues, experienceFormValuesSchema } from "./experience.fields";

const DEFAULT_VALUES: ExperienceFormValues = {
  company: "",
  jobTitle: "",
  startDate: "",
  endDate: "",
  additionalDetails: "",
  achievements: [],
  responsibilities: [],
  keyContributions: [],
  employmentType: "",
  locationType: "",
};

type ExperienceFieldsProps = {
  className?: string;
  defaultValues?: Partial<ExperienceFormValues>;
  onSubmit: (data: Experience) => void;
  action: 'add' | 'edit';
};

export const ExperienceForm = ({ className, defaultValues = DEFAULT_VALUES, action, onSubmit }: ExperienceFieldsProps) => {
  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceFormValuesSchema),
    defaultValues: {
      ...DEFAULT_VALUES,
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    console.log('data', data);
    const { success, data: parsedData, error } = experienceSchema.safeParse({
      ...data,
      isPresent: data.isPresent ?? undefined,
      endDate: data.endDate ?? undefined,
      employmentType: data.employmentType || undefined,
      locationType: data.locationType || undefined,
      additionalDetails: data.additionalDetails || undefined,
      achievements: data.achievements.length > 0 ? data.achievements : undefined,
      responsibilities: data.responsibilities.length > 0 ? data.responsibilities : undefined,
      keyContributions: data.keyContributions.length > 0 ? data.keyContributions : undefined,
    });

    if (success) {
      onSubmit(parsedData);
      form.reset();
    }

    if (error) {
      toast.error(getErrorMessage(error));
    }
  }, (errors) => {
    console.log('errors', errors);
    toast.error(
      errors.root?.message ||
      errors.company?.message ||
      errors.jobTitle?.message ||
      errors.startDate?.message ||
      errors.endDate?.message ||
      errors.employmentType?.message ||
      errors.locationType?.message ||
      errors.additionalDetails?.message ||
      errors.achievements?.message ||
      errors.responsibilities?.message ||
      errors.keyContributions?.message
    );
  });

  return (
    <div className={cn("space-y-6", className)}>
      <ExperienceFields form={form} />
      <div className="flex justify-end gap-2">
        <Button type="button" className="w-36" variant={'secondary'} size={'icon'} onClick={handleSubmit}>{action === 'add' ? 'Add' : 'Save'}</Button>
      </div>
    </div>
  );
};
