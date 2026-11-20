import { Check, ChevronDown, CircleAlert } from 'lucide-react';
import { ProfileForm } from '@app/account/create/views/forms/profile.form';
import { HighlightsForm } from '@app/account/create/views/forms/highlights.form';
import { ExperienceView } from '@app/account/create/views/experience';
import { EducationView } from '@app/account/create/views/education';
import { ProjectsView } from '@app/account/create/views/projects';
import { RecommendationsView } from '@app/account/create/views/recommendations';
import { useCurrentTemplate } from '@app/account/create/views/forms/template-context';
import { resolveAvailableTemplate } from '@lib/resume/resolve-editor';
import {
  effectiveSectionOrder,
  storedSectionOrder,
  type MovableSection,
} from '@lib/resume/section-order';
import { ContactsForm, RESUME_CONTACT_FIELDS } from '@app/account/create/views/forms/contacts.form';
import { useAppForm } from '@lib/forms/use-form';
import { hasFieldError } from '@lib/forms/errors';
import { normalizeResumeDocument, type ResumeFieldIssue } from '@lib/models/resume-document';
import { resumeDraftSchema } from '@lib/schema/resume.schema';
import type { ResumeForm } from '@lib/types';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@lib/utils';
import { downloadErrorSummaryTitle, RECOMMENDATIONS_INTRO, type ResumeSectionId } from '@/lib/resume-editor-copy';

import { SectionOrderLine, SectionOrderPanel } from './section-order-panel';

import {
  resumeFieldLabel,
  resumeSectionOf,
  resumeSectionStates,
  resumeSectionTitle,
  type ResumeSectionState,
} from './resume-sections';
import { useStore } from '@tanstack/react-form';

type ResumeDocumentFormProps = {
  defaultValues: ResumeForm;
  issues?: ResumeFieldIssue[];
  onSubmit: (data: ResumeForm) => void;
};

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
    headlineAchievements: values.headlineAchievements ?? [],
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

/** The editor section that holds each movable PDF section: skills, tools and languages sit in Highlights. */
const EDITOR_SECTION: Record<MovableSection, ResumeSectionId> = {
  experience: 'experience',
  education: 'education',
  skills: 'highlights',
  projects: 'projects',
  recommendations: 'recommendations',
};

