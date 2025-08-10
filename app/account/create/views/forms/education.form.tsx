import { useForm } from "react-hook-form";
import { Button } from "@components/ui";
import { cn, getErrorMessage } from "@lib/utils";
import { Education } from "@lib/types";
import { educationFormSchema } from "@lib/schema/account.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { EducationFields, EducationFormValues, educationFormValuesSchema } from "./education.fields";

const DEFAULT_VALUES: EducationFormValues = {
  name: "",
  degreeType: "",
  startDate: "",
  endDate: "",
  isPresent: "",
  additionalDetails: "",
};

type EducationFieldsProps = {
  className?: string;
  defaultValues?: Partial<EducationFormValues>;
  onSubmit: (data: Education) => void;
  action: 'add' | 'edit';
};

export const EducationForm = ({ className, defaultValues = DEFAULT_VALUES, action, onSubmit }: EducationFieldsProps) => {
  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationFormValuesSchema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit((data) => {
    const { success, data: parsedData, error } = educationFormSchema.safeParse({
      ...data,
      isPresent: data.isPresent ? new Date().toISOString() : undefined,
      endDate: data.endDate ? new Date().toISOString() : undefined,
    });

    if (success) {
      onSubmit(parsedData);
      form.reset();
    }

    if (error) {
      toast.error(getErrorMessage(error));
    }
  }, (errors) => {
    console.log(errors);
    toast.error(
      errors.root?.message ||
      errors.name?.message ||
      errors.degreeType?.message ||
      errors.startDate?.message ||
      errors.endDate?.message ||
      errors.isPresent?.message ||
      errors.additionalDetails?.message
    );
  });

  return (
    <div className={cn("space-y-6", className)}>
      <EducationFields form={form} />
      <div className="flex justify-end gap-2">
        <Button type="button" className="w-36" variant={'secondary'} onClick={handleSubmit}>{action === 'add' ? 'Add' : 'Save'}</Button>
      </div>
    </div>
  );
};
