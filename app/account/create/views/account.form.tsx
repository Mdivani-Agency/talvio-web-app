'use client';

import { accountSchema } from "@lib/schema/account.schema";
import { ProfileForm } from "./forms/profile.form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormReturn } from "react-hook-form";
import { Button } from "@components/ui";
import { ContactsForm } from "./forms/contacts.form";
import { HighlightsForm } from "./forms/highlights.form";
import { Account, Highlights } from "@lib/types";
import { ExperienceView } from "./experience";
import { EducationView } from "./education";
import { ProjectsView } from "./projects";

interface AccountFormProps {
  values?: Account
}

export const AccountForm = ({ values }: AccountFormProps) => {
  const form = useForm<Account>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      profile: {
        firstName: '',
        lastName: '',
        role: '',
        email: '',
        phone: '',
        website: '',
        tagline: '',
        city: '',
        country: '',
        seniority: 'entry',
      },
      languages: [],
      links: [],
      experience: [],
      education: [],
      skills: [],
      tools: [],
    },
    values,
  });

  const handleSubmit = form.handleSubmit((data) => {
    console.log(data);
  });

  return (
    <div className="space-y-8 py-8">
      <ProfileForm form={form} />
      <ContactsForm form={form} />
      <HighlightsForm form={form as unknown as UseFormReturn<Highlights>} />
      <ExperienceView form={form} />
      <EducationView form={form} />
      <ProjectsView form={form} />
      <div className="flex justify-end gap-2">
        <Button className="w-64" onClick={handleSubmit} type="button">Continue</Button>
      </div>
    </div>
  );
};