/** Templates with a side column, where a section keeps its column whatever the order. */
const COLUMN_TEMPLATES = ['talvio', 'sidebar'];

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
  const formErrors = new Set<ResumeSectionId>();
  if (Boolean(errorMap) && (hasFieldError(form, 'profile') || hasFieldError(form, 'headlineAchievements'))) formErrors.add('about');
  if (hasFieldError(form, 'contacts') || hasFieldError(form, 'location')) formErrors.add('contact');
  if (['skills', 'languages', 'links', 'tools'].some((key) => hasFieldError(form, key))) formErrors.add('highlights');
  if (hasFieldError(form, 'experience')) formErrors.add('experience');
  if (hasFieldError(form, 'education')) formErrors.add('education');
  if (hasFieldError(form, 'projects')) formErrors.add('projects');
  if (hasFieldError(form, 'recommendations')) formErrors.add('recommendations');
  const allSections = resumeSectionStates(values, issues, formErrors);

  // Section order: the user's own, else the template's. Stored only when it differs from the template's default.
  const current = useCurrentTemplate();
  const templateItem = resolveAvailableTemplate(current?.key);
  const templateName = current?.name ?? templateItem.name;
  const order = effectiveSectionOrder(values.sectionOrder, templateItem.template);
  // Custom means an order is stored, even one that happens to equal this template's default: it still applies after
  // a switch to another template, so it must show as the user's and stay resettable.
  const customOrder = Boolean(values.sectionOrder?.length);
  const setOrder = (next: MovableSection[]) =>
    form.setFieldValue('sectionOrder', storedSectionOrder(next, templateItem.template));
  const [reordering, setReordering] = useState(false);
  const movable = new Set<ResumeSectionId>(Object.values(EDITOR_SECTION));
  const fixedSections = allSections.filter((section) => !movable.has(section.id));
  const orderedSections = order
    .map((name) => allSections.find((section) => section.id === EDITOR_SECTION[name]))
    .filter((section): section is (typeof allSections)[number] => Boolean(section));
  const columnTemplate = COLUMN_TEMPLATES.some((name) => templateItem.key === name || templateItem.key.endsWith(`-${name}`));

  // One section is open at a time, About you first. A download that finds issues opens the first one with an issue.
  const [open, setOpen] = useState<ResumeSectionId | null>(() =>
    issues?.length ? resumeSectionOf(issues[0]!.path) : 'about',
  );
  const [seenIssues, setSeenIssues] = useState(issues);
  if (issues !== seenIssues) {
    setSeenIssues(issues);
    if (issues?.length) {
      setOpen(resumeSectionOf(issues[0]!.path));
    }
  }
  const rootRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (issues?.length) {
      summaryRef.current?.focus();
    }
  }, [issues]);

  const focusIssue = (issue: ResumeFieldIssue) => {
    setReordering(false);
    const id = resumeSectionOf(issue.path);
    setOpen(id);
    requestAnimationFrame(() => {
      const panel = rootRef.current?.querySelector<HTMLElement>(`#${panelId(id)}`);
      if (!panel) return;
      panel.scrollIntoView?.({ block: 'nearest' });
      const direct = panel.querySelector<HTMLElement>(`[name="${CSS.escape(issue.path)}"]`);
      if (direct) {
        direct.focus();
        return;
      }
      const label = resumeFieldLabel(issue.path).split(', ').pop() ?? '';
      // An issue inside a list entry (experience.0.startDate) needs that entry's editor open: its fields only mount on Edit.
      const index = entryIndexOf(issue.path);
      const row = index === null ? null : panel.querySelectorAll<HTMLElement>('[draggable]')[index];
      const edit = row?.querySelector<HTMLButtonElement>('button[aria-label^="Edit "]');
      if (edit) {
        edit.click();
        requestAnimationFrame(() => focusByLabel(panel, label));
        return;
      }
      focusByLabel(panel, label);
    });
  };

  const body: Record<ResumeSectionId, React.ReactNode> = {
    about: <ProfileForm form={form} />,
    contact: <ContactsForm form={form} fields={RESUME_CONTACT_FIELDS} heading={false} />,
    highlights: <HighlightsForm form={form} heading={false} />,
    experience: <ExperienceView form={form} documentMode heading={false} />,
    education: <EducationView form={form} documentMode heading={false} />,
    projects: <ProjectsView form={form} documentMode heading={false} />,
    recommendations: (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{RECOMMENDATIONS_INTRO}</p>
        <RecommendationsView form={form} documentMode />
      </div>
    ),
  };

  const renderSection = (section: (typeof allSections)[number]) => {
    const expanded = open === section.id;
    return (
      <section key={section.id} id={`resume-section-${section.id}`} className="flex-none rounded-[1.2rem] bg-card">
        <h2>
          <button
            type="button"
            id={buttonId(section.id)}
            aria-expanded={expanded}
            aria-controls={panelId(section.id)}
            aria-describedby={summaryId(section.id)}
            onClick={() => setOpen(expanded ? null : section.id)}
            className="flex w-full items-center gap-3 rounded-[1.2rem] p-4 text-left focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none md:px-5"
          >
            <SectionMark state={section.state} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-md font-semibold text-primary">{section.title}</span>
              <span
                id={summaryId(section.id)}
                aria-hidden="true"
                data-allow-small-text
                className="truncate text-[1.3rem] text-muted-foreground"
              >
                {section.summary}
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cn('size-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
            />
          </button>
        </h2>
        <div
          id={panelId(section.id)}
          role="region"
          aria-labelledby={buttonId(section.id)}
          hidden={!expanded}
          className="px-4 pb-5 md:px-5"
        >
          {body[section.id]}
        </div>
      </section>
    );
  };

  return (
    <div ref={rootRef} className="flex h-full w-full flex-col gap-3 overflow-y-auto px-4 pt-1 pb-6 md:px-6">
      {issues?.length ? <IssueSummary ref={summaryRef} issues={issues} onSelect={focusIssue} /> : null}
      {fixedSections.map(renderSection)}
      {reordering ? (
        <SectionOrderPanel
          order={order}
          custom={customOrder}
          templateName={templateName}
          columnNote={columnTemplate}
          onChange={setOrder}
          onReset={() => form.setFieldValue('sectionOrder', undefined)}
          onDone={() => {
            setReordering(false);
            requestAnimationFrame(() =>
              rootRef.current?.querySelector<HTMLButtonElement>('[data-reorder-sections]')?.focus(),
            );
          }}
        />
      ) : (
        <>
          <SectionOrderLine
            order={order}
            custom={customOrder}
            templateName={templateName}
            onReorder={() => {
              setOpen(null);
              setReordering(true);
            }}
          />
          {orderedSections.map(renderSection)}
        </>
      )}
    </div>
  );
};

