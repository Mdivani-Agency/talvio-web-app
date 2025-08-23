import { AccountDto, ResumeForm } from '@lib/types';
import { ResumeFormView } from '../form/resume.form';

type EditResumeProps = {
  className?: string;
  defaultValues: AccountDto;
  onSubmit: (data: ResumeForm) => void;
};

export const EditResumeView = ({ className, defaultValues, onSubmit }: EditResumeProps) => {
  return (
    <section className={`${className} w-full`}>
      <ResumeFormView onSubmit={onSubmit} defaultValues={defaultValues} />
    </section>
  );
};
