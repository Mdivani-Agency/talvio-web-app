import type { ResumeFieldIssue } from '@lib/models/resume-document';
import type { ResumeForm } from '@lib/types';

import { ResumeDocumentForm } from '../form/resume.form';

type EditResumeProps = {
  className?: string;
  defaultValues: ResumeForm;
  issues?: ResumeFieldIssue[];
  onSubmit: (data: ResumeForm) => void;
};

export const EditResumeView = ({ className, defaultValues, issues, onSubmit }: EditResumeProps) => {
  return (
    <section className={`${className} w-full`}>
      <ResumeDocumentForm onSubmit={onSubmit} defaultValues={defaultValues} issues={issues} />
    </section>
  );
};
