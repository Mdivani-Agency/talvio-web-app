import { UseFormReturn } from "react-hook-form";
import { Form } from "@components/ui";
import { cn } from "@lib/utils";
import { SkillFields } from "@lib/types";
import { SkillsFormField } from "./skill.field";

type SkillFieldsFormProps = {
  className?: string;
  form: UseFormReturn<SkillFields>;
};

export const SkillFieldsForm = ({ className, form }: SkillFieldsFormProps) => {
  return (
    <Form {...form}>
      <div className={cn("space-y-6", className)}>
        <SkillsFormField form={form} name="skills" />
        <SkillsFormField form={form} name="tools" />
      </div>
    </Form>
  );
};
