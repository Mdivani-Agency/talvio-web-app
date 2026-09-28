import Image from 'next/image';
import { DetailsList } from '@components/ui';
import { FREE_CREDITS_ANSWER, MORE_CREDITS_ANSWER, SUBSCRIPTION_ANSWER, SUBSCRIPTION_QUESTION } from '@/lib/credits';
import { ACCOUNT_DELETION_ANSWER, DATA_SAFETY_ANSWER, WHAT_IS_TALVIO_ANSWER } from '@/lib/public-claims';

const faqs = [
  {
    question: 'What is Talvio?',
    answer: WHAT_IS_TALVIO_ANSWER,
  },
  {
    question: 'How do I create a resume?',
    answer: 'You can create a resume by signing up for a free account and following the steps to create a resume.',
  },
  {
    question: 'Is it really free?',
    answer: FREE_CREDITS_ANSWER,
  },
  {
    question: 'What if free credits are not enough?',
    answer: MORE_CREDITS_ANSWER,
  },
  {
    question: SUBSCRIPTION_QUESTION,
    answer: SUBSCRIPTION_ANSWER,
  },
  {
    question: 'Is my data safe?',
    answer: DATA_SAFETY_ANSWER,
  },
  {
    question: 'What if I want to delete my account?',
    answer: ACCOUNT_DELETION_ANSWER,
  },
  {
    question: 'How do I get support?',
    answer: 'You can contact us via email at contact@talvio.co or via our social media channels.',
  },
];

export const Faq = () => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full">
      <div className="relative hidden w-full aspect-[1.42] lg:mt-12 2xl:mt-16 lg:block">
        <Image src="/faq.png" placeholder={'blur'} blurDataURL={'/faq.png'} alt="FAQ" fill />
      </div>
      <article className="w-full">
        <DetailsList qa={faqs} />
      </article>
    </section>
  );
};
