import Image from 'next/image';
import { DetailsList } from '@components/ui';
import { HOME_FAQ } from '@/lib/homepage-copy';

export const Faq = () => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full">
      <div className="relative hidden w-full aspect-[1.42] lg:mt-12 2xl:mt-16 lg:block">
        <Image src="/faq.png" placeholder={'blur'} blurDataURL={'/faq.png'} alt="FAQ" fill />
      </div>
      <article className="w-full">
        <DetailsList qa={[...HOME_FAQ]} />
      </article>
    </section>
  );
};
