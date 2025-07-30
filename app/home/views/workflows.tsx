export const Workflow = () => {
  return (
    <ul className="grid w-full grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
      <li className="flex items-center rounded-md bg-card p-4 gap-4 lg:rounded-lg lg:p-8 lg:gap-8 lg:flex-col lg:items-start">
        <div className="flex size-16 items-center justify-center rounded-md bg-accent p-6 text-2xl font-semibold text-accent-foreground lg:size-26 lg:rounded-lg">
          1
        </div>

        <div className='flex flex-col gap-1'>
          <h3 className={'text-lg lg:text-xl font-semibold text-primary'}>
            Quick Start
          </h3>
          <p className='text-md font-regular text-muted-foreground'>
            Import your current resume and pick a template that fits your style and industry.
          </p>
        </div>
      </li>
      <li className="flex items-center rounded-md bg-card p-4 gap-4 lg:rounded-lg lg:p-8 lg:gap-8 lg:flex-col lg:items-start">
        <div className="flex size-16 items-center justify-center rounded-md bg-accent p-6 text-2xl font-semibold text-accent-foreground lg:size-26 lg:rounded-lg">
          2
        </div>

        <div className='flex flex-col gap-1'>
          <h3 className={'text-lg lg:text-xl font-semibold text-primary'}>
            Tailor with AI Assistant
          </h3>
          <p className='text-md font-regular text-muted-foreground'>
            Create your free account to access our tools and templates.
          </p>
        </div>
      </li>
      <li className="flex items-center rounded-md bg-card p-4 gap-4 lg:rounded-lg lg:p-8 lg:gap-8 lg:flex-col lg:items-start">
        <div className="flex size-16 items-center justify-center rounded-md bg-accent p-6 text-2xl font-semibold text-accent-foreground lg:size-26 lg:rounded-lg">
          3
        </div>

        <div className='flex flex-col gap-1'>
          <h3 className={'text-lg lg:text-xl font-semibold text-primary'}>
            Customize Your Resume
          </h3>
            <p className='text-md font-regular text-muted-foreground'>
            Enter your details, choose a template, and customize it
          </p>
        </div>
      </li>
    </ul>
  );
};
