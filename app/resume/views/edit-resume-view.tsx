import { AccountDto } from '@lib/types';
import { ResumeFormView } from '../form/resume.form';

type EditResumeProps = {
  className?: string;
  defaultValues: AccountDto;
  onSubmit: (data: AccountDto) => void;
};

export const EditResumeView = ({ className, defaultValues, onSubmit }: EditResumeProps) => {
  return (
    <section className={`${className} w-full`}>
      <ResumeFormView onSubmit={onSubmit} defaultValues={defaultValues} />
    </section>
  );
};
