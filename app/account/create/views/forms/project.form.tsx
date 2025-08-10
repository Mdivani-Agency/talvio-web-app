import { useForm } from "react-hook-form";
import { Button } from "@components/ui";
import { cn, getErrorMessage } from "@lib/utils";
import { Project } from "@lib/types";
import { projectFormSchema } from "@lib/schema/account.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ProjectFields, ProjectFormValues, projectFormValuesSchema } from "./project.fields";

const DEFAULT_VALUES: ProjectFormValues = {
  name: "",
  additionalDetails: "",
  url: "",
};

type ProjectFieldsProps = {
  className?: string;
  defaultValues?: Partial<ProjectFormValues>;
  onSubmit: (data: Project) => void;
  action: 'add' | 'edit';
};

export const ProjectForm = ({ className, defaultValues = DEFAULT_VALUES, action, onSubmit }: ProjectFieldsProps) => {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormValuesSchema),
    defaultValues: {
      ...DEFAULT_VALUES,
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    const { success, data: parsedData, error } = projectFormSchema.safeParse({
      ...data,
      url: data.url ?? undefined,
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
      errors.url?.message ||
      errors.additionalDetails?.message
    );
  });

  return (
    <div className={cn("space-y-6", className)}>
      <ProjectFields form={form} />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          className={"w-36"}
          variant={'secondary'}
          size={'icon'}
          onClick={handleSubmit}>{action === 'add' ? 'Add' : 'Save'}</Button>
      </div>
    </div>
  );
};
