import { useForm } from "react-hook-form";
import { Button } from "@components/ui";
import { cn } from "@lib/utils";
import { Experience } from "@lib/types";
import { experienceSchema } from "@lib/schema/account.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ExperienceFields } from "./experience.fields";

const DEFAULT_VALUES: Experience = {
  company: "",
  jobTitle: "",
  startDate: "",
  endDate: "",
  additionalDetails: "",
  achievements: [],
  responsibilities: [],
  keyContributions: [],
};

type ExperienceFieldsProps = {
  className?: string;
  defaultValues?: Experience;
  onSubmit: (data: Experience) => void;
  onCancel?: () => void;
  action: 'add' | 'edit';
};

export const ExperienceForm = ({ className, defaultValues = DEFAULT_VALUES, action, onCancel, onSubmit }: ExperienceFieldsProps) => {
  const form = useForm<Experience>({
    resolver: zodResolver(experienceSchema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  }, (errors) => {
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
        <Button type="button" className="w-36" variant={'secondary'} onClick={handleSubmit}>{action === 'add' ? 'Add' : 'Save'}</Button>
      </div>
    </div>
  );
};
