import { UseFormReturn } from "react-hook-form";
import { Form, Label } from "@components/ui";
import { cn } from "@lib/utils";
import { Highlights } from "@lib/types";
import { SkillFieldsForm } from "./skill-fields";
import { LanguagesFormFields } from "./language-fields";

type HighlightsFormProps = {
  className?: string;
  form: UseFormReturn<Highlights>;
};

export const HighlightsForm = ({ className, form }: HighlightsFormProps) => {
  return (
    <Form {...form}>
      <div className={cn("space-y-6", className)}>
        <Label size="lg">Highlights</Label>
        <SkillFieldsForm form={form} />
        <LanguagesFormFields form={form} />
      </div>
    </Form>
  );
};
