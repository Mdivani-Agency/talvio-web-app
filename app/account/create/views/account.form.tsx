'use client';

import { accountSchema } from "@lib/schema/account.schema";
import { ProfileForm } from "./forms/profile.form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@components/ui";

export const AccountForm = () => {
  const form = useForm<z.infer<typeof accountSchema>>({
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
  });

  const handleSubmit = form.handleSubmit((data) => {
    console.log(data);
  });

  return (
    <form className="space-y-8 py-8" onSubmit={handleSubmit}>
      <ProfileForm form={form} />
      <div className="flex justify-end gap-2">
        <Button className="w-64" onClick={handleSubmit} type="button">Continue</Button>
      </div>
    </form>
  );
};
