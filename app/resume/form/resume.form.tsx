import { TabNavigation } from '@components/views/tabs';
import { hasError } from '@lib/utils';
import { AccountDto, Highlights, ResumeForm } from '@lib/types';
import { useForm, UseFormReturn } from 'react-hook-form';
import { ProfileForm } from '@app/account/create/views/forms/profile.form';
import { HighlightsForm } from '@app/account/create/views/forms/highlights.form';
import { ExperienceView } from '@app/account/create/views/experience';
import { EducationView } from '@app/account/create/views/education';
import { ProjectsView } from '@app/account/create/views/projects';
import { accountToResume } from '@lib/utils/resume';
import { ContactsForm } from '@app/account/create/views/forms/contacts.form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accountSchema } from '@lib/schema/account.schema';

type ResumeFormProps = {
  defaultValues: AccountDto;
  onSubmit: (data: ResumeForm) => void;
};

export const ResumeFormView = ({ onSubmit, defaultValues }: ResumeFormProps) => {
  const form = useForm<AccountDto>({
    resolver: zodResolver(accountSchema),
    defaultValues,
  });
  const { trigger, formState: { errors } } = form;

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(accountToResume(data));
  });

  form.watch(() => {
    handleSubmit();
  });

  return (
    <TabNavigation className={'w-full h-full'} withActionButtons={true}>
      <TabNavigation.TabContent
        title={'Personal Details'}
        icon={'User'}
        error={errors.profile?.message}
        hasError={hasError(errors, 'profile')}
      >
        <section className="mt-8 h-full">
          <ProfileForm form={form} />
        </section>
      </TabNavigation.TabContent>
      <TabNavigation.TabContent
        title={'Contact Information'}
        icon={'Mail'}
        error={errors.profile?.message}
        hasError={hasError(errors, 'profile')}
      >
        <section className="mt-8 h-full">
          <ContactsForm form={form} />
        </section>
      </TabNavigation.TabContent>
      <TabNavigation.TabContent
        title={'Highlights'}
        icon={'Text'}
        validate={() => trigger('skills')}
        error={errors.skills?.message || errors.languages?.message}
        hasError={hasError(errors, 'skills') || hasError(errors, 'languages')}
      >
        <section className="mt-8 h-full w-full">
          <HighlightsForm form={form as unknown as UseFormReturn<Highlights>} />
        </section>
      </TabNavigation.TabContent>
      <TabNavigation.TabContent
        title={'Experience'}
        icon={'SuitCase'}
        error={errors.experience?.message}
        hasError={hasError(errors, 'experience')}
      >
        <section className="mt-8 h-full w-full">
          <ExperienceView form={form} />
        </section>
      </TabNavigation.TabContent>
      <TabNavigation.TabContent
        title={'Education'}
        icon={'Graduate'}
        error={errors.education?.message}
        hasError={hasError(errors, 'education')}
      >
        <section className="mt-8 h-full w-full">
          <EducationView form={form} />
        </section>
      </TabNavigation.TabContent>
      <TabNavigation.TabContent
        title={'Personal Projects'}
        icon={'Project'}
        error={errors.projects?.message}
        hasError={hasError(errors, 'projects')}
      >
        <section className="mt-8 h-full w-full">
          <ProjectsView form={form} />
        </section>
      </TabNavigation.TabContent>
    </TabNavigation>
  );
};
