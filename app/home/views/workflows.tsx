import { WORKFLOW_STEPS } from '@/lib/homepage-copy';

export const Workflow = () => {
  return (
    <ul className="grid w-full grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
      {WORKFLOW_STEPS.map((step, index) => (
        <li
          key={step.title}
          className="flex items-center rounded-md bg-card p-4 gap-4 lg:rounded-lg lg:p-8 lg:gap-8 lg:flex-col lg:items-start"
        >
          <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-accent p-6 text-2xl font-semibold text-accent-foreground lg:size-26 lg:rounded-lg">
            {index + 1}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-lg font-semibold text-primary lg:text-xl">{step.title}</h3>
            <p className="text-md font-regular text-muted-foreground">{step.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
};
