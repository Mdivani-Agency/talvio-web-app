import { WORKFLOW_STEPS } from '@/lib/homepage-copy';

export const Workflow = () => {
  return (
    <ol className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
      {WORKFLOW_STEPS.map((step, index) => (
        <li key={step.title} className="flex items-start gap-4 rounded-lg bg-card p-5 lg:flex-col lg:gap-6 lg:p-8">
          {/* The list already numbers the steps for assistive technology. */}
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-md bg-secondary text-xl font-semibold text-secondary-foreground"
          >
            {index + 1}
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <h3 className="text-lg leading-[1.4] font-semibold text-primary lg:text-xl">{step.title}</h3>
            <p className="text-md font-regular text-muted-foreground">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
};
