import { Form } from '@components/ui';
import { cn } from '@lib/utils';
import type { AppForm } from '@lib/forms/use-form';
import { PROFILE_FIELDS } from '@/lib/onboarding-copy';

import { HeadlineAchievementsField } from './headline-achievements.field';
import { TextFormField } from './text-form-field';

type ProfileFormProps = {
  className?: string;
  form: AppForm;
};

export const ProfileForm = ({ className, form }: ProfileFormProps) => {
  return (
    <Form className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextFormField form={form} name="profile.firstName" copy={PROFILE_FIELDS.firstName} autoComplete="given-name" />
        <TextFormField form={form} name="profile.lastName" copy={PROFILE_FIELDS.lastName} autoComplete="family-name" />
      </div>
      <TextFormField form={form} name="profile.role" copy={PROFILE_FIELDS.role} autoComplete="organization-title" />
      <TextFormField form={form} name="profile.tagline" copy={PROFILE_FIELDS.summary} multiline />
      <HeadlineAchievementsField form={form} />
    </Form>
  );
};
