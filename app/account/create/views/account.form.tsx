'use client';

import { accountSchema } from '@lib/schema/account.schema';
import { ProfileForm } from './forms/profile.form';
import { Button } from '@components/ui';
import { ContactsForm } from './forms/contacts.form';
import { HighlightsForm } from './forms/highlights.form';
import { AccountDto } from '@lib/types';
import { ExperienceView } from './experience';
import { EducationView } from './education';
import { ProjectsView } from './projects';
import { useAccountContext } from '@app/account/providers/state-provider';
import { toast } from 'sonner';
import { useAppForm } from '@lib/forms/use-form';
import { firstFormError } from '@lib/forms/errors';

export const DEFAULT_ACCOUNT_DTO: AccountDto = {
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
};

interface AccountFormProps {
  onSubmit: (data: AccountDto) => void;
}

export const AccountForm = ({ onSubmit }: AccountFormProps) => {
  const { state, send } = useAccountContext();
  const values = state.context.accountDto || state.context.partialDto || {};

  const form = useAppForm<AccountDto>({
    defaultValues: {
      profile: {
        firstName: values.profile?.firstName || DEFAULT_ACCOUNT_DTO.profile.firstName,
        lastName: values.profile?.lastName || DEFAULT_ACCOUNT_DTO.profile.lastName,
        role: values.profile?.role || DEFAULT_ACCOUNT_DTO.profile.role,
        email: values.profile?.email || DEFAULT_ACCOUNT_DTO.profile.email,
        phone: values.profile?.phone || DEFAULT_ACCOUNT_DTO.profile.phone,
        website: values.profile?.website || DEFAULT_ACCOUNT_DTO.profile.website,
        tagline: values.profile?.tagline || DEFAULT_ACCOUNT_DTO.profile.tagline,
        city: values.profile?.city || DEFAULT_ACCOUNT_DTO.profile.city,
        country: values.profile?.country || DEFAULT_ACCOUNT_DTO.profile.country,
        seniority: values.profile?.seniority || DEFAULT_ACCOUNT_DTO.profile.seniority,
      },
      languages: values.languages || DEFAULT_ACCOUNT_DTO.languages,
      links: values.links || DEFAULT_ACCOUNT_DTO.links,
      experience: values.experience || DEFAULT_ACCOUNT_DTO.experience,
      education: values.education || DEFAULT_ACCOUNT_DTO.education,
      skills: values.skills || DEFAULT_ACCOUNT_DTO.skills,
      tools: values.tools || DEFAULT_ACCOUNT_DTO.tools,
      projects: values.projects || DEFAULT_ACCOUNT_DTO.projects,
    },
    schema: accountSchema,
    validateOn: 'submit',
    onSubmit,
    onValuesChange: (data) => {
      send({ type: 'SET_PARTIAL_DTO', value: data });
    },
  });

  const handleSubmit = async () => {
    await form.handleSubmit();
    if (!form.state.isValid) {
      toast.error('Failed to create account', {
        description: firstFormError(form),
      });
    }
  };

  return (
    <div className="space-y-8 py-8">
      <ProfileForm form={form} />
      <ContactsForm form={form} />
      <HighlightsForm form={form} />
      <ExperienceView form={form} />
      <EducationView form={form} />
      <ProjectsView form={form} />
      <div className="flex justify-end gap-2">
        <Button className="w-64" onClick={() => void handleSubmit()} type="button">
          Continue
        </Button>
      </div>
    </div>
  );
};
