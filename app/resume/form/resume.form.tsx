import { TabNavigation } from '@components/views/tabs';
import { ProfileForm } from '@app/account/create/views/forms/profile.form';
import { HighlightsForm } from '@app/account/create/views/forms/highlights.form';
import { ExperienceView } from '@app/account/create/views/experience';
import { EducationView } from '@app/account/create/views/education';
import { ProjectsView } from '@app/account/create/views/projects';
import { ContactsForm, RESUME_CONTACT_FIELDS } from '@app/account/create/views/forms/contacts.form';
import { useAppForm } from '@lib/forms/use-form';
import { hasFieldError } from '@lib/forms/errors';
import { normalizeResumeDocument, type ResumeFieldIssue } from '@lib/models/resume-document';
import { resumeDraftSchema } from '@lib/schema/resume.schema';
import type { ResumeForm } from '@lib/types';
import { useLayoutEffect, useRef } from 'react';
import { useStore } from '@tanstack/react-form';

type ResumeDocumentFormProps = {
  defaultValues: ResumeForm;
  issues?: ResumeFieldIssue[];
  onSubmit: (data: ResumeForm) => void;
};

function issueOn(issues: ResumeFieldIssue[] | undefined, prefixes: string[]) {
  return (issues ?? []).some((issue) =>
    prefixes.some((prefix) => issue.path === prefix || issue.path.startsWith(`${prefix}.`)),
  );
}

function documentDefaults(values: ResumeForm): ResumeForm {
  return {
    ...values,
    contacts: {
      email: values.contacts?.email ?? '',
      phone: values.contacts?.phone,
      url: values.contacts?.url,
    },
    location: {
      city: values.location?.city ?? '',
      country: values.location?.country ?? '',
    },
    skills: values.skills ?? [],
    tools: values.tools ?? [],
    links: values.links ?? [],
    languages: values.languages ?? [],
    experience: values.experience ?? [],
    education: values.education ?? [],
    recommendations: values.recommendations ?? [],
    projects: values.projects ?? [],
  };
}

export const ResumeDocumentForm = ({ onSubmit, defaultValues, issues }: ResumeDocumentFormProps) => {
  const form = useAppForm<ResumeForm>({
    defaultValues: documentDefaults(defaultValues),
    schema: resumeDraftSchema,
    validateOn: 'submit',
  });
  const values = useStore(form.store, (state) => state.values);
  const lastSent = useRef<string | null>(null);
  // List editors call replaceFieldValue, which updates the store without
  // TanStack onChange listeners. Read values here so those edits reach preview and save.
  useLayoutEffect(() => {
    const next = normalizeResumeDocument(values);
    const serialized = JSON.stringify(next);
    if (lastSent.current === serialized) {
      return;
    }
    const isInitial = lastSent.current === null;
    lastSent.current = serialized;
    if (isInitial) {
      return;
    }
    onSubmit(next);
  }, [onSubmit, values]);

  const errorMap = useStore(form.store, (state) => state.errorMap);
  const profileHasError = (Boolean(errorMap) && hasFieldError(form, 'profile')) || issueOn(issues, ['profile']);
  const contactsHasError = hasFieldError(form, 'contacts') || hasFieldError(form, 'location') || issueOn(issues, ['contacts', 'location']);
  const skillsHasError = hasFieldError(form, 'skills')
    || hasFieldError(form, 'languages')
    || hasFieldError(form, 'links')
    || hasFieldError(form, 'tools')
    || issueOn(issues, ['skills', 'languages', 'links', 'tools']);
  const experienceHasError = hasFieldError(form, 'experience') || issueOn(issues, ['experience']);
  const educationHasError = hasFieldError(form, 'education') || issueOn(issues, ['education']);
  const projectsHasError = hasFieldError(form, 'projects') || issueOn(issues, ['projects']);

  return (
    <div className="flex h-full w-full flex-col">
      {issues?.length ? (
        <ul className="mb-4 space-y-1 px-4 text-sm text-destructive" aria-label="Resume issues">
          {issues.map((issue) => (
            <li key={`${issue.path}:${issue.message}`}>
              {issue.path}: {issue.message}
            </li>
          ))}
        </ul>
      ) : null}
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
          const contactErrors = await Promise.resolve(form.validateField('contacts', 'submit'));
          const locationErrors = await Promise.resolve(form.validateField('location', 'submit'));
          return contactErrors.length === 0 && locationErrors.length === 0;
        }}
        hasError={contactsHasError}
      >
        <section className="mt-8">
          <ContactsForm form={form} fields={RESUME_CONTACT_FIELDS} />
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
          <ExperienceView form={form} documentMode />
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
          <EducationView form={form} documentMode />
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
          <ProjectsView form={form} documentMode />
        </section>
      </TabNavigation.TabContent>
    </TabNavigation>
    </div>
  );
};