/** "Contact information, Email: …", or "Experience 1, End date: …" where the field already names its section. */
function issueLinkText(issue: ResumeFieldIssue): string {
  const section = resumeSectionTitle(resumeSectionOf(issue.path));
  const field = resumeFieldLabel(issue.path);
  return `${field.startsWith(section) ? field : `${section}, ${field}`}: ${issue.message}`;
}

/** The entry index in a list path such as `experience.0.startDate`, or null for a field outside a list. */
function entryIndexOf(path: string): number | null {
  const [head, index] = path.split('.');
  if (!['experience', 'education', 'projects'].includes(head ?? '') || !/^\d+$/.test(index ?? '')) return null;
  return Number(index);
}

/** Focus the control a visible label names inside `scope`, else its first field. */
function focusByLabel(scope: HTMLElement, label: string) {
  const byLabel = [...scope.querySelectorAll('label')].find((node) => node.textContent?.trim().startsWith(label));
  const target =
    (byLabel?.control as HTMLElement | null | undefined)
    ?? scope.querySelector<HTMLElement>('input:not([disabled]), textarea:not([disabled]), [role="combobox"]');
  target?.focus();
}

const buttonId = (id: ResumeSectionId) => `resume-section-${id}-button`;
const panelId = (id: ResumeSectionId) => `resume-section-${id}-panel`;
const summaryId = (id: ResumeSectionId) => `resume-section-${id}-summary`;

function SectionMark({ state }: { state: ResumeSectionState['state'] }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
        state === 'done' && 'bg-secondary text-secondary-foreground',
        state === 'error' && 'bg-destructive text-white',
        state === 'todo' && 'border border-muted-foreground/50',
      )}
    >
      {state === 'done' ? <Check className="size-3.5" strokeWidth={3} /> : state === 'error' ? '!' : null}
    </span>
  );
}

/** After a download finds issues: the count, then each issue in words, linking to its field. It takes focus. */
function IssueSummary({
  issues,
  onSelect,
  ref,
}: {
  issues: ResumeFieldIssue[];
  onSelect: (issue: ResumeFieldIssue) => void;
  ref: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="group"
      aria-labelledby="resume-issues-title"
      className="flex flex-none gap-3 rounded-[1.2rem] border border-destructive bg-background p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-[1.8rem] shrink-0 text-destructive" />
      <div className="flex min-w-0 flex-col gap-1.5">
        <p id="resume-issues-title" className="text-md font-semibold text-primary">
          {downloadErrorSummaryTitle(issues.length)}
        </p>
        <ul className="flex list-disc flex-col gap-1 pl-[1.8rem] text-sm">
          {issues.map((issue) => (
            <li key={`${issue.path}:${issue.message}`}>
              <a
                href={`#${panelId(resumeSectionOf(issue.path))}`}
                className="font-medium text-secondary underline-offset-2 hover:underline dark:text-secondary-hover"
                onClick={(event) => {
                  event.preventDefault();
                  onSelect(issue);
                }}
              >
                {issueLinkText(issue)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
