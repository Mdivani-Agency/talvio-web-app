import { TabNavigation } from '@components/views/tabs';
import { AccountDto } from '@lib/types';
import { ProfileForm } from '@app/account/create/views/forms/profile.form';
import { HighlightsForm } from '@app/account/create/views/forms/highlights.form';
import { ExperienceView } from '@app/account/create/views/experience';
import { EducationView } from '@app/account/create/views/education';
import { ProjectsView } from '@app/account/create/views/projects';
import { ContactsForm } from '@app/account/create/views/forms/contacts.form';
import { accountSchema } from '@lib/schema/account.schema';
import { useAppForm } from '@lib/forms/use-form';
import { hasFieldError } from '@lib/forms/errors';
import { useStore } from '@tanstack/react-form';

type ResumeFormProps = {
  defaultValues: AccountDto;
  onSubmit: (data: AccountDto) => void;
};

export const ResumeFormView = ({ onSubmit, defaultValues }: ResumeFormProps) => {
  const form = useAppForm<AccountDto>({
    defaultValues,
    schema: accountSchema,
    validateOn: 'submit',
    onValuesChange: onSubmit,
  });

  const errorMap = useStore(form.store, (state) => state.errorMap);
  const profileHasError = Boolean(errorMap) && hasFieldError(form, 'profile');
  const skillsHasError = hasFieldError(form, 'skills') || hasFieldError(form, 'languages');
  const experienceHasError = hasFieldError(form, 'experience');
  const educationHasError = hasFieldError(form, 'education');
  const projectsHasError = hasFieldError(form, 'projects');

  return (
    <TabNavigation className={'w-full h-full'} withActionButtons={true}>
      <TabNavigation.TabContent
        title={'Personal Details'}
        icon={'User'}
        validate={async () => {
          const errors = await Promise.resolve(form.validateField('profile', 'submit'));
          return errors.length === 0;
        }}
        hasError={profileHasError}
      >
        <section className="mt-8">
          <ProfileForm form={form} />
        </section>
      </TabNavigation.TabContent>
      <TabNavigation.TabContent
        title={'Contact Information'}
        icon={'Mail'}
        validate={async () => {
          const errors = await Promise.resolve(form.validateField('profile', 'submit'));
          return errors.length === 0;
        }}
        hasError={profileHasError}
      >
        <section className="mt-8">
          <ContactsForm form={form} />
        </section>
      </TabNavigation.TabContent>
      <TabNavigation.TabContent
        title={'Highlights'}
        icon={'Text'}
        validate={async () => {
          const errors = await Promise.resolve(form.validateField('skills', 'submit'));
          return errors.length === 0;
        }}
        hasError={skillsHasError}
      >
        <section className="mt-8 w-full">
          <HighlightsForm form={form} />
        </section>
      </TabNavigation.TabContent>
      <TabNavigation.TabContent
        title={'Experience'}
        icon={'SuitCase'}
        validate={async () => {
          const errors = await Promise.resolve(form.validateField('experience', 'submit'));
          return errors.length === 0;
        }}
        hasError={experienceHasError}
      >
        <section className="mt-8 w-full">
          <ExperienceView form={form} />
        </section>
      </TabNavigation.TabContent>
      <TabNavigation.TabContent
        title={'Education'}
        icon={'Graduate'}
        validate={async () => {
          const errors = await Promise.resolve(form.validateField('education', 'submit'));
          return errors.length === 0;
        }}
        hasError={educationHasError}
      >
        <section className="mt-8 w-full">
          <EducationView form={form} />
        </section>
      </TabNavigation.TabContent>
      <TabNavigation.TabContent
        title={'Personal Projects'}
        icon={'Project'}
        validate={async () => {
          const errors = await Promise.resolve(form.validateField('projects', 'submit'));
          return errors.length === 0;
        }}
        hasError={projectsHasError}
      >
        <section className="mt-8 w-full">
          <ProjectsView form={form} />
        </section>
      </TabNavigation.TabContent>
    </TabNavigation>
  );
};
