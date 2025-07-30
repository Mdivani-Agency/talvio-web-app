import { Icon } from '@components/icons';
import Image from 'next/image';

export const Benefits = () => {
  return (
    <section className="grid w-full grid-cols-1 gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
      <ul className="grid w-full grid-cols-1 gap-4 md:gap-8 lg:py-24">
        <li className="p-4">
          <Icon className={'size-12'} type={'MemoCheck'} />

          <h3 className={'my-4 text-secondary text-xl lg:my-6'}>
            Effortless Resumes
          </h3>
          <p className='text-md font-regular text-muted-foreground'>
            Our platform guides you step-by-step to create a polished ATS-friendly resume in minutes.
          </p>
        </li>
        <li className={'p-4'}>
          <Icon className={'size-12'} type={'Corportate'} />

          <h3 className={'my-4 text-secondary text-xl lg:my-6'}>
            Job-Specific Suggestions
          </h3>
          <p className='text-md font-regular text-muted-foreground'>
            Get tailored resume tips based on your industry and career goals.
          </p>
        </li>
      </ul>
      <figure className="relative h-full w-full hidden lg:block">
        <Image
          src={'/iphone.png'}
          placeholder={'blur'}
          blurDataURL={'/iphone-blur.png'}
          alt={'Iphone with nested website'}
          className="object-contain"
          priority={false}
          fill
        />
      </figure>
      <ul className="grid w-full grid-cols-1 gap-4 md:gap-8 lg:py-24">
        <li className="p-4">
          <Icon className={'size-12'} type={'Pencil'} />

          <h3 className={'my-4 text-secondary text-xl lg:my-6'}>
            Customizable Designs
          </h3>
          <p className='text-md font-regular text-muted-foreground'>
            Choose from a variety of professional, ATS-friendly templates.
          </p>
        </li>
        <li className="p-4">
          <Icon className={'size-12'} type={'Spark'} />

          <h3 className={'my-4 text-secondary text-xl lg:my-6'}>
            AI-Content Generator
          </h3>
          <p className='text-md font-regular text-muted-foreground'>
            Get a personalized resume instantly using AI and your job description.
          </p>
        </li>
      </ul>
    </section>
  );
};
