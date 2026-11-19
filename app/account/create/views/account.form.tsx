'use client';

import { DEFAULT_ACCOUNT_DTO } from '@lib/models/account-defaults';
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
import { useAppForm } from '@lib/forms/use-form';
import { useStore } from '@tanstack/react-form';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { DRAFT_NOTE, PROFILE_SECTIONS } from '@/lib/onboarding-copy';

import { ErrorSummary, focusFieldError } from './error-summary';
import { SectionHeading } from './forms/section-heading';
import { SectionNav } from './section-nav';
import { collectFieldErrors, sectionStatuses, type FormFieldError, type ProfileSectionId } from './profile-sections';

export { DEFAULT_ACCOUNT_DTO };

interface AccountFormProps {
  onSubmit: (data: AccountDto) => void;
  submitLabel?: string;
  valuesOverride?: Partial<AccountDto> | null;
  onValuesChange?: (data: AccountDto) => void;
  submitting?: boolean;
  /** The Start faster card: above the form on phones, at the top of the side column from lg. */
  startFaster?: ReactNode;
}

export const AccountForm = ({
  onSubmit,
  submitLabel = 'Continue',
  valuesOverride,
  onValuesChange,
  submitting = false,
  startFaster,
}: AccountFormProps) => {
  const { accountDto, partialDto, setPartialDto } = useAccountContext();
  const values = valuesOverride || partialDto || accountDto || {};

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
      (onValuesChange ?? setPartialDto)(data);
    },
  });

  const formValues = useStore(form.store, (state) => state.values as AccountDto);
  const fieldMeta = useStore(form.store, (state) => state.fieldMeta);
  const errors = useMemo(() => collectFieldErrors(fieldMeta), [fieldMeta]);
  const sections = sectionStatuses(formValues, errors);
  const [summaryShown, setSummaryShown] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }
    await form.handleSubmit();
    if (!form.state.isValid) {
      // The summary replaces the old toast: it lists every error and takes focus once it renders.
      setSummaryShown(true);
      requestAnimationFrame(() => summaryRef.current?.focus());
    }
  };

  const focusField = (error: FormFieldError) => focusFieldError(formRef.current, error);

  const saveButton = (className: string) => (
    <Button className={className} onClick={() => void handleSubmit()} type="button" loading={submitting}>
      {submitLabel}
    </Button>
  );

  return (
    <div ref={formRef} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_30rem] lg:items-start">
      {/* First in the DOM so phones show Start faster above the form; from lg it is the sticky side column. */}
      <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
        {startFaster}
        <SectionNav sections={sections} className="hidden lg:block" />
        {saveButton('hidden h-[4.8rem] w-full text-md lg:inline-flex')}
        <p data-allow-small-text className="hidden text-center text-xs text-muted-foreground lg:block">
          {DRAFT_NOTE}
        </p>
      </aside>
      <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
        {summaryShown && errors.length > 0 ? (
          <ErrorSummary ref={summaryRef} errors={errors} onSelect={focusField} />
        ) : null}
        <SectionCard id="about">
          <SectionHeading copy={PROFILE_SECTIONS.about} />
          <ProfileForm form={form} />
        </SectionCard>
        <SectionCard id="contact">
          <ContactsForm form={form} />
        </SectionCard>
        <SectionCard id="highlights">
          <HighlightsForm form={form} />
        </SectionCard>
        <SectionCard id="experience">
          <ExperienceView form={form} />
        </SectionCard>
        <SectionCard id="education">
          <EducationView form={form} />
        </SectionCard>
        <SectionCard id="projects">
          <ProjectsView form={form} />
        </SectionCard>
        {saveButton('h-[4.8rem] w-full text-md lg:hidden')}
      </div>
    </div>
  );
};

function SectionCard({ id, children }: { id: ProfileSectionId; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-label={PROFILE_SECTIONS[id].title}
      className="flex scroll-mt-6 flex-col gap-5 rounded-[1.2rem] bg-card p-4 md:p-6"
    >
      {children}
    </section>
  );
}
