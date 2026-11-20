import type { ResumeFieldIssue } from '@lib/models/resume-document';
import type { ResumeForm } from '@lib/types';
import type { ResumeSectionId } from '@/lib/resume-editor-copy';

import { ResumeDocumentForm } from '../form/resume.form';

type EditResumeProps = {
  className?: string;
  defaultValues: ResumeForm;
  issues?: ResumeFieldIssue[];
  /** The section to open first, such as the one "Fill them in" points to. */
  openSection?: ResumeSectionId;
  onSubmit: (data: ResumeForm) => void;
};

export const EditResumeView = ({ className, defaultValues, issues, openSection, onSubmit }: EditResumeProps) => {
  return (
    <section className={`${className} w-full`}>
      <ResumeDocumentForm onSubmit={onSubmit} defaultValues={defaultValues} issues={issues} openSection={openSection} />
    </section>
  );
};
